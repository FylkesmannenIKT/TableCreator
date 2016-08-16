/*global $, console, alert*/
/*exported TableCreator*/

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

    /*
     * Always return a new instance of the TableCreator.
     * If the new keyword has not been used, we use it so
     * that we get an instance of TableCreator.
     */
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
     * Enable keyboard by making table clickable, so that we can use the "Enter" button 
     * to activate elements we have navigated to (i.e. by tabing).
     */
    this.el.onkeyup = function(evt) {
        if (evt.which == 13 || evt.keyCode == 13) {
            evt.path[0].click();
        }
        console.log(evt);
        return true; // to bubble event further
    };



    /**
     * Object containing settings.
     * @memberOf TableCreator
     */
    this.settings = {
        schemaId: null,
        instanceId: null,

        precision: 2,
        
        saveUrl: null,
        deleteUrl: null
    };

    /** 
     * Building a html table from data the TableCreator has.
     * @memberOf TableCreator
     * @example
     * var table = new TableCreator(jsonStructure, document.querySelector("#container"))
     *     .build()
     *     .setSaveUrl("/save")
     *     .setDeleteUrl("/delete")
     *     .activate();
     *
     * @return {object} context The current TableCreator
     */
    this.build = function() {
        this.buildTable(this.data, this.el);
        return this;
    };

    /**
     * Sets a url we can call to save edited rows
     * @memberOf TableCreator
     * 
     * @param {string} saveUrl Url to call by ajax
     * @return {object} context The current TableCreator
     */
    this.setSaveUrl = function(saveUrl) {
        this.settings.saveUrl = saveUrl;
        return this;
    };

    /**
     * Sets a url we can call to delete rows
     * @memberOf TableCreator
     * 
     * @param {string} deleteUrl Url to call by ajax
     * @return {object} context The current TableCreator
     */
    // this.setDeleteUrl = function(deleteUrl) {
    //     this.settings.deleteUrl = deleteUrl;
    //     return this;
    // };


    /**
     * Creates modal if it does not exist.
     * @memberOf TableCreator
     *
     * @return {object} context The current TableCreator
     */
    // this.init = function() {
    //     if( $('#EditModal').length === 0 ) {
    //         this.createModal('Edit', 'Endring', 'Lukk', 'Lagre');
    //     }
    //     return this;
    // };

    /**
     * Activate editing on the table.
     * OK Edit row in table
     * x  Delete row in table
     * @memberOf TableCreator
     *
     * @return {object} context The current TableCreator
     */
    this.activate = function() {
        if (this.settings.saveUrl === null) {
            console.warn("Url to save changes is not set.");
        }
        if (this.settings.deleteUrl === null) {
            console.warn("Url to delete rows is not set.");
        }

        if (this.data.hasOwnProperty("table")) {
            if (this.data.table.hasOwnProperty("schemaId"))
                this.settings.schemaId = this.data.table.schemaId;
            if (this.data.table.hasOwnProperty("instanceId"))
                this.settings.instanceId = this.data.table.instanceId;
        }

        // bind click events to undo icons
        if ($('#EditModal').length === 0) {
        // if (this.settings.hasEditModal === false) {
            this.createModal('Edit', 'Endring', 'Lukk', 'Lagre');
            // this.createModal("tcEditModal", "Endring");
            // $(el).after(editModal);
            // this.settings.hasEditModal = true;
        }
        this.addEditLinks();

        // Add undo modal if not created and bind click events to undo icons
        // if (this.settings.hasUndoModal === false) {
        //     var undoModal = this.createModal("tcUndoModal", "Angre");
        //     $(el).after(undoModal);
        //     this.settings.hasUndoModal = true;
        // }
        // this.addUndoLinks();

        return this;
    };

    /** 
     * Building a html table from data and put it the given element.
     *
     * @param {object} data - The data structure with table structure and table data.
     * @param {object} el - The element where the finished table should be pasted to.
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

            if(dataLine.hasOwnProperty("retry")) {
                html += '<tr class="tcNotSaved">';
            } else {
                html += '<tr>';
            }

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
                            var isSaving = dataLine.hasOwnProperty("isSaving") ? dataLine.isSaving : false;
                            if(isSaving === true ) {
                            // var cache = dataLine.hasOwnProperty("cache") ? dataLine.cache : null;
                            // if(cache !== null) {
                                html += '<i class="fa fa-refresh fa-spin"></i>';
                            }

                            // add action icons for a column
                            var actions = column[x].hasOwnProperty("actions") ? column[x].actions : null;
                            if(actions !== null && actions.constructor === Array ) {
                                for(var a = 0; a < actions.length; ++a) {
                                    switch(actions[a]) {
                                        case 'retry': 
                                            if(dataLine.hasOwnProperty("retry") && dataLine.retry !== null) {
                                                html += '<a title="Prøv på nytt" class="tcAction retry" data-tc_action="retry" data-tc_row="' + line + '" tabindex="0">Prøv på nytt</a>';
                                            }
                                            break;
                                        case 'undo':
                                            if(dataLine.hasOwnProperty("undo") && dataLine.undo !== null) {
                                                html += '<a title="Angre" class="tcAction undo" data-tc_action="undo" data-tc_row="' + line + '" tabindex="0">angre</a>';
                                            }
                                            break;
                                        case 'edit':
                                            html += '<a title="Rediger" class="tcAction edit" data-tc_action="edit" data-tc_row="' + line + '" tabindex="0">rediger</a>';
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

    /**
     * addUndoLinks - Bind click method for edit links
     * @return void
     */
    this.addUndoLinks = function() {
        var ctx = this;
        var undoActionLink = $(this.el).find(".tcAction.undo");
        undoActionLink.on("click", undoAction);

        function undoAction(data) {
            var index = data.target.getAttribute("data-tc_row");
            ctx.spawnUndoModal(index);
        }
    };

    this.spawnUndoModal = function(rowIdx, errors) {
        if(errors === undefined) errors = null;
        var ctx = this;
        var container = $("#tcUndoModal"); /* TODO: Create!!! */
        var body = container.find('.modal-body');
        body.html('<p>Angre og gå eit steg tilbake?</p>');

        var button = container.find("#tcUndoModal_Save");
        button.off("click").on("click", clickEvent);

        function clickEvent() {
            ctx.undoAction(rowIdx);
        }

        container.modal('show');
    };

    this.undoAction = function() {
        alert("Angre!");
    };

    /**
     * Create a modal
     * The ID of the submit button will be the modalId postfixed with _Save
     * @param {string} modalId The DOM ID to reference the returned modal
     * @param {string} title The title to display in the modal
     * @return jQuery DOM element containing the modal
     */
    this.createModal = function (id, headline, dismissLabel, submitLabel) {
        var header = $('<div class="modal-header">');
        var body = $('<div class="modal-body">');
        var footer = $('<div class="modal-footer">');

        header.append($('<button type="button" class="close" data-dismiss="modal" aria-label="Lukk"><span aria-hidden="true">&times;</span></button><h4 class="modal-title">' + headline + '</h4>'));
        footer.append($('<button type="button" class="btn btn-default" data-dismiss="modal">' + dismissLabel + '</button><button type="button" class="btn btn-primary" id="' + id + 'Save">' + submitLabel + '</button>'));

        var modal = $('<div id="' + id + 'Modal" class="modal face" tabindex="1" role="dialog">')
            .append($('<div class="modal-dialog">')
                .append($('<div class="modal-content">')
                    .append(header)
                    .append(body)
                    .append(footer)
                )
            );

        $(this.el).after(modal);
        // $('body').append(modal);
    };

    // this.createModal = function(modalId, title) {
    //     var modal = $('<div id="' + modalId + '" class="modal face" tabindex="1" role="dialog"></div>');
    //     var dialog = $('<div class="modal-dialog"></div>');
    //     var content = $('<div class="modal-content"></div>');
    //     var header = $('<div class="modal-header"></div>');
    //     var body = $('<div class="modal-body"></div>');
    //     var footer = $('<div class="modal-footer"></div>');

    //     modal.append(dialog);
    //     dialog.append(content);
    //     content.append(header);
    //     content.append(body);
    //     content.append(footer);

    //     header.append('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
    //     header.append('<h4 class="modal-title">' + title + '</h4>');

    //     footer.append('<button type="button" class="btn btn-default" data-dismiss="modal">Lukk</button>');
    //     footer.append('<button type="submit" class="btn btn-primary" id="' + modalId + '_Save">Utfør</button>');

    //     return modal;
    // };

    /**
     * addEditLinks - Bind click method for edit links
     * @return void
     */
    this.addEditLinks = function() {
        var ctx = this;
        var editActionLink = $(this.el).find(".tcAction.edit");
        editActionLink.on("click", editAction);

        function editAction(data) {
            var index = data.target.getAttribute("data-tc_row");
            ctx.spawnEditModal(index); //, ["testerror","hey me"]);
        }
    };

    this.spawnEditModal = function(rowIdx, errors) {
        if (errors === undefined) errors = null;
        
        var ctx = this;
        var container = $("#EditModal");
        var body = container.find(".modal-body");
        body.data("rowIdx", rowIdx);
        body.html(this.editFor(rowIdx));

        if(errors !== null) {
            var errorDiv = $('<div class="panel panel-warning">');
            errorDiv.append('<div class="panel-heading">Feil</div>');
            var errorBody = $('<div class="panel-body"></div>');
            errorDiv.append(errorBody);
            for(var i = 0; i < errors.length; ++i) {
                var item = $('<li>');
                item.html(errors[i]);
                errorBody.append(item);
            }
            // console.log(errors);
            body.prepend(errorDiv);
        }

        var savebutton = container.find("#EditSave");
        savebutton.off("click").on("click", saveClickEvent);

        function saveClickEvent() {
            return ctx.saveEdit(body, rowIdx);
        }

        container.modal('show');
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
        var ctx = this;
        var dictionary = [];

        // validate input elements
        var validity = true;
        var formElements = bodyElement.find("input[name^='tcEdit_']");
        formElements.each(function() {
            var elem = $(this);
                console.log(this);

            // use checkValidity by webshim
            if($(this).callProp('checkValidity') === false) {
                validity = false;
                elem.addClass("tc_warning");
            }
            else {
                console.log(this);
                elem.removeClass("tc_warning");
            }
        });
        if (validity === false) {
            return false; /* modal will not close, thus showing tc_warning errors */
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
                if(type == 'number' && parseFloat(row[key]) !== parseFloat(value)) {
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
                else if (type != 'number' && row[key] !== value ) {
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
        }

        // add cache element
        if(!$.isEmptyObject(oldValues)) {
            // row.cache = oldValues;
            row.isSaving = true;
        }

        if(!row.hasOwnProperty("undo")) {
            row.undo = null;
        }

        // add undo element
        var oldUndo = row.undo;
        var newUndo = {};
        for (var prop in oldValues) {
            if(oldValues.hasOwnProperty(prop)) {
                newUndo[prop] = oldValues[prop];
            }
        }
        newUndo.undo = oldUndo;
        row.undo = newUndo;


        console.log(row);
        console.log(this.data.tbody[rowIdx]);
        console.log("Yay! Will store in " + rowIdx);

        // Activate again to add callbacks to any new undo buttons
        this.build().activate();

        // // close dialog if we have no saveUrl. Browser editing still works.
        // if(this.settings.saveUrl === null) {
        //     return;
        // }

        var ajaxData = {
            SchemaId: this.settings.schemaId,
            InstanceId: this.settings.instanceId,
            RowId: rowIdx,
            Data: JSON.stringify(row)
        };

        $.ajax({
            type: 'POST',
            url: this.settings.saveUrl,
            dataType: 'json',
            data: ajaxData,
            success: successOnSave,
            error: errorOnSave
        });

        function errorOnSave(jqXHR, textStatus, errorThrown) {
            ctx.rowUndo(rowIdx);

            var modal = $('#EditModal');
            var errorDiv = $('#EditModal .errorDiv');
            if (errorDiv.length === 0) {
                errorDiv = $('<div class="errorDiv alert alert-danger"></div>');
                modal.find('.modal-body').prepend(errorDiv);
            }

            switch(jqXHR.status) {
                case 404:
                    errorDiv.html('<p>Ikke lagret:</p><li>Finner ikke lagringsplass (feil 404).</li>');
                    break;
                default:
                    errorDiv.html('<p>Lagring ikke mulig (feil ' + jqXHR.status + ').</p>');
                    break;
            }

            console.log(row.undo);
            modal.modal('show');
        }

        function successOnSave(data, textStatus, jqXHR) {
            data.Success = true;
            data.Message = "Message";
            data.Errors = ["Message1", "Message2", "Message3"];

            row.isSaving = false;

            if(data.Success === false) {
                // ctx.removeCache(rowIdx);
                ctx.removeLastUndo(rowIdx);
                var errors = (!!data.Errors && data.Errors.constructor === Array) ? data.Errors : null;
                ctx.setEditModalError(data.Message, errors);

                ctx.build().activate();
                console.log(row.undo);
                return;
            }

            // else: successful: saving is done, there is an undo availible, no errors displayed, modal closed.
            ctx.build().activate();
            // close modal
            console.log(row.undo);
            $('#EditModal').modal('hide');
        }
        // adding spinner when (row.cache != null) (done)
        // TODO: request savechange to server
        // TODO:  - if valid, replace spinner with fading check-sign
        // TODO:  - if unvalid, display error and replace new values with old.
    };

    this.setEditModalError = function(errorMessage, errorArray) {
        var modal = $('#EditModal');
        var errorDiv = modal.find('.errorDiv');
        if (errorDiv.length === 0) {
            errorDiv = $('<div class="errorDiv alert alert-danger"></div>');
            modal.find('.modal-body').prepend(errorDiv);
        }

        errorDiv.html('<p>' + errorMessage + '</p>');

        if(!!errorArray && errorArray.constructor === Array) {
            for(var i = 0; i < errorArray.length; ++i)
                errorDiv.append($('<li>' + errorArray[i] + '</li>'));
        }
    };

    // this.removeCache = function(rowIdx) {
    //     var row = this.data.tbody[rowIdx];
    //     if(row.hasOwnProperty('cache')) {
    //         var oldValues = row.cache;
    //         for(var prop in oldValues) {
    //             if (!oldValues.hasOwnProperty(prop)) continue;

    //             row.prop = oldValues.prop;
    //         }
    //         row.cache = null;
    //     }
    // };

    this.removeLastUndo = function(rowIdx) {
        var row = this.data.tbody[rowIdx];
        if(row.hasOwnProperty('undo') && row.undo !== null) {
            var undoItem = row.undo;
            var remainingUndo = row.undo.undo;
            for (var property in undoItem) {
                if (undoItem.hasOwnProperty(property) && property !== "undo") {
                    row.property = undoItem.property;
                }
            }
            row.undo = remainingUndo;
        }
    };

    return this;
}
