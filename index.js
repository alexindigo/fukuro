#!/usr/bin/env node
/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * index.js: main server file
 */
var async  = function() {}
  , _      = require('underscore')
  , fs     = require('fs')
  , app    = require('http').createServer(handler)
  , io     = require('socket.io').listen(app)
  , static = require('node-static')
  , file   = new (static.Server)('./web')
  , $      = require('nconf');

// get environment
$.argv().env();

// TODO: put to config file
$.defaults(
{
    teams: './data/teams.json',
    storage: './data',
    log_level: 1,
    port: 8000
});

// Routing
var Routing =
{
  // client init
  'helo': function(data, fn)
  {
    // send current state
    fn(
    {
      status: $.get('dump:status'),
      round: $.get('round'),
      teams: $.get('teams')
    });
  },
  // game status change
  'status': function(data)
  {
    $.set('dump:status', data);

    socket.broadcast.emit('status', data);

    // save state
    $.save(async);
  },
  // admin actions
  'admin:action': function(data, fn)
  {
    $.set('dump:action', data);

    switch (data.id)
    {
      case 'round':
        $.set('round', $.get('round')+1);
        socket.broadcast.emit('action', {id: 'round', number: $.get('round')});
        fn({type: 'round', number: $.get('round')});
        break;

      case 'final':
        $.set('round', 0);
        socket.broadcast.emit('final', {teams: $.get('teams')});
        fn({type: 'final', round: $.get('round'), teams: $.get('teams')});
        break;

      default:
        socket.broadcast.emit('action', data);
    }

    // save state
    $.save(async);
  },
  // TODO: Split it
  'admin:check': function(data)
  {
    var teams = $.get('teams'),
        rounds = $.get('rounds'),
        r = $.get('round');

    $.set('dump:check', data);

    switch (data.type)
    {
      case 'team':
        if (!$.get('round') || !(data.id in Teams)) return;

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
        $.set('teams', teams);
        $.set('rounds', rounds);

        // update scorebaords everywhere
        io.sockets.emit('team', teams[Teams[data.id]]);
        break;
    }

    // save state
    $.save(async);
  },
  // reload all the clients
  'admin:reload': function()
  {
    // tell everybody except me to reload the page
    socket.broadcast.emit('reset');
  },
  // reset the game
  'admin:reset': function()
  {
    // override storage file with initital values
    fs.readFile($.get('init'), function (err, data)
    {
      if (err) return; // do nothing
      fs.writeFile($.get('storage'), data, function(err, data)
      {
        if (err) throw err;
        // reload config
        $.load(function()
        {
          // tell everybody to reload
          io.sockets.emit('reset');

        });
      });

    });
    // end of mess
  }
};
// }}}

// {{{ main
function main()
{
  // set the game
  reset();

  io.set('log level', $.get('log_level'));

  // init server
  io.sockets.on('connection', function(socket)
  {
    _.each(Routing, function(method, handle)
    {
      socket.on(handle, method);
    });
  });

  // start listening
  app.listen($.get('port'));
}
// }}}

// {{{ http requests handler
function handler(req, res)
{
    req.addListener('end', function()
    {
        file.serve(req, res);
    });
}
// }}}

// {{{ reset storage/game
// increments file number for new storage
function reset()
{
  // find lastest file
//  var last = get

  // assume we're the only process
  // working with the storage folder
  getNextFile($.get('storage'), function(err, next)
  {
    if (err) throw new Exception('Unable to read '+$.get('storage')+' folder.', 500);

    $.use('file', {file: next});
  });

  function getNextFile(path, callback)
  {
    fs.readdir(path, function(err, files)
    {
      if (err) return callback(err);

      var file;

      file = _.reduce(files, function(last, file)
      {
        if (!file.match(/^\d+\.json$/)) return last;
        if (!last) return file; // first entry
        // get the highest number
        if (parseInt(file, 10) > parseInt(last, 10)) return file;
        // otherwise stick with what we have
        return last;
      }, file);

      // if no files, return default one
      if (!file) return callback(null, '0000.json');

      // increment last file number
      file = (parseInt(file, 10) + 1).toString();

      while (file.length < 4)
      {
        file = '0' + file;
      }

      callback(null, file+'.json');
    });
  }
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
