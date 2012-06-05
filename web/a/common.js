/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * common.js: common frontend elements
 */

// connect to the server
var socket;

// set of the common handler
var common =
{
  'password': function(callback)
  {
    // TODO: make it real
    // check if we have any candidates
    if (window._password)
    {
      // already tried something, ask user
      window._password = prompt('Please enter correct password.');
    }
    // check if we have anything in the cookie
    else if (window._password = getCookie('password'))
    {
      // store it for future reference
    }
    // nothing, ask user
    else
    {
      window._password = prompt('Password is required');
    }

    // submit password to the server
    callback(window._password);

    // store in the cookie
    addCookie('password', window._password);
  },

  // team's data modifications
  'team': function(data)
  {
    var team;
    if (team = $('#team_'+data.handle))
    {
      if ($('.points', team).text() < data.points)
      {
        team.addClass('checked');
      }
      else
      {
        team.removeClass('checked');
      }
      // update score
      $('.points', team).text(data.points);
    }
  },
  // add team
  'add': function(data)
  {
    Teams.add(data.team);
  },
  // remove team
  'remove': function(data)
  {
    var team;

    // remove team
    if (data.team && (team = $('#team_'+data.team)))
    {
      team.remove();
    }
  },
  // hard reset
  'reset': function()
  {
    window.location.reload();
  }
};

// connect method with handlers to listen
// and helo object for handshake
// helo = {data: {...}, callback: function }
var connect = function(custom, helo)
{
  socket = io.connect();

  var handlers = (function(base, child)
  {
    var method;

    for (var key in child)
    {
      if (child.hasOwnProperty(key))
      {
        method = child[key];

        // check for the one in base
        if (base.hasOwnProperty(key))
        {
          method = (function(child, parent)
          {
            return function()
            {
              return child.apply(this, $.toArray(arguments).concat(parent));
            };
          })(method, base[key]);
        }

        base[key] = method;
      }
    }

    return base;

  })(common, custom);

  // add handlers
  $.each(handlers, function(method, handle)
  {
    socket.on(handle, method);
  });

  // {{{ TODO: Should be refactored
  socket.on('connect', function(zzz)
  {
    // assume new session, reset stored password
    // TODO: make it right
    window._password = null;
  });

  socket.emit('helo', helo.data, helo.callback);
  // }}}

};

/* Lego */

var Base =
{
  _deffered: null,
  _current: null,
  _el: null,
  current: function(o)
  {
    if (typeof o != 'undefined') this._current = o;
    return this._current;
  },
  on: function(deffered)
  {
    // store deffered callback
    if (deffered) this._deffered = deffered;
    if (this.current()) this.current().off();
    this.current(this);
    this._el.addClass('active');
  },
  off: function()
  {
    this.current(null);
    this._el.removeClass('active');
    this._deffered = null;
  },
  extend: function(props)
  {
    var defs = {}, key;
    if (props)
    for (key in props)
    {
      if (props.hasOwnProperty(key))
      {
        defs[key] = {value: props[key], enumerable: true};
      }
    }
    // add parent, not enumerable
    defs['_parent'] = {value: this};
    return Object.create(this, defs);
  },
  init: function(el, options)
  {
    var child = Object.create(this, {_el: {value: el, enumerable: true}});

    // store the options
    child.options = options || {};

    // attach current to the Base
    child.current = $.bind(child.current, Base);
    return child;
  },
  populate: function(html)
  {
    this._el.append(html);
    return this;
  }
};

// simple image
var oImage = Base.extend(
{
});

// extend video
var oVideo = Base.extend(
{
  on: function()
  {
    if (this._media)
    {
      this._media.play();
    }
    // back to regular thing
    return this._parent.on.apply(this, arguments);
  },
  off: function()
  {
    // do regular thing first
    var res = this._parent.off.apply(this, arguments);

    if (this._media)
    {
      if (!this._media.paused)
      {
        this._media.pause();
        this._media.currentTime = 0.1;
      }
    }

    return res;
  },
  populate: function(html)
  {
    // add elements first
    var res = this._parent.populate.apply(this, arguments);
    // store mdeia element
    this._media = $('video', this._el).get(0);

    // add options
    for (opt in this.options)
    {
      // filter out custom options
      if (opt[0] != '_') this._media[opt] = this.options[opt];
    }

    // off itself on stop
    $(this._media).on('ended', $.bind(function()
    {
        // check options if it needs to stay
        if (this.options['_keep-alive'])
        {
          this._media.currentTime = this.options['_stop'] ? this.options['_stop'] : 0.1;
        }
        else
        {
          // call deffered if there is one
          if (this._deffered) this._deffered();
          this.off();
        }
    }, this));

    // add text
    if (this.options['_text'])
    {
      $(this._media).attr('data-text', this.options['_text']);
    }

    // continue normal flow
    return res;
  }
});

