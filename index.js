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
  // set the game
  game.reset(conf, function(err, storage)
  {
    if (err) throw new Exception('Unable to reset storage file.', 500);

    // use file for storage
    conf.set('data', storage);

    // init server
    init();
  });
}
// }}}

// init server
function init()
{
  var R = router.router(conf);

  // socket io log level
  io.set('log level', 1);

  // init server
  io.sockets.on('connection', function(socket)
  {
    _.each(R, function(method, handle)
    {
      socket.on(handle, method);
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


// {{{ exceptions
function Exception(message, code)
{
  this.code = code || 0;
  this.message = message;
  this.toString = function()
  {
    return 'Exception'+(this.code ? ' ['+this.code+']' : '')+': '+this.message;
  };
}
// }}}

// run the thing
main();
