function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}
function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
	var message = $('#send-message').val(), systemMessage;
	if (message[0] == '/') {
		systemMessage = chatApp.processCommand($('#room').text(), message);
		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	} else {
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
	$('#send-message').val('');
}


/**
 *
 * @param step
 */
function processStep(step) {

	switch (step) {
	case 'step1':
		// show form 1 execute code block 1
		break;
	case 'step2':
		// show form 2 execute code block 1
		break;
	case 'step3':
		// show form 3 execute code block 1
		break;
	default:
		// show form 0 execute code block 1
	}
}


var socket = io.connect();
$(document).ready(
		function() {
			var chatApp = new Chat(socket);

			socket.on('checkinResult', function(result) {
				var message;
				if (result.success) {
					if (!result.fullname || !result.contacts || !result.team) {
						processStep('step1');
						return;
					}

					if (!result.fullname || !result.contacts) {
						processStep('step1');
						return;
					}
					if (!result.team) {
						processStep('step2');
						return;
					}
						processStep('step3');
						return;
				} else {
					message = result.message;
				}


				$('#messages').append(divSystemContentElement(message));
			});

			socket.on('refreshCheckin', function(result) {
				var message;
				if (result.success) {
					message = 'You are now known as ' + result.name + '.';
				} else {
					message = result.message;
				}
				$('#messages').append(divSystemContentElement(message));
			});

			socket.on('refreshTeams', function(result) {
				var message;
				if (result.success) {
					message = 'You are now known as ' + result.name + '.';
				} else {
					message = result.message;
				}
				$('#messages').append(divSystemContentElement(message));
			});


			socket.on('joinResult',
					function(result) {
						$('#room').text(result.room);
						$('#messages').append(
								divSystemContentElement('Room changed.'));
					});
			socket.on('message', function(message) {
				var newElement = $('<div></div>').text(message.text);
				$('#messages').append(newElement);
			});
			socket.on('rooms', function(rooms) {
				$('#room-list').empty();
				for ( var room in rooms) {
					room = room.substring(1, room.length);
					if (room != '') {
						$('#room-list').append(divEscapedContentElement(room));
					}
				}
				$('#room-list div').click(
						function() {
							chatApp.processCommand($('#room').text(), '/join '
									+ $(this).text());
							$('#send-message').focus();
						});
			});
			setInterval(function() {
				socket.emit('rooms');
			}, 1000);
			$('#send-message').focus();
			$('#send-form').submit(function() {
				processUserInput(chatApp, socket);
				return false;
			});
			$('#send-button').click(function() {
				processUserInput(chatApp, socket);
			});
		});