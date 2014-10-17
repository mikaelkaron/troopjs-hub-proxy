/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"troopjs-core/component/emitter",
	"./config",
	"./emitter",
	"./executor",
	"when/when"
],function (Emitter, config, emitter, executor, when) {
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
	var ARRAY_PROTO = Array.prototype;
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
	 * @method constructor
	 * @inheritdoc
	 */
	return Emitter.extend({
		"displayName" : "hub/component",

		/**
		 * @inheritdoc
		 * @localdoc Registers event handlers declared HUB specials
		 * @handler
		 */
		"sig/initialize" : function () {
			var me = this;
			var specials = me.constructor.specials;

			if (specials.hasOwnProperty(HUB)) {
				specials[HUB].forEach(function (special) {
					me.on(special[NAME], special[VALUE]);
				});
			}
		},

		/**
		 * @inheritdoc
		 * @localdoc Triggers memorized values on HUB specials
		 * @handler
		 */
		"sig/start" : function () {
			var me = this;
			var empty = {};
			var specials = me.constructor.specials[HUB] || ARRAY_PROTO;

			// Calculate specials
			specials = specials
				.map(function (special) {
					var memory;
					var result;

					if (special[ARGS][0] === true && (memory = emitter.peek(special[TYPE], empty)) !== empty) {
						// Redefine result
						result = {};
						result[TYPE] = special[NAME];
						result[EXECUTOR] = executor;
						result[SCOPE] = me;
						result[CALLBACK] = special[VALUE];
						result = [ result ].concat(memory);
					}

					return result;
				})
				.filter(function (special) {
					return special !== UNDEFINED;
				});

			return when.map(specials, function (special) {
				return me.emit.apply(me, special);
			});
		},

		/**
		 * @inheritdoc
		 * @localdoc Registers subscription on the {@link hub.emitter hub emitter} for matching callbacks
		 * @handler
		 */
		"sig/add": function (handlers, type, callback) {
			var me = this;
			var matches;
			var _callback;

			if ((matches = RE.exec(type)) !== NULL) {
				// Let `_callback` be `{}` and initialize
				_callback = {};
				_callback[SCOPE] = me;
				_callback[CALLBACK] = callback;

				// Subscribe to the hub
				emitter.on(matches[1], _callback);
			}
		},

		/**
		 * @inheritdoc
		 * @localdoc Removes remote subscription from the {@link hub.emitter hub emitter} that was previously registered in {@link #handler-sig/add}
		 * @handler
		 */
		"sig/remove": function (handlers, type, callback) {
			var me = this;
			var matches;
			var _callback;

			if ((matches = RE.exec(type)) !== NULL) {
				// Let `_callback` be `{}` and initialize
				_callback = {};
				_callback[SCOPE] = me;
				_callback[CALLBACK] = callback;

				// Unsubscribe from the hub
				emitter.off(matches[1], _callback);
			}
		}
	});
});
