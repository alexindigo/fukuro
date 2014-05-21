var socket = io.connect()
  , wingmanApp = null
  ;


/**
 * Show form depend on the level of
 * user profile's completion
 */
function showForm()
{
  $('section.form').hide();
  $('#fullname').val(wingmanApp.fullname);

  if (!wingmanApp.fullname||wingmanApp.fullname==='')
  {
    $('#step1').show();
    return;
  }
  if(!wingmanApp.team||wingmanApp.team==='')
  {
    $('#step2').show();
  }
  else
  {
    $('#txtFullname').html(wingmanApp.fullname);
    $('#txtTeam').html(wingmanApp.teams[wingmanApp.team]['short']);
    $('#step3').show();
  }
}

htmlTeamList = function ()
{
  var html = '';
  for (team in wingmanApp.teams)
  {
    objTeam = wingmanApp.teams[team];

    // can't vote for collective or group
    if (objTeam.collective || objTeam.is_group) continue;

    var selected ='';

    if(team === wingmanApp.team)
    {
        selected = 'selected';
    }

    html+='<li id="'+team+'" class="'+selected+'">'+objTeam.short+'<a  class="button">выбрать</a></li>';
  }

  $('#teambox').html(html);
}

handleTeamResponse = function (data)
{
    if (data.status==='ok')
    {
        wingmanApp.setToken(data.token);
        showForm();
    }
    else
    {
        wingmanApp.setTeam();
    }
    showForm();
}

handleSelectTeam = function (e){
    if(e.target && e.target.nodeName == "A") {
        $('#teambox li').removeClass('selected');
        $('#teambox').on('click', handleSelectTeam);
        e.target.parentNode.className ="selected";
        wingmanApp.setTeam(e.target.parentNode.id);
        wingmanApp.emitTeam(handleTeamResponse);
    }
}

handleHeloResponse = function(data)
{
    if (data.status==='ok')
    {
        if (data.player)
        {
          if (data.player.name) wingmanApp.setFullname(data.player.name);
          if (data.player.team) wingmanApp.setTeam(data.player.team);
        }

        wingmanApp.setToken(data.token);
        wingmanApp.setTeams(data.teams);
        htmlTeamList();

        // show first step right away
        showForm();

        // if (wingmanApp.fullname||wingmanApp.team)
        // {
        //     showForm();
        // }
        // else
        // {
        //     $('section.form').hide();
        //     $('#step0').show();
        // }
    }
    else
    {
      wingmanApp.setToken('');
      wingmanApp.helo(handleHeloResponse);
    }
};


handleJoinResponse = function(data)
{
    if (data.status==='ok')
    {
        showForm();
    }
    else
    {
        wingmanApp.setFullname('');
        alert('Игрок уже зарегистрирован');
    }
};

handleSetFullname= function(e)
{
    wingmanApp.setFullname($('#fullname').val());
    wingmanApp.emitJoin(handleJoinResponse);
};

handleAnswerResponse= function()
{
    $('#info').addClass('completed');
    $('#info').html('Спасибо за ответ!');
};

handleAnswerRequest= function(e)
{
    var answer =$('#answer').val();
    if (!answer){
        alert('Введите ответ');
    }
    wingmanApp.emitAnswer(answer,handleAnswerResponse);
};


$(document).ready(
    function()
    {
      wingmanApp = new Wingman(socket);
      wingmanApp.helo(handleHeloResponse);

      $('#start-button').on('click', showForm);
      $('#set-user-button').on('click', handleSetFullname);
      $('#teambox').on('click', handleSelectTeam);
      $('#edit-user-button').on('click', function() {$('section.form').hide();$('#step1').show();});
      $('#edit-team').on('click',  function() {$('section.form').hide();$('#step2').show();});

      /**
       *  Prepopulate form with user and team data
       */
      socket.on('checkinResult', function(result)
      {
        if (result.success)
        {
          wingmanApp.setFullname(result.fullname);
          wingmanApp.setTeam(result.team);
          $('#fullname').val(result.fullname);
          $('#team').val(result.team);
          showForm();
          return;
        }
        else
        {
          alert(result.message);
        }
      });

            socket.on('timer', function(data)
            {
                if (data.time<0)
                {
                    $('#info').addClass('completed');
                    if ($('#info').html() != 'Спасибо за ответ!') $('#info').html('Время истекло');
                }
                else
                {
                    if ($('#info').hasClass('wait')&&!$('#info').hasClass('completed'))
                    {
                        html = '<p id="timer"></p>';
                        html = '<label for="answer">Ваш ответ:</label>';
                        html +='<input id="answer" type="text" required/>';
                        html +='<input class="action-button" id="answer-button" type="button" value="Ответить" />';
                        $('#info').removeClass('wait');
                        $('#info').html(html);
                        $('#answer-button').on('click', handleAnswerRequest);
                    };
                    $('#timer').html('Осталось '+data.time+' сек.');
                }
            });

            socket.on('reset', function(data)
            {
                window.location.reload();
            });

    });
