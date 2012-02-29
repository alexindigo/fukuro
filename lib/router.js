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
var store     = require('nconf')
  // lib stuff
  , exception = require('./exception');

// define routing
var Router =
{
  // client init
  'helo': function(data, fn)
  {
    // send current state
    fn(this.game.state());
  },
  'admin:show': function(data, fn)
  {
    this.socket.broadcast.emit('show', data, function(res)
    {
      fn({stat: 'ok'});

console.log(['res', res]);
    });
  },




  // admin actions
  'admin:action': function(data, fn)
  {
    var round;

    switch (data.id)
    {
      case 'round':
        round = this.game.round(this.game.round()+1);
        this.socket.broadcast.emit('action', {id: 'round', number: round});
        fn({type: 'round', number: round});
        break;

      case 'final':
        round = this.game.round(-1);
        this.socket.broadcast.emit('final', {teams: this.game.getTeams()});
        fn({type: 'final', teams: this.game.getTeams()});
        break;

      default: // pass thru
        this.socket.broadcast.emit('action', data);
    }
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


// export router
exports.router = function()
{
  return Router;
}
