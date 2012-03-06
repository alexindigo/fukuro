/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * game.js: game related methods
 */
var _         = require('utile')
  , fs        = require('fs')
  , store     = require('nconf')
  // lib stuff
  , teams     = require('./teams')
  , exception = require('./exception');

var $D // define storage
  , $T // teams list
  , $C // content
  , $Q // timer
  , $; // config

// init module with external vars
exports.init = function(conf, callback)
{
  $ = conf;

  // init game upon creation
  reset(function(err)
  {
    // pass it thru
    return callback(err);
  });
};

// {{{ reset storage/game
// increments file number for new storage
var reset = exports.reset = function(callback)
{
  // assume we're the only process
  // working with the storage folder
  getStorage($.get('storage'), function(err, storage)
  {
    if (err) throw new exception('Unable to reset storage file.', 500);

    // set new data storage
    if (!$D) $D = new store.Provider({store: {type: 'file', file: storage} });
    // or switch storage file to new one
    else $D.use('file', {file: storage} );

    // reset game
    $D.set('current', null);
    $D.set('round', 0);
    $D.set('rounds', []);

    // set teams list if no set
    if (!$T) $T = new store.Provider({store: {type: 'file', file: $.get('teams')} });
    // or reload from the file
    else $T.load();

    // set questions list if no set
    if (!$C) $C = new store.Provider({store: {type: 'file', file: $.get('content')} });
    // or reload from the file
    else $C.load();

    // rebuild teams
    teams.reset($T, $D, function(err)
    {
      // pass it thru
      return callback(err);
    });

  });
};
// }}}

// {{{ returns current state
exports.state = function()
{
  return {
    current: $D.get('current'),
    round: $D.get('round'),
    points: $D.get('rounds:'+$D.get('round')),
    teams: $D.get('teams'),
    content: $C.dump()
    }
};
// }}}

// {{{ returns rounds list
exports.rounds = function()
{
  return $D.get('rounds');
};
// }}}

// {{{ updates current state
exports.current = function(current)
{
  if (typeof current != 'undefined')
  {
    $D.set('current', current);
    // save state (async)
    $D.save();
  }
  return $D.get('current');
};
// }}}

// {{{ setter/getter for the round
exports.round = function(round)
{
  if (typeof round != 'undefined')
  {
    $D.set('round', round);
    // save state (async)
    $D.save();
  }
  return $D.get('round');
};
// }}}

// {{{ start game timer
exports.timer = function(callback)
{
  // clear if we had anything before
  if ($Q)
  {
    clearInterval($Q);
    $Q = null;
    return callback(-1);
  }

  var start = +new Date() + 60000;

  $Q = setInterval(function()
  {
    var time = +new Date();
    // calculate difference
    time = Math.round((start - time)/1000);

    if (time < 0)
    {
      clearInterval($Q);
      $Q = null;
    }

    callback(time);
  }, 200); // every second
};
// }}}

// {{{
exports.checkTeam = function(id, callback)
{
  var delta = null
    , team = $D.get('teams:'+id)
    , round = $D.get('round')
    , current = $D.get('rounds:'+round);

  // if it's got one point this round
  // than reverse the action
  if (current && current[id])
  {
    // adjust game points when playing
    if (round > 0) team.points--;
  }
  else
  {
    if (round > 0) team.points++;
    delta = 1;
  }

  // save results
  $D.set('rounds:'+round+':'+id, delta);
  $D.set('teams:'+id, team);
  $D.save();

  // get back
  callback(team);
};
// }}}

// {{{
exports.changePoint = function(id, round, callback)
{
  var delta = null
    , team = $D.get('teams:'+id)
    , current = $D.get('rounds:'+round);

  // if it's got one point this round
  // than reverse the action
  if (current && current[id])
  {
    // adjust game points when playing
    if (round > 0) team.points--;
  }
  else
  {
    if (round > 0) team.points++;
    delta = 1;
  }

  // save results
  $D.set('rounds:'+round+':'+id, delta);
  $D.set('teams:'+id, team);
  $D.save();

  // get back
  callback({team: team, delta: delta});
};
// }}}

// {{{ get list of teams
exports.getTeams = function()
{
  return $D.get('teams');
};
// }}}

// {{{ add new team
exports.addTeam = function(team, callback)
{
  teams.add(team, function(err, data)
  {
    if (err) throw new exception('Unable to add a team ('+team+').', 500);

    callback(data);
  });
};
// }}}

// {{{ remove existing team
exports.removeTeam = function(id, callback)
{
  teams.remove(id, function(err, data)
  {
    if (err) throw new exception('Unable to remove the team (id:'+id+').', 500);

    callback(data);
  });
};
// }}}


// private methods

// get storage file from the provided path
function getStorage(path, callback)
{
  // attach path to the result file
  function middleman(err, file)
  {
    if (file) file = path+'/'+file;
    callback(err, file);
  }

  fs.readdir(path, function(err, files)
  {
    if (err) // if error
    {
      // try to create the folder
      return _.mkdirp(path, function(err2)
      {
        if (err2) return callback(err);
        // proceed with empty files list
        getNextFile([], middleman);
      });
    }

    // otherwise continue to breath normally
    getNextFile(files, middleman);
  });
}

// get next data file
function getNextFile(files, callback)
{
  _.async.reduce(files, '', function(last, f, callback)
  {
    if (!f.match(/^\d+\.json$/)) return callback(null, last);
    if (!last) return callback(null, f); // first entry
    // get the highest number
    if (parseInt(f, 10) > parseInt(last, 10)) return callback(null, f);
    // otherwise stick with what we have
    return callback(null, last);
  },
  // when reduce finished
  function(err, result)
  {
    if (err) return callback(err);

    // if no files, return default one
    if (!result) return callback(null, '0000.json');

    // increment last file number
    result = (parseInt(result, 10) + 1).toString();

    while (result.length < 4)
    {
      result = '0' + result;
    }

    return callback(null, result+'.json');
    // done here
  });
}
