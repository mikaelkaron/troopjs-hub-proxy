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
	var HANDLERS = config.emitter.handlers;
	var EXECUTOR = config.emitter.executor;
	var HEAD = config.emitter.head;
	var NEXT = config.emitter.next;
	var SCOPE = config.emitter.scope;
	var CALLBACK = config.emitter.callback;
	var DATA = config.emitter.data;
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
					me.on(special[NAME], special[VALUE], special[ARGS][0]);
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
			var handlers = me[HANDLERS];

			return when.all(Object
				// Get keys
				.keys(handlers)
				// Map to promises
				.map(function (type) {
					var matches;
					var memory;
					var handler;
					var _callback;
					var _handlers;
					var _handlersLength;

					// If `type` matches `RE` and the emitter has non `empty` memory ...
					if ((matches = RE.exec(type)) !== NULL && (memory = emitter.peek(matches[1], empty)) !== empty) {
						_handlers = [];
						_handlersLength = 0;

						// ... loop `handlers[type]` list ...
						for (handler = handlers[type][HEAD]; handler !== UNDEFINED; handler = handler[NEXT]) {
							// ... if `handler` requested memorization ...
							if (handler[DATA] === true) {
								// ... initialize `_callback` from `handler` ...
								_callback = {};
								_callback[EXECUTOR] = executor;
								_callback[TYPE] = handler[TYPE];
								_callback[SCOPE] = handler[SCOPE];
								_callback[CALLBACK] = handler[CALLBACK];

								// ... store emit with memory on `_handlers`
								_handlers[_handlersLength++] = me.emit.apply(me, [ _callback ].concat(memory));
							}
						}

						// convert `_handlers` to a promise
						_handlers = when.all(_handlers);
					}

					return _handlers;
				}));
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
