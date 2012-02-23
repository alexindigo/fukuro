/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * teams.js: teams related methods
 */
var _ = require('utile');

// build teams from the initial list
exports.build = function(list, callback)
{
  var result = [];

  _.async.forEach(list, function(item, next)
  {
    // check for required fields and generate ones if needed
    var team = {};

    if (!item.full) next('Full team name is required.');

    team.full   = item.full;
    team.short  = (item.short) ? item.short : team.full;
    // TODO: Add check for repetitive handles
    team.handle = (item.handle) ? item.handle : makeHandle(team.short);
    team.points = 0;

    result.push(team);
    return next();

  }, function(err)
  {
    return callback(err, result);
  });
}

function makeHandle(name)
{
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '_').replace(/^[0-9-_]*/, '');
}
