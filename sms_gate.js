#!/usr/bin/env node
/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * sms_gate.js: gateway to sms service (receive/send)
 */
var _        = require('utile')
  , http     = require('http')
  , https    = require('https')
  , app      = http.createServer(handler)
  , qs       = require('querystring')
  , io       = require('socket.io').listen(app)
  , ioClient = require('socket.io-client')
  , conf     = require('nconf')

  // globals
  , players  = {}
  , nameRef  = {}

  // game's state
  , state = {timer: -1, number: 0}

  // connection to master
  , master
  ;

// {{{ get configuations
conf.argv().env().use('memory');

// TODO: put to config file
conf.defaults(
{
    master: '127.0.0.1:31337',
    port: 8037,
    password: null,

    account: 'ACc4be9d7b97e4ce941b85982fbeb1b0fa',
    key    : '55ef2de8d408cf44e699c1ab6fc1d02e',
    phone  : '+14158684080'
});
// }}}

// {{{ main
function main()
{
  // connect to the master
  console.log('connecting... '+ conf.get('master'));
  master = ioClient.connect('ws://'+conf.get('master'));

  master.on('connect', function()
  {
    console.log('connected to master ['+conf.get('master')+']');

    master.emit('helo', {me: 'admin'}, function(state)
    {
      console.log(['successful handshake']);

      // and start the server
      start(master, state.teams);
    });
  });
}
// }}}

// start server
function start(master, teams)
{
  // listen for master emitted events
  master.on('on', function(data, fn)
  {
console.log(['on', data]);

    if (data.item == 'question')
    {
      state.ready  = true;
      state.timer  = -1;
      state.number = data.number;
    }
  });

  master.on('off', function(data, fn)
  {
    state.ready  = false;
    state.timer  = -1;
    state.number = 0;

console.log(['off', data]);
  });

  master.on('timer', function(data, fn)
  {
    state.timer = data.time;
  });

  // socket io config
  io.set('log level', 1);
  io.set('heartbeat interval', 20);
  io.set('heartbeat timeout', 60);

  // start listening
  app.listen(conf.get('port'));
  console.log('running webserver on port '+ conf.get('port'));
}

// {{{ http requests handler
function handler(req, res)
{
  var body = ''
    ;

  if (req.method == 'POST')
  {
    req.on('data', function(data)
    {
      body = body + data.toString('utf8');
    });

    req.on('end', function()
    {
      var data = qs.parse(body)
        , match
        ;

      console.log(['req', data]);
      res.end();

      if (!data) return;

      if (data.AccountSid == conf.get('account'))
      {
        // get name
        if (players[data.From])
        {
          console.log(['answer by', state.ready, state.timer, players[data.From].name, data.Body, players[data.From].played[state.number]]);

          // accept only during question state
          if (state.ready && state.timer > -1 && !players[data.From].played[state.number])
          {
            players[data.From].played[state.number] = data.Body;
            master.emit('player:answer', {id: data.From, name: players[data.From].name, answer: data.Body});
          }
        }
        else if (match = data.Body.match(/^play\s+(.+)$/i))
        {
          console.log(['new', match]);

          // check name
          if (!match[1] || match[1].length < 4)
          {
            sendMessage(data.From, 'Please enter at least 4 characters for your name.');
            return;
          }
          // check if name exists
          if (nameRef[match[1]])
          {
            sendMessage(data.From, 'Please choose different name, "'+match[1]+'" already taken.');
            return;
          }

          players[data.From] =
          {
            name: match[1],
            points: 0,
            played: {}
          };
          // keep reference by name
          nameRef[match[1]] = data.From;

          // notify master
          master.emit('player:new', {id: data.From, name: players[data.From].name});

          console.log(['players', players]);
        }
        else
        {
          sendMessage(data.From, 'Please register your name by sending "play Your Name".');
        }
      }
    });
  }
  else
  {
    console.log(['boo', req.method]);
    res.end('boo');
  }

}
// }}}

// sending messages back
function sendMessage(number, message)
{
  var request
    , params
    , options
    ;

console.log(['sending...', number, message]);

  params = qs.stringify(
  {
    From: conf.get('phone'),
    To  : number,
    Body: message
  });

  options =
  {
    host   : 'api.twilio.com',
    port   : 443,
    path   : '/2010-04-01/Accounts/'+conf.get('account')+'/SMS/Messages.json',
    auth   : conf.get('account')+':'+conf.get('key'),
    method : 'POST',
    headers:
    {
      'Content-type'  : 'application/x-www-form-urlencoded',
      'Content-length': params.length
    }
  };

  request = https.request(options, function(res)
  {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk)
    {
      console.log('BODY: ' + chunk);
    });
  });

  request.on('error', function(err)
  {
    console.log('problem with request: ' + err.message);
  });

  // write data to request body
  request.write(params);
  request.end();
}

// run the thing
main();

