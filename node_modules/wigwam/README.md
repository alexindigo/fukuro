# Wigwam

A module for creating restful API servers and static file servers (with etags, caching, etc).

Web server is like a house, some are small and tiny, some are big and fancy. And if you're goin gto live there alone
or with small family of two-three people, you don't huge mansion with 10 rooms and 15 bathrooms,
it will take all your time to maintain teh thing with no clear advantage.
Same with the webservers, it's easy to install all-included frameworks like express,
but do you really need all of it's features all the time?


## Install

```
$ npm install wigwam
```

## Examples

Assume:

```javascript
var http      = require('http')
  , path      = require('path')

  , Wigwam    = require('wigwam')

  , publicDir = './public'

  , wigwam
  ;
```


### 1. Simplest, static files only, no api, no websockets

```javascript
wigwam = new Wigwam(http.createServer(), {path: publicDir}).listen(11337);
console.log('Listening on 11337');
```

### 2. All in one

```javascript
Wigwam(http.createServer(),
{
  // static files
  static:
  {
    path: publicDir,
    url : '/'
  },
  // api endpoints
  api:
  {
    path: '/api/v0',
    get:
    {
      'test/:test': function(params, callback)
      {
        // successful response
        callback(null, {method: 'get'});
      }
    },
    post:
    {
      'test': function(params, callback)
      {
        // successful response
        callback(null, {method: 'post'});
      },
    }
  },
  // websocket events
  websockets:
  {
    transformer: 'websockets',
    events:
    {
      'connection': function(socket)
      {
        console.log('connected');
      },
      'data': function(socket, data)
      {
        socket.write({echo: data});
      },
      'error': function(err)
      {
        console.error('Something horrible has happened', err, err.message);
      }
    }
  }
}).listen(11338);
console.log('Listening on 11338');
```

### 3. Step-by-step, Static + API + Websockets
```javascript
// Create server instance
wigwam = new Wigwam(http.createServer());

// Static files
wigwam.static(
{
  path: publicDir
});

// API endpoints
wigwam.api(
{
  path: '/api/v1',
  get:
  {
    'test/:test': function(params, callback)
    {
      // unsuccessful response
      callback({code: 500, error: 'for get'});
    }
  },
  post:
  {
    'test': function(params, callback)
    {
      // parse POST parameters
      this.parseRequestBody(function(err, data)
      {
        // unsuccessful response
        callback({code: 500, error: 'for post'});
      });
    }
  }
});

// Websocket events
wigwam.websockets(
{
  transformer: 'websockets',
  events:
  {
    'connection': function(socket)
    {
      console.log('connected to :11339');
    },
    'data': function(socket, data)
    {
      socket.write({echo: data, port: 11339});
    }
  }
});

// Start listening
wigwam.listen(11339);
console.log('Listening on 11339');
```

### 4. Verbose handlers
```javascript
// Start with server + settings
wigwam = new Wigwam(http.createServer(),
{
  path: publicDir,
  apiPath: '/api',
  transformer: 'websockets'
}).listen(11340);
console.log('Listening on 11340');

// GET endpoint
wigwam.get('test/:test', function(params, callback)
{
  // successful response
  callback(null, {parameter: params.test, method: 'get', port: 11340});
});

// POST endpoint
wigwam.post('test', function(params, callback)
{
  // parse POST parameters
  this.parseRequestBody(function(err, data)
  {
    // successful response
    callback(null, {data: data, method: 'post', port: 11340});
  });
});

// combined events handler
wigwam.on('connection data', function(socket, data)
{
  if (data.connection)
  {
    console.log('connected to :11340');
  }

  socket.write({echo: data, port: 11340});
});

// Single event handler
wigwam.on('disconnection', function(socket)
{
  console.log('bye, bye');
});

```

## TODO

- Tests
- Better docs

