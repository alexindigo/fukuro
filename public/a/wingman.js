function getCookie(c_name) {
	var i, x, y, ARRcookies = document.cookie.split(";");
	for (i = 0; i < ARRcookies.length; i++) {
		x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
		y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
		x = x.replace(/^\s+|\s+$/g, "");
		if (x == c_name) {
			return unescape(y);
		}
	}
}

function setCookie(c_name, value, exdays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = escape(value)
			+ ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
	document.cookie = c_name + "=" + c_value;
}

var Wingman = function(socket) {
    this.teams=[];
	this.socket = socket;
	this.setFullname(getCookie("fullname"));
	this.setTeam(getCookie("team"));
};

/**
 * Full name setter
 * @param value
 */
Wingman.prototype.setFullname = function(value) {
    this.fullname = value||'';
	setCookie("fullname",value,1);
};

/**
 * Team setter
 * @param value
 */
Wingman.prototype.setTeam = function(value) {
    this.team = value||'';
	setCookie("team",value,1);
};

/**
 * Team setter
 * @param value
 */
Wingman.prototype.setTeams = function(value) {
    this.teams = value||[];
};

/**
 * Token setter
 * @param value
 */
Wingman.prototype.setToken = function(value) {
	setCookie("token",value,1);
};

/**
 * Sends user information to the server
 *
 */
Wingman.prototype.helo = function(fn) {
		message =  {
				token : getCookie("token")||null
		};
	console.log(message);
	this.socket.emit('helo', message, fn);
};

Wingman.prototype.emitTeam = function(fn) {
    message =  {
        team : getCookie("team")||null
    };
    this.socket.emit('team', message, fn);
};

Wingman.prototype.emitJoin = function(fn) {
    message =  {
        name : getCookie("fullname")||null
    };
    console.log(message);
    this.socket.emit('join', message, fn);
};

/**
 * Sends answer to the server
 * @param text
 */
Wingman.prototype.answer = function(text) {
	var message = {
			answer : text
		};
		this.socket.emit('answer', message);
};