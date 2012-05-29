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
var _         = require('utile')
  // lib stuff
  , unidecode = require('./unidecode')
  , exception = require('./exception');

// define storage
var $D // game data
 ,  $T; // teams list

// reset teams
exports.reset = function(teams, data, callback)
{
  var flags = {};

  $D = data;
  $T = teams;

  // rebuild teams list
  build($T.dump(), function(err, teams)
  {
    if (err) throw new exception('Unable to rebuild teams list.', 500);

    // check for special features
    flags.guest      = isFeature(teams, 'guest')[0];
    flags.collective = isFeature(teams, 'collective')[0];

    // store new teams
    $D.set('teams', teams);
    $D.set('flags', flags);
    $D.save();

    return callback(null);
  });
}

// add team
exports.add = function(data, callback)
{
  // create team
  create(data, function(err, team)
  {
    if (err) throw new exception(err, 500);

   $T.push(data);
   $T.save();

    $D.set('teams:'+team.handle, team);
    $D.save();

    callback(null, team);
  });
};

// remove team
exports.remove = function(id, callback)
{
  var full
    , teams = []
    , list = $T.dump();

  // get full name from id
  full = $D.get('teams:'+id+':full');

  // do it async way
  _.async.forEach(list, function(item, next)
  {
    if (item.full != full) teams.push(item);

    return next();

  }, function(err)
  {
    if (err) return callback(err);

    $T.replace(teams);
    $T.save();

    // rebuild teams list
    build($T.dump(), function(err, teams)
    {
      if (err) throw new exception('Unable to rebuild teams list.', 500);

      // store new teams
      $D.set('teams', teams);
      $D.save();

      // finally go back
      return callback(null, id);
    });
  });

};


// private methods

// check if special feature exists in teams
function isFeature(list, feature)
{
  return Object.keys(_.filter(list, function(item)
  {
    return !!item[feature];
  }));
}

// create team object
function create(data, callback)
{
  var team = {};

  if (!data.full) callback('Full team name is required.');

  team.full   = data.full;
  team.short  = (data.short) ? data.short : team.full;
  // TODO: Add check for repetitive handles
  team.handle = (data.handle) ? data.handle : makeHandle(team.short);
  team.points = 0;

  // special guest feature
  team.guest = data.guest ? true : false;
  team.collective = data.collective ? true : false;

  return callback(null, team);
}

// build teams from the initial list
function build(list, callback)
{
  var result = {};

  _.async.forEach(list, function(item, next)
  {
    create(item, function(err, team)
    {
      if (err) return next(err);

      result[team.handle] = team;
      return next();
    });

  }, function(err)
  {
    return callback(err, result);
  });
}

function makeHandle(name)
{
  return unidecode.fold(name).toLowerCase().replace(/[^a-z0-9-]/g, '_').replace(/^[0-9-_]*/, '');
}
