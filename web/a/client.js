var socket = io.connect();

var Final = false,
    Round = 0,
    Current,
    Elements = {};

var E = function(data)
{
    // singleton, yay!
    if (typeof data != 'object' && Elements[data])
    {
        return Elements[data];
    }
    else if (typeof data != 'undefined' && Elements[data.id])
    {
        return Elements[data.id].dump(data);
    }

    var self = {},
        dump = data,
        id = data.id || data,
        type = data.type || ((id == 'cover') ? 'cover' : 'pic'),
        el = $('#'+id);

    if (!el) return false; // TODO: throw up

    self =
    {
        handle: function()
        {
            return id;
        },
        el: function()
        {
            return el;
        },
        dump: function(data)
        {
            dump = data;
            return self;
        },
        active: function()
        {
            return el.hasClass('active');
        },
        action: function()
        {
            // hack for round
            if (id == 'round')
            {
                Round = dump.number;
                el.text(Round);
                // and hide everythiing
                if (Current) Current.off();
                Current = null;
                // uncheck all checked
                $('.team.checked').removeClass('checked');
                return self;
            }

            // turn off current in any case
            if (Current) Current.off();
            // check if we need activate something
            if (Current && Current.handle() == self.handle())
            {
                Current = null;
            }
            else
            {
                self.on();
            }

            return self;
        },
        on: function()
        {
            el.addClass('active');
            // skip for labels
            if (id == 'round' || id == 'final')
            {
                return self;
            }
            Current = self;
            if (type == 'cover')
            {
                $('#'+id+'>video').get(0).play();
            }
            if (id == 'teams')
            {
                if (Round)
                {
                    E('round').on();
                }
                else
                {
                    if (Final)
                    {
                        el.addClass('final');
                        E('final').on();
                    }
                    else
                    {
                        el.addClass('present');
                    }
                }
            }
            socket.emit('status', {id: id, on: true});

            return self;
        },
        off: function()
        {
            // reset current should be only one anyway
            el.removeClass('active');
            if (id == 'round' || id == 'final')
            {
                return self;
            }
            if (type == 'cover')
            {
                $('#'+id+'>video').get(0).pause();
                $('#'+id+'>video').get(0).currentTime = 0;
            }
            if (id == 'teams')
            {
                setTimeout(function()
                {
                    el.removeClass('present');
                    el.removeClass('final');
                }, 1500);
                E('round').off();
                E('final').off();
            }
            socket.emit('status', {id: id, on: false});

            return self;
        }
    };

    // add extra stuff
    if (type == 'cover')
    {
        $('#'+id+'>video').on('ended', function()
        {
            self.off();
        });
    }

    Elements[id] = self;

    return self;
};

// handshake
socket.emit('helo', {me: 'client'}, function(data)
{
    console.log(['helo', data]);

    // round
    E('round').el().text(Round = data.round);

    // process initial state
    if (data.status && data.status.on && data.status.id) E(data.status.id).on();

    // process teams
    _.each(data.teams, function(t)
    {
        E('teams').el().append('<span id="team_'+t.handle+'" class="team"><span class="short">'+t.short+'</span><span class="full">'+t.full+'</span><span class="points">'+t.points+'</span></span>');
    });
});

// handle action
socket.on('action', function(data)
{
    E(data).action();
});

socket.on('team', function(data)
{
    var oPoints;

    if ($('#team_'+data.handle))
    {
        oPoints = $('#team_'+data.handle+'>.points').text();
        $('#team_'+data.handle+'>.points').text(data.points);

        if (oPoints < data.points)
        {
            $('#team_'+data.handle).addClass('checked');
        }
        else
        {
            $('#team_'+data.handle).removeClass('checked');
        }
    }
});

socket.on('final', function(data)
{
    var topScore = 0;

    Round = 0;
    Final = true;

    if (Current)
    {
        Current.off();
        Current = null;
    }

    $('.team').removeClass('checked');

    setTimeout(function()
    {
        _.each(data.teams, function(t)
        {
            if (t.points > topScore) topScore = t.points;
            $('#team_'+t.handle+'>.points').text(t.points);
        });
        // double trouble, yes but it's just a hack
        _.each(data.teams, function(t)
        {
            if (t.points == topScore)
            {
                $('#team_'+t.handle).addClass('checked');
            }
        });

        E('teams').on();

    }, 1500);

});

// hard reset
socket.on('reset', function()
{
    window.location.reload();
});
