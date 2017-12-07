var assert = require('assert');
require('../src/tablecreator.js');
var testdata = require('../usage/test.json');
var table = new TableCreator(testdata, {});
var attribute = "databind";
var attributeColumns = table.getTableColumnAttribute(attribute);

describe('Get array of objects containing ids and attributes', function() {
	it('should get two elements', function() {
		console.log('\t' + JSON.stringify(attributeColumns));
		assert.equal(attributeColumns.length, 2);
	});
	it('should have \"' + attribute + '\" as part of all the objects in returned array', function() {
		var isOK = attributeColumns.reduce((acc, next) => { 
			return acc.hasOwnProperty(attribute) && next.hasOwnProperty(attribute);
		});
		assert.ok(isOK)
	});
});