/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * admin.js: adminUI controller
 */

// Navigation controller
var Nav =
{
  base: 'body>nav>.questions',
  played: [],
  init: function(data)
  {
    // {{{ create questions
    if ('questions' in data)
    {
      $.each(data.questions, $.bind(function(q, n)
      {
        // add (show) question button
        $('<button id="button_question_'+n+'" data-item="question" data-number="'+n+'">'+n+'</button>').appendTo(this.base);
        // add (show) answer button
        $('<button id="button_answer_'+n+'" class="careful" data-item="answer" data-number="'+n+'">'+n+'</button>').appendTo(this.base);
      }, this));
    }
    // }}}
  },
  addPlayed: function(question)
  {
    this.played[Round.round] = question;
    // do the DOM
    this.refresh();
  },
  setPlayed: function(data)
  {
    this.played = data;
    this.refresh();
  },
  refresh: function()
  {
    // start from scratch each time to keep things clean
    $('button', this.base).removeClass('current').removeClass('played');

    // loop thru: question, round
    $.each(this.played, $.bind(function(q, r)
    {
      // massage DOM, add played
      $('#button_question_'+q).addClass('played');
      // and current classes
      if (r == Round.round)
      {
        // current is not played
        $('#button_question_'+q).addClass('current').removeClass('played');
      }
    }, this));
  }

};

// event handlers
var handlers =
{
  'on': function(data)
  {
    var item = $('#button_'+data.item+(data.number ? '_'+data.number : ''));
    if (item)
    {
      item.addClass('active');
    }
    // update list of played questions
    if (data.item == 'question')
    {
      Nav.addPlayed(data.number);
    }
  },
  'off': function(data)
  {
    var item = $('#button_'+data.item+(data.number ? '_'+data.number : ''));
    if (item)
    {
      item.removeClass('active');
    }
  },
  // update round
  'round': function(data)
  {
    Round.update(data.round);
    // update new round button
    // TODO: Add support for Final, round: -1
    $('#button_round').attr('data-label', data.round ? 'New Round' : 'Start Game');
    // update current question in the nav
    Nav.refresh();
  },
  // listen to the timer
  'timer': function(data)
  {
    if (data.time > -1)
    {
      $('#button_timer').addClass('active').attr('data-timer', ' '+data.time);
    }
    else
    {
      $('#button_timer').removeClass('active').removeAttr('data-timer');
    }
  },
  'final': function(data)
  {
    Round.update(-1);
  }
  // end fo handlers
};

// listen to the navbar button events
var contentActions = function(e)
{
  var action
    , item = {}
    , button = $(this);

  e.preventDefault();
  // already doing something don't disturb
  if (button.hasClass('busy')) return;

  // flag button as busy
  button.addClass('busy');

  // prepare action
  action = button.hasClass('active') ? 'hide' : 'show';

  // get item data
  item.item = button.data('item');
  if (button.data('number')) item.number = button.data('number');

  // mark question as currently playing
  if (item.item == 'question') button.addClass('playing');

  // notify the server
  socket.emit('admin:'+action, item, function(data)
  {
    // got the answer, unflag button
    button.removeClass('busy');
  });
};

// listen to the footer button events
var statActions = function(e)
{
  var action
    , button = $(this);

  e.preventDefault();
  // already doing something don't disturb
  if (button.hasClass('busy')) return;

  // prepare action
  if (action = button.data('item'))
  {
    // flag button as busy
    button.addClass('busy');

    // notify the server
    socket.emit('admin:'+action, function(data)
    {
      // got the answer, unflag button
      button.removeClass('busy');
    });
  }
};

// listen to the team related events
var teamActions = function(e)
{
  var id
    , team = $(this);

  e.preventDefault();
  // already doing something don't disturb
  // and collective team is not an actual team to assign points to manually
  if (team.hasClass('busy') || team.hasClass('collective')) return;

  // prepare action
  if (id = team.attr('id').replace(/^team_/, ''))
  {
    // flag team as busy
    team.addClass('busy');

    // notify the server
    socket.emit('admin:team', {id: id}, function(data)
    {
      // got the answer, unflag team
      team.removeClass('busy');
    });
  }
};

// to the server and beyond!
connect(handlers,
{
  data: {me: 'admin'},
  callback: function(data)
  {
console.log(['data', data]);
    // set round
    handlers.round({round: data.round});

    // init navigation
    Nav.init(data.content);

    // get already played questions
    Nav.setPlayed(data.played);

    // init teams
    Teams.init(data.teams, data.points, data.flags);

    // check and set current
    if (data.current) handlers.on(data.current);

    // start listening
    $('body>nav').on('button:not([data-item=timer])', 'mousedown touchstart', contentActions);
    // special treatment for the timer
    $('body>nav').on('button[data-item=timer]', 'mousedown touchstart', statActions);

    $('body>footer').on('button:not([data-item=cover])', 'mousedown touchstart', statActions);
    // special treatment for the cover
    $('body>footer').on('button[data-item=cover]', 'mousedown touchstart', contentActions);

    // teams
    $('#teams').on('.team', 'click touchstart', teamActions);
  }
});

