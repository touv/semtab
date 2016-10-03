'use strict';

var path = require('path')
  , basename = path.basename(__filename, '.js')
  , debug = require('debug')('castor:downloaders:' + basename)
  ;

module.exports = function(options, core) {
  options = options || {};
  return function (data, submit) {
    var self = this;
    var ndata = {};
    Object.keys(data).filter(function(key) {
      return key[0] === '_'  && key !== '_config'
    }).forEach(function(key) {
      ndata[key] = data[key];
    })
    submit(null, ndata);
  }
}

