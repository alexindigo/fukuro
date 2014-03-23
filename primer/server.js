var http   = require('http')
  , path   = require('path')

  // thrid-party
  , Wigwam = require('wigwam')
  , Primus = require('primus')
  , Socket = Primus.createSocket({ transformer: 'websockets' })

  // globals
  , wigwam // web server instance
  , bus    // event bus reference
  ;

// Connect to event bus
bus = new Socket('http://localhost:4567/');

bus.on('open', function()
{
  console.log('Webserver connected to Event Bus');
});

// subscribe to 'module' events
bus.write({subscribe: ['module']});

// init webserver
wigwam = new Wigwam(http.createServer(),
{
  static:
  {
    path: path.join(__dirname, 'public'),
    cache: false
  },
  websockets:
  {
    transformer: 'websockets'
  }
});

// process events
wigwam.on('data', function(socket, data)
{
  // pass everything to the event bus
  bus.write({web: data});
});

bus.on('data', function(socket, data)
{
  // pass everything to the browser
  wigwam.instance.websockets.write(data);
});


// }}}

wigwam.listen(1337);
console.log('Web Server is listening on 1337');
