/**
 * @fileoverview TableCreation
 * @copyright Fylkesmannen i Sogn og Fjordane 2016
 * @author Per Kristian Warvik <fmsfpkw@fylkesmannen.no>
 * @license MIT
 */

"use strict";

String.prototype.isNumeric = function() {
    return !isNaN(parseFloat(this)) && isFinite(this);
};

Array.prototype.clean = function() {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === "") {
            this.splice(i, 1);
        }
    }
    return this;
};

/**
 * tableC
 * Object that holds all the methods for creating tables.
 * @class 
 */
var tableC = {

    /** 
     * Building a html table from data and put it the given element.
     *
     * @param {object} data - The data structure with table structure and table data.
     * @param {object} args - The element where the finished table should be pasted to.
     * @return void
     * @memberOf tableC
     */
    buildTable: function (data, el) {
        var tableClass = '';
        if(data.hasOwnProperty("table")) {
            tableClass = (data.table.hasOwnProperty("class")) ? data.table.class : '';
        }
        var html = '<table class="data_table ' + tableClass + '"><thead>';

        /**
         * Iterate over rows in data.thead to create headings in the table
         */
        for (var headrow = 0; headrow < data.thead.rows.length; ++headrow) {
            var rowList = data.thead.rows[headrow];
            html += '<tr>';
            for (var hrCol = 0; hrCol < rowList.length; ++hrCol) {
                var hrColumn = rowList[hrCol];
                var colspan = hrColumn.hasOwnProperty("colspan") ? ' colspan="' + hrColumn.colspan + '"' : '';
                var title = hrColumn.hasOwnProperty("title") ? hrColumn.title : '';
                html += '<th class="tcTableHeaders" ' + colspan + '>' + title + '</th>';
            }
            html += '</tr>';
        }

        /**
         * Iterate over cols in data.thead to create column headings in thead of table
         */
        html += '<tr>';
        for (var col = 0; col < data.thead.cols.length; ++col) {
            var headerRow = data.thead.cols[col];
            var headerTitle = headerRow.hasOwnProperty("title") ? headerRow.title : null;
            var hClass = headerRow.hasOwnProperty("class") ? headerRow.class : '';
            html += '<th class="' + hClass + '">' + headerTitle + '</th>';
        }
        html += '</tr>';

        /**
         * Iterate over the array in tbody to create one tbody row for each contained object.
         */
        html += '</thead><tbody>';
        for (var line = 0; line < data.tbody.length; ++line)
        {
            var dataLine = data.tbody[line];
            html += '<tr>';

            var column = data.thead.cols;

            for (var x = 0; x < column.length; ++x)
            {
                var id = column[x].id;
                var value = dataLine.hasOwnProperty(id) ? dataLine[id] : "";
                var cls = column[x].hasOwnProperty("class") ? column[x].class : "";
                if (column[x].hasOwnProperty("method"))
                {
                    var method = column[x].method;
                    var type = column[x].hasOwnProperty("type") ? column[x].type : '';
                    var answer = tableC.parseMethod(method, dataLine);
                    answer = (type == 'number') ? tableC.formatData(answer, 'number') : answer;
                    html += '<td class="' + type + ' ' + cls + '">' + answer + '</td>';

                }
                else if (column[x].hasOwnProperty("type"))
                {
                    switch(column[x].type)
                    {
                        case 'method':
                            value = tableC.parseMethod(value, dataLine);
                            html += '<td class="' + column[x].type + ' ' + cls + '">' + tableC.formatData(value, 'number') + '</td>';
                            break;
                        case 'number':
                            html += '<td class="' + column[x].type + ' ' + cls + '">' + tableC.formatData(value, 'number') + '</td>';
                            break;
                        case 'string':
                        case 'undefined':
                            html += '<td class="tcLeftAlign ' + column[x].type + ' ' + cls + '">' + value + '</td>';
                            break;
                        case 'index':
                            html += '<td>' + (line+1) + '</td>';
                            break;
                        case 'actionArray':
                            html += '<td class="tcRightAlign ' + cls + '">';
                            var actions = column[x].hasOwnProperty("actions") ? column[x].actions : null;
                            if(actions !== null && actions.constructor === Array ) {
                                for(var a = 0; a < actions.length; ++a) {
                                    switch(actions[a]) {
                                        case 'edit':
                                            html += '<span class="edit">rediger</span>';
                                            break;
                                    }
                                }
                            }
                            html += '</td>';
                            break;
                        default:
                            html += '<td class="' + column[x].type + ' ' + cls + '">' + value + '</td>';
                    }
                }
                else
                {
                    html += '<td class="tcLeftAlign ' + cls + '"></td>';
                }
            }

            // html += '<td><span class="edit">rediger</span></td>';

            html += '</tr>';
        }
        html += '</tbody>';

        /**
         * If tfoot has an array in cols property, iterate over it to produce bottom row (possibly with calculations)
         */
        if(data.tfoot.hasOwnProperty("cols") && Array.isArray(data.tfoot.cols) && data.tfoot.cols.length > 0) {
            html += '<tfoot><tr>';
            for (var y = 0; y < data.tfoot.cols.length; ++y)
            {
                var fCol = data.tfoot.cols[y];
                var globalClass = '';
                var footValue;
                if(y < data.thead.cols.length) {
                    globalClass = data.thead.cols[y].hasOwnProperty("class") ? data.thead.cols[y].class : '';
                }
                var localClass = fCol.hasOwnProperty("class") ? fCol.class : '';
                if(fCol.hasOwnProperty("title")) {
                    html += '<td class="' + globalClass + ' ' + localClass + ' string">' + fCol.title + '</td>';
                }
                else if (fCol.hasOwnProperty("method")) {
                    footValue = tableC.parseMethod(fCol.method, data);
                    html += '<td class="' + globalClass + ' ' + localClass + ' number">' + tableC.formatData(footValue, 'number') + '</td>';
                }
                else {
                    html += '<td class="' + globalClass + '"></td>';
                }
            }
            html += '</tfoot></tr>';
        }
        html += '</table>';

        el.innerHTML = html;
    },

    /**
     * Method to format values based on type
     * @memberof tableC
     * @param value A value that can be transformed
     * @param type The type that should determine how the value should be formatted
     * @returns A formatted string if formatting exists, else the original value
     * @example
     * // returns '15 000'
     * tableC.formatData( 15000, 'number' );
     */
     formatData: function formatData(value, type) {
        var val = value;
        switch(type) {
            case 'number':
                var parts = val.toString().split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                val = parts.join('.');
                var minus = '<span class="minus">' + val.replace('-', '- ') + '</span>';
                val = (val.charAt(0) == '-') ? minus : val;
                break;
            default:
                break;
        }
        return val;
     },

    /**
     * Object containing arithmetic methods (method name as key and function([array of numbers]) as values).
     * @memberOf tableC
     * @param {Array.<Number>}
     * @example
     * // returns 15
     * methods["sum"]([5,10]);
     * methods["avg"]([5,25]);
     */
    methods: {
      "sum" : function(args) {
        var total = 0;
        for (var arg = 0; arg < args.length; ++arg) {
          total += parseFloat(args[arg]);
        }
        return total;
      },
      "avg" : function(args) {
        var total = 0;
        for (var arg = 0; arg < args.length; ++arg) {
            total += parseFloat(args[arg]);
        }
        return (total / args.length);
      }
    },

    /** 
     * Calculate an answer with a method, passing in parameters(numbers or properties in data).<br/>
     * <pre>If the data contains tbody:
     *     Iterate over param in paramArray
     *         If a parameter is a number, it is ready for calculation.
     *         If a parameter is a string:
     *             Find number by looking at object or try parsing it as a method
     * If the data does not contain tbody:
     *     Iterate over param in paramArray
     *         If number, save in array
     *         If parama exists as a property, save in array (with or without minus)
     *  Calculate with the method and the numbers that has been found.       
     * </pre>
     *
     * @example
     * // returns 15
     * tableC.calculate("sum", ['five', 10], {tbody:[{five:5}]});
     *
     * @param {string} method - a name of a calculation in tableC.methods
     * @param {Array} paramArray - an array with numbers, keys or methods
     * @param {object} data - either a object found in tbody or a full data object with thead and tbody
     * @returns {Number} The final answer to the calculation.
     * @memberOf tableC
     */
    calculate: function(method, paramArray, data) {
        var args = [];
        var result;
        if (data.hasOwnProperty("tbody")) {
            for (var i = 0; i < paramArray.length; ++i) {
                var param = paramArray[i];
                if (typeof param === 'number') {
                    args.push((minus)?-param:param);
                    continue;
                }
                var minus = false;
                if(typeof param === 'string' && param.charAt(0) === '-') {
                    minus = true;
                    param = param.slice(1);
                }
                for (var j = 0; j < data.tbody.length; ++j) {
                    var row = data.tbody[j];
                    if (row.hasOwnProperty(param)) {

                        var colHead = null;
                        for (var t = 0; t < data.thead.cols.length; ++t) {
                            colHead = data.thead.cols[t];
                            if(colHead.id === param) { break; }
                        }
                        if (colHead === null) {
                            debugger;
                        }
                        if (colHead.type === "method") {
                            var methodResult = tableC.parseMethod(row[param], row);
                            args.push((minus)?-methodResult:methodResult);   
                        } else if (colHead.hasOwnProperty("method")) {
                            alert(JSON.stringify(colHead));
                            // var methodResult = tableC.parsemethod();
                        } else if (colHead.type === "number") {
                            args.push((minus)?-row[param]:row[param]);
                        }
                    }
                }
            }
        } else {
            for (var k = 0; k < paramArray.length; ++k) {
                var item = paramArray[k];
                if(typeof item === 'number') {
                    args.push(item);
                }
                else if(data.hasOwnProperty(item)) {
                    args.push(data[item]);
                }
                else if(item.charAt(0) === '-' && data.hasOwnProperty(item.slice(1))) {
                    args.push(-data[item.slice(1)]);
                }
            }
        }
        result = tableC.methods[method](args);
        return result;
    },

    /** 
     * Parse a method, pass it to calculation and return the answer.
     *
     * @example
     * // returns 15
     * tableC.parseMethod("sum(five,ten)", {five:5,ten:10});
     *
     * @param {string} methodString - a text representation of a calculation
     * @param {object} data - a structure where some keys can be found in methodString
     * @returns {Number} The final answer to the calculation
     * @memberOf tableC
     */
    parseMethod: function(methodString, data) {
    var parts = methodString.replace(/\s+/g, "");
        parts = parts.split(/([\,\(\)])/).clean();

        var argArrayStack = [[]];
        var operatorStack = [];

        for (var x = 0; x < parts.length; ++x) {
            var token = parts[x];
            // methods
            if (tableC.methods.hasOwnProperty(token)) {
                operatorStack.push(token);
            }
            // scope
            else if (token === '(') {
                argArrayStack.push([]);
            }
            // numbers
            else if (token.isNumeric()) {
                argArrayStack[argArrayStack.length-1].push(parseFloat(token));
            }
            // end of scope
            else if (token === ')') {
                var args = argArrayStack.pop();
                var call = operatorStack.pop();
                var result = tableC.calculate(call, args, data);
                argArrayStack[argArrayStack.length-1].push(result);
            }
            // arguments
            else if (token !== ',') {
                argArrayStack[argArrayStack.length-1].push(token);
            }
        }

        var value = parseFloat(argArrayStack.pop()).toFixed(0);
        value = isNaN(value) ? "" : value;
        return value;
    }

};
