var chai = require("chai"),
	assert = chai.assert,
	expect = chai.expect,
	testdata = require('../usage/test.json'),
	table = new TableCreator(testdata, {});

chai.use(require('chai-integer'));

describe('Insert row', function() {
	it('length of tbody should increase by 1', function() {
		var rows = table.data.tbody.length;
		table.insertRow({a:1,b:2,"stedligTilsyn_i_fjor":15,"stedligTilsyn_i_aar":13});
		assert.equal(rows+1, table.data.tbody.length);
	});
});

describe('Empty insert', function(){
	it('should be possible (or should it?)', function(){
		var rows = table.data.tbody.length;
		table.insertRow({});
		assert.equal(rows+1, table.data.tbody.length);
	});
});

describe('Values of zero', function(){
	it('should be inserted normally', function() {
		var rows = table.data.tbody.length;
		table.insertRow({"stedligTilsyn_i_aar": 0});
		var resultNumber = table.data.tbody.pop().stedligTilsyn_i_aar;
		expect(resultNumber).to.be.an.integer();
	});
});