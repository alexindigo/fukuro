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
  lang: 'en', // english by default

  init: function(data)
  {
    var el;

    // check for alternate language
    if ($('body').data('lang'))
    {
      this.lang = $('body').data('lang');
    }

    // {{{ get cover
    if ('cover' in data)
    {
      el = $('<section id="cover"></section>').prependTo('body');
      this.cover = make(el, data.cover);
    }
    // }}}

    // {{{ prepare rules
    this.rules = make($('#rules'), {});
    this.sms = make($('#sms'), {});
    this.playoff = make($('#playoff'), {});
    // }}}

    // {{{
    if ('questions' in data)
    {
      $.each(data.questions, $.bind(function(item, n)
      {
        var id = makeHandle(n)
          , q = $('<section id="question_'+id+'" class="question'+(n.match(/^playoff/) ? ' playoff' : '')+'"></section>').prependTo('body')
          , a = $('<section id="answer_'+id+'" class="answer"></section>').prependTo('body')
          ;

        if (!this.questions) this.questions = {};
        if (!this.answers) this.answers = {};

        // populate questions list
        this.questions[n] = make(q, item.question);
        this.answers[n]   = make(a, item.answer);

      }, this));
    }
    // }}}

    // sounds
    if ('sounds' in data)
    {
      $.each(data.sounds, $.bind(function(item, key)
      {
        if (!this.sounds) this.sounds = {};
        this.sounds[key] = Sound.create(item);
      }, this));
    }

    // {{{ Timer
    if (data.timer)
    {
      Timer.create(data.timer);
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
  },
  deferredSoundOff: function(key)
  {
    return function()
    {
      socket.emit('sound_stop', key);
    }
  }
}

