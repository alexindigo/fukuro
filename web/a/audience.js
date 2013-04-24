/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * audience.js: audienceUI control panel
 */

// event handlers
var handlers =
{
  'player:new': function(player)
  {
    var player = $('<p class="new_player">'+player.name+'</p>').appendTo('body');
    player.on('animationend webkitAnimationEnd', function()
    {
      player.remove();
    });
  },
  'player:answer': function(answer, cb)
  {
    var answer = $('<p class="answer" data-player="'+answer.name+'">'+answer.answer+'</p>').appendTo('body');
    answer.on('animationend webkitAnimationEnd', function()
    {
      answer.remove();
    });
  },
  'on': function(data)
  {
console.log(['on', data]);
  },
  'off': function(data)
  {
console.log(['off', data]);
  },
  // update round
  'round': function(data)
  {
console.log(['round+', data]);
  },
  // listen to the timer
  'timer': function(data)
  {
    if (data.time < 0)
    {
      $('.timer').html('');
    }
    else
    {
      $('.timer').html(data.time);
    }
  },
  'final': function(data)
  {
console.log(['final', data]);
  }
  // end fo handlers
};


// to the server and beyond!
connect(handlers,
{
  data: {me: 'audience'},
  callback: function(data)
  {
    // set round
    handlers.round({a: '1', round: data.round});

    // // init navigation
    // Nav.init(data.content);

    // // get already played questions
    // Nav.setPlayed(data.played);

    // // init teams
    // Teams.init(data.teams, data.points, data.flags);

    // check and set current
//    if (data.current) handlers.on(data.current);

    // // start listening
    // $('body>nav').on('button:not([data-item=timer])', 'mousedown touchstart', contentActions);
    // // special treatment for the timer
    // $('body>nav').on('button[data-item=timer]', 'mousedown touchstart', statActions);

    // $('body>footer').on('button:not(.content)', 'mousedown touchstart', statActions);

    // // special treatment for the cover, rules and wifi
    // $('body>footer').on('button.content', 'mousedown touchstart', contentActions);

    // // special questions
    // $('body>footer>.special').on('button', 'mousedown touchstart', contentActions);


    // // teams
    // $('#teams').on('.team', 'click touchstart', teamActions);
  }
});

