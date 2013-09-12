var zlib = require('zlib');
var http = require('http');
var fs = require('fs');
var client = require('./')
var stream = require('stream')
var assert = require('assert')
var util = require('util')
var test = fs.readFileSync(__dirname+'/test.js').toString()
var passes = 0

util.inherits(TestStream, stream.PassThrough)
function TestStream () {
  stream.PassThrough.apply(this, arguments)
  var str = ''
  var self = this
  self.on('data', function (chunk) {
    str += chunk
  })
  self.on('end', function () {
    assert.equal(str, test)
    passes += 1
    if (passes === 3) {
      console.log('ok')
      process.exit()
    }
  })
}

http.createServer(function(request, response) {
  var raw = fs.createReadStream(__dirname+'/test.js');
  var acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  }
  if (request.url === '/deflate') {
    response.writeHead(200, { 'content-encoding': 'deflate' });
    raw.pipe(zlib.createDeflate()).pipe(response);
  } else if (request.url === '/gzip') {
    response.writeHead(200, { 'content-encoding': 'gzip' });
    raw.pipe(zlib.createGzip()).pipe(response);
  } else {
    response.writeHead(200, {});
    raw.pipe(response);
  }
}).listen(8080, function () {

  ['gzip', 'deflate', ''].forEach(function (path) {
    var c = client({method:"GET", port:8080, path:'/'+path})
    c.pipe(new TestStream())
    c.on('response', function (resp) {
      if (path) assert.equal(resp.headers['content-encoding'], path)
    })
    c.end()
  })

})