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
 * wingman.js: audience facing server
 */
var _        = require('utile')
  , app      = require('http').createServer()
  , io       = require('socket.io').listen(app)
  , ioClient = require('socket.io-client')
  , static   = require('node-static')
  , file     = new (static.Server)('./public')
  , conf     = require('nconf')
  // lib stuff
  , router = require('./lib/audience')
  ;

// {{{ get configuations
conf.argv().env().use('memory');

// TODO: put to config file
conf.defaults(
{
    master: '10.0.8.2:31337',
    port: 80,
    password: null
});
// }}}

// {{{ main
function main()
{
  // connect to the master
  var master = ioClient.connect('ws://'+conf.get('master'));

  master.on('connect', function()
  {
    console.log('connected to master ['+conf.get('master')+']');

    master.emit('helo', {me: 'admin'}, function(state)
    {
      console.log('successful handshake');

      // and start the server
      start(master, state);
    });
  });
}
// }}}

// start server
function start(master, state)
{
  var R = router.router();

  // listen for master emitted events
  master.on('on', function(data, fn)
  {

  });

  master.on('timer', function(data, fn)
  {

  });

  // pass master
  router.master = master;
  router.state = state;

  // socket io config
  io.set('log level', 1);
  io.set('heartbeat interval', 20);
  io.set('heartbeat timeout', 60);

  // init server
  io.sockets.on('connection', function(socket)
  {
    router.socket = socket;

    // reload client's page
    socket.emit('reset');

    // timer from time := 60 .. -1
    socket.emit('timer', {time: time});

    _.each(R, function(method, handle)
    {
      socket.on(handle, function()
      {
        var thisArg = _.mixin(this, {'socket': socket, 'all': io.sockets, 'master': master, 'rooms': io.rooms})
          , funArgs = Array.prototype.slice.call(arguments)
          ;

        // if password is set as clients for the password
        // TODO: make it real
        if (conf.get('password'))
        {
          socket.get('password', function(err, password)
          {
            // kust formality
            if (err) return console.log(['ERROR', err]);

            // check the password
            // double equal to compare nothing with empty string
            if (conf.get('password') == password)
            {
              process();
            }
            else // don't match ask (again)
            {
              requestPassword(conf.get('password'));
            }
          });
        }
        else // no need for password
        {
          process();
        }

        // subroutines

        // to make deferred
        function process()
        {
          // catch stuff that goes wrong
          try
          {
            return method.apply(thisArg, funArgs);
          }
          catch (e)
          {
            // TODO: Add flatiron/errs
            console.log(['ERROR', e]);
          }
        }

        // request password
        function requestPassword(original)
        {
          socket.emit('password', function(password)
          {
            if (original == password)
            {
              // store new password
              socket.set('password', password, function(err)
              {
                // don't really care about errors at this point
                process();
              });
            }
            else // don't match, everything all over again
            {
              requestPassword(original);
            }
          });
        }

      });
    });
  });

  // start listening
  app.listen(conf.get('port'));
}


// run the thing
main();

