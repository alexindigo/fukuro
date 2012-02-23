/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * router.js: handle logic here
 */
// use nconf as storage layer
var store = require('nconf')
  // lib stuff
  , game   = require('./game')
  , teams = require('./teams.js');

// define storages
var $D // data storage
  , $T // teams storage
  , $C; // content storage

// define routing
var Router =
{
  // client init
  'helo': function(data, fn)
  {
    // send current state
    fn(
    {
      status: $D.get('dump:status'),
      round: $D.get('round'),
      teams: $D.get('teams')
    });
  },
  // game status change
  'status': function(data)
  {
    $D.set('dump:status', data);

    socket.broadcast.emit('status', data);

    // save state
    $D.save();
  },
  // admin actions
  'admin:action': function(data, fn)
  {
    $D.set('dump:action', data);

    switch (data.id)
    {
      case 'round':
        $D.set('round', $D.get('round')+1);
        socket.broadcast.emit('action', {id: 'round', number: $D.get('round')});
        fn({type: 'round', number: $D.get('round')});
        break;

      case 'final':
        $D.set('round', 0);
        socket.broadcast.emit('final', {teams: $D.get('teams')});
        fn({type: 'final', round: $D.get('round'), teams: $D.get('teams')});
        break;

      default:
        socket.broadcast.emit('action', data);
    }

    // save state
    $D.save();
  },
  // TODO: Split it
  'admin:check': function(data)
  {
    var teams = $D.get('teams'),
        rounds = $D.get('rounds'),
        r = $D.get('round');

    $D.set('dump:check', data);

    switch (data.type)
    {
      case 'team':
        if (!$D.get('round') || !(data.id in Teams)) return;

        // set rounds log
        if (!rounds[r]) rounds[r] = {};
        // do toggle

        // update total score
        if (rounds[r][data.id])
        {
            delete rounds[r][data.id];
            teams[Teams[data.id]].points--;
        }
        else
        {
            rounds[r][data.id] = 1;
            teams[Teams[data.id]].points++;
        }

        // put objects back
        $D.set('teams', teams);
        $D.set('rounds', rounds);

        // update scorebaords everywhere
        io.sockets.emit('team', teams[Teams[data.id]]);
        break;
    }

    // save state
    $D.save();
  },
  // reload all the clients
  'admin:reload': function()
  {
    // tell everybody except me to reload the page
    socket.broadcast.emit('reset');
  },





  // reset the game
// TODO: Refactor
  'admin:reset': function()
  {
    // override storage file with initital values
    fs.readFile($D.get('init'), function (err, data)
    {
      if (err) return; // do nothing
      fs.writeFile($D.get('storage'), data, function(err, data)
      {
        if (err) throw err;
        // reload config
        $D.load(function()
        {
          // tell everybody to reload
          io.sockets.emit('reset');

        });
      });

    });
    // end of mess
  }
};

// {{{ nconf with human face
function getStorage(file)
{
  var data;

  if (file) data = { store: { type: 'file', file: file }};

  return new store.Provider(data);
}
// }}}

// {{{ reset teams from initial list
function resetTeams()
{
  teams.build($T.dump(), function(err, teams)
  {
    if (err) return;

    $D.set('teams', teams);
    $D.save();
  });
}
// }}}

// export router
exports.router = function(conf)
{
  // init storages
  $D = getStorage(conf.get('data'))
, $T = getStorage(conf.get('teams'))
, $C = getStorage(conf.get('content'));

  // TODO: find better place for that
  resetTeams();

  return Router;
}
