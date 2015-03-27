/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
  "troopjs-core/component/emitter",
  "./config",
  "./emitter",
  "./executor",
  "when/when"
], function (Emitter, config, emitter, executor, when) {
  "use strict";

  /**
   * Component that provides hub features.
   * @class hub.component
   * @extend core.component.emitter
   * @mixin hub.config
   * @alias feature.component
   */

  var UNDEFINED;
  var NULL = null;
  var TRUE = true;
  var EXECUTOR = config.emitter.executor;
  var SCOPE = config.emitter.scope;
  var CALLBACK = config.emitter.callback;
  var ARGS = "args";
  var NAME = "name";
  var TYPE = "type";
  var VALUE = "value";
  var HUB = "hub";
  var RE = new RegExp("^" + HUB + "/(.+)");

  /**
   * @handler sig/start
   * @localdoc Triggers memorized values on HUB specials
   * @inheritdoc
   */

  /**
   * @handler sig/add
   * @localdoc Registers subscription on the {@link hub.emitter hub emitter} for matching callbacks
   * @inheritdoc
   */

  /**
   * @handler sig/remove
   * @localdoc Removes remote subscription from the {@link hub.emitter hub emitter} that was previously registered in {@link #handler-sig/add}
   * @inheritdoc
   */

  /**
   * @method constructor
   * @inheritdoc
   */
  return Emitter.extend(function () {
    var me = this;
    var memorized = [];

    // Intercept added handlers
    me.on("sig/added", function (handlers, type, callback, data) {
      var _matches;
      var _type;
      var _callback;
      var _memory;
      var _empty = {};

      // If we've added a HUB callback ...
      if ((_matches = RE.exec(type)) !== NULL) {
        // Let `_type` be `_matches[1]`
        _type = _matches[1];

        // Let `_callback` be `{}` and initialize
        _callback = {};
        _callback[SCOPE] = me;
        _callback[TYPE] = type;
        _callback[CALLBACK] = callback;
        _callback[EXECUTOR] = executor;
        _callback[HUB] = _type;

        // Subscribe to the hub
        emitter.on(_type, _callback);

        // If re-emit was requested ...
        if (data === TRUE) {
          // If memorization is "open"
          if (memorized !== UNDEFINED) {
            memorized.push(_callback);
          }
          // .. otherwise try to `emit` if `emitter` memory for `_type` is not `_empty`
          else if ((_memory = emitter.peek(_type, _empty)) !== _empty) {
            me.emit.apply(me, [ _callback ].concat(_memory));
          }
        }
      }
    });

    // Intercept removed handlers
    me.on("sig/removed", function (handlers, type, callback, data) {
      var _matches;
      var _callback;

      // If we've removed a HUB callback ...
      if ((_matches = RE.exec(type)) !== NULL) {
        // Let `_callback` be `{}` and initialize
        _callback = {};
        _callback[SCOPE] = me;
        _callback[CALLBACK] = callback;

        // Unsubscribe from the hub
        emitter.off(_matches[1], _callback);

        // If re-emit was requested and there are `memorized` callbacks ...
        if (data === TRUE && memorized !== UNDEFINED) {
          // TODO in place filtering for performance
          // Filter matching `__callback`
          memorized = memorized.filter(function (__callback) {
            return __callback[TYPE] !== type && __callback[SCOPE] !== me && __callback[CALLBACK] !== callback;
          });
        }
      }
    });

    // Intercept component start
    me.on("sig/start", function () {
      return when
        // Map `memorized` ...
        .map(memorized, function (_callback) {
          var _memory;
          var _empty = {};

          // If `emitter` memory for `_callback[HUB]` is not `_empty` re-emit ...
          return (_memory = emitter.peek(_callback[HUB], _empty)) !== _empty
            ? me.emit.apply(me, [ _callback ].concat(_memory))
            : UNDEFINED;
        })
        // ... and reset to `UNDEFINED`
        .tap(function () {
          memorized = UNDEFINED;
        });
    });

  }, {
    "displayName": "hub/component",

    /**
     * @inheritdoc
     * @localdoc Registers event handlers declared HUB specials
     * @handler
     */
    "sig/initialize": function () {
      var me = this;
      var specials = me.constructor.specials;

      if (specials.hasOwnProperty(HUB)) {
        specials[HUB].forEach(function (special) {
          me.on(special[NAME], special[VALUE], special[ARGS][0]);
        });
      }
    }
  });
});
