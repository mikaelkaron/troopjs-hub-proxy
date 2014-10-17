define([
	"../emitter",
	"when/when",
	"when/delay"
], function (emitter, when, delay) {
	"use strict";

	var assert = buster.referee.assert;
	var refute = buster.referee.refute;

	buster.testCase("troopjs-hub/emitter", {
		"setUp" : function () {
			this.timeout = 1000;
		},

		"subscribe/publish sync subscribers" : function () {
			var foo = "FOO";
			var bar = "BAR";

			emitter.on("foo/bar", function (arg) {
				assert.same(foo, arg);
				// Return an array.
				return [arg, bar];
			});
			emitter.on("foo/bar", function (arg1, arg2) {
				assert.same(foo, arg1);
				assert.same(bar, arg2);
				// Return no value.
			});
			emitter.on("foo/bar", function (arg1, arg2) {
				// Arguments received are to be same as the previous one.
				assert.same(foo, arg1);
				assert.same(bar, arg2);

				// Return array-like arguments
				return arguments;
			});
			emitter.on("foo/bar", function (arg1, arg2) {
				// Arguments received are to be same as the previous one.
				assert.same(foo, arg1);
				assert.same(bar, arg2);

				// Return a single value.
				return arg1;
			});
			emitter.on("foo/bar", function (arg1, arg2) {
				assert.same(foo, arg1);
				refute.defined(arg2);
			});
			return emitter.emit("foo/bar", foo);
		},

		"subscribe/publish async subscribers": function() {
			var foo = "FOO";
			var bar = "BAR";

			emitter.on("foo/bar", function (arg) {
				assert.same(foo, arg);
				return when.resolve([arg, bar]);
			});
			emitter.on("foo/bar", function (arg1, arg2) {
				assert.same(foo, arg1);
				assert.same(bar, arg2);
				return delay(200, [bar]);
			});
			emitter.on("foo/bar", function (arg1) {
				assert.same(bar, arg1);
				// Return a promise that resolves to no value.
				return delay(200, foo);
			});
			emitter.on("foo/bar", function (arg1, arg2) {
				assert.same(foo, arg1);
				refute.defined(arg2);

				// Return a promise that resolves to no value.
				return delay(200, undefined);
			});
			emitter.on("foo/bar", function(arg1, arg2) {
				// Arguments received are to be same as the previous one.
				assert.same(foo, arg1);
				refute.defined(arg2);
			});
			return emitter.emit("foo/bar", foo);
		},

		"bug out in first hub subscriber": function() {
			var err = new Error("bug out");
			emitter.on("foo/bar", function() {
				throw err;
			});
			return emitter.emit("foo/bar").otherwise(function(error) {
				assert.same(error, err);
			});
		},

		"tearDown": function () {
			emitter.off("foo/bar");
		}
	});
});
