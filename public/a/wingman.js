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
	this.socket = socket;
	this.initToken();
	this.setFullname(getCookie("fullname"));
	this.setTeam(getCookie("team"));
};

/**
 * Init token
 * If token is not set in cookie generates and sets one
 */
Wingman.prototype.initToken = function() {

	this.token=getCookie("token");
	if (!this.token)
	{
		this.token = Math.random().toString(36).substring(7);
		setCookie("token",this.token,1);
	}
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
 * Sends user information to the server
 *
 */
Wingman.prototype.checkin = function() {
	var message = {
		token : this.token,
		fullname : this.fullname,
		team : this.team
	};
	this.socket.emit('checkin', message);
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