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
  special: 'body>footer>.special',
  played: [],
  init: function(data)
  {
    // clean up
    $('button', this.base).remove();
console.log(['dd', data]);
    // {{{ create questions
    if ('questions' in data)
    {
      $.each(data.questions, $.bind(function(q, n)
      {
        var id = makeHandle(n)
          , t
          , isManual = false
          ;

        if (q.question && q.question.manual)
        {
          isManual = true;
        }

        // separate regular and special questions
        if (n == parseInt(n, 10))
        {
          // add (show) question button
          $('<button id="button_question_'+id+'" class="'+(isManual ? 'manual' : '')+'" data-item="question" data-number="'+id+'">'+n+'</button>').appendTo(this.base);
          // add (show) answer button
          $('<button id="button_answer_'+id+'" class="careful" data-item="answer" data-number="'+id+'">'+n+'</button>').appendTo(this.base);
        }
        else
        {
          // show playoffs as shorten label
          t = (n == 'audience') ? 'Club' : n.replace(/^playoff/, 'PO').replace(/^PO X/, 'EX ');
          // add (show) question button
          $('<button id="button_question_'+id+'" class="'+(isManual ? 'manual' : '')+'" data-label="'+t+'" data-item="question" data-number="'+n+'">'+t+'</button>').appendTo(this.special);
          // add (show) answer button
          $('<button id="button_answer_'+id+'" class="careful" data-label="'+t+'" data-item="answer" data-number="'+n+'">'+t+'</button>').appendTo(this.special);
        }
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
    $('button', this.special).removeClass('current').removeClass('played');

    // loop thru: question, round
    $.each(this.played, $.bind(function(q, r)
    {
      // massage DOM, add played
      $('#button_question_'+makeHandle(q)).addClass('played');
      // and current classes
      if (r == Round.round)
      {
        // current is not played
        $('#button_question_'+makeHandle(q)).addClass('current').removeClass('played');
      }
    }, this));
  }

};

// event handlers
var handlers =
{
  'on': function(data)
  {
    // {{{ hack
    if (data.item == 'audience')
    {
      $('#audience').html('<span class="player" data-team="'+data.team+'">'+data.player+'</span><span class="answer">'+data.answer+'</span>').addClass('active');
      return;
    }
    // }}}

    var item = $('#button_'+data.item+(data.number ? '_'+makeHandle(data.number) : ''));
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
    var item = $('#button_'+data.item+(data.number ? '_'+makeHandle(data.number) : ''));
    if (item)
    {
      item.removeClass('active');
    }
  },
  // update round
  'round': function(data)
  {
    // hack
    $('#audience').removeClass('active').html('');

    Round.update(data.round);
    // update new round button
    // TODO: Add support for Final, round: -1
    $('#button_round').attr('data-label', data.round ? 'New Round' : 'Start Game');
    // update current question in the nav
    Nav.refresh();
  },
  // listen to the timer
  'sound': function(data)
  {
console.log(['sound', data]);
    // if (data.time > -1)
    // {
    //   $('#button_timer').addClass('active').attr('data-timer', ' '+data.time);
    // }
    // else
    // {
    //   $('#button_timer').removeClass('active').removeAttr('data-timer');
    // }
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

    $('body>footer').on('button:not(.content)', 'mousedown touchstart', statActions);

    // special treatment for the cover, rules and sms
    $('body>footer').on('button.content', 'mousedown touchstart', contentActions);

    // special questions
    $('body>footer>.special').on('button', 'mousedown touchstart', contentActions);


    // teams
    $('#teams').on('.team', 'click touchstart', teamActions);
  }
});

