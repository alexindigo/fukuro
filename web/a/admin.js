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

    // {{{ create questions
    if ('questions' in data)
    {
      $.each(data.questions, $.bind(function(q, n)
      {
        var id = makeHandle(n)
          , t
          , isManual = false
          , isAudience = false
          , soundAlong
          ;

        if (q.question)
        {
          // manual (attention) flag
          isManual = !!q.question.manual;

          // audience question
          isAudience = !!q.question.audience;

          // sound along property
          soundAlong = q.question.sound_along;


        }

        // separate regular and special questions
        if (n == parseInt(n, 10))
        {
          // add (show) question button
          $('<button id="button_question_'+id+'" class="'+(isManual ? ' manual' : '')+(isAudience ? ' audience' : '')+'" data-item="question" data-number="'+id+'"'+(soundAlong ? ' data-sound="'+soundAlong+'"' : '')+'>'+n+'</button>').appendTo(this.base);
          // add (show) answer button
          $('<button id="button_answer_'+id+'" class="careful" data-item="answer" data-number="'+id+'">'+n+'</button>').appendTo(this.base);
        }
        else
        {
          // show playoffs as shorten label
          t = (n == 'audience') ? 'Club' : n.replace(/^playoff/, 'PO').replace(/^PO X/, 'BK ');
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
  setSound: function(key)
  {
    $('#button_sound_'+key).addClass('active');
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

    // {{{ extra stuff, means hack on hack
    if (data.item == 'audience_team_team')
    {
      $('body').addClass('audience_team_team');
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

    // {{{ extra stuff, means hack on hack
    if (data.item == 'audience_team_team')
    {
      $('body').removeClass('audience_team_team');
    }
    // }}}

    var item = $('#button_'+data.item+(data.number ? '_'+makeHandle(data.number) : ''));
    if (item)
    {
      item.removeClass('active');
    }
  },
  'sound_stop': function(key)
  {
    var item = $('#button_sound_'+key);
    if (item)
    {
      item.removeClass('active');
    }
    $('#volume').addClass('disabled');
    $('#volume_range')[0].value = 0;
  },
  // update round
  'round': function(data)
  {
    // hack
    $('#audience').removeClass('active').html('');

    $('body').removeClass('player_answer_team');

    Round.update(data.round);
    // update new round button
    // TODO: Add support for Final, round: -1
//    $('#button_round').attr('data-label', data.round ? 'New Round' : 'Start Game');
    // update current question in the nav
    Nav.refresh();
  },
  // listen to the timer
  'sound': function(data)
  {
    if (data.action == 'play')
    {
      $('#button_sound_'+data.key).addClass('active');
    }
    else if (data.action == 'stop')
    {
      $('#button_sound_'+data.key).removeClass('active');
      $('#volume').addClass('disabled');
      $('#volume_range')[0].value = 0;
    }
    else if (data.action == 'volume')
    {
      if (!$('#volume_range').data('interacted'))
      {
        $('#volume_range')[0].value = Math.floor(data.volume * 100);
      }
    }
  },
  'sound_volume': function(volume)
  {
    $('#volume_range')[0].value = Math.floor(volume * 100);
    $('#volume').removeClass('disabled');
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
  },
  'player_answer_team': function(data)
  {
    $('body').addClass('player_answer_team');
  }
  // end of handlers
};

// listen to the navbar button events
var contentActions = function(e)
{
  var action
    , item = {}
    , button = $(this)
    , sound
    ;

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

  // special sounds
  if (sound = button.data('sound'))
  {
    socket.emit('admin:sound', {key: sound, action: 'play'}, function(){});
  }

  // turn on teams music together with cover video
  if (item.item == 'cover')
  {
    socket.emit('admin:sound', {key: 'teams', action: (action == 'show' ? 'play' : 'stop')}, function(){});
  }

  if (item.item == 'rules' || item.item == 'sms')
  {
    socket.emit('admin:sound', {key: 'rules', action: (action == 'show' ? 'play' : 'stop')}, function(){});
  }
};

// listen to the sound button events
var soundActions = function(e)
{
  var action
    , key
    , button = $(this);

  e.preventDefault();
  // already doing something don't disturb
  if (button.hasClass('busy')) return;

  // flag button as busy
  button.addClass('busy');

  // prepare action
  action = button.hasClass('active') ? 'stop' : 'play';

  // get item data
  key = button.data('item');

  // hack
  if (key == 'assist' || key == 'guest_star')
  {
    socket.emit('admin:hide', {item: 'rules'}, function(){});
  }

  // notify the server
  socket.emit('admin:sound', {key: key, action: action}, function()
  {
    // got the answer, unflag button
    button.removeClass('busy');
  });

  // turn on teams music together with cover video
  if (key == 'teams')
  {
    socket.emit('admin:'+(action == 'play' ? 'show' : 'hide'), {item: 'cover'}, function(){});
  }

  if (key == 'rules')
  {
    socket.emit('admin:'+(action == 'play' ? 'show' : 'hide'), {item: 'rules'}, function(){});
  }
};

// listen to volume changes
var volumeActions = function(e)
{
  var volume;

  // get volume, 1 is the limit
  volume = Math.min(this.value / 100, 1);

  // notify the server
  socket.emit('admin:sound', {volume: volume, action: 'volume'});
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

    if (action == 'round') //  && $('body>footer').attr('data-round') != '0'
    {
      // play new round sound
      socket.emit('admin:sound', {key: 'horse', action: 'play'}, function()
      {
        // do nothing
      });
    }
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
  // group team is virtual team
  if (team.hasClass('busy') || team.hasClass('collective') || team.hasClass('is_group')) return;

  // prepare action
  if (id = team.attr('id').replace(/^team_/, ''))
  {
    // flag team as busy
    team.addClass('busy');

    // notify the server
    socket.emit('admin:team', {id: id}, function()
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

    if (data.sound)
    {
      Nav.setSound(data.sound);
    }

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

    // sounds
    $('#sounds').on('button', 'mousedown touchstart', soundActions);

    // volume
    $('#volume_range').on('change', volumeActions);
    // prevent from feedback loop
    $('#volume_range').on('mousedown', function(e)
    {
      var el = $(this);
      el.data('interacted', true);
      $(document).one('mouseup', function(e)
      {
        el.data('interacted', false);
      });
    });

    // teams
    $('#teams').on('.team', 'click touchstart', teamActions);

    // manual points adjustment
    $('.points_plus, .points_minus', '#teams').on('click touchstart', function(e)
    {
      var el = $(this)
        , action
        , team
        ;

      if (!el.parent().hasClass('team') || !(team = el.parent().attr('id').replace(/^team_/, '')))
      {
        return;
      }

      e.stop();

      if (el.hasClass('points_plus'))
      {
        action = 'add';
      }
      else
      {
        action = 'remove';
      }

      socket.emit('admin:team_'+action+'_point', {id: team});
    });

  }
});
