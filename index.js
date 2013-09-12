var HTTPDuplex = require('http-duplex-client')
  , zlib = require('zlib')
  , util = require('util')
  ;

module.exports = HTTPGzipDuplex

function HTTPGzipDuplex (req, options) {
  var self = this
  if (! (self instanceof HTTPGzipDuplex)) return new HTTPGzipDuplex(req, options)
  HTTPDuplex.apply(this, arguments)
}
util.inherits(HTTPGzipDuplex, HTTPDuplex)
HTTPGzipDuplex.prototype.makeRequest = function (req) {
  var self = this
  if (!req.headers) req.headers = {}
  req.headers['accept-encoding'] = 'gzip,deflate'
  self.req = self.http.request(req)
  self.req.on('response', function (resp) {
    self._output = resp
    self.emit('response', resp)

    var encoding = resp.headers['content-encoding'] || 'identity'
      , decompress
      , output
      ;

    if (encoding.match(/\bdeflate\b/)) {
      decompress = zlib.createInflate()
    } else if (encoding.match(/\bgzip\b/)) {
      decompress = zlib.createGunzip()
    }

    if (decompress) {
      resp.pipe(decompress)
      output = decompress
    } else {
      output = resp
    }

    self._output = output

    output.on('data', function (c) {
      if (!self.push(c)) output.pause()
    })
    output.on('end', function() {
      self.push(null)
    })
  })
}
