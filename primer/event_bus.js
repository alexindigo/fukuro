var server = require('http').createServer()
  , Primus = require('primus')

  // globals
  , bus    // event bus instance

  , subscriptions = {}
  ;

// init event bus
bus = new Primus(server, { transformer: 'websockets' });

bus.on('connection', function(socket)
{

  // process events
  socket.on('data', function(data)
  {
    var i, event;

    // process subscription
    if (typeof data == 'object' && data.subscribe)
    {
      for (i=0; i<data.subscribe.length; i++)
      {
        if (!subscriptions[data.subscribe[i]]) subscriptions[data.subscribe[i]] = [];
        subscriptions[data.subscribe[i]].push(socket);

      }
      return;
    }

    // get event (assume one event per message, just for primer)
    event = Object.keys(data || {})[0];

    // pass events
    if (subscriptions[event])
    {
      for (i=0; i<subscriptions[event].length; i++)
      {
        subscriptions[event][i].write(data);
      }
    }
  });

});

server.listen(4567);
console.log('Event Bus is listening on 4567');
