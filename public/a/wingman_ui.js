var socket = io.connect()
   ,wingmanApp = null;


/**
 * Show form depend on the level of
 * user profile's completion
 */
function showForm() {
	$('section.form').hide();
    console.log(wingmanApp);

    $('#fullname').val(wingmanApp.fullname);
    $('#teambox li#'+wingmanApp.team).addClass('selected');

	if (!wingmanApp.fullname||wingmanApp.fullname===''){
		$('#step1').show();
		return;
	}
	if(!wingmanApp.team||wingmanApp.team===''){
        $('#step2').show();
		return;
	}else{

        $('#txtFullname').html(wingmanApp.fullname);
        $('#txtTeam').html(wingmanApp.teams[wingmanApp.team]['short']);

		$('#step3').show();
		return;
	}
}

htmlTeamList = function (){
    var html = '';
	for (team in wingmanApp.teams){
        objTeam = wingmanApp.teams[team];
        var selected ='';
        if(team===wingmanApp.team){
            selected = 'selected';
        }

       	html+='<li id="'+team+'" class="'+selected+'">'+objTeam.short+'<a  class="button">выбрать</a></li>';
	}
	$('#teambox').html(html);
}

handleTeamResponse = function (data){
    console.log(data);
    if (data.status==='ok'){
        wingmanApp.setToken(data.token);
        showForm();
    }else{
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

handleHeloResponse = function(data) {
    console.log(data);
    if (data.status==='ok'){
        wingmanApp.setToken(data.token);
        wingmanApp.setTeams(data.teams);
        htmlTeamList();
        showForm();
    }else{
        wingmanApp.setToken('');
        wingmanApp.helo(handleHeloResponse);
    }
};


handleJoinResponse = function(data) {
    console.log(message);
    console.log(data);
    if (data.status==='ok'){
        showForm();
    }else{
        alert(data.message);
    }
};

handleSetFullname= function(e) {
    console.log($('#fullname').val());
    wingmanApp.setFullname($('#fullname').val());
    wingmanApp.emitJoin(handleJoinResponse);
};

$(document).ready(
		function() {
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
			socket.on('checkinResult', function(result) {
				if (result.success) {
					wingmanApp.setFullname(result.fullname);
					wingmanApp.setTeam(result.team);
					$('#fullname').val(result.fullname);
					$('#team').val(result.team);
					showForm();
					return;
				} else {
					alert(result.message);
				}
			});

            socket.on('timer', function(data)
            {
                if (data.time<0){
                    alert ('Время истекло');
                    // show completed
                }else{
                    // show answer
                    alert ('Осталось '+data.time+ ' секунд');
                    console.log(['timer', data.time]);
                }
            });

            socket.on('reset', function(data)
            {
                window.location.reload();
            });

		});