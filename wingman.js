var io     = require('socket.io-client')
  ;

var socket = io.connect('ws://192.168.0.212:8000');

socket.on('connect', function(zzz)
{
  console.log('connected');

  socket.emit('helo',  {me: 'admin'}, function(data)
  {

console.log(['helo', data]);

    socket.emit('admin:timer', function(data)
    {
console.log(['admin', data]);
    });

  });
});
