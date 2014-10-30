'use strict';

var path      = require('path')
  , qs        = require('querystring')
  , http      = require('http') // not as server, but for misc use

  // thrid-party
  , _         = require('lodash')
  , merge     = require('deeply')
  , st        = require('st')
  , MapleTree = require('mapleTree')
  , Primus    = require('primus')

  // defaults
  , defaults  =
    {
      // default options for `st`atic files server
      static:
      {
        url            : '/',
        passthrough    : true, // no 404 for files
        index          : 'index.html',
        optionalHtmlExt: false,
        content        :
        {
          max          : 1024*1024*64, // memory limit for cache – 64Mb should be enough for everybody :)
          maxAge       : 10*60*1000, // time limit for content cache – 10 minutes
        }
      },
      // default options for the api server
      api:
      {
        maxLength     : 1024, // max length of request body in bytes, 0 for unlimited
        contentType   : 'application/json',
        responseEncode: JSON.stringify,
        requestDecode : qs.parse
        // TODO: Add decoder per content type
        // 'application/x-www-form-urlencoded' -> qs.parse
        // 'application/json' -> JSON.parse
        // 'multipart/form-data' -> Formidable ? user-land
      },
      // default options for (primus) websockets server
      websockets:
      {
      }
    }
  ;

// do the thing
module.exports = Wigwam;

// main thing
function Wigwam(server, options)
{
  if (!(this instanceof Wigwam)) return new Wigwam(server, options);

  // submodules instances storage
  this.instance = {};

  // keep reference to the server
  this.instance.server = server;

  // set defaults
  this.options = merge(defaults);

  // merge in custom options
  this._mergeOptions(options);

  this._init();

  // check for handlers in the options
  this._takeHandlers();
}

// --- Setup methods

// Static files server setup
Wigwam.prototype.static = function Wigwam_static(options)
{
  // merge in custom options
  this._mergeOptions({static: options});

  this._setStatic(this.options.static);

  return this;
}

// API server setup
Wigwam.prototype.api = function Wigwam_api(options)
{
  // merge in custom options
  this._mergeOptions({api: options});
  // retrieve handlers
  this._takeHandlers();

  return this;
}

// Web sockets server setup
Wigwam.prototype.websockets = function Wigwam_websockets(options)
{
  // merge in custom options
  this._mergeOptions({websockets: options});

  // reset websockets server
  this._setWebsockets(this.options.websockets);

  // retrieve handlers
  this._takeHandlers();

  return this;
}

// start doing useful stuff
Wigwam.prototype.listen = function Wigwam_listen(port, host)
{
  this.instance.server.listen(port, host);
  return this;
}

// --- API methods

// Adds HTTP GET method to API
Wigwam.prototype.get = function Wigwam_get(route, handler)
{
  this._addRoute('get', route, handler);
  return this;
}

// Adds HTTP POST method to API
Wigwam.prototype.post = function Wigwam_post(route, handler)
{
  this._addRoute('post', route, handler);
  return this;
}

// Adds HTTP PUT method to API
Wigwam.prototype.put = function Wigwam_put(route, handler)
{
  this._addRoute('put', route, handler);
  return this;
}

// Adds HTTP DELETE method to API
Wigwam.prototype.delete = function Wigwam_delete(route, handler)
{
  this._addRoute('delete', route, handler);
  return this;
}

// --- Websockets (Primus) methods

// TODO: Make it proper
// TODO: throw up if no websocket instance defined?
Wigwam.prototype.on = function Wigwam_on(event, handler)
{
  var i;

  // check for empty strings
  if (typeof event != 'string' || !(event = event.trim()))
  {
    return;
  }

  // check for multiply events
  if (event.indexOf(' ') > 0)
  {
    event = event.trim().split(' ');
    for (i=0; i<event.length; i++)
    {
      this.on(event[i], handler);
    }
    return;
  }

  if (!this.instance.events[event])
  {
    this.instance.events[event] = [];
  }

  this.instance.events[event].push(handler);

  return this;
}

// Semi-private methods, not part of the public interface

// creates submodules instances
Wigwam.prototype._init = function Wigwam__init()
{
  // conditionally create static files server
  if (this.options.static && this.options.static.path)
  {
    this._setStatic(this.options.static);
  }

  // create api routing storage
  // separate routes per HTTP method
  this.instance.api = {};

  // create websocket events routing table
  this.instance.events = {};

  // attach to http server
  this.instance.server.on('request', this._requestHandler.bind(this));

  // add websockets
  if (this.options.websockets.transformer)
  {
    this._setWebsockets(this.options.websockets);
  }
}

