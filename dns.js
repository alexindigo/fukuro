var jack = require('dnsjack').createServer();

var dest = '10.0.1.206';

jack.route('*', dest);

// it listens on the standard DNS port of 53 per default
jack.listen();

console.log('Resolving everything to ' + dest);
