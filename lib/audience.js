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

var Players = {}
  , PlayersByName = {}
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
    var token;

    data = data || {};

    // first timer
    if (!data.token)
    {
      token = this.socket.id;

      Players[token] = {token: token};

      this.socket.set('user', token, function(err)
      {
        // don't really care about errors at this point
        fn({status: 'ok', teams: this.state.teams, token: token});
      }.bind(this));
    }
    else if (!Players[data.token])
    {
      fn({status: 'error'});
    }
    else
    {
      this.socket.join('clients');

      this.socket.set('user', data.token, function(err)
      {
        // don't really care about errors at this point
        fn({status: 'ok', teams: this.state.teams, token: data.token});
      }.bind(this));
    }
  },
  'join': function(data, fn)
  {
    data = data || {};

    if (!data.name) return fn({status: 'error'});

    if (data.name in PlayersByName) return fn({status: 'error'});

    this.socket.get('user', function(err, token)
    {
      if (err) return fn({status: 'error', message: 'Wrong user'});

      // remove old name
      if (PlayersByName[Players[token].name])
      {
        delete PlayersByName[Players[token].name];
      }

      // save new name
      PlayersByName[data.name] = token;
      Players[token].name      = data.name;

      fn({status: 'ok'});

    }.bind(this));
  },
  'team': function(data, fn)
  {
    data = data || {};

    if (!data.team) return fn({status: 'error'});

    if (!(data.team in this.state.teams)) return fn({status: 'error'});

    this.socket.get('user', function(err, token)
    {
      if (err) return fn({status: 'error', message: 'Wrong user'});

      // save team
      Players[token].team = data.team;

      fn({status: 'ok'});

    }.bind(this));
  },
  'answer': function(data, fn)
  {
    data = data || {};

    if (!data.answer) return fn({status: 'error'});

    this.socket.get('user', function(err, token)
    {
      var answer;

      if (err) return fn({status: 'error', message: 'Wrong user'});

      // save team
      Players[token].answer = data.answer;

      // notify client
      fn({status: 'ok'});

      // and start doing our business
      if (Players[token].answer.match(/29/))
      {
        answer = {type: 'audience', player: Players[token].name, team: Players[token].team, answer: Players[token].answer};
        // notify master
        this.master.emit('admin:answer', answer, function(data)
        {
console.log(['master replied', data]);
        });
      }

    }.bind(this));
  }
};

// export router
exports.router = function()
{
  return Router;
}
