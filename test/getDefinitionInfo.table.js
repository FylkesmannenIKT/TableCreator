var chai = require("chai"),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	testdata = require('../usage/test.json'),
	table = new TableCreator(testdata, {});

describe('Get table definition', function(){
	it('should receive what is in the table part of the definition.', function(){
		var tableInfo = table.getTableDefinitionInfo();
		tableInfo.should.have.property('id');
		tableInfo.should.have.property('settings');
		tableInfo.should.have.property('datasource');
	});
});