// Merge provided options with existing ones
Wigwam.prototype._mergeOptions = function Wigwam__mergeOptions(options)
{
  // for easier dealing with undefined
  options = options || {};
  this.options = this.options || {};

  // static files server
  this.options.static = merge(this.options.static, options.static || {});

  // api server
  this.options.api = merge(this.options.api, options.api || {});

  // websockets server
  this.options.websockets = merge(this.options.websockets, options.websockets || {});

  // set convenience options
  // static files local path
  options.path && (this.options.static.path = options.path);
  // api uri prefix
  options.apiPath && (this.options.api.path = options.apiPath);
  // websockets transport
  options.transformer && (this.options.websockets.transformer = options.transformer);

}

// Take handlers from options
Wigwam.prototype._takeHandlers = function Wigwam__takeHandlers()
{
  var event;

  // fetch api handlers
  // method by method
  if (this.options.api.get)
  {
    this._addApi('get', this.options.api.get);
    delete this.options.api.get;
  }
  if (this.options.api.post)
  {
    this._addApi('post', this.options.api.post);
    delete this.options.api.post;
  }
  if (this.options.api.put)
  {
    this._addApi('put', this.options.api.put);
    delete this.options.api.put;
  }
  if (this.options.api.delete)
  {
    this._addApi('delete', this.options.api.delete);
    delete this.options.api.delete;
  }

  // fetch websockets event handlers
  if (this.options.websockets.events)
  {
    for (event in this.options.websockets.events)
    {
      if (!this.options.websockets.events.hasOwnProperty(event)) continue;
      this.on(event, this.options.websockets.events[event]);
    }
    delete this.options.websockets.events;
  }
}

// Sets static files server
Wigwam.prototype._setStatic = function Wigwam__setStatic(options)
{
  if (options)
  {
    this.instance.files = st(options);
  }
}

// Adds API handlers in a batch
Wigwam.prototype._addApi = function Wigwam__addApi(method, handlers)
{
  var route;

  if (!method || !handlers)
  {
    return;
  }

  for (route in handlers)
  {
    if (!handlers.hasOwnProperty(route)) continue;

    this._addRoute(method, route, handlers[route]);
  }
}

// Sets websockets server
Wigwam.prototype._setWebsockets = function Wigwam__setWebsockets(options)
{
  if (options)
  {
    this.instance.websockets = new Primus(this.instance.server, options);

    // update client library
    if (options.clientLibrary)
    {
      this.instance.websockets.save(options.clientLibrary);
    }

    // listen for connections
    this.instance.websockets.on('connection', this._websocketConnectionHandler.bind(this));
  }
}


