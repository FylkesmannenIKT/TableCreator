require('../src/tablecreator.js');
var chai = require("chai"),
	assert = chai.assert,
	testdata = require('../usage/test.json'),
	table = new TableCreator(testdata, {});

var x = new (function myFn() {
	this.myName = "my test name";
	this.hello = function hello() {
		console.log(this.myName);
		return this.myName;
	};
	this.outputSettingsPrecision = function() {
		return this.settings && this.settings.precision;
	}
	return this;
})();

describe('Activate callbacks', function() {
	it('should be called successfully with specified context', function() {

		table.activateCallbacks.push({fn: x.hello, ctx: x});

		var result = table.callCallback(table.activateCallbacks[0]);
		assert.equal("my test name", result);

		// cleanup
		table.activateCallbacks = [];
	});

	it('should execute without access to TableCreator\'s context', function() {
		table.activateCallbacks.push({fn: x.outputSettingsPrecision});

		var result = table.callCallback(table.activateCallbacks[0]);
		assert.equal(2, table.settings.precision);
		assert.equal(undefined, result);

		// cleanup
		table.activateCallbacks = [];
	});
});