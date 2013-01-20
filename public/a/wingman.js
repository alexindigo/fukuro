var setCookie = function (c_name, value)
{
  document.cookie = c_name + "=" + escape(value) + ';' +
    'expires=0; ' +
    'path=/';
}

var getCookie = function (c_name)
{
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

var Wingman = function(socket)
{
  this.teams=[];
  this.socket = socket;
  this.fullname = ''; //getCookie("fullname") || '';
  this.team = ''; //getCookie("team") || '';
};

/**
 * Full name setter
 * @param value
 */
Wingman.prototype.setFullname = function(value)
{
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
Wingman.prototype.setToken = function(value)
{
  setCookie("token",value,1);
};

/**
 * Sends user information to the server
 *
 */
Wingman.prototype.helo = function(fn)
{
  var message =
    {
        token: getCookie("token")
    };
  this.socket.emit('helo', message, fn);
};

Wingman.prototype.emitTeam = function(fn)
{
  var message =
    {
        team : this.team
    };
    this.socket.emit('team', message, fn);
};

Wingman.prototype.emitJoin = function(fn)
{
  var message =
    {
        name : this.fullname
    };
    this.socket.emit('join', message, fn);
};

/**
 * Sends answer to the server
 * @param text
 */
Wingman.prototype.emitAnswer = function(text,fn)
{
  var message =
    {
      name: this.fullname,
      team: this.team,
      answer : text
    };
    this.socket.emit('answer', message, fn);
};
