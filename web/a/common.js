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
  // team's data modifications
  'team': function(data)
  {

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

  // merge custom handlers with common
  var handlers = $.extend(common, custom);

  // add handlers
  $.each(handlers, function(method, handle)
  {
    socket.on(handle, method);
  });

  socket.emit('helo', helo.data, helo.callback);
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
  init: function(el)
  {
    // attach current to the Base
    this.current = $.bind(this.current, Base);
    return Object.create(this, {_el: {value: el, enumerable: true}});
  },
  populate: function(html)
  {
    this._el.append(html);
    return this;
  }
};

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
      this._media.pause();
      this._media.currentTime = 0;
    }

    return res;
  },
  populate: function(html)
  {
    // add elements first
    var res = this._parent.populate.apply(this, arguments);
    // off itself on stop
    $('video', this._el).on('ended', $.bind(function()
    {
        // call deffered if there is one
        if (this._deffered) this._deffered();
        this.off();
    }, this));
    // store mdeia element
    this._media = $('video', this._el).get(0);
    // continue normal flow
    return res;
  }
});

// simple image
var oImage = Base.extend();

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
      this._media.pause();
      this._media.currentTime = 0;
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
            this.off();
        }, this));
      }
      // store mdeia element
      this._media = window.__audio[path];
    }

    // call parent method, emulate empty string
    return this._parent.populate.apply(this, ['']);
  }
});

// teams object
var oTeams = Base.extend(
{
  teams: {},
  points: {},
  addTeam: function(team)
  {
    var el = $('<span id="team_'+team.handle+'" class="team"><span class="short">'+team.short+'</span><span class="full">'+team.full+'</span><span class="points">'+team.points+'</span></span>').appendTo(this._el);

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

