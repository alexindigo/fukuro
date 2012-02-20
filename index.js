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
    init: './teams.json',
    storage: './data',
    log_level: 1,
    port: 8000
});

// main
function main()
{
  // set the game
  reset();


}

// http requests handler
function handler(req, res)
{
    req.addListener('end', function()
    {
        file.serve(req, res);
    });
}

// reset storage/game
function reset()
{
  // find lastest file
//  var last = get

  // assume we're the only process
  // working with the storage folder
  getNextFile($.get('storage'), function(err, next)
  {
    if (err) throw new Exception('Unable to read '+$.get('storage')+' folder.', 500);
console.log('next: '+next+'\n');

    $.use('file', {file: next});
  });

// set file storage
//$.use('file', {file: $.get('storage')});

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

// exceptions
function Exception(message, code)
{
  this.code = code || 0;
  this.message = message;
  this.toString = function()
  {
    return 'Exception'+(this.code ? ' ['+this.code+']' : '')+': '+this.message;
  };
}

// run the thing
main();