// Generic method for routes addition
Wigwam.prototype._addRoute = function Wigwam__addRoute(method, route, handler)
{
  // make it uppercase as HTTP methods
  method = method.toUpperCase();

  // TODO: Check method exists
  // normailize slashes and generate route
  // TODO: '/' case
  route = '/' + this.options.api.path.replace(/(^\s*\/|\/\s*$)/g, '') + '/' + route.replace(/^\s*\//, '');

  // create namespace if doesn't exist yet
  if (!this.instance.api[method])
  {
    this.instance.api[method] = new MapleTree.RouteTree();
  }

  // add
  this.instance.api[method].define(route, handler)
}

// Handles http requests
Wigwam.prototype._requestHandler = function Wigwam__requestHandler(req, res)
{
  var _wigman = this
    , match
    , host // host object for route method to be bound to
    // HEAD and GET available for static files
    , allowedMethods = _.uniq(['HEAD', 'GET'].concat(Object.keys(this.instance.api)))
    ;

  // check if response already finished
  if (res.finished) return;

  // check if method supported
  if (allowedMethods.indexOf(req.method) == -1)
  {
    // return 405 Method Not Allowed
    // with the list of allowed methods
    res.setHeader('Allow', allowedMethods.join(' '));
    this._responseHandler(res, 405);
    return;
  }

  // check request body length length
  if (+this.options.api.maxLength && +req.headers['content-length']
    && +this.options.api.maxLength < +req.headers['content-length'])
  {
    this._responseHandler(res, 413); // Request Entity Too Large
    return;
  }

  // check api router
  if (this.instance.api[req.method] && (match = this.instance.api[req.method].match(req.url)).perfect)
  {
    // fill host object with useful stuff
    host =
    {
      // data
      extras  : match.extras,
      request : req,
      response: res,
      // request specific methods
      parseRequestBody: this._requestParser.bind(this, req)
    };

    // execute matched method
    match.fn.call(host, match.params, function Wigwam__requestHandler_matchedRoute_cb(err, body)
    {
      if (err) return _wigman._responseHandler(res, err.code, err);

      // not an error
      _wigman._responseHandler(res, 200, body); // Ok
    });

    // and be done here
    return;
  }

  // check for local files
  if (this.instance.files)
  {
    this.instance.files(req, res, this._requestHandler_fileNotFound.bind(this, req, res));
  }
  else
  {
    // nothing
    this._responseHandler(res, 404); // Not Found
  }
}

// Handles File Not Found callback from static file server
Wigwam.prototype._requestHandler_fileNotFound = function Wigwam__requestHandler_fileNotFound(req, res)
{
  // check if it's no extension html request
  if (this.options.static.optionalHtmlExt && req.url.indexOf('.') == -1)
  {
    // try again with '.html'
    req.url += '.html';
    // try one more time
    this.instance.files(req, res, this._requestHandler_fileNotFound.bind(this, req, res));
    return;
  }

  // nothing
  this._responseHandler(res, 404); // Not Found
}

// Handles response finishing touches
Wigwam.prototype._responseHandler = function Wigwam__responseHandler(res, code, body)
{
  var code = code || 500 // server error by default
    , body = body || http.STATUS_CODES[code] // by default standard http message
    ;

  // inconvenient case when err is just code number
  // treat that number as code status
  if (code == 500 && typeof body == 'number' && body > 99)
  {
    code = body;
    body = http.STATUS_CODES[code];
  }

  res.writeHead(code, {'Content-type': this.options.api.contentType});
  res.end(this.options.api.responseEncode(body));
}

// Collects and parses request body
Wigwam.prototype._requestParser = function Wigwam__requestParser(req, callback)
{
  var _wigwam = this
    , body    = new Buffer('')
    ;

  // collect data first
  req.on('data', function Wigwam__requestParser_onData(data)
  {
    var newLength;

    if ((newLength = body.length + data.length) > _wigwam.options.api.maxLength) return callback(413); // Request Entity Too Large

    body = Buffer.concat([body, data], newLength);
  });

  // parse params
  req.on('end', function Wigwam__requestParser_onDataEnd()
  {
    var params;

    try
    {
      params = _wigwam.options.api.requestDecode(body.toString('utf8'));
    }
    catch (e)
    {
      return callback(400); // Bad Request
    }

    callback(null, params);
  });
}

// Handles websockets connections
Wigwam.prototype._websocketConnectionHandler = function Wigwam__websocketConnectionHandler(spark)
{
  var _wigwam = this;

  // check for custom connection events
  if (_.isArray(this.instance.events['connection']))
  {
    _.invoke(this.instance.events['connection'], 'call', this.instance.websockets, spark, {connection: true});
  }

  // check for custom disconnection events
  if (_.isArray(this.instance.events['disconnection']))
  {
    spark.on('end', function Wigwam__websocketConnectionHandler_onEnd()
    {
      _.invoke(_wigwam.instance.events['disconnection'], 'call', _wigwam.instance.websockets, spark, {disconnection: true});
    });
  }

  // check user wants to handle websocket events
  // on "low" level – deal with data events manually
  if (_.isArray(this.instance.events['data']))
  {
    spark.on('data', function Wigwam__websocketConnectionHandler_onData(data)
    {
      _.invoke(_wigwam.instance.events['data'], 'call', _wigwam.instance.websockets, spark, data);
    });
  }
  else // or add some sugar
  {
    spark.on('data', this._websocketOnDataHandler.bind(this, spark));
  }
}

// Handles websockets data events
Wigwam.prototype._websocketOnDataHandler = function Wigwam__websocketOnDataHandler(socket, data)
{
  var event;

  // only objects
  if (typeof data != 'object') return;

  for (event in data)
  {
    if (!data.hasOwnProperty(event)) continue;

    // check for existing event handlers
    if (_.isArray(this.instance.events[event]))
    {
      _.invoke(this.instance.events[event], 'call', this.instance.websockets, socket, data[event]);
    }
  }
}
