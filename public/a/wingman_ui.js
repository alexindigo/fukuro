/**
 * Show form depend on the level of
 * user profile's completion
 */
function showForm() {
	$('section.form').hide();
	var fullname=$('#fullname').val();
	var team=$('#team').val();
	if (!fullname){
		$('#step1').show();
		return;
	}
	if(!team){
		$('#step2').show();
		return;
	}else{
		$('#step3').show();
		return;
	}
}

var socket = io.connect();
$(document).ready(
		function() {

			$('#start-button').on('click', showForm);
			$('#set-user-button').on('click', showForm);

			var wingmanApp = new Wingman(socket);
			wingmanApp.checkin();

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

			socket.on('ping', function(result) {
				wingmanApp.checkin();
			});

			socket.on('refreshTeams', function(result) {
				//TODO generate the list of teams
				// <input type="radio" name="team" value="blash">Male<br>
				var teambox= '<li></li>';
				$('#teambox').html(teambox);
				// TODO check team
			});

			socket.on('message', function(message) {
				var newElement = $('<div></div>').text(message.text);
				$('#messages').append(newElement);
			});
		});