// predefines
var Teams = {};

var async  = function() {},
    fs     = require('fs'),
    app    = require('http').createServer(handler),
    io     = require('socket.io').listen(app),
    static = require('node-static'),
    file   = new (static.Server)('./web'),
    $      = require('nconf'); // data store

$.argv().env();

$.defaults(
{
    init: './teams.json',
    storage: './data',
    log_level: 1,
    port: 8000
});

// set file storage
$.use('file', {file: $.get('storage')});

io.set('log level', $.get('log_level'));

app.listen($.get('port'));

function handler(req, res)
{
    req.addListener('end', function()
    {
        file.serve(req, res);
    });
}

// add some redundancy
(function()
{
    for (var i=0,s=$.get('teams').length; i<s; i++)
    {
        Teams[$.get('teams')[i].handle] = i;
    }
})();


