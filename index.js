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
  , fs     = require('fs')
  , app    = require('http').createServer(handler)
  , io     = require('socket.io').listen(app)
  , static = require('node-static')
  , file   = new (static.Server)('./web')
  , conf   = require('nconf')
  // lib stuff
  , exception = require('./lib/exception')
  , game   = require('./lib/game')
  , router = require('./lib/router');

// {{{ get configuations
conf.argv().env().use('memory');

// TODO: put to config file
conf.defaults(
{
    teams: './data/teams.json',
    content: './data/content.json',
    storage: './data',
    port: 8000
});
// }}}

// {{{ main
function main()
{
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

  // socket io log level
  io.set('log level', 1);

  // TODO: wrap into try-catch

  // init server
  io.sockets.on('connection', function(socket)
  {
    router.socket = socket;

    _.each(R, function(method, handle)
    {
      socket.on(handle, function()
      {
        var thisArg = _.mixin(this, {'game': game, 'socket': socket});
        return method.apply(thisArg, Array.prototype.slice.call(arguments));
      });
    });
  });

  // start listening
  app.listen(conf.get('port'));
}

// {{{ http requests handler
function handler(req, res)
{
    req.addListener('end', function()
    {
        file.serve(req, res);
    });
}
// }}}

// run the thing
main();
