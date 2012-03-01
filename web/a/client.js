// Content controller
var Content =
{
  init: function(data)
  {
    // {{{ get cover
    if ('cover' in data)
    {
      var el = $('<section id="cover"></section>').appendTo('body');
      this.cover = make(el, data.cover);
    }
    // }}}

    // {{{
    if ('questions' in data)
    {
      $.each(data.questions, $.bind(function(q, n)
      {
        var el = $('<section id="question_'+n+'" class="question '+q.type+'"></section>').appendTo('body');
        if (!this.questions) this.questions = {};
        this.questions[n] = make(el, q);
      }, this));
    }
    // }}}
  }

};

// Teams controller
var Teams =
{
  init: function(data)
  {
    // create teams section
    var el = $('<section id="teams"></section>').appendTo('body');
    this.board = oTeams.init(el);

    if (!this.teams) this.teams = {};
    $.each(data, $.bind(function(team)
    {
      this.board.addTeam(team);
    }, this));
  }
};

// Stats controller
var Stats =
{
  _el: null,
  update: function(round)
  {
    if (!this._el) this._el = $('<div id="stats"><span class="round"></span></div>').appendTo('body');

    $('.round', this._el).text(round);
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
          fn({item: 'questions', number: data.number, status: 'on'});
        }
        else
        {
          fn({item: 'questions', number: data.number, status: 'error'});
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
          fn({item: 'questions', number: data.number, status: 'off'});
        }
        else
        {
          fn({item: 'questions', number: data.number, status: 'error'});
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
    handlers.hide(data, misc.noCallback);
  },
  //
  'round': function(data)
  {
    // clean up the screen
    if (Base.current()) Base.current().off();
    // and update round
    Stats.update(data.round);
  },

  'team': function(data)
  {
    // set new score
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
var make = function(el, data)
{
  var res, poster = '';

  if ('video' in data)
  {
    if ('image' in data) poster = ' poster="/content/'+data.image+'"';
    //only video/mp4 for now
    res = oVideo.init(el).populate('<video'+poster+'><source src="/content/'+data.video+'" type="video/mp4"></video>');
  }
  else if ('image' in data)
  {
    res = oImage.init(el).populate('<img src="/content/'+data.image+'" alt="">');
  }
  else if ('audio' in data)
  {
    res = oAudio.init(el).populate('/content/'+data.audio);
  }

  return res;
};

// to the server
connect(handlers,
{
  data: {me: 'client'},
  callback: function(data)
  {
    // init content
    Content.init(data.content);

    // init teams
    Teams.init(data.teams);

    // set stats
    Stats.update(data.round);

    // check and set current
    if (data.current) handlers.show(data.current, misc.noCallback);
  }
});
