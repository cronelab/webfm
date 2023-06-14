// ======================================================================== //
//
// fmfeature
// Abstraction of data feature computations
//
// ======================================================================== //

// REQUIRES

var $ = require('jquery')

require('setimmediate') // Needed to fix promise
// polyfill on non-IE
var Promise = require('promise-polyfill') // Needed for IE Promise
// support
// MODULE OBJECT
var fmfeature = {}

// MAIN CLASS

fmfeature.Feature = function () {
  // Default feature is the "identity" feature; idea is for end-user to
  // overwrite with another appropriate computation function
  this.compute = function (trialData) {
    return new Promise(function (resolve, reject) {
      resolve(trialData)
    })
  }
}

fmfeature.Feature.prototype = {
  constructor: fmfeature.Feature,

  // ...
}

// RELATED CLASSES
// TODO Figure out subclassing in JS. It fucking SUCKS.

fmfeature.RemoteFeature = function (route) {
  var feature = this

  this.route = route

  // Create an appropriate compute for our remote pattern
  this.compute = function (trialData) {
    return new Promise(function (resolve, reject) {
      $.ajax(route, {
        type: 'post',
        data: JSON.stringify(trialData),
        contentType: 'application/json',
      })
        .done(function (result) {
          // Result is a string, presumably, so decode it
          var resultData = null
          try {
            resultData = JSON.parse(result)
          } catch (err) {
            // Whoops, the server made a boo-boo
            reject(err)
            return
          }
          // We made it!
          resolve(resultData)
        })
        .fail(function (req, reason, err) {
          reject(reason)
        })
    })
  }
}

fmfeature.RemoteFeature.prototype = {
  constructor: fmfeature.RemoteFeature,

  // ...
}

// EXPORT MODULE

module.exports = fmfeature

//
