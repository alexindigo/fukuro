/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * audience.js: handle audience related logic here
 */

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
      case 'client':
        this.socket.join('clients');
        break;
    }

    // send current teams
    this.master.emit();
    fn(this.game.state());
  },
  'join': function(data, fn)
  {
    data.name = 'Vasya';

    // // update current, if new data not the same as current
    // if (!changeCurrent.call(this, data)) return;

    // var self = this;

    // // check if there are any clients and if not fire callback right away
    // if (this.rooms['/clients'] && this.rooms['/clients'].length)
    // {
    //   // notify others
    //   this.socket.broadcast.emit('show', data, function(res)
    //   {
    //     fn(res);
    //   });
    // }
    // else
    // {
    //   fn({error: 'No connected clients'});
    // }
  },
  'team': function(data, fn)
  {
    data.team = 'romantiki';

    // // update current, if old data same as current
    // if (!changeCurrent.call(this, null, data)) return;

    // // check if there are any clients and if not fire callback right away
    // if (this.rooms['/clients'] && this.rooms['/clients'].length)
    // {
    //   // notify others
    //   this.socket.broadcast.emit('hide', data, function(res)
    //   {
    //     fn(res);
    //   });
    // }
    // else
    // {
    //   fn({error: 'No connected clients'});
    // }
  },
  'answer': function(data, fn)
  {
    // var round;

    data.answer = 'Feb 29 bla';

    // // check round and save it
    // // final round is -1 so it can't get thru
    // if (round = (this.game.round() + 1))
    // {
    //   this.game.round(round);
    //   // tell clients to hide current
    //   this.all.in('clients').emit('off', this.game.current());
    //   // reset current
    //   changeCurrent.call(this, null);
    //   // notify the gang
    //   this.all.emit('round', {round: this.game.round()});
    // }
    // // get back to the emitter
    // fn({round: this.game.round()});
  }
};

// export router
exports.router = function()
{
  return Router;
}
