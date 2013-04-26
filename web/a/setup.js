/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * setup.js: setupUI controller
 */

// event handlers
var handlers =
{
  // update round
  'scale': function(scale)
  {
    if (!$('#scale_range').data('interacted'))
    {
      $('#scale_range')[0].value = Math.floor(scale * 100);
    }
  },
  'round': function(data)
  {
    Round.update(data.round);
  },
  'final': function(data)
  {
    Round.update(-1);
  }
  // end fo handlers
};

var addTeam = function(button)
{
  // flag button as busy
  button.addClass('busy');

  var short, full = prompt('Enter team name:');

  // check if cancel
  if (!full) return button.removeClass('busy');

  // check if we need short name
  if (full.length > 15)
  {
    short = prompt('Name is too long, please enter short version:');
    if (!short || short.length > 15) return button.removeClass('busy');
  }
  else
  {
    short = full;
  }

  socket.emit('setup:add', {full: full, short: short}, function()
  {
    button.removeClass('busy');
  });
};

// listen to scale changes
var scaleActions = function(e)
{
  var scale;

  // get volume, 1 is the limit
  scale = Math.min(this.value / 100, 1);

  // notify the server
  socket.emit('admin:scale', scale);
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
    // special handling for the 'Add Team' buttom
    if (action == 'team') return addTeam(button);

    if (action == 'reset' && !confirm('Do you really want to reset the game?')) return;

    // flag button as busy
    button.addClass('busy');

    // notify the server
    socket.emit('setup:'+action, function()
    {
      // got the answer, unflag button
      button.removeClass('busy');
    });
  }
};

// listen to the team related events
var teamActions = function(e)
{
  var team = $(this)
    , target = $(e.target);

  e.preventDefault();

  // prevent accidental hit of the rounds tooltip
  if (target[0].tagName == 'OL') return;

  // separate way for li (rounds)
  if (target[0].tagName == 'LI') return point(target);

  // if game is not started  remove the team instead of changing points
  if ($('body').hasClass('waiting')) return remove();

  // already doing something don't disturb
  if (team.hasClass('selected')) return off();

  // do
  on();

  // subroutines

  // show points tooltip
  function on()
  {
    // hide others
    off($('#teams>.team.selected'));

    // prepare action
    if (id = team.attr('id').replace(/^team_/, ''))
    {
      // flag team as busy
      team.addClass('selected');

      // get up to date rounds data
      socket.emit('setup:rounds', function(data)
      {
        var rounds, pointer;

        // check if it's still on
        if (!team.hasClass('selected')) return;

        // game should be started
        if (data.round)
        {
          // create rounds holder
          rounds = $('<ol class="rounds"></ol>').appendTo(team);
          // something we still need js for
          rounds.css({width: (56 * data.round)+'px'});
          // fill in with team's points
          for (var i=1; i<=data.round; i++)
          {
            pointer = $('<li>'+i+'</li>').appendTo(rounds);
            // add points
            if (data.points[i] && data.points[i][id])
              pointer.addClass('point');
          }
          // check position
          if (rounds.offset().left + rounds.dim().width + 100 > $('body').dim().width)
          {
            rounds.addClass('reverse');
          }
        }
      });
    }
  }

  // destroy tooltip
  function off(el)
  {
    el = el || team;
    // clean up
    $('.rounds', el).remove();
    el.removeClass('selected');
  }

  // handle tooltip button actions
  function point(round)
  {
    if (id = team.attr('id').replace(/^team_/, ''))
    {
      round.addClass('active');

      // adjust points
      socket.emit('setup:point', {id: id, round: round.text()}, function(delta)
      {
        // unpress the button
        round.removeClass('active');
        // update points
        (delta) ? target.addClass('point') : target.removeClass('point');
      });

    }
  }

  // remove the team
  function remove()
  {
    if (id = team.attr('id').replace(/^team_/, ''))
    {
      // flag team as busy
      team.addClass('selected');

      if (!confirm('Do you really want to remove team '+$('.short', team).text()+'?'))
        return team.removeClass('selected');

      socket.emit('setup:remove', {id: id});
      // nothing to uncheck
    }
  }
};

// to the server and beyond!
connect(handlers,
{
  data: {me: 'setup'},
  callback: function(data)
  {
    // set round
    handlers.round({round: data.round});

    // init teams
    Teams.init(data.teams, data.points);

    if (data.scale)
    {
      $('#scale_range')[0].value = Math.floor(data.scale * 100);
    }

    // listen for the buttons
    $('body>footer').on('button', 'click touchstart', statActions);

    // teams
    $('#teams').on('.team', 'click touchstart', teamActions);

    // scale
    $('#scale_range').on('change', scaleActions);
    // prevent from feedback loop
    $('#scale_range').on('mousedown', function(e)
    {
      var el = $(this);
      el.data('interacted', true);
      $(document).one('mouseup', function(e)
      {
        el.data('interacted', false);
      });
    });
  }
});

