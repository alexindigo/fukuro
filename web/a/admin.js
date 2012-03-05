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
  init: function(data)
  {
    // {{{
    if ('questions' in data)
    {
      $.each(data.questions, $.bind(function(q, n)
      {
        var el = $('<button id="button_question_'+n+'" data-item="question" data-number="'+n+'" class="'+q.type+'">'+n+'</button>').appendTo('body>nav>.questions');
      }, this));
    }
    // }}}
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
    $('#button_round').text(data.round ? 'New Round' : 'Start Game');
  },
  // listen to the timer
  'timer': function(data)
  {
    if (data.time > -1)
    {
      $('body>nav').attr('data-timer', data.time);
      $('#button_timer').addClass('active');
    }
    else
    {
      $('body>nav').removeAttr('data-timer');
      $('#button_timer').removeClass('active');
    }
  },






  'final': function(data)
  {
      var topScore = 0;

      // current – off

      // all teams uncheck

      setTimeout(function()
      {
        // calculate topScore

        // check top score team(s)

        // show teams board

      }, 1500);
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
  if (team.hasClass('busy')) return;

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

    // init teams
    Teams.init(data.teams, data.points);

    // check and set current
    if (data.current) handlers.on(data.current);

    // start listening
    $('body>nav').on('button:not([data-item=timer])', 'click touchstart', contentActions);
    // special treatment for the timer
    $('body>nav').on('button[data-item=timer]', 'click touchstart', statActions);
    $('body>footer').on('button', 'click touchstart', statActions);
    // teams
    $('#teams').on('.team', 'click touchstart', teamActions);
  }
});









function getRidOf()
{
  var Status = function(data)
  {
      if (data.on)
      {
          $('#'+data.id).addClass('active');
      }
      else
      {
          $('#'+data.id).removeClass('active');
      }
  };

  // sort teams by name
  var sortByShort = function(team)
  {
    return team.short;
  };

  // handshake
  socket.emit('helo', {me: 'admin'}, function(data)
  {
  console.log(['helo', data]);
      // process initial state
      if (data.status && data.status.on && data.status.id) Status(data.status);

      // round
      $('footer').attr('data-round', data.round);

      // process teams
      $.each($.sortBy(data.teams, sortByShort), function(t)
      {
          $('#data>.teams').append('<span id="team_'+t.handle+'" class="team"><span class="short">'+t.short+'</span><span class="full">'+t.full+'</span><span class="points">'+t.points+'</span></span>');
      });
  });

  socket.on('status', Status);

  // special case for reset
  var reset = function(type)
  {
      var mesg = 'Reset the game? Really?',
          action = 'admin:reset';

      if (type == 'reload')
      {
          mesg = 'Reload all clients?';
          action = 'admin:reload';
      }

      if (confirm(mesg))
      {
          socket.emit(action);
      }
  };

}
