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
    $D.set('sound', null);
    $D.set('scale', 1);
    $D.set('round', 0);
    $D.set('rounds', []);
    $D.set('played', []);

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
    sound: $D.get('sound'),
    scale: $D.get('scale'),
    round: $D.get('round'),
    points: $D.get('rounds:'+$D.get('round')),
    teams: $D.get('teams'),
    flags: $D.get('flags'),
    played: $D.get('played'),
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

// {{{ returns rounds list
exports.played = function()
{
  return $D.get('played');
};
// }}}


// {{{ updates current state
exports.current = function(current)
{
  if (typeof current != 'undefined')
  {
    $D.set('current', current);

    // store played question
    if (current && current.item == 'question')
    {
      $D.set('played:'+$D.get('round'), current.number);
    }

    // save state (async)
    $D.save();
  }
  return $D.get('current');
};
// }}}

// {{{ updates current sound
exports.sound = function(sound)
{
  if (typeof sound != 'undefined')
  {
    $D.set('sound', sound);
    // save state (async)
    $D.save();
  }
  return $D.get('sound');
};
// }}}

// {{{ updates current scale
exports.scale = function(scale)
{
  if (typeof scale != 'undefined')
  {
    $D.set('scale', scale);
    // save state (async)
    $D.save();
  }
  return $D.get('scale');
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

// {{{ recieve an answer
exports.answer = function(answer, callback)
{
  var current = $D.get('current');

  // check different things
  if (
       !$Q // no timer set
    || !answer // no answer passed
    || !current // game has not started
    || current.item != 'question' // not in question state
    || current.number != answer.type // not an audience question
    )
  {
    return callback('error');
  }

  clearInterval($Q);
  $Q = null;
  return callback(null);
};
// }}}

// {{{
exports.checkTeam = function(id, callback)
{
  var delta = null
    , collective
    , lastStanding
    , team = $D.get('teams:'+id)
    , round = $D.get('round')
    , current = $D.get('rounds:'+round)
    ;

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

  // {{{ check for collective team
  if ((collective = $D.get('flags:collective')) && id != $D.get('flags:guest'))
  {
    // get actual object
    collective = $D.get('teams:'+collective);

    // add points to collective, but only once per round
      // special changes for Druz' game
      // collective equals max points of all teams
    if (delta && collective.points < team.points)// && (!current || !current[collective.handle]))
    {
      collective.points++;

      $D.set('rounds:'+round+':'+collective.handle, delta);
      $D.set('teams:'+collective.handle, collective);
      // it's not good pattern, but it's very convenient for now
      // and only call the thing on changes
      callback(collective);
    }
    // for minus point check if it's last team of the collective
    // and we have points to subtract from
    else if (current && current[collective.handle])
    {
      lastStanding = Object.keys(_.filter(current, function(item, key)
      {
        var tt; // temp team

        // no virtual teams
        if (key == collective.handle)
        {
          return false;
        }
        // no guest teams
        if (key == $D.get('flags:guest'))
        {
          return false;
        }
        // no current team
        // because it's the one with minus point
        if (key == id)
        {
          return false;
        }
        // only one with points
        if (!item)
        {
          return false;
        }

        // check if there is team with equal number of points
        tt = $D.get('teams:'+key);
        if (tt.points < collective.points)
        {
          return false;
        }

        return true;
      }));

      if (lastStanding.length == 0)
      {
        collective.points--;

        $D.set('rounds:'+round+':'+collective.handle, delta);
        $D.set('teams:'+collective.handle, collective);
        // it's not good pattern, but it's very convenient for now
        // and only call the thing on changes
        callback(collective);
      }
    }
    // end of "to add or not to add points"
  }
  // }}} end of collective hack

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