// basic audio
var oAudio = Base.extend(
{
  on: function()
  {
    if (this._media)
    {
      this._media.play();
    }
    // back to regular thing
    return this._parent.on.apply(this, arguments);
  },
  off: function()
  {
    // do regular thing first
    var res = this._parent.off.apply(this, arguments);

    if (this._media)
    {
      if (!this._media.paused)
      {
        this._media.pause();
        this._media.currentTime = 0.1;
      }
    }

    return res;
  },
  populate: function(path)
  {
    if ('Audio' in window)
    {
      if (!window.__audio) window.__audio = {};
      if (!(path in window.__audio))
      {
        window.__audio[path] = new Audio();
        window.__audio[path].src = path;

        // off itself on stop
        $(window.__audio[path]).on('ended', $.bind(function()
        {
          // check options if it needs to stay
          if (!this.options.stay || !this.options.text)
          {
            // call deffered if there is one
            if (this._deffered) this._deffered();
            this.off();
          }
        }, this));
      }
      // store mdeia element
      this._media = window.__audio[path];

      // add options
      for (opt in this.options)
      {
        this._media[opt] = this.options[opt];
      }
    }

    if (this.options['_text'])
    {
      this._el.attr('data-text', this.options['_text']);
    }

    // call parent method, emulate empty string
    return this._parent.populate.apply(this, ['']);
  }
});

// text only question
var oText = Base.extend(
{
});

// teams object
var oTeams = Base.extend(
{
  teams: {},
  points: {},
  addTeam: function(team, before)
  {
    var el, isGuest, isCollective;

    isGuest = team.guest ? ' guest static' : '';
    isCollective = team.collective ? ' collective static' : '';

    el = $('<span id="team_'+team.handle+'" class="team'+isGuest+isCollective+'"><span class="short">'+team.short+'</span><span class="full">'+team.full+'</span><span class="points">'+team.points+'</span></span>');

    if (before)
    {
      el.insertBefore(before);
    }
    else
    {
      el.appendTo(this._el);
    }

    this.teams[team.handle] = el;
    this.points[team.handle] = team.points;

    return el;
  },
  setPoints: function(team, points)
  {
    if (team in this.teams)
    {
      $('.points', this.teams[team]).text(points);
      // mark as checked if number of points raised
      (points > this.points[team]) ? this.teams[team].addClass('checked') : this.teams[team].removeClass('checked');
      this.points[team] = points;
    }
  }
});

/**
 * common controllers
 */

function sortTeams(data)
{
  return $.sortBy(data, function(item)
  {
    return item.short;
  });
}

// Teams controller
var Teams =
{
  init: function(data, points, flags)
  {
    var specialGuest = '', limit = 0;

    // calculate limit
    // in most cases it would be 5 teams per row
    limit = Math.floor((Object.keys(data).length-1)/5)*5;

    // check flags
    if (flags && flags.guest && flags.collective)
    {
      specialGuest = ' special_guest';
      // don't include special teams into limit

      // adjust for special guest
      limit = Math.floor((Object.keys(data).length-3)/5)*5;
    }

    // create teams section
    var el = $('<section id="teams" class="atleast_'+limit+specialGuest+'"></section>').prependTo('body');
    this.board = oTeams.init(el);

    $.each(sortTeams(data), $.bind(function(team)
    {
      var el = this.board.addTeam(team);

      // check if it has points added this round
      if (points && points[team.handle]) el.addClass('checked');

    }, this));
  },
  add: function(team)
  {
    // place it alphabetically
    var before = $.find(this.board.teams, function(item)
    {
      return team.short < $('.short', item).text();
    });

    // add team to the board
    this.board.addTeam(team, before);
  }
};

// Round controller
var Round =
{
  round: 0,
  update: function(round, delayed)
  {
    this.round = round;

    // push it to the page
    $('body>footer').attr('data-round', round);

    // clean all checked team
    // add some time out to allow css transition to play
    // css trainsition is set to 1.5s so 2s shoudl be enough
    // don't think hooking to actual transition end would help,
    // since if there is no transition it won't fire at all
    // TODO: This FkSh should be refactored
    if (delayed)
    {
      setTimeout(function()
      {
        $('.team').removeClass('checked');
      }, delayed);
    }
    else // and we don't need any delay for adminUI
    {
      $('.team').removeClass('checked');
    }

    // flag body with different game states
    switch (round)
    {
      case 0: // about to start
        $('body').removeClass('final').removeClass('playing').addClass('waiting');
        break;

      case -1: // final
        $('body').removeClass('waiting').removeClass('playing').addClass('final');
        break;

      default: // normal state
        $('body').removeClass('waiting').removeClass('final').addClass('playing');
    }
  }
};

// Can't live without cookies, can you?

function getCookie(name)
{
  var marker;

  pattern = '\\b'+name+'=([^;]+)(;|$)';

  if (!(marker = document.cookie.match(pattern))) return false;

  return unescape(marker[1]);
}

function addCookie(name, value)
{
  var token;

  token = name + '=' + escape(value) + '; path=/; expires=' + (new Date(+new Date() + 60*60*24*365*1000).toUTCString());

  document.cookie = token;

  return true;
}
