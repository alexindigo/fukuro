/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * game.js: game related methods
 */
var _  = require('utile')
  , fs = require('fs');

// {{{ reset storage/game
// increments file number for new storage
exports.reset = function(conf, callback)
{
  // assume we're the only process
  // working with the storage folder
  getFiles(conf.get('storage'), function(err, next)
  {
    callback(err, conf.get('storage')+'/'+next);
  });
}
// }}}

function getFiles(path, callback)
{
  fs.readdir(path, function(err, files)
  {
    if (err) // if error
    {
      // try to create the folder
      return _.mkdirp(path, function(err2)
      {
        if (err2) return callback(err);
        // proceed with empty files list
        getNextFile([], callback);
      });
    }

    // otherwise continue to breath normally
    getNextFile(files, callback);
  });
}

function getNextFile(files, callback)
{
  _.async.reduce(files, '', function(last, f, callback)
  {
    if (!f.match(/^\d+\.json$/)) return callback(null, last);
    if (!last) return callback(null, f); // first entry
    // get the highest number
    if (parseInt(f, 10) > parseInt(last, 10)) return callback(null, f);
    // otherwise stick with what we have
    return callback(null, last);
  },
  // when reduce finished
  function(err, result)
  {
    if (err) return callback(err);

    // if no files, return default one
    if (!result) return callback(null, '0000.json');

    // increment last file number
    result = (parseInt(result, 10) + 1).toString();

    while (result.length < 4)
    {
      result = '0' + result;
    }

    return callback(null, result+'.json');
    // done here
  });
}
