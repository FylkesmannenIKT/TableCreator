var chai = require("chai"),
	assert = chai.assert,
	testdata = require('../usage/test.json'),
	table = new TableCreator(testdata, {});

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