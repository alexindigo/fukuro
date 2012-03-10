/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * host.js: hostUI controller
 */

// event handlers
var handlers =
{
  // update round
  'round': function(data)
  {
    Round.update(data.round);
  },
  'reset': function()
  {
    // do nothing
  }
  // end fo handlers
};

var Questions =
{
  init: function()
  {
    $.ajax({url: '/content/questions.html', type: 'html'}, function(res)
    {
      $('<section id="questions"></section>')
        .insertAfter('#teams')
        .append(res);

    });

  }
};

var Screenplay =
{
  init: function()
  {
    $.ajax({url: '/content/screenplay.html', type: 'html'}, function(res)
    {
      $('<section id="screenplay"></section>')
        .insertAfter('#questions')
        .append(res);

    });

  }
};


// to the server and beyond!
connect(handlers,
{
  data: {me: 'host'},
  callback: function(data)
  {
    // set round
    handlers.round({round: data.round});

//    $('<iframe id="teams" src="/"></iframe>').prependTo('body');

//    $('<iframe id="questions" src="/content/questions.pdf"></iframe>').insertAfter('#teams');


    // init teams
    //Teams.init(data.teams, data.points);

    // init questions
//    Questions.init();

    // init screenplay
//    Screenplay.init();

  }
});

