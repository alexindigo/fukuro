var Primus = require('primus')
  , Socket = Primus.createSocket({ transformer: 'websockets' })

  // globals
  , bus    // event bus reference
  ;

// Connect to event bus
bus = new Socket('http://localhost:4567/');

bus.on('open', function()
{
  console.log('Module connected to Event Bus');
});

// subscribe to 'web' events
bus.write({subscribe: ['web']});

bus.on('data', function(data)
{
  // pass everything back
  bus.write({module: data});
});
