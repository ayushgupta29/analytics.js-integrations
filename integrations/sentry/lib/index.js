'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');
var foldl = require('@ndhoule/foldl');
/**
 * Expose `Sentry` integration.
 */

var Sentry = (module.exports = integration('Sentry')
  .global('Sentry') // do we need a global here?
  .option('config', '')
  .option('serverName', null)
  .option('release', null)
  .option('ignoreErrors', []) // deprecated
  .option('ignoreUrls', [])
  .option('whitelistUrls', [])
  .option('includePaths', []) // deprecated
  .option('maxMessageLength', null) // deprecated
  .option('logger', null)
  .option('customVersionProperty', null)
  .option('level', '')
  .option('debug', false)
  .tag(
    '<script src="https://browser.sentry-cdn.com/5.7.1/bundle.min.js" integrity="sha384-KMv6bBTABABhv0NI+rVWly6PIRvdippFEgjpKyxUcpEmDWZTkDOiueL5xW+cztZZ" crossorigin="anonymous"></script>'
  ));

/**
 * Initialize.
 *
 * https://docs.sentry.io/clients/javascript/config/
 * https://github.com/getsentry/raven-js/blob/3.12.1/src/raven.js#L646-L649
 * @api public
 */

Sentry.prototype.initialize = function() {
  var customRelease = this.options.customVersionProperty
    ? window[this.options.customVersionProperty]
    : null;

  var options = {
    dsn: this.options.config,
    environment: this.options.logger,
    release: customRelease || this.options.release,
    serverName: this.options.serverName,
    whitelistUrls: this.options.whitelistUrls,
    blacklistUrls: this.options.ignoreUrls,
    debug: this.options.debug
  };

  var level = this.options.level;
  if (level) {
    window.Sentry.configureScope(function(scope) {
      scope.setLevel(level);
    });
  }

  window.Sentry.init(reject(options));
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Sentry.prototype.loaded = function() {
  return is.object(window.Sentry);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Sentry.prototype.identify = function(identify) {
  window.Sentry.configureScope(function(scope) {
    scope.setUser(identify.traits());
  });
};

/**
 * Clean out null values
 */

function reject(obj) {
  return foldl(
    function(result, val, key) {
      var payload = result;

      // strip any null or empty string values
      if (val !== null && val !== '' && !is.array(val)) {
        payload[key] = val;
      }
      // strip any empty arrays
      if (is.array(val)) {
        var ret = [];
        // strip if there's only an empty string or null in the array since the settings UI lets you save additional rows even though some may be empty strings
        for (var x = 0; x < val.length; x++) {
          if (val[x] !== null && val[x] !== '') ret.push(val[x]);
        }
        if (!is.empty(ret)) {
          payload[key] = ret;
        }
      }
      return payload;
    },
    {},
    obj
  );
}
