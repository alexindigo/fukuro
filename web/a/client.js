/**
 * Fukurō [フクロウ] - Owl (jap.) symbol of the TV version of the game.
 *
 * Control panel for the russian intellectual game Cho? Gde? Kogda?
 * more info: http://en.wikipedia.org/wiki/What%3F_Where%3F_When%3F
 *
 * (c) 2012 Alex Indigo <iam@alexindigo.com>
 * Fukurō may be freely distributed under the MIT license.
 *
 * client.js: clientUI controller
 */

// Content controller
var Content =
{
  init: function(data)
  {
    // {{{ get cover
    if ('cover' in data)
    {
      var el = $('<section id="cover"></section>').prependTo('body');
      this.cover = make(el, data.cover);
    }
    // }}}

    // {{{
    if ('questions' in data)
    {
      $.each(data.questions, $.bind(function(q, n)
      {
        var el = $('<section id="question_'+n+'" class="question '+q.type+'"></section>').prependTo('body');
        if (!this.questions) this.questions = {};
        // stay: true – no-auto off for questions
        this.questions[n] = make(el, q);
      }, this));
    }
    // }}}

    // {{{ Timer
    if (data.timer)
    {
      Timer.init(data.timer);
    }
    // }}}
  }

};


// set of misc helpers
var misc =
{
  // dummy function to substitute callback
  noCallback: function(){},
  // deferred automatic off callback
  // set on turning element on
  deferredOff: function(data)
  {
    return function()
    {
      socket.emit('off', data);
    }
  }
}

// event handlers
var handlers =
{
  'show': function(data, fn)
  {
    switch (data.item)
    {
      case 'cover':
        Content.cover.on(misc.deferredOff(data));
        fn({item: 'cover', status: 'on'});
        break;
      case 'question':
        if (data.number && Content.questions[data.number])
        {
          Content.questions[data.number].on(misc.deferredOff(data));
          fn({item: 'question', number: data.number, status: 'on'});
        }
        else
        {
          fn({item: 'question', number: data.number, status: 'error'});
        }
        break;
      case 'teams':
        Teams.board.on(misc.deferredOff(data));
        fn({item: 'teams', status: 'on'});
        break;
    }
  },
  'hide': function(data, fn)
  {
    switch (data.item)
    {
      case 'cover':
        Content.cover.off();
        fn({item: 'cover', status: 'off'});
        break;
      case 'question':
        if (data.number && Content.questions[data.number])
        {
          Content.questions[data.number].off();
          fn({item: 'question', number: data.number, status: 'off'});
        }
        else
        {
          fn({item: 'question', number: data.number, status: 'error'});
        }
        break;
      case 'teams':
        Teams.board.off();
        fn({item: 'teams', status: 'off'});
        break;
    }
  },
  'off': function(data)
  {
    // other peer asked to clean up leftovers
    if (data) handlers.hide(data, misc.noCallback);
  },
  //
  'round': function(data)
  {
    // and update round
    Round.update(data.round, 2000);
  },
  // listen to the timer
  'timer': function(data)
  {
    if (data.time > -1)
    {
      Timer.on(data.time);
    }
    else
    {
      Timer.off();
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

// objects helpers
var make = function(el, data, options)
{
  var res, poster = '';

  options = $.extend(options || {}, data.params || {});

  if ('video' in data)
  {
    if ('image' in data) poster = ' poster="/content/'+data.image+'"';
    res = oVideo.init(el, options).populate('<video'+poster+'><source src="/content/'+data.video+'" type="video/mp4"></video>');
  }
  else if ('image' in data)
  {
    res = oImage.init(el, options).populate('<img src="/content/'+data.image+'" alt="">');
  }
  else if ('audio' in data)
  {
    res = oAudio.init(el, options).populate('/content/'+data.audio);
  }

  return res;
};

// to the server and beyond!
connect(handlers,
{
  data: {me: 'client'},
  callback: function(data)
  {
    // set stats
    Round.update(data.round);

    // init content
    Content.init(data.content);

    // init teams
    Teams.init(data.teams, data.points);

    // check and set current
    if (data.current) handlers.show(data.current, misc.noCallback);
  }
});

// helpers

// Teams controller
var Timer =
{
  _el: null,
  _media: null,
  options: {},
  init: function(data)
  {
console.log(['timer', data]);
    this.options = data;

    // create visial part
    this._el = $('<ul id="timer"></ul>').appendTo('body');

    for (var i=0; i<this.options.length; i++)
    {
      this._el.append('<li class="fill"></li>');
    }

    // init sound
    if ('Audio' in window)
    {
      if (!window.__audio) window.__audio = {};
      if (!(this.options.audio in window.__audio))
      {
        window.__audio[this.options.audio] = new Audio();
        window.__audio[this.options.audio].src = '/content/'+this.options.audio;

        // off itself on stop
        $(window.__audio[this.options.audio]).on('ended', $.bind(function()
        {
          // call deffered if there is one
          if (this._deffered) this._deffered();
          this.off();
        }, this));
      }
      // store mdeia element
      this._media = window.__audio[this.options.audio];

      // add options
      for (opt in this.options.params)
      {
        // filter out custom options
        if (opt[0] != '_') this._media[opt] = this.options.params[opt];
      }
    }

    // return itself
    return this;
  },
  on: function(time)
  {
    // create element if needed
    if (!this._media) this.init();

    this._el.addClass('playing');
    if (time < 11) this._el.addClass('ending');

    $('li:nth-last-child(-n+'+Math.max(this.options.length-time, 0)+')', this._el).removeClass('fill');

    if (!this.isPlaying)
    {
      // small hack to accomodate current audio file
      this._media.currentTime = Math.max(this._media.duration - time - 0.5, 0.1);
      this._media.play();
      this.isPlaying = true;
    }
  },
  off: function()
  {
    // clean up defferend
    this._deffered = null;

    // reset visual
    this._el.removeClass('playing').removeClass('ending');

    // wait for the transition to finish
    setTimeout(function()
    {
      $('li', this._el).addClass('fill');
    }, 1500);

    if (this._media)
    {
      // small hack to prevent cutting off the last piece
      if (this._media.currentTime < this.options.length) this._media.pause();
      this.isPlaying = false;
    }
  }
};
