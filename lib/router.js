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
  ;

// define routing
var Router =
{
  //
  // frontend init
  //
  'disconnect': function()
  {
    // do something?
  },
  'helo': function(data, fn)
  {
    // join client to the specific room (admin, client, host)
    switch (data.me)
    {
      case 'setup':
      case 'admin':
        this.socket.join('admins');
        break;

      case 'client':
        this.socket.join('clients');
        break;

      case 'host':
        this.socket.join('admins');
        this.socket.join('clients');
        break;
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

    var self = this;

    // check if there are any clients and if not fire callback right away
    if (this.rooms['/clients'] && this.rooms['/clients'].length)
    {
      // notify others
      this.socket.broadcast.emit('show', data, function(res)
      {
        fn(res);
      });
    }
    else
    {
      fn({error: 'No connected clients'});
    }
  },
  'admin:hide': function(data, fn)
  {
    // update current, if old data same as current
    if (!changeCurrent.call(this, null, data)) return;

    // check if there are any clients and if not fire callback right away
    if (this.rooms['/clients'] && this.rooms['/clients'].length)
    {
      // notify others
      this.socket.broadcast.emit('hide', data, function(res)
      {
        fn(res);
      });
    }
    else
    {
      fn({error: 'No connected clients'});
    }
  },
  'admin:round': function(fn)
  {
    var round, fakeRound;

    // check round and save it
    // final round is -1 so it can't get thru
    if (round = (this.game.round() + 1))
    {
      this.game.round(round);
      // tell clients to hide current
      this.all.in('clients').emit('off', this.game.current());
      // reset current
      changeCurrent.call(this, null);
      // notify the gang
      if (this.game.played().indexOf('audience') != -1)
      {
        fakeRound = this.game.round() - 1;
      }
      else
      {
        fakeRound = this.game.round();
      }

      this.all.emit('round', {round: fakeRound});
    }
    // get back to the emitter
    fn({round: this.game.round()});
  },
  'admin:reload': function(fn)
  {
    // tell everybody except me to reload the page
    this.socket.broadcast.emit('reset');
    // get back to the emitter
    fn();
  },
  'admin:timer': function(fn)
  {
    var self = this;

    if (this.game.round() < 0) return;
    // show centralized timer
    // ping everybody every second
    this.game.timer(function(time)
    {
      if (time < 0)
      {
        // send end state for sure
        self.all.emit('timer', {time: time});

        // hide current content on timer expiration
        // self.all.in('clients').emit('off', self.game.current());
        // changeCurrent.call(self, null);
      }
      else
      {
        self.all.volatile.emit('timer', {time: time});
      }
    });
    // get back to the emitter
    fn();
  },
  'admin:team': function(data, fn)
  {
    var self = this;

    // no points before the game
    if (this.game.round() < 1) return fn();
    // notify everybody with new team data
    // TODO: Bad pattern! callback maybe called more than once
    // workaround to support collective virtual team
    this.game.checkTeam(data.id, function(team)
    {
      self.all.emit('team', team);
    });
    // get back to the emitter
    fn();
  },
  'admin:final': function(fn)
  {
    round = this.game.round(-1);
    this.all.emit('final', {teams: this.game.getTeams()});
    fn();
  },

  //
  // special events
  //
  'admin:answer': function(data, fn)
  {
    var answer, self = this;

    if (this.game.round() < 0) return fn({status: 'error'});

    // show centralized timer
    // ping everybody every second
    this.game.answer(data, function(err)
    {
      if (err) return fn({status: 'error'});

      self.all.emit('timer', {time: -1});
      // hide current content on timer expiration

      answer = {item: 'audience', player: data.player, team: data.team, answer: data.answer};

      self.all.in('clients').emit('show', answer);
      changeCurrent.call(self, answer);

      // get back to the emitter
      fn();
    });
  },

  //
  // setup commands
  //
  'setup:reload': function(fn)
  {
    // tell everybody except me to reload the page
    this.socket.broadcast.emit('reset');
    // get back to the emitter
    fn();
  },
  'setup:reset': function(fn)
  {
    var self = this;

    // reset the game and reload all clients
    this.game.reset(function()
    {
      self.all.emit('reset');
    });
  },
  'setup:rounds': function(fn)
  {
    fn({round: this.game.state().round, points: this.game.rounds()});
  },
  'setup:point': function(data, fn)
  {
    var self = this;

    this.game.changePoint(data.id, data.round, function(data)
    {
      self.all.emit('team', data.team);
      fn(data.delta);
    })
  },
  'setup:add': function(data, fn)
  {
    var self = this;

    this.game.addTeam(data, function(team)
    {
      self.all.emit('add', {team: team});
      fn();
    });
  },
  'setup:remove': function(data)
  {
    var self = this;

    this.game.removeTeam(data.id, function(team)
    {
      self.all.emit('remove', {team: team});
    });
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
// return true if current has been changed
// Note: should be used in teh context of the router
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
    this.all.emit('off', current);
  }

  // change current
  this.game.current(newData);
  // notify other admins
  if (newData) this.all.emit('on', newData);

  return true;

  // subroutines

  function same(data)
  {
    if (current.item != data.item) return false;
    if (current.number && (current.number != data.number)) return false;
    return true;
  }
}
