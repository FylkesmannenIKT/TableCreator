/**
 * @fileoverview TableCreator
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
 * TableCreator
 * Object that holds all the methods for creating tables.
 * @class 
 */
function TableCreator(data, el) {

    if (!(this instanceof TableCreator)) {
        return new TableCreator(data, el);
    }

    /**
     * Store reference to this TableCreator as an internal context.
     * (Note: In JavaScript, all objects are referenced.)
     */
    this.ctx = this;

    /**
     * Object containing json structure defining table with content.
     * @memberOf TableCreator
     */
    this.data = data;

    /**
     * DOM element the generated table should be put into.
     * @memberOf TableCreator
     */
    this.el = el;

    /**
     * Object containing settings.
     * @memberOf TableCreator
     */
    this.settings = {
        precision: 2
    };

    /** 
     * Building a html table from data the TableCreator has.
     *
     * @return void
     * @memberOf TableCreator
     */
    this.build = function() {
        this.buildTable(this.data, this.el);
        return this;
    };

    this.activate = function() {
        this.addEditLinks();
        return this;
    };

    /** 
     * Building a html table from data and put it the given element.
     *
     * @param {object} data - The data structure with table structure and table data.
     * @param {object} args - The element where the finished table should be pasted to.
     * @return void
     * @memberOf TableCreator
     */
    this.buildTable = function (data, el) {
        var tableClass = '';
        if(data.hasOwnProperty("table")) {
            tableClass = (data.table.hasOwnProperty("class")) ? data.table.class : '';
        }

        if (data.hasOwnProperty("table")) {
            if (data.table.hasOwnProperty("settings")) {
                if (data.table.settings.hasOwnProperty("decimals")) {
                    if (typeof data.table.settings.decimals === 'number') {
                        this.settings.precision = data.table.settings.decimals;
                    }
                }
            }
        }

        var html = '<table class="tc_table ' + tableClass + '"><thead>';

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
                    var answer = this.parseMethod(method, dataLine);
                    answer = (type == 'number') ? this.formatData(answer, 'number') : answer;
                    html += '<td class="' + type + ' ' + cls + '">' + answer + '</td>';

                }
                else if (column[x].hasOwnProperty("type"))
                {
                    switch(column[x].type)
                    {
                        case 'method':
                            value = this.parseMethod(value, dataLine);
                            html += '<td class="' + column[x].type + ' ' + cls + '">' + this.formatData(value, 'number') + '</td>';
                            break;
                        case 'number':
                            html += '<td class="' + column[x].type + ' ' + cls + '">' + this.formatData(value, 'number') + '</td>';
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

                            // Add spinner if column is cached while saving to server
                            var cache = dataLine.hasOwnProperty("cache") ? dataLine.cache : null;
                            if(cache !== null) {
                                html += '<i class="fa fa-refresh fa-spin"></i>';
                            }

                            // add action icons for a column
                            var actions = column[x].hasOwnProperty("actions") ? column[x].actions : null;
                            if(actions !== null && actions.constructor === Array ) {
                                for(var a = 0; a < actions.length; ++a) {
                                    switch(actions[a]) {
                                        case 'edit':
                                            html += '<span class="tcAction edit" data-tc_action="edit" data-tc_row="' + line + '">rediger</span>';
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
                    footValue = this.parseMethod(fCol.method, data);
                    html += '<td class="' + globalClass + ' ' + localClass + ' number">' + this.formatData(footValue, 'number') + '</td>';
                }
                else {
                    html += '<td class="' + globalClass + '"></td>';
                }
            }
            html += '</tfoot></tr>';
        }
        html += '</table>';

        el.innerHTML = html;
    };

    /**
     * Method to format values based on type
     * @memberof TableCreator
     * @param value A value that can be transformed
     * @param type The type that should determine how the value should be formatted
     * @returns A formatted string if formatting exists, else the original value
     * @example
     * // returns '15 000'
     * TableCreator.formatData( 15000, 'number' );
     */
    this.formatData = function formatData(value, type) {
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
    };

    /**
     * Object containing arithmetic methods (method name as key and function([array of numbers]) as values).
     * @memberOf TableCreator
     * @param {Array.<Number>}
     * @example
     * // returns 15
     * methods["sum"]([5,10]);
     * methods["avg"]([5,25]);
     */
    this.methods = {
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
    };

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
     * TableCreator.calculate("sum", ['five', 10], {tbody:[{five:5}]});
     *
     * @param {string} method - a name of a calculation in TableCreator.methods
     * @param {Array} paramArray - an array with numbers, keys or methods
     * @param {object} data - either a object found in tbody or a full data object with thead and tbody
     * @returns {Number} The final answer to the calculation.
     * @memberOf TableCreator
     */
    this.calculate = function(method, paramArray, data) {
        var args = [];
        var result;
        if (data.hasOwnProperty("tbody")) {
            var columns = data.thead.cols;
            var rows = data.tbody;
            for (var i = 0; i < paramArray.length; ++i) {
                var param = paramArray[i];
                
                // param is a number and can be calculated directly
                if (typeof param === 'number') {
                    args.push(param);
                    continue;
                }

                var minus = false;
                if(typeof param === 'string' && param.charAt(0) === '-') {
                    minus = true;
                    param = param.slice(1);
                }

                // find column definition
                var headObject = null;
                for (var c = 0; c < columns.length; ++c) {
                    if(columns[c].id === param) {
                        headObject = columns[c];
                        break;
                    }
                }

                // param is a method at column level (colHeader, colDefinition)
                if (headObject !== null && headObject.hasOwnProperty("method")) {
                    var columnResult = this.parseMethod(headObject.method, data);
                    args.push((minus) ? -columnResult : columnResult);
                    continue;
                }

                for (var j = 0; j < rows.length; ++j) {
                    var row = rows[j];
                    if (row.hasOwnProperty(param)) {

                        // param is a method defined at row level
                        if (headObject.type === "method") {
                            var rowResult = this.parseMethod(row[param], row);
                            args.push((minus)? -rowResult : rowResult);
                        }

                        // param is a number at row level
                        else if (headObject.type === "number") {
                            args.push((minus) ? -row[param] : row[param]);
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
        result = this.methods[method](args);
        return result;
    };

    /** 
     * Parse a method, pass it to calculation and return the answer.
     *
     * @example
     * // returns 15
     * TableCreator.parseMethod("sum(five,ten)", {five:5,ten:10});
     *
     * @param {string} methodString - a text representation of a calculation
     * @param {object} data - a structure where some keys can be found in methodString
     * @returns {Number} The final answer to the calculation
     * @memberOf TableCreator
     */
    this.parseMethod = function(methodString, data) {
        var parts = methodString.replace(/\s+/g, "");
        parts = parts.split(/([\,\(\)])/).clean();

        var argArrayStack = [[]];
        var operatorStack = [];

        for (var x = 0; x < parts.length; ++x) {
            var token = parts[x];
            // methods
            if (this.methods.hasOwnProperty(token)) {
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
                var call = operatorStack.pop();
                var args = argArrayStack.pop();
                var result = this.calculate(call, args, data);
                argArrayStack[argArrayStack.length-1].push(result);
            }
            // arguments
            else if (token !== ',') {
                argArrayStack[argArrayStack.length-1].push(token);
            }
        }

        var precision = 2;
        if (typeof this.settings.precision === 'number')
            precision = this.settings.precision;

        var value = parseFloat(argArrayStack.pop()).toFixed(precision);
        value = isNaN(value) ? "" : value;
        return value;
    };

    this.editFor = function(rowIdx) {
        var row = this.data.tbody[rowIdx];
        var cols = this.data.thead.cols;
        var settings = this.data.table;
        var html = '';

        for(var i = 0; i < cols.length; ++i) {
            var id = cols[i].id;
            var title = cols[i].title;
            var type = cols[i].type;
            var pool = null;

            if (cols[i].hasOwnProperty("method") || type === 'method' || type === 'actionArray') {
                continue;
            }

            html += '<div class="form-group row">';
            html += '<label for="tcEdit_' + id + '" class="control-label col-md-4">' + title + '</label>';

            if (type === 'number') {
                html += '<div class="col-md-push-3 col-md-5">';
            } else {
                html += '<div class="col-md-8">';
            }

            if(settings.pool.hasOwnProperty(id)) {
                if (settings.pool[id].constructor === Array) {
                    type = 'dropdown';
                    pool = settings.pool[id];
                }
            }

            switch (type) {
                case 'undefined':
                case 'default':
                case 'string':
                    html += '<input type="text" class="form-control" name="tcEdit_' + id + '" value="' + row[id] + '"/>';
                    break;
                case 'number':
                    var frac = Math.pow(10,settings.settings.decimals);
                    html += '<input type="number" class="form-control" step="' + (frac?(1/frac):1) + '" name="tcEdit_' + id + '" value="' + row[id] + '"/>';
                    break;
                case 'dropdown':
                    html += '<select class="form-control" name="tcEdit_' + id + '">';
                    for (var j = 0; j < pool.length; ++j) {
                        var selected = (row[id] === pool[j]) ? ' selected="selected"' : '';
                        html += '<option' + selected + '>' + pool[j] + '</option>';
                    }
                    html += '</select>';
                    break;
            }

            html += '</div></div>';
        }

        return html;
    };

    /**
     * @param package {Object} jQuery DOM element object
     * @param rowIdx {number} Position of the row in data.tbody that should be saved to.
     */
    this.saveEdit = function (bodyElement, rowIdx) {
        var dictionary = [];

        var validity = true;
        var formElements = bodyElement.find("input[name^='tcEdit_']");
        formElements.each(function() {
            var elem = $(this);
                console.log(this);
            // if($(this).checkValidity() == false) {
            if($(this).callProp('checkValidity') == false) {
                validity = false;
                elem.addClass("tc_warning");
            }
            else {
                console.log(this);
                elem.removeClass("tc_warning");
            }
        });
        if (validity === false) {
            return false;
        }

        var inputs = bodyElement.find("input[name^='tcEdit_']");

        var element, key, value, type;
        inputs.each(function(index, inputElement) {
            element = $(inputElement);
            key = element.attr('name').slice("tcEdit_".length);
            value = element.val();
            type = element.attr('type');
            dictionary.push({ "key": key, "value": value, "type": type });
            console.log({ "key": key, "value": value });
        });
        
        var selects = bodyElement.find("select[name^='tcEdit_']");
        selects.each(function(index, select) {
            element = $(select);
            key = element.attr('name').slice("tcEdit_".length);
            value = element.val();
            dictionary.push({ "key": key, "value": value });
            console.log({ "key": key, "value": value });
        });

        var oldValues = {};
        var row = this.data.tbody[rowIdx];

        var validationFail = false;
        for (var i = 0; i < dictionary.length; ++i) {
            key = dictionary[i].key;
            value = dictionary[i].value;
            type = dictionary[i].hasOwnProperty("type") ? dictionary[i].type : null;
            if(row.hasOwnProperty(key)) {
                if(type == 'number' && row[key] !== parseFloat(value)) {
                    oldValues[key] = row[key];
                    value = parseFloat(value);
                    if(isNaN(value)) {
                        var elem = bodyElement.find("[name^='tcEdit_" + key + "']");
                        elem.toggleClass("tc_warning");
                        validationFail = true;
                        continue;
                    }
                    row[key] = parseFloat(value);
                }
                else if (row[key] !== value ) {
                    oldValues[key] = row[key];
                    row[key] = value;
                }
            }
            else {
                oldValues[key] = null;
                row[key] = value;
            }
            console.log(key + ' changed it\'s value from ' + oldValues[key] + ' to ' + value);
        }

        if (validationFail) {
            return false;
            return this.spawnEditModal(rowIdx);
        }

        if(!$.isEmptyObject(oldValues)) {
            row["cache"] = oldValues;
        }
        console.log(row);
        console.log(this.data.tbody[rowIdx]);
        console.log("Yay! Will store in " + rowIdx);

        this.build().activate();

        // $.ajax()
        // adding spinner when (row.cache != null) (done)
        // TODO: request savechange to server
        // TODO:  - if valid, replace spinner with fading check-sign
        // TODO:  - if unvalid, display error and replace new values with old.
    }

    /**
     * addEditLinks - Bind click method for edit links
     * @return void
     */
    this.addEditLinks = function() {
        // var value = this.editFor(2);
        // var container = $("#EditModal");
        // var body = container.find(".modal-body");
        // body.html(value);
        // container.modal('toggle');



        var ctx = this;
        var editActionLink = $(this.el).find(".tcAction.edit");
        editActionLink.on("click", editAction);

        function editAction(data) {
            // var container = $("#EditModal");
            var index = data.target.getAttribute("data-tc_row");
            ctx.spawnEditModal(index);
            // var body = container.find(".modal-body");
            // body.html(ctx.editFor(index));

            // var savebutton = container.find("#EditSave");
            // savebutton.off("click").on("click", saveClickEvent);

            // function saveClickEvent() {
            //     ctx.saveEdit(body, index);
            // }

            // // var row = ctx.data.tbody[index];
            // // console.log(row);
            // container.modal('toggle');
            // // var template = $("#ModalTemplate").length;
            // // console.log(template);
            // // console.log(ctx);
            // // console.log(data.target.getAttribute("data-tc_row"));
            // // console.log(data);
        }
    };

    this.spawnEditModal = function(rowIdx) {
        var ctx = this;
        var container = $("#EditModal");
        var body = container.find(".modal-body");
        body.html(this.editFor(rowIdx));

        var savebutton = container.find("#EditSave");
        savebutton.off("click").on("click", saveClickEvent);

        function saveClickEvent() {
            return ctx.saveEdit(body, rowIdx);
        }

        container.modal('show');
    }

    return this;
}
