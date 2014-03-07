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
 * index.js: main server file
 */
var _      = require('utile')
  , app    = require('http').createServer(handler)
  , io     = require('socket.io').listen(app)
  , static = require('node-static')
  , file   = new (static.Server)('./web')
  , conf   = require('nconf')
  , errs   = require('errs')
  , dump   = require('fukuro-dump')
  // lib stuff
  , exception = require('./lib/exception')
  , game   = require('./lib/game')
  , router = require('./lib/router')
  ;

// {{{ get configuations
conf.argv().env().use('memory');

// TODO: put to config file
conf.defaults(
{
    teams: './data/teams.json',
    content: './data/content.json',
    storage: './data',
    port: 31337,
    password: null
});
// }}}

// {{{ main
function main()
{
  // check for detours
  if (conf.get('dump'))
  {
    return dump(conf.get('dump'));
  }
  // init the game
  game.init(conf, function(err)
  {
    // and start the server
    start();
  });
}
// }}}

// start server
function start()
{
  var R = router.router();

  router.game = game;

  // socket io config
  io.set('log level', 1);
  io.set('transports', ['websocket']);
  io.set('heartbeat interval', 20);
  io.set('heartbeat timeout', 60);

  // init server
  io.sockets.on('connection', function(socket)
  {
    router.socket = socket;

    _.each(R, function(method, handle)
    {
      socket.on(handle, function()
      {
        var thisArg = _.mixin(this, {'game': game, 'socket': socket, 'all': io.sockets, 'rooms': io.rooms})
          , funArgs = Array.prototype.slice.call(arguments)
          ;

        // if password is set as clients for the password
        // TODO: make it real
        if (conf.get('password'))
        {
          socket.get('password', function(err, password)
          {
            // just formality
            if (err)
            {
              console.log(['ERROR-password', err]);
              console.trace();
              return;
            }

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
            console.log(['ERROR-process', e, handle, method, thisArg, funArgs]);
            console.trace();
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
  console.log('listening on '+conf.get('port'));
}

// {{{ http requests handler
function handler(req, res)
{

    req.addListener('end', function()
    {
      var match;

      // serve top level html files as simple uris
      if (match = req.url.match(/^(\/[a-z]+)\/?$/)) req.url = match[1]+'.html';
      // add mime type
      if (req.url.match(/\.(m4v|mp4)$/)) res.setHeader("Content-Type", "video/mp4");
      // continue breath normally
      file.serve(req, res);

      // TODO: Add 404 error handler
    }).resume();
}
// }}}

// run the thing
main();
