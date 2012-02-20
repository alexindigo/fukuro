var socket = io.connect();

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

// handshake
socket.emit('helo', {me: 'admin'}, function(data)
{
console.log(['helo', data]);
    // process initial state
    if (data.status && data.status.on && data.status.id) Status(data.status);

    // round
    $('footer').attr('data-round', data.round);

    // process teams
    _.each(data.teams, function(t)
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

$('button').on('click', function()
{
    var id = $(this).attr('id'),
        type = (id == 'cover') ? 'cover' : 'pic';

    if (id)
    {
        if (id == 'reset' || id == 'reload') return reset(id);

        socket.emit('admin:action', {id: id, type: type}, function(data)
        {
            switch (data.type)
            {
                case 'round':
                    $('footer').attr('data-round', data.number);
                    $('.team').removeClass('checked');
                    break;

                case 'final':
                    $('footer').attr('data-round', data.round);
                    $('.team').removeClass('checked');
                    break;
            }
        });
    }
});

$('#data').on('.team', 'click', function()
{
    var id = $(this).attr('id').substr(5);
    if (id)
    {
        socket.emit('admin:check', {id: id, type: 'team'});
    }
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

// hard reset
socket.on('reset', function()
{
    window.location.reload();
});