// event handlers
var handlers =
{
  'show': function(data, fn)
  {
    // hack
    $('#audience').removeClass('active').html('');

    switch (data.item)
    {
      case 'cover':
        Content.cover.on(misc.deferredOff(data));
        fn({item: 'cover', status: 'on'});
        break;

      case 'rules':
        Content.rules.on(misc.deferredOff(data));
        fn({item: 'rules', status: 'on'});
        break;

      case 'sms':
        Content.sms.on(misc.deferredOff(data));
        fn({item: 'sms', status: 'on'});
        break;

      case 'playoff':
        Content.playoff.on(misc.deferredOff(data));
        fn({item: 'playoff', status: 'on'});
        break;

      case 'question':

        if (data.number == 'audience')
        {
          // set round to audience
          Round.update('audience');
        }
        else if ((''+data.number).match(/^playoff /))
        {
          // set round to playoff
          Round.update('playoff');
        }

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

      case 'answer':
        if (data.number && Content.answers[data.number])
        {
          Content.answers[data.number].on(misc.deferredOff(data));
          fn({item: 'answer', number: data.number, status: 'on'});
        }
        else
        {
          fn({item: 'answer', number: data.number, status: 'error'});
        }
        break;

      case 'teams':
        Teams.board.on(misc.deferredOff(data));
        fn({item: 'teams', status: 'on'});
        break;

      case 'audience':
        if (data.player && data.answer)
        {
          $('#audience').html('<p>'+data.player+'</p>').addClass('active');
          fn({item: 'audience', player: data.player, status: 'on'});
        }
        else
        {
          fn({item: 'audience', player: data.player, status: 'error'});
        }
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

      case 'rules':
        Content.rules.off();
        fn({item: 'rules', status: 'off'});
        break;

      case 'sms':
        Content.sms.off();
        fn({item: 'sms', status: 'off'});
        break;

      case 'playoff':
        Content.playoff.off();
        fn({item: 'playoff', status: 'off'});
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

      case 'answer':
        if (data.number && Content.answers[data.number])
        {
          Content.answers[data.number].off();
          fn({item: 'answer', number: data.number, status: 'off'});
        }
        else
        {
          fn({item: 'answer', number: data.number, status: 'error'});
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
  // listen to the sounds of music
  'scale': function(scale)
  {
    scale = Math.max(scale, 0) || 1;
    $('body').css('webkitTransform', 'scale('+scale+')');
  },
  // when everybody stopped
  'sound_stop': function(key)
  {
    if (key && Content.sounds[key])
    {
      Content.sounds[key].off();
    }
  },
  // listen to the sounds of music
  'sound': function(data)
  {
    var volume
      , sound
      ;

    if (data.action == 'play')
    {
      if (data.key && Content.sounds[data.key])
      {
        volume = Content.sounds[data.key].on(misc.deferredSoundOff(data.key));
        socket.emit('sound_volume', volume);
      }
    }
    else if (data.action == 'stop')
    {
      if (data.key && Content.sounds[data.key])
      {
        Content.sounds[data.key].off();
      }
    }
    else if (data.action == 'volume')
    {
      if (sound = Sound.current())
      {
        sound.volume(data.volume);
      }
    }
  },
  // listen to the timer
  'timer': function(data)
  {
    var volume;

    if (data.time > -1)
    {
      Timer.on(data.time);
    }
    else
    {
      Timer.off();
    }
  },
  'team': function(data, parent)
  {
    // do parent first
    parent.apply(this, arguments);

    var team, action = 'insertBefore';

    if (team = $('#team_'+data.handle))
    {
      // skip this part for static teams
      if (team.hasClass('static')) return true;

      // resort teams
      var placeholder, item, arr = $('#teams>.team:not(.static)');
      for (var i=0, s=arr.length; i<s; i++)
      {
        item = arr[i];
        // skip itself
        if (item == team[0]) continue;

        if ($('.points', item).text() == data.points && $('.short', item).text() > data.short)
        {
          placeholder = item;
          break;
        }
        else if ($('.points', item).text() < data.points)
        {
          placeholder = item;
          break;
        }
      }

      // on the way back reverse the animation a bit
      if (!team.hasClass('checked'))
      {
        action = 'insertAfter';
        placeholder = (placeholder) ? $(placeholder).previous()[0] : $('#teams>.team:not(.static)').last()[0];
        // quick hack, two would be enough
        // TODO: enchance (bonzo) .previous and .next to accept selectors
        if ($(placeholder).hasClass('static')) placeholder = $(placeholder).previous()[0];
        if ($(placeholder).hasClass('static')) placeholder = $(placeholder).previous()[0];
      }
      // continue breath normally
      if (placeholder && placeholder != team[0]
          && (placeholder != team.next()[0] || action == 'insertAfter') )
      {
        var origTop  = team.offset().top
          , origLeft = team.offset().left
          , destTop  = $(placeholder).offset().top
          , destLeft = $(placeholder).offset().left;

        team.addClass('moving');

        team.css(
        {
          position: 'absolute',
          top: (origTop-12)+'px',
          left: (origLeft-35)+'px'
        });

        // flush changes to the DOM
        team.offset();

        // move
        team.css(
        {
          position: 'absolute',
          top: (destTop-12)+'px',
          left: (destLeft-35)+'px'
        });

        setTimeout(function()
        {
          team[action](placeholder);
          team.css(
          {
            position: 'static',
            top: 'auto',
            left: 'auto'
          });

          team.removeClass('moving');

        }, 900);
      }

    }
  },
  'final': function(data)
  {
    // get top score
    var winners
      , scale = 2
      , body = $('body').dim()
      , unit = $('#teams>.team').dim()
      , score = $('#teams>.team>.points').text();

    // all teams uncheck
    Round.update(-1);

    $('#teams>.team').each(function(item)
    {
      if ($('.points', item).text() == score)
      {
        $(item).addClass('winner');
      }
    });

    winners = $('#teams>.team.winner').length;

    // assume there could no tie break for more than 4 teams. Seriously.
    $('#teams>.team.winner').each(function(item, num)
    {
      var x, y, p = $(item).offset();

      // TODO: Build now, optimize later
      switch (winners)
      {
        case 1:
          scale = 4;
          x = unit.width*0.075 + Math.floor(body.width/2) - unit.width*2  + (unit.width*2 * (num%2) + unit.width ) + (parseInt($('#teams').css('padding-left'), 10)*(2+(num%2)) );
          y = Math.floor(body.height/2) - unit.height*2 + (unit.height*2 * Math.floor(num/2)) + (parseInt($('#teams').css('padding-top'), 10)*(2+Math.floor(num/2)) );
          break;

        case 2:
        case 3:
          x = Math.floor(body.width/2) - unit.width*2  + (unit.width*2 * (num%2) + (num==2 ? unit.width : 0)  ) + (parseInt($('#teams').css('padding-left'), 10)*(2+(num%2)) );
          y = Math.floor(body.height/2) - unit.height*2 + (unit.height*2 * Math.floor(num/2)) + (parseInt($('#teams').css('padding-top'), 10)*(2+Math.floor(num/2)) );
          break;

        case 4:
          x = Math.floor(body.width/2) - unit.width*scale  + (unit.width*scale * (num%2) ) + (parseInt($('#teams').css('padding-left'), 10)*(scale+(num%2)) );
          y = Math.floor(body.height/2) - unit.height*scale + (unit.height*scale * Math.floor(num/2)) + (parseInt($('#teams').css('padding-top'), 10)*(scale+Math.floor(num/2)) );
          break;

        case 5:
        case 6:
          scale = 1.5;
          x = Math.floor(body.width/2) - unit.width*scale  + (unit.width*scale * (num%2) ) + (parseInt($('#teams').css('padding-left'), 10)*(scale+(num%2)) );
          y = (unit.height*scale * -1) + Math.floor(body.height/2) - unit.height*scale + (unit.height*scale * Math.floor(num/2)) + (parseInt($('#teams').css('padding-top'), 10)*(scale+Math.floor(num/2)) );

        default:
          scale = 1;
          x = (unit.width*scale * -0.4) + Math.floor(body.width/2) - unit.width*scale  + (unit.width*scale * (num%2) ) + (parseInt($('#teams').css('padding-left'), 10)*(scale+(num%2)) );
          y = (unit.height*scale * (-3 + scale ) ) + Math.floor(body.height/2) - unit.height*scale + (unit.height*scale * Math.floor(num/2)) + (parseInt($('#teams').css('padding-top'), 10)*(scale+Math.floor(num/2)) );
      }

      $(item).css({transform: 'scale('+scale+') translate('+Math.floor((x-p.left)/scale)+'px, '+Math.floor((y-p.top)/scale)+'px)'});
    });

  }
  // end fo handlers
};

function scrableText(text, lang)
{
  var en = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    , ru = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщьэюя'
    , res = ''
    ;

  for (var i=0; i<text.length; i++)
  {
    if (text[i] != ' ' && text[i] != '\n')
    {
      if (lang == 'ru')
      {
        res += ru[Math.floor(Math.random() * ru.length)];
      }
      else
      {
        res += en[Math.floor(Math.random() * en.length)];
      }
    }
    else
    {
      res += text[i];
    }
  }
  return res;
}

// objects helpers
var make = function(el, data, options)
{
  var res, text, flags = [], poster = '';

  options = $.extend(options || {}, data.params || {});

  if ('video' in data)
  {
    if (window.x.isIPad && 'image' in data)
    {
      res = oImage.init(el, options).populate('<img class="video" src="/content/'+data.image+'" alt="">');
    }
    else
    {
      if ('image' in data) poster = ' poster="/content/'+data.image+'"';
      res = oVideo.init(el, options).populate('<video'+poster+'><source src="/content/'+data.video+'" type="video/mp4"></video>');
    }
  }
  else if ('image' in data)
  {
    res = oImage.init(el, options).populate('<img src="/content/'+data.image+'" alt="">');
  }
  else if ('audio' in data)
  {
    res = oAudio.init(el, options).populate('<audio preload="auto" '+(options.loop ? 'loop ' : '')+'><source src="/content/'+data.audio+'" type="audio/mpeg"></audio>');
  }

  // we should have text most of the time
  if ('text' in data)
  {
    // reset flags
    flags = ['text'];

    // check if there is version for current language
    // fallback to the default
    text = (Content.lang in data) ? data[Content.lang] : data.text;

    // for long text add modifying class
    if (text.length > 100) flags.push('long');
    if (text.length > 400) flags.push('extra');

    // {{{ quick hack, will fix it after the game
    if (!res)
    {
      res = oText.init(el, options).populate('<p class="'+flags.join(' ')+'">'+text+'</p>');
    }
    else
    {
      oText.init(el, options).populate('<p class="'+flags.join(' ')+'">'+text+'</p>');
    }
    // }}}

    if ('desc' in data)
    {
      el.append('<p class="desc">'+data.desc+'</p>');
    }
  }

  // still nothing?
  if (!res)
  {
    res = oBlank.init(el, options);
  }

  return res;
};

// override team sorting
function sortTeams(data)
{
  return $.sortBy(data, function(item)
  {
    // there is no chance for more than 50 round/points
    return (99-item.points)+item.short;
  });
}

// to the server and beyond!
connect(handlers,
{
  data: {me: 'client'},
  callback: function(data)
  {
    // scale
    if (data.scale)
    {
      handlers.scale(data.scale);
    }

    // set stats
    Round.update(data.round);

    // init content
    Content.init(data.content);

    // init teams
    Teams.init(data.teams, data.points, data.flags);

    // get sound
    if (data.sound && Content.sounds[data.sound])
    {
      Content.sounds[data.sound].on(misc.deferredSoundOff(data.sound));
    }

    // check and set current
    if (data.current) handlers.show(data.current, misc.noCallback);
  }
});

// helpers

// Timer controller
var Timer =
{
  _el: null,
  sound: null,
  options: {},
  create: function(data)
  {
    this.options = data;

    // create visial part
    this._el = $('<ul id="timer"></ul>').prependTo('body');

    for (var i=0; i<this.options.length; i++)
    {
      this._el.append('<li class="fill"></li>');
    }

    if (data.audio)
    {
      this.sound = Sound.create(data);
    }

    return this;
  },
  on: function(time)
  {
    var volume;

    this._el.addClass('playing').removeClass('hold');
    if (time < 11) this._el.addClass('ending');

    $('li:nth-last-child(-n+'+Math.max(this.options.length-time, 0)+')', this._el).removeClass('fill');

    if (this.sound && !this.sound.isPlaying())
    {
      volume = this.sound.on(time);
      socket.emit('sound_volume', volume);
    }
  },
  off: function()
  {
    // reset visual
//    this._el.removeClass('playing').removeClass('ending');
    // special for Jim
    this._el.removeClass('ending');
    this._el.addClass('hold');

    // wait for the transition to finish
    setTimeout(function()
    {
      $('li', this._el).addClass('fill');
    }, 1500);

    if (this.sound)
    {
      this.sound.off();
      socket.emit('sound_stop', 'timer');
    }
  }
};

// Sound controller
var Sound =
{
  _el: null,
  _media: null,
  _current: null,
  _goingToPlay: null,
  options: {},
  current: function(o)
  {
    if (typeof o != 'undefined') this._current = o;
    return this._current;
  },
  create: function(data)
  {
    var child = Object.create(this);

    // store the options
    child.options = data.params || {};

    // attach current to the Base
    child.current = $.bind(child.current, Sound);

    child.init(data.audio);

    return child;
  },
  init: function(path)
  {
    // add element first
    this._el0 = $('<audio preload><source src="/content/'+path+'" type="audio/mpeg"></audio>').appendTo(document.body);
    this._el1 = $('<audio preload><source src="/content/'+path+'" type="audio/mpeg"></audio>').appendTo(document.body);

    // store media element
    this._media0 = this._el0.get(0);
    this._media1 = this._el1.get(0);

    // for others
    if (!this._media0.load) this._media0.load = function(){};
    if (!this._media1.load) this._media1.load = function(){};

    // add options
    for (opt in this.options)
    {
      // filter out custom options
      // do manual loops, html5 rocks, not
      if (opt[0] != '_' && opt != 'loop')
      {
        this._media0[opt] = this.options[opt];
        this._media1[opt] = this.options[opt];
      }
    }

    // start loading video
    this._media0.load();
    this._media1.load();

    // off itself on stop
    $(this._media1).on('ended', $.bind(function()
    {
      if (this.options['loop'])
      {
        this._media1.load();
        this._media0.play();
        return;
      }
    }, this));
    $(this._media0).on('ended', $.bind(function()
    {
      if (this.options['loop'])
      {
        this._media0.load();
        this._media1.play();
        return;
      }

      // check options if it needs to stay
      if (this.options['_keep-alive'])
      {
        this._media0.load();
      }
      else
      {
        // call deffered if there is one
        if (this._deffered) this._deffered();
        this.off();
      }
    }, this));

    return this;
  },
  isPlaying: function()
  {
    return (!this._media0.paused || !this._media1.paused);
  },
  volume: function(volume)
  {
    if (this._media0)
    {
      this._media0.volume = volume;
    }
    if (this._media1)
    {
      this._media1.volume = volume;
    }
  },
  on: function(time, deffered)
  {
    var previous
      ;

    time = time || 0;

    // play with arguments
    if (typeof time == 'function')
    {
      deffered = time;
      time = 0;
    }

    if (deffered) this._deffered = deffered;

    // race condition
    if ((previous = this.current()) && previous != this)
    {
      if (previous._deffered) previous._deffered();
      previous.off();
    }
    this.current(this);

    if (this._media0 && this._media0.readyState > this._media0.HAVE_CURRENT_DATA)
    {
      // TODO: Wait for Chrome to fix it
//      this._media0.currentTime = Math.max(this._media0.duration - (+time) - 0.5, 0.1);
      this._media0.play();
    }
    else if (!this._goingToPlay)
    {
      $(this._media0).one('canplay', $.bind(function()
      {
        // TODO: Wait for Chrome to fix it
//        this._media0.currentTime = Math.max(this._media0.duration - (+time) - 0.5, 0.1);
        this._media0.play();
        this._goingToPlay = null;
      }, this));
      this._goingToPlay = true;
    }

    return this._media0.volume;
  },
  off: function()
  {
    // clean up defferend
    this._deffered = null;
    this.current(null);

    if (this._media0)
    {
      if (!this._media0.paused)
      {
        this._media0.pause();
      }
      this._media0.load();
    }
    if (this._media1)
    {
      if (!this._media1.paused)
      {
        this._media1.pause();
      }
      this._media1.load();
    }

  }
};
