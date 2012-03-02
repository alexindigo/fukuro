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
  //
  // frontend init
  //
  'helo': function(data, fn)
  {
    // join client to the specific room (admin, client, host)
    if (data.me == 'admin')
    {
      this.socket.join('admins');
    }
    else
    {
      this.socket.join('clients');
    }
    // send current state
    fn(this.game.state());
  },
  //
  // admin commands
  //
  'admin:show': function(data, fn)
  {
    // update current, if new data not the same as current
    if (!changeCurrent.call(this, data)) return;

    // notify others
    this.socket.broadcast.emit('show', data, function(res)
    {
      fn(res);
    });
  },
  'admin:hide': function(data, fn)
  {
    // update current, if old data same as current
    if (!changeCurrent.call(this, null, data)) return;

    // notify others
    this.socket.broadcast.emit('hide', data, function(res)
    {
      fn(res);
    });
  },
  'admin:round': function(data, fn)
  {
    var round;

    // check round and save it
    // final round is -1 so it can't get thru
    if (round = (this.game.round() + 1))
    {
      this.game.round(round);
      // notify the gang
      this.all.emit('round', {round: this.game.round()});
    }
    // get back to the emitter
    fn({round: this.game.round()});
  },
  'admin:reload': function(data, fn)
  {
    // tell everybody except me to reload the page
    this.socket.broadcast.emit('reset');
    // get back to the emitter
    fn();
  },
  //
  // client's state changes
  //
  'off': function(data)
  {
    // update current, if it's the same skip it
    changeCurrent.call(this, null);
  }

};

// export router
exports.router = function()
{
  return Router;
}

/**
 * helpers
 */

// check if current exists and it's different from the new data
// notify admins if current changes the value
// should be used in teh context of the router
// return true if current has been changed
// TODO: This one looks particulary hacky
function changeCurrent(newData, oldData)
{
  var current;

  // check if anything is active right now
  // or it's an blast from the past
  if (current = this.game.current())
  {
    // check if we're trying to unset right thing
    if (oldData && !same(oldData)) return false;

    // check it's exact same item
    if (newData && same(newData)) return false;

    // notify admins
    this.all.in('admins').emit('off', current);
  }

  // change current
  this.game.current(newData);
  // notify other admins
  if (newData) this.all.in('admins').emit('on', newData);

  return true;

  // subroutines

  function same(data)
  {
    if (current.item != data.item) return false;
    if (current.number && (current.number != data.number)) return false;
    return true;
  }
}








function getRidOf()
{


////////////
var zz = {
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
}
////////////


}


