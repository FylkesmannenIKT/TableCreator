var chai = require("chai"),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should();

require('../src/tablecreator.js');
var table = new TableCreator({}, {});
var methods = table.methods;

describe('calculation methods', function() {
	it('should be available', function() {
		assert(!!methods);
	});
	
	it('should sum 100 and 10 and get 110', function() {
		var divisors = [100, 10];
		var result = methods.sum(divisors);
		expect(result).to.equal(110);
	});
	
	it('should average 100 and 10 and get 55', function() {
		var divisors = [100, 10];
		var result = methods.avg(divisors);
		expect(result).to.equal(55);
	});
	
	it('should divide 100 by 10 and get 10', function() {
		var divisors = [100, 10];
		var result = methods.div(divisors);
		expect(result).to.equal(10);
	});
	
	it('should multiply 100 by 10 and get 1000', function() {
		var divisors = [100, 10];
		var result = methods.mult(divisors);
		expect(result).to.equal(1000);
	});
});

describe('more advanced calculation methods', function() {
	it('should sum 100 and -10 and get 90', function() {
		var numbers = [100, -10];
		var result = methods.sum(numbers);
		expect(result).to.equal(90);
	});

	it('should sum 100 with NaN and get 100', function() {
		var divisors = [100, NaN];
		var result = methods.sum(divisors);
		expect(result).to.equal(100);
	});
	
	it('should divide 100 by 0 and get NaN', function() {
		var divisors = [100, 0];
		var result = methods.div(divisors);
		expect(result).to.be.NaN;
	});
	
	it('should divide 100 by NaN and get NaN', function() {
		var divisors = [100, NaN];
		var result = methods.div(divisors);
		expect(result).to.be.NaN;
	});

});
