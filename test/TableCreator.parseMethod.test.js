var chai = require("chai"),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should();

require('../src/tablecreator.js');
var tableCreator = new TableCreator({}, {});
tableCreator.settings.precision = 3;

//TableCreator.parseMethod("sum(five,ten)", {five:5,ten:10});

describe('parseMethod', function() {
  
  it('should be available as a function', function() {
		assert.isFunction(tableCreator.parseMethod);
  });
  
  it('should parse successfully - example 1', function() {
    var methodString = "sum(five,ten)";
    var data = {five:5,ten:10}

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.be.equal('15.000');
  });
  
  it('should parse successfully - example 2', function() {
    var methodString = "sum(five,ten)";
    var data = {five:5,ten:NaN}

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.be.equal('5.000');
  });

  it('should parse successfully - example 3', function() {
    var methodString = "sum(five,ten)";
    var data = {five:5,ten:NaN}

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.be.equal('5.000');
  });

  it('should parse successfully - example 4', function() {
    var methodString = "mult(div(behandlet_innen_frist,behandlede_saker),100)";
    var data = {"resultatmaal":100,"behandlede_saker":"0","behandlet_innen_frist":"0"};

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.equal("");
  });

  it('should parse successfully - example 5', function() {
    var methodString = "mult(div(aarslonn_kvinner,aarslonn_menn),100)";
    var data =   {
      "betegnelse": "Kategori 7: L&aelig;rlinger",
      "tal_kvinner": "2",
      "tal_menn": "0",
      "aarslonn_kvinner": "100000",
      "aarslonn_menn": "0"
    };  

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.equal("");
  });

  it('should parse successfully - example 6', function() {
    var methodString = "mult(div(aarslonn_kvinner,aarslonn_menn),100)";
    var data = {
      "betegnelse": "Kategori 5: Kontorstillinger",
      "tal_kvinner": "3",
      "tal_menn": "1",
      "aarslonn_kvinner": "0",
      "aarslonn_menn": "479000"
    };

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.equal("0.000");
  });

  it('should parse successfully - example 7', function() {
    var methodString = "sum(-resultatmaal,resultat)"  ;
    var data = {
      "resultatmaal": 100,
      "resultat": 100
    };

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.equal("0.000");
  });

  it('should parse successfully - example 8', function() {
    var methodString = "work_ratio(resultatmaal,resultat)"  ;
    var data = {
      "resultatmaal": 0,
      "resultat": 0
    };

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.equal("100.000");
  });

  it('should parse successfully - example 9 work_ratio', function() {
    //"mult(div(behandlet_innen_frist,behandlede_saker),100)"
    var methodString = "work_ratio(behandlet_innen_frist,behandlede_saker)"  ;
    var data = {
      "behandlet_innen_frist": 10,
      "behandlede_saker": 10
    };

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.equal("100.000");
  });

  it('should parse successfully - example 10 work_ratio', function() {
    //"mult(div(behandlet_innen_frist,behandlede_saker),100)"
    var methodString = "work_ratio(behandlet_innen_frist,behandlede_saker)"  ;
    var data = {
      "behandlet_innen_frist": 10,
      "behandlede_saker": 100
    };

    var result = tableCreator.parseMethod(methodString, data);
    expect(result).to.equal("10.000");
  });

});	
