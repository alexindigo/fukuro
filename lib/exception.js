/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * exception.js: exception handling
 */

module.exports = function(message, code)
{
  this.code = code || 0;
  this.message = message;
  this.toString = function()
  {
    return 'Exception'+(this.code ? ' ['+this.code+']' : '')+': '+this.message;
  };
}
