var util      = require('util')
  , http      = require('http')
  , fs        = require('fs')

  , server    = http.createServer
  , request   = http.request

  , port      = 8101
  , options   =
    {
      hostname: 'ir.trulia.com',
      port    : 80,
      path    : '/phoenix.zhtml?c=251458&p=irol-quoteSide',
      method  : 'GET'
    }
  , template  = fs.readFileSync('trla.html', 'utf8')
  ;

server(function(req, response)
{
  var req = request(options, function(res)
  {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk)
    {
      data += chunk;
    });

    res.on('end', function()
    {
      var quote = data.match(/<span class="pull-right text-green lt-num">\$([0-9\.]+)<\/span>/);
      quote = quote ? '$'+quote[1] : '[failed]';

      var change = data.match(/<span class="(?:ccbnPos|ccbnNeg)">&#160;(.)&#160;([0-9\.]+)<\/span><span class="pctChange"><span class="(?:ccbnPos|ccbnNeg)">&#160;\(([-0-9\.]+)%\)<\/span>/);
      change = change ? change[1] + change[2] + ' (' + change[3] + '%)' : '[failed]';

      response.end(template.replace(/{{QUOTE}}/, quote).replace(/{{CHANGE}}/, change));
    });
  });

  req.on('error', function(e)
  {
    console.log('problem with request: ' + e.message);
  });

  req.end();

}).listen(port);
