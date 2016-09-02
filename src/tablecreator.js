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
        isResizable: false,
        
        createUrl: null,
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
     * Sets an url we can call to create a new row
     * @memberOf TableCreator
     *
     * @param {string} createUrl Url to call by ajax
     * @return {object} context The current TableCreator
     */
    this.setCreateUrl = function(createUrl) {
        this.settings.createUrl = createUrl;
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
    this.setDeleteUrl = function(deleteUrl) {
        this.settings.deleteUrl = deleteUrl;
        return this;
    };


    /**
     * Init - Loads settings from the json structure
     * @memberOf TableCreator
     *
     * @return {object} context The current TableCreator
     */
    this.init = function() {
        if (this.data.hasOwnProperty("table")) {
            if (this.data.table.hasOwnProperty("schemaId"))
                this.settings.schemaId = this.data.table.schemaId;
            if (this.data.table.hasOwnProperty("instanceId"))
                this.settings.instanceId = this.data.table.instanceId;
            if (this.data.table.hasOwnProperty("settings"))
                if (this.data.table.settings.hasOwnProperty("isResizable"))
                    this.settings.isResizable = this.data.table.settings.isResizable;
        }

        return this;
    };

    this.init(); // run init()

    /**
     * Activate editing on the table.
     * OK Edit row in table
     * x  Delete row in table
     * @memberOf TableCreator
     *
     * @return {object} context The current TableCreator
     */
    this.activate = function() {
        if (this.settings.createUrl === null) {
            console.warn("Url to create row is not set.");
        }

        if (this.settings.saveUrl === null) {
            console.warn("Url to save changes is not set.");
        }
        if (this.settings.deleteUrl === null) {
            console.warn("Url to delete rows is not set.");
        }

        $(".tcActionRow").removeClass("hide");

        // bind click events to undo icons
        if ($('#EditModal').length === 0) {
        // if (this.settings.hasEditModal === false) {
            this.createModal('Edit', 'Endring', 'Lukk', 'Lagre');
            // this.createModal("tcEditModal", "Endring");
            // $(el).after(editModal);
            // this.settings.hasEditModal = true;
        }
        this.addEditLinks();

        if ($('#UndoModal').length === 0) {
            this.createModal('Undo', 'Angre', 'Lukk', 'Utfør');
        }
        this.addUndoLinks();
        // Add undo modal if not created and bind click events to undo icons
        // if (this.settings.hasUndoModal === false) {
        //     var undoModal = this.createModal("tcUndoModal", "Angre");
        //     $(el).after(undoModal);
        //     this.settings.hasUndoModal = true;
        // }
        // this.addUndoLinks();

        if ($('#DeleteModal').length === 0) {
            this.createModal('Delete', 'Sletting', 'Avbryt', 'Slett');
        }
        this.addDeleteLinks();

        if(this.settings.isResizable) {
            var ctx = this;
            var addRowLink = $('<a class="tcAction add" tabindex="0">Legg til ny rad</a>');
            $(this.el).append(addRowLink);

            addRowLink.on("click", function() {
                ctx.newAction();
            });
        }

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
                var hClass = hrColumn.hasOwnProperty("class") ? ' '+hrColumn.class : '';
                html += '<th class="tcTableHeaders' + hClass + '"' + colspan + '>' + title + '</th>';
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
            hClass += headerRow.type === "number" ? ' number' : '';
            hClass += headerRow.type === "string" ? ' tcLeftAlign' : '';
            hClass += !headerRow.hasOwnProperty("type") ? ' tcLeftAlign' : '';
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
                            html += '<td class="tcActionRow hide ' + cls + '">';

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
                                        case 'undo':
                                            if(dataLine.hasOwnProperty("undo") && dataLine.undo !== null) {
                                                html += '<a title="Angre" class="tcAction undo" data-tc_action="undo" data-tc_row="' + line + '" tabindex="0">angre</a>';
                                            }
                                            break;
                                        case 'edit':
                                            html += '<a title="Rediger" class="tcAction edit" data-tc_action="edit" data-tc_row="' + line + '" tabindex="0">rediger</a>';
                                            break;
                                        case 'delete':
                                            if (this.settings.isResizable)
                                                html += '<a title="Slett" class="tcAction delete" data-tc_action="delete" data-tc_row="' + line + '" tabindex="0">slett</a>';
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
        var actionButton = $('<button type="button" class="btn btn-primary" id="' + id + 'Save">' + submitLabel + '</button>');

        header.append($('<button type="button" class="close" data-dismiss="modal" aria-label="Lukk"><span aria-hidden="true">&times;</span></button><h4 class="modal-title">' + headline + '</h4>'));
        footer.append($('<button type="button" class="btn btn-default" data-dismiss="modal">' + dismissLabel + '</button>'));
        footer.append(actionButton);

        var modal = $('<div id="' + id + 'Modal" class="modal face" role="dialog">')
            .append($('<div class="modal-dialog">')
                .append($('<div class="modal-content">')
                    .append(header)
                    .append(body)
                    .append(footer)
                )
            );

        $("body").append(modal);

        modal.on("keyup", function(evt) {
            if(evt.which == 13 || evt.keyCode == 13) { // if Enter is released
                actionButton.click();
            }
            return true;
        });
        // $('body').append(modal);
    };

    this.displayErrorHelper = function(errors) {
        errors = !errors ? null :                            // if falsy: null
            errors.constructor === String ? [errors] :       // if string: array with string
            errors.constructor === Array ? errors : null;    // if array: itself, else: null

        if(!!errors) {
            var errorDiv = $('<div class="panel panel-danger">');
            errorDiv.append('<div class="panel-heading">Feil</div>');
            var errorBody = $('<div class="panel-body"></div>');
            errorDiv.append(errorBody);
            for(var i = 0; i < errors.length; ++i) {
                var item = $('<p>');
                item.html(errors[i]);
                errorBody.append(item);
            }
            return errorDiv;
        }
        return "";
    };


    /*********************************************************************************
     *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT 
     ********************************************************************************/

    /*********************************************************************************
     *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT 
     ********************************************************************************/

    /*********************************************************************************
     *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT 
     ********************************************************************************/

    /*********************************************************************************
     *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT 
     ********************************************************************************/

    /*********************************************************************************
     *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT *** SAVE *** EDIT 
     ********************************************************************************/

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
        var ctx = this;
        var container = $("#EditModal");
        var body = container.find(".modal-body");
        body.data("rowIdx", rowIdx);
        body.html(this.editFor(rowIdx));
        if (!!errors) {
            body.prepend(this.displayErrorHelper(errors));
        }

        var savebutton = container.find("#EditSave");
        savebutton.off("click").on("click", saveClickEvent);

        function saveClickEvent() {
            return ctx.saveEditAction(body, rowIdx);
        }

        container.modal('show');
        body.find(".form-control").first().focus().select();
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
    this.saveEditAction = function (bodyElement, rowIdx) {
        var ctx = this;
        var dictionary = [];

        // validate input elements
        var validity = true;
        var formElements = bodyElement.find("input[name^='tcEdit_']");
        formElements.each(function() {
            var elem = $(this);

            // use checkValidity by webshim
            if($(this).callProp('checkValidity') === false) {
                validity = false;
                elem.addClass("tc_warning");
            }
            else {
                elem.removeClass("tc_warning");
            }
        });
        if (validity === false) {
            return; // errors will be displayed in open modal
        }

        var element, key, value, type;
        var inputs = bodyElement.find("input[name^='tcEdit_']");
        inputs.each(function(index, inputElement) {
            element = $(inputElement);
            key = element.attr('name').slice("tcEdit_".length);
            value = element.val();
            type = element.attr('type');
            dictionary.push({ "key": key, "value": value, "type": type });
        });
        
        var selects = bodyElement.find("select[name^='tcEdit_']");
        selects.each(function(index, select) {
            element = $(select);
            key = element.attr('name').slice("tcEdit_".length);
            value = element.val();
            dictionary.push({ "key": key, "value": value });
        });

        var row = this.data.tbody[rowIdx];
        var oldValues = {};
        var newValues = {};
        var valid = true;
        for (var x = 0; x < dictionary.length; ++x) {
            key = dictionary[x].key;
            value = dictionary[x].value;
            type = dictionary[x].hasOwnProperty("type") ? dictionary[x].type : null;

            // Test for NaN values
            if (type == 'number') {
                value = parseFloat(value);
                if (row.hasOwnProperty(key)) row[key] = parseFloat(row[key]);

                if (isNaN(value)) {
                    var keyElem = bodyElement.find("[name^='tcEdit_" + key + "']");
                    keyElem.addClass("tc_warning");
                    valid = false;
                    continue;
                }
            }

            // Create objects with new and old values (do not track equal values)
            if (!row.hasOwnProperty(key)) {
                oldValues[key] = null;
                newValues[key] = value;
            }
            else if (row[key] !== value) {
                oldValues[key] = row[key];
                newValues[key] = value;
            }
        }

        // A number is NaN: respawn edit modal
        if(!valid) {
            this.spawnEditModal(rowIdx, ["Et innskrevet tall ble ikke godkjent. Prøv igjen."]);
            return;
        }

        // close silently if no changes is registered
        if($.isEmptyObject(oldValues)) {
            console.log("Ingen endringer");
            $('#EditModal').modal('hide');
            return;
        }

        // Display load symbol
        row.isSaving = true;
        this.build().activate();

        if(!row.hasOwnProperty("undo")) {
            row.undo = null;
        }

        // create undo element and newRow element
        var newUndo = { undo: row.undo };
        for (var y in oldValues) {
            if(oldValues.hasOwnProperty(y)) {
                newUndo[y] = oldValues[y];
            }
        }

        var newRow = {};
        for (var z in newValues) {
            if (newValues.hasOwnProperty(z)) {
                newRow[z] = newValues[z];
            }
        }

        // Construct data object and start AJAX call
        var ajaxData = {
            SchemaId: this.settings.schemaId,
            InstanceId: this.settings.instanceId,
            RowId: rowIdx,
            Data: JSON.stringify(newRow)
        };

        $.ajax({
            type: 'POST',
            url: this.settings.saveUrl,
            dataType: 'json',
            data: ajaxData,
            success: successOnSave,
            error: errorOnSave
        });

        function errorOnSave(jqXHR) {
            row.isSaving = false;
            ctx.build().activate();

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

            modal.modal('show');
        }

        function successOnSave(data) {
            row.isSaving = false;       // to remove loading symbol

            if(data.Success === false) {
                ctx.setModalError("#EditModal", data.Message, data.Errors);
                ctx.build().activate();
                return;
            }

            ///////////////////// SUCCESSFUL SAVE! /////////////////////
            for (var attr in newRow) {
                if (newRow.hasOwnProperty(attr)) {
                    ctx.data.tbody[rowIdx][attr] = newRow[attr];
                }
            }
            ctx.data.tbody[rowIdx].undo = newUndo;
            ctx.build().activate();        // Rebuild table
            $('#EditModal').modal('hide'); // close modal
        }
    };

    this.setModalError = function(modalId, errorMessage, errorArray) {
        var modal = $(modalId);
        var errorDiv = modal.find('.errorDiv');
        if (errorDiv.length === 0) {
            errorDiv = $('<div class="errorDiv alert alert-danger"></div>');
            modal.find('.modal-body').prepend(errorDiv);
        }

        if(!!errorMessage) {
            errorDiv.html('<p>' + errorMessage + '</p>');
        }

        if(!!errorArray && errorArray.constructor === Array) {
            for(var i = 0; i < errorArray.length; ++i)
                errorDiv.append($('<li>' + errorArray[i] + '</li>'));
        }
    };

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



    /*********************************************************************************
     *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO 
     ********************************************************************************/

    /*********************************************************************************
     *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO 
     ********************************************************************************/

    /*********************************************************************************
     *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO 
     ********************************************************************************/

    /*********************************************************************************
     *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO 
     ********************************************************************************/

    /*********************************************************************************
     *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO *** UNDO 
     ********************************************************************************/

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
        var ctx = this;
        var container = $("#UndoModal");
        var body = container.find('.modal-body');
        body.html('<p>Angre og gå eit steg tilbake?</p>');

        if(!!errors) {
            body.prepend(this.displayErrorHelper(errors));
        }

        var button = container.find("#UndoSave");
        button.off("click").on("click", clickEvent);

        function clickEvent() {
            ctx.undoEditAction(rowIdx);
        }

        container.modal('show');
        button.focus().select();
    };

    this.undoEditAction = function(rowIdx) {
        var row = this.data.tbody[rowIdx];
        if (!row.undo) return;
        row.isSaving = true;
        this.build().activate();
        var ctx = this;

        var requestObj = {};
        for (var prop in row) {
            if(row.hasOwnProperty(prop) && prop !== "undo") {
                requestObj[prop] = row[prop];
            }
        }

        for (var change in row.undo) {
            if (row.undo.hasOwnProperty(change) && change !== "undo") {
                requestObj[change] = row.undo[change];
            }
        }

        var ajaxData = {
            SchemaId: this.settings.schemaId,
            InstanceId: this.settings.instanceId,
            RowId: rowIdx,
            Data: JSON.stringify(requestObj)
        };

        $.ajax({
            type: 'POST',
            url: this.settings.saveUrl,
            dataType: 'json',
            data: ajaxData,
            success: successOnUndo,
            // error: successOnUndo
            error: errorOnUndo
        });

        function errorOnUndo(response) {
            row.isSaving = false;
            ctx.build().activate();
            var modal = $('#UndoModal');
            var errorDiv = $('#UndoModal .errorDiv');
            if (errorDiv.length === 0) {
                errorDiv = $('<div class="errorDiv alert alert-danger"></div>');
                modal.find('.modal-body').prepend(errorDiv);
            }

            switch(response.status) {
                case 404:
                    errorDiv.html('<p>Fikk ikke angret:</p><li>Finner ikke lagringsplass (feil 404).</li>');
                    break;
                default:
                    errorDiv.html('<p>Angring ikke mulig (feil ' + response.status + ').</p>');
                    break;
            }
        }

        function successOnUndo(data) {
            // TESTDATA {
            // data.Success = true;
            // data.Message = "data.Message";
            // data.Errors = ["Error 0", "Error 1", "Error 2"];
            // } TESTDATA

            // We got an answer from the server, but it did not approve input
            if(data.Success === false) {
                ctx.setModalError("#UndoModal", data.Message, data.Errors);

                ctx.removeLastUndo(rowIdx);
                row.isSaving = false;
                ctx.build().activate();
                return;
            }

            // Server answered Success === true, so set undo values as current values
            for (var attr in requestObj) {
                if(requestObj.hasOwnProperty(attr)) {
                    row[attr] = requestObj[attr];
                }
            }

            ctx.removeLastUndo(rowIdx);            

            // rebuild with new state
            row.isSaving = false;
            ctx.build().activate();

            $("#UndoModal").modal('hide');
        }
    };

    /********************************************************************************
     *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE ***
     *******************************************************************************/

    /********************************************************************************
     *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE ***
     *******************************************************************************/

    /********************************************************************************
     *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE ***
     *******************************************************************************/

    /********************************************************************************
     *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE ***
     *******************************************************************************/

    /********************************************************************************
     *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE *** CREATE ***
     *******************************************************************************/

    this.newAction = function() {
        var ctx = this;
        var container = $('#EditModal');
        var body = container.find('.modal-body');
        body.html(this.blankRowEditor());

        var savebutton = container.find('#EditSave');
        savebutton.off("click").on("click", createClickEvent);

        function createClickEvent() {
            ctx.constructRow(container);
        }

        container.modal('show');
    };

    this.constructRow = function (container) {
        console.log(container);
        var ctx = this;

        var validity = true;
        var newRow = {};
        var element, key, value;
        var formElements = container.find("[name^='tcEdit_']");
        formElements.each(function() {
            element = $(this);
            console.log("elem:");
            console.log(element);

            // use checkValidity by webshim
            if(element.callProp('checkValidity') === false) {
                validity = false;
                element.addClass("tc_warning");
            } else {
                element.removeClass("tc_warning");
                key = element.attr('name').slice("tcEdit_".length);
                value = element.val();
                newRow[key] = value;
            }

            // check validity on select elements
            if(element.is("select")) {
                var notAvailible = !ctx.data.table.pool.hasOwnProperty(key);
                var notInArray = (!notAvailible) ? (-1 === $.inArray(value, ctx.data.table.pool[key])) : false;
                if(notAvailible || notInArray) {
                    validity = false;
                    element.addClass("tc_warning");
                }
            }
        });

        if (validity === false) {
            console.log("validity failed");
            return;
        }

        if (this.settings.createUrl === null) {
            return;
        }

        var ajaxData = {
            SchemaId: this.settings.schemaId,
            InstanceId: this.settings.instanceId,
            Data: JSON.stringify(newRow)
        };

        var footer = container.find('.modal-footer');
        footer.prepend($('<i class="fa fa-save fa-lg" style="margin-right: 1em;"></i>'));
        footer.prepend($('<i class="fa fa-refresh fa-spin" style="margin-right: 1em;"></i>'));

        $.ajax({
            type: 'POST',
            url: this.settings.createUrl,
            dataType: 'json',
            data: ajaxData,
            success: successOnCreate,
            error: errorOnCreate,
            // success: errorOnCreate,
            // error: errorOnCreate
        });
        // TODO: SERVER-SIDE ajax!!!

        function errorOnCreate(jqXHR) {
            var modal = $('#EditModal');
            var errorDiv = modal.find('.errorDiv');
            if(errorDiv.length === 0) {
                errorDiv = $('<div class="errorDiv alert alert-danger"></div>');
                modal.find('.modal-body').prepend(errorDiv);
            }

            switch (jqXHR.status) {
                case 404:
                    errorDiv.html('<p><b>Ikke lagret:</b> Finner ikke lagringsplass (feil 404).</p>');
                    break;
                default:
                    errorDiv.html('<p><b>Ikke lagret:</b> Lagring ikke mulig (feil ' + jqXHR.status + ').</p>');
                    break;
            }

            footer.find("i.fa-spin").fadeOut(1000, function() { $(this).remove(); });
            footer.find("i.fa-save").fadeOut(1000, function() { $(this).remove(); });
        }

        function successOnCreate(data) {
            // data.Success = true;
            // data.Message = "Message";
            // data.Errors = ["Message1", "Message2", "Message3"];


            if (data.Success !== true) {
                var errors = (!!data.Errors && data.Errors.constructor === Array) ? data.Errors : null;
                ctx.setModalError('#EditModal', data.Message, errors);

                footer.find("i.fa-spin").fadeOut(500, function() { $(this).remove(); });
                footer.find("i.fa-save").fadeOut(1000, function() { $(this).remove(); });
                return;
            }

            ctx.data.tbody.push(newRow);
            ctx.build().activate();
            container.modal('hide');
            footer.find("i.fa").remove();
        }

        // this.data.tbody.push(newRow);
        // this.build().activate();
        // container.modal('hide');

    };

    this.blankRowEditor = function() {
        var cols = this.data.thead.cols;
        var settings = this.data.table;
        var html = '';

        for (var i = 0; i < cols.length; ++i) {
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

            if (settings.pool.hasOwnProperty(id)) {
                if (settings.pool[id].constructor === Array) {
                    type = 'dropdown';
                    pool = settings.pool[id];
                }
            }

            switch (type) {
                case 'undefined':
                case 'default':
                case 'string':
                    html += '<input type="text" class="form-control" name="tcEdit_' + id + '"/>';
                    break;
                case 'number':
                    var frac = Math.pow(10, settings.settings.decimals);
                    html += '<input type="number" class="form-control" step="' + (frac?(1/frac):1) + '" name="tcEdit_' + id + '" value="0"/>';
                    break;
                case 'dropdown':
                    html += '<select class="form-control" name="tcEdit_' + id + '">';
                    html += '<option selected disabled>Velg en...</option>';
                    for (var j = 0; j < pool.length; ++j) {
                        html += '<option>' + pool[j] + '</option>';
                    }
                    html += '</select>';
                    break;
            }

            html += '</div></div>';
        }

        return html;
    };

    /********************************************************************************
     *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE ***
     *******************************************************************************/

    /********************************************************************************
     *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE ***
     *******************************************************************************/

    /********************************************************************************
     *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE ***
     *******************************************************************************/

    /********************************************************************************
     *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE ***
     *******************************************************************************/

    /********************************************************************************
     *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE *** DELETE ***
     *******************************************************************************/

     this.addDeleteLinks = function() {
        var ctx = this;
        var deleteActionLink = $(this.el).find(".tcAction.delete");
        deleteActionLink.on("click", deleteAction);

        function deleteAction(data) {
            var index = data.target.getAttribute("data-tc_row");
            ctx.spawnDeleteModal(index);
        }
     };

     this.spawnDeleteModal = function(rowIdx, errors) {
        var ctx = this;
        var container = $('#DeleteModal');
        var body = container.find(".modal-body");
        // body.data("rowIdx", rowIdx);
        body.html("Slette denne raden?");
        if (!!errors) {
            body.prepend(this.displayErrorHelpers(errors));
        }

        var deletebutton = container.find("#DeleteSave");
        deletebutton.off("click").on("click", deleteClickEvent);

        function deleteClickEvent() {
            return ctx.saveDeleteAction(container, rowIdx);
        }

        container.modal('show');
        deletebutton.focus().select();
     };

     this.saveDeleteAction = function (bodyElement, rowIdx) {
        var ctx = this;
        var row = this.data.tbody[rowIdx];
        var deleteObj = {};
        for (var x in row) {
            if (row.hasOwnProperty(x)) {
                if (x === 'undo') continue;
                if (x === 'isSaving') continue;
                deleteObj[x] = row[x];
            }
        }

        var ajaxData = {
            SchemaId: this.settings.schemaId,
            InstanceId: this.settings.instanceId,
            RowId: rowIdx,
            Data: JSON.stringify(deleteObj)
        };

        $.ajax({
            type: 'POST',
            url: this.settings.deleteUrl,
            dataType: 'json',
            data: ajaxData,
            success: successOnDelete,
            error: errorOnDelete
        });

        function successOnDelete(data) {
            row.isSaving = false;
            if(data.Success === false) {
                ctx.setModalError("#DeleteModal", data.Message, data.Errors);
                ctx.build().activate();
                return;
            }

            ///////////////////// SUCCESSFUL DELETE! /////////////////////
            ctx.data.tbody.splice(rowIdx, 1);
            ctx.build().activate();
            bodyElement.modal('hide');
        }

        function errorOnDelete(jqXHR) {
            row.isSaving = false;
            ctx.build().activate();

            var errorMessage = "<p>Sletting ikke mulig (feil " + jqXHR.status + ").</p>";
            ctx.setModalError("#DeleteModal", errorMessage);
        }
     }

    return this;
}
