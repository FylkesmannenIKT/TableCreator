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
     * @example
     *  {
     *      "table": {
     *          "id": "unique_name",
     *          "title": "headline",
     *          "schemaId": # to identify type of schema,
     *          "instanceId": # to identify instance of schema,
     *          "pool": {} to contain key->array where key is column ID and array contains dropdown string values,
     *          "settings": {
     *              "decimals": # of decimals in numbers,
     *              "isResizable": boolean (is it possible to add and remove rows?),
     *              "dataOrientation": string - "vertical" if vertical table, else a horizontal table is given
     *          },
     *          "template": {
     *              "addTpl": {} rowobject containing key->value where key is column ID and value is column value in that row,
     *              "setTpl": [] array containing multiple rowobjects
     *          }
     *      },
     *      "thead": {
     *          "rows": [
     *              [{th element where "title" is content, "colspan" is a # for html colspan}] array with multiple td elements
     *          ] arrays with multiple tr elements,
     *          "cols": [
     *              {} column specification object:
     *                  "id": "name_to_uniquely_ID_column",
     *                  "title": "text in th element",
     *                  "class": "css class to apply to heading",
     *                  "type": one of the following ["string", "number", "percent", "dropdown", "method"] default:string,
     *                  "method": "sum(col1,div(col2,100))" - string of calculations; available [sum, avg, mult, div]
     *                  "editable": boolean - column can only be edited if set to true, default:false,
     *              ,{} Action object [optional]: {
     *                  "id": "actions",
     *                   "class": "tcActionRow hide tc-hidden-print",
     *                  "type": "actionArray",
     *                  "actions": [] array with name of actions, can be multiple of ["undo", "edit", "delete"]
     *              }
     *          ] array with column specification objects
     *      },
     *      "tfoot": {
     *          "cols": [{}] objectarray similar to thead.cols (one object consecutively for each column)
     *          {
     *              "title": "text in th element",
     *              "class": "CSS class for th element",
     *              "method": similar to thead.cols.method, but calculates all values of a thead.cols.id
     *          }
     *      },
     *      "tbody": [{}] Array of data entities (one row if horizontal layout, else one column if vertical layout)
     *          [{ "columnId1": "columnvalue 1", "columnId2": 2 }, {...}]
     *  }
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
            var addRowLink = $('<a class="tcActionRow add" tabindex="0">Legg til ny rad</a>');
            var actionMenu = $(this.el).find(".tcActionMenu");
            actionMenu.append(addRowLink);

            addRowLink.on("click", function() {
                ctx.newAction();
            });
        }

        // Editable comment
        if ($('#CommentModal').length === 0) {
            this.createModal('Comment', 'Kommentar', 'Avbryt', 'Lagre');
        }
        this.addCommentLink();

        return this;
    };

    /** 
     * Building a html table from data and putting it into the given element.
     *
     * @param {object} data - The data structure with table structure and table data.
     * @param {object} el - The element where the finished table should be pasted to.
     * @return void
     * @memberOf TableCreator
     */
    this.buildTable = function (data, el) {
        var tableClass = "";
        var title = "";
        var isVertical = false; // default value
        if (data.hasOwnProperty("table")) {
            if (data.table.hasOwnProperty("title")) {
                if (typeof data.table.title === 'string')
                    title = data.table.title;
            }

            if (data.table.hasOwnProperty("settings")) {
                if (data.table.settings.hasOwnProperty("decimals")) {
                    if (typeof data.table.settings.decimals === 'number') {
                        this.settings.precision = data.table.settings.decimals;
                    }
                }

                isVertical = data.table.settings.hasOwnProperty("dataOrientation") && 
                    data.table.settings.dataOrientation == "vertical";

                tableClass += isVertical ? " vertical" : " horizontal";
            }

            tableClass += (data.table.hasOwnProperty("class")) ? data.table.class : "";
        }

        var html = "";
        if (title !== "") {
            html += '<p class="tc_heading">' + title + '</p>';
        }

        html += '<table class="tc_table ' + tableClass + '">';

        if (isVertical) {
            html += this.printVerticalTableContent(data);
        } else {
            html += this.printHorizontalTableContent(data);
        }

        html += '</table>';
        html += '<div class="tcActionMenu"></div>';
        html += '<div class="tcComment">' +
                    '<span class="comment"></span>' +
                '</div>';

        el.innerHTML = html;

        var tableDiv = el.getElementsByClassName("tc_table")[0];
        var fullWidth = tableDiv.parentNode.offsetWidth;
        var partWidth = tableDiv.offsetWidth;
        var commentDiv = el.getElementsByClassName("tcComment")[0];
        commentDiv.setAttribute("style","width:" + (partWidth / fullWidth * 100) + "%");

        if (data.hasOwnProperty("table")) 
            if (data.table.hasOwnProperty("comment"))
                if (typeof(data.table.comment) === 'string')
                    commentDiv.querySelector(".comment").innerHTML = data.table.comment;
    };


    /** 
     * Building a html string with the content for a table, such that the data are
     * displayed horizontally.
     *
     * @param {object} data - The data structure with table structure and table data.
     * @return string - html string starting with &lt;thead&gt;, ending with &lt;/tfoot&gt;
     * @memberOf TableCreator
     */
    this.printHorizontalTableContent = function(data) {
        var html = "<thead>";
        /**
         * Iterate over rows in data.thead to create headings in the table
         */
        for (var headrow = 0; headrow < data.thead.rows.length; ++headrow) {
            var rowList = data.thead.rows[headrow];
            html += '<tr>';
            for (var hrCol = 0; hrCol < rowList.length; ++hrCol) {
                var hrColumn = rowList[hrCol];
                var colspan = hrColumn.hasOwnProperty("colspan") ? ' colspan="' + hrColumn.colspan + '"' : '';
                var ctitle = hrColumn.hasOwnProperty("title") ? hrColumn.title : '';
                var hClass = hrColumn.hasOwnProperty("class") ? ' '+hrColumn.class : '';
                html += '<th class="tcTableHeaders' + hClass + '"' + colspan + '>' + ctitle + '</th>';
            }
            html += '</tr>';
        }

        /**
         * Iterate over cols in data.thead to create column headings in thead of table
         */
        html += '<tr>';
        for (var col = 0; col < data.thead.cols.length; ++col) {
            var headerRow = data.thead.cols[col];
            var headerTitle = headerRow.hasOwnProperty("title") ? headerRow.title : '';
            var cClass = headerRow.hasOwnProperty("class") ? headerRow.class : '';
            cClass += headerRow.type === "number" ? ' number' : '';
            cClass += headerRow.type === "string" ? ' tcLeftAlign' : '';
            cClass += headerRow.type === "multichoice" ? ' tcLeftAlign' : '';
            cClass += !headerRow.hasOwnProperty("type") ? ' tcLeftAlign' : '';
            html += '<th class="' + cClass + '">' + headerTitle + '</th>';
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
                    answer = (type == 'number') ? this.formatData(answer, 'number') : 
                             (type == 'percent') ? this.formatData(answer, 'percent') : answer;
                    html += '<td class="' + type + ' ' + cls + '">' + answer + '</td>';

                }
                else
                {
                    html += this.printCell(column[x].type, cls, value, column[x], dataLine, line);
                }
            }
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

        return html;        
    };

    /** 
     * Building a html string with the content for a table, such that the data are
     * displayed vertically.
     *
     * @param {object} data - The data structure with table structure and table data.
     * @return string - html string starting with &lt;tbody&gt;, ending with &lt;/tbody&gt;
     * @memberOf TableCreator
     */
    this.printVerticalTableContent = function(data) {
        var html = "";
        var hSpans = data.thead.rows || [];
        var hSpanCounter = [];  // array to keep track of index to current hSpan
        var hSpanRest = [];     // array to keep track of remaining rows for current hSpan ([3,2,1] for colspan="3")

        for (var column = 0; column < data.thead.cols.length; ++column) {
            html += '<tr>';

            /////////////////////////////////////////////////////////////////////////////////////////////////
            // print <th> for rowspan before row-definition

            var rTitle, hClass, item, itemData, id, type, value, hasMethod;
            var hSpanIdx, hSpanLeft, rowspan;

            for (var hCol = 0; hCol < hSpans.length; ++hCol) {
                hSpanIdx = hSpanCounter[hCol] || 0;
                hSpanLeft = hSpanRest[hCol] || 0;
                item = hSpans[hCol][hSpanIdx];

                if (hSpanLeft > 0) {
                    --hSpanRest[hCol];
                    continue;
                }

                rowspan = item.hasOwnProperty("colspan") ? ' rowspan="' + item.colspan + '"' : '';
                rTitle = item.hasOwnProperty("title") ? item.title : '';
                hClass = item.hasOwnProperty("class") ? ' ' + item.class : '';
                html += '<th class="tcTableHeaders' + hClass + '"' + rowspan + '>' + rTitle + '</th>';

                hSpanCounter[hCol] = hSpanCounter[hCol] + 1 || 1;   // increment 1 or init to 1
                hSpanRest[hCol] = (item.colspan - 1) || 0;
            }


            /////////////////////////////////////////////////////////////////////////////////////////////////
            // print <th> for row name
            item = data.thead.cols[column];
            rTitle = item.hasOwnProperty("title") ? item.title : '';
            hClass = item.hasOwnProperty("class") ? ' ' + item.class : '';
            type = item.hasOwnProperty("type") ? item.type : "string";
            // hClass += (type === "number") ? ' number' : ' tcLeftAlign';
            html += '<th class="' + hClass + ' tcLeftAlign">' + rTitle + '</th>';

            id = item.id;
            hasMethod = item.hasOwnProperty("method");

            /////////////////////////////////////////////////////////////////////////////////////////////////
            // print <td> for n'th item where n=tbody[x] and value like tbody[x][item]
            var method, answer;

            for (var dataItr = 0; dataItr < data.tbody.length; ++dataItr) {
                itemData = data.tbody[dataItr];
                value = itemData.hasOwnProperty(id) ? itemData[id] : '';
                if (hasMethod) {
                    method = item.method;
                    answer = this.parseMethod(method, itemData);
                    answer = (type == 'number') ? this.formatData(answer, 'number') :
                             (type == 'percent') ? this.formatData(answer, 'percent') : answer;
                    html += '<td class="' + type + ' ' + hClass + '">' + answer + '</td>';
                }
                else {
                    html += this.printCell(type, hClass, value, item, itemData, dataItr);
                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////
            // print <td> for tfoot values
            if (data.hasOwnProperty("tfoot") &&
                data.tfoot.hasOwnProperty("cols") &&
                Array.isArray(data.tfoot.cols) &&
                data.tfoot.cols.length > 0) {

                if (column < data.tfoot.cols.length) {
                    var footObject = data.tfoot.cols[column];
                    var foClass = (footObject.hasOwnProperty("class")) ? ' ' + footObject.class : '';

                    var fClass = hClass + foClass;
                    if (footObject.hasOwnProperty("title"))
                        html += '<td class="' + fClass + ' string">' + footObject.title + '</td>';
                    else if (footObject.hasOwnProperty("method")) {
                        value = this.parseMethod(footObject.method, data);
                        html += '<td class="' + fClass + ' number">' + this.formatData(value, 'number') + '</td>';
                    }
                    else {
                        html += '<td class="' + fClass + '"></td>';
                    }
                }
                else {
                    html += '<td class="' + hClass + '"></td>';
                }

            }

            html += '</tr>';
        } // end for each thead.col

        return html;
    };

    /** 
     * Building a <td> html string with the content for a cell. Different types of data is parsed properly.
     *
     * @param {string} cType - the type of data: one of ['method', 'number', 'percent', 'string', undefined, 'index', 'actionArray']
     * @param {string} cClass - classes that will be written in the class="" attribute
     * @param {var} cValue - Value for the cell
     * @param {object} item - column object defining stuff for the cell
     * @param {object} itemData - data object containing stuff for the cell
     * @param {number} refIdx - data object index in data.tbody[]
     * @return string - html string starting with &lt;td&gt;, ending with &lt;/td&gt;
     * @memberOf TableCreator
     */
    this.printCell = function (cType, cClass, cValue, item, itemData, refIdx) {
        var html = "";
        switch(cType) {
            case 'method':
                cValue = this.parseMethod(cValue, itemData);
                html += '<td class="' + cType + ' ' + cClass + '">' + this.formatData(cValue, 'number') + '</td>';
                break;
            case 'number':
                html += '<td class="' + cType + ' ' + cClass + '">' + this.formatData(cValue, 'number') + '</td>';
                break;
            case 'percent':
                html += '<td class="' + cType + ' ' + cClass + '">' + this.formatData(cValue, 'percent') + '</td>';
                break;
            default:
            case 'string':
            case undefined:
                html += '<td class="tcLeftAlign ' + cType + ' ' + cClass + '">' + cValue + '</td>';
                break;
            case 'index':
                html += '<td>' + (refIdx+1) + '</td>';
                break;
            case 'multichoice':
                if (cValue.constructor === Array) {
                    cValue = cValue.join(', ');
                }
                html += '<td class="tcLeftAlign ' + cType + ' ' + cClass + '">' + cValue + '</td>';
                break;
            case 'actionArray':
                html += '<td class="tcActionRow hide ' + cClass + '">';

                // Add spinner if column is cached while saving to server
                var isSaving = itemData.hasOwnProperty("isSaving") ? itemData.isSaving : false;
                if(isSaving === true ) {
                    html += '<i class="fa fa-refresh fa-spin"></i>';
                }

                // add action icons for a column
                var actions = item.hasOwnProperty("actions") ? item.actions : null;
                if(actions !== null && actions.constructor === Array ) {
                    for(var a = 0; a < actions.length; ++a) {
                        switch(actions[a]) {
                            case 'undo':
                                if(itemData.hasOwnProperty("undo") && itemData.undo !== null) {
                                    html += '<a title="Angre" class="tcAction undo" data-tc_action="undo" data-tc_row="' + refIdx + '" tabindex="0">angre</a>';
                                }
                                break;
                            case 'edit':
                                html += '<a title="Rediger" class="tcAction edit" data-tc_action="edit" data-tc_row="' + refIdx + '" tabindex="0">rediger</a>';
                                break;
                            case 'delete':
                                if (this.settings.isResizable)
                                    html += '<a title="Slett" class="tcAction delete" data-tc_action="delete" data-tc_row="' + refIdx + '" tabindex="0">slett</a>';
                                break;
                        }
                    }
                }

                html += '</td>';
                break;
        }
        return html;
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

        var precision = 2;
        if (typeof this.settings.precision === 'number')
            precision = this.settings.precision;

        switch(type) {
            case 'number':
                val = parseFloat(val).toFixed(precision);
                val = isNaN(val) ? "" : val;

                var parts = val.toString().split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                val = parts.join('.');
                var nMinus = '<span class="minus">' + val.replace('-', '- ') + '</span>';
                val = (val.charAt(0) == '-') ? nMinus : val;
                break;
            case 'percent':
                val = parseFloat(val).toFixed(precision);
                val = isNaN(val) ? "0 %" : val + " %";
                var pMinus = '<span class="minus">' + val.replace('-', '- ') + '</span>';
                val = (val.charAt(0) == '-') ? pMinus : val;
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
            // += 0 if empty, undefined or whitespace
            total += (!args[arg] || /^\s*$/.test(args[arg])) ? 0 : parseFloat(args[arg]);
        }
        return total;
      },
      "avg" : function(args) {
        var total = 0;
        for (var arg = 0; arg < args.length; ++arg) {
            // += 0 if empty, undefined or whitespace
            total += (!args[arg] || /^\s*$/.test(args[arg])) ? 0 : parseFloat(args[arg]);
        }
        return (total / args.length);
      },
      "div" : function(args) {
        if (args.length === 0) return NaN;
        if (args.length === 1) return args[0];
        var dividend = parseFloat(args[0]);
        for (var divisor = 1; divisor < args.length; ++divisor) {
            // /= 1 if empty, undefined or whitespace
            dividend /= (!args[divisor] || /^\s*$/.test(args[divisor])) ? 1 : args[divisor];
        }
        return dividend;
      },
      "mult" : function(args) {
        if (args.length < 1) return NaN;
        var total = args[0];
        for (var arg = 1; arg < args.length; ++arg) {
            // *= 1 if empty, undefined or whitespace
            total *= (!args[arg] || /^\s*$/.test(args[arg])) ? 1 : args[arg];
        }
        return total;
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
        } else {    // we deal with a row-object from tbody
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
                else {  // can we find attribute in column definitions?
                    var sliced = item.slice(1);
                    var cols = this.data.thead.cols;
                    for (var l = 0; l < cols.length; ++l) {
                        if (cols[l].id === item || cols[l].id === sliced) {
                            if (cols[l].hasOwnProperty("method")) {
                                var colResult = this.parseMethod(cols[l].method, data);
                                colResult = (cols[l].id === sliced) ? -colResult : colResult;
                                args.push(colResult);
                            }
                            else {
                                // item found in column definition, but is not found
                                // as property in row (data).
                                // unaccounted state: cols[l].type === "method"
                                args.push(0);
                            }
                        }
                    }
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
            var hasMethod = cols[i].hasOwnProperty("method") ? true : false;
            var editable = cols[i].hasOwnProperty("editable") ? cols[i].editable : false;

            if (hasMethod || type === 'method' || type === 'actionArray' || !editable) {
                continue;
            }

            html += '<div class="form-group row">';

            if (type === 'number' || type === 'percent') {
                html += '<label for="tcEdit_' + id + '" class="control-label col-md-7">' + title + '</label>';
                html += '<div class="col-md-5">';
            } else {
                html += '<label for="tcEdit_' + id + '" class="control-label col-md-4">' + title + '</label>';
                html += '<div class="col-md-8">';
            }

            if (settings.hasOwnProperty("pool")) {
                if(settings.pool.hasOwnProperty(id)) {
                    if (settings.pool[id].constructor === Array) {
                        if (type !== 'multichoice') {
                            type = 'dropdown';
                        }
                        pool = settings.pool[id];
                    }
                }
            }

            row[id] = row[id] || ""; // make empty string value if it doesn't exist.

            switch (type) {
                default:
                case 'undefined':
                case 'string':
                    html += '<input type="text" class="form-control" name="tcEdit_' + id + '" value="' + (row[id] || "") + '"/>';
                    break;
                case 'number':
                    var frac = Math.pow(10,settings.settings.decimals);
                    html += '<input type="number" class="form-control" step="' + (frac?(1/frac):1) + '" name="tcEdit_' + id + '" value="' + row[id] + '"/>';
                    break;
                case 'percent':
                    html += '<input type="number" class="form-control" step="0.1" name="tcEdit_' + id + '" value="' + row[id] + '"/>';
                    break;
                case 'dropdown':
                    html += '<select class="form-control" name="tcEdit_' + id + '">';
                    for (var j = 0; j < pool.length; ++j) {
                        var selected = (this.decodeHtmlEntities(row[id]) === pool[j]) ? ' selected="selected"' : '';
                        html += '<option' + selected + '>' + pool[j] + '</option>';
                    }
                    html += '</select>';
                    break;
                case 'multichoice':
                    var isActive, active, checked;
                    for (var k = 0; k < pool.length; ++k) {
                        isActive = false;
                        if (row[id].constructor === Array) {
                            for (var l = 0; l < row[id].length && !isActive; ++l) {
                                if(this.decodeHtmlEntities(row[id][l]) === pool[k])
                                    isActive = true;
                            }
                        }
                        else if (typeof row[id] === 'string' && row[id] === this.decodeHtmlEntities(pool[k])) {
                            isActive = true;
                        }
                        active = (isActive ? 'active' : '');
                        checked = (isActive ? ' checked' : '');
                        html += '<div class="checkbox"><label class="' + active + '">'+
                                    '<input type="checkbox"' + checked + ' name="tcEdit_' + id + '_' + k + '">' + pool[k] + '</label></div>';
                    }
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

        var element, key, value, type, hasCheckBox = false;
        var inputs = bodyElement.find("input[name^='tcEdit_']");
        inputs.each(function(index, inputElement) {
            element = $(inputElement);
            key = element.attr('name').slice("tcEdit_".length);
            if (element.val().length === 0) return;
            type = element.attr('type');
            value = element.val();
            if (type === 'checkbox') {
                value = element.prop('checked');
                hasCheckBox = true;
            }

            dictionary.push({ "key": key, "value": value, "type": type });
        });
        
        var selects = bodyElement.find("select[name^='tcEdit_']");
        selects.each(function(index, select) {
            element = $(select);
            key = element.attr('name').slice("tcEdit_".length);
            value = element.val();
            dictionary.push({ "key": key, "value": value });
        });

        var pool = null;
        if(hasCheckBox) {

            pool = !!this.data ? 
                    !!this.data.table ? 
                     !!this.data.table.pool ?  this.data.table.pool : null : null : null;
        }

        var row = this.data.tbody[rowIdx];
        var oldValues = {};
        var newValues = {};
        var valid = true;
        var checkboxId;
        for (var x = 0; x < dictionary.length; ++x) {
            key = dictionary[x].key;
            value = dictionary[x].value;
            type = dictionary[x].hasOwnProperty("type") ? dictionary[x].type : null;

            // Test for NaN values
            if (type == 'number') {
                if(typeof value === "string") {
                    value = value.replace(/\s/g, ''); // remove spaces (1 000 000) for parseFloat in IE where spaces are accepted in number input
                    value = value.replace(/,/g, '.'); // replace all commas with dots, such that they are recognised as decimal separators
                }
                value = parseFloat(value);
                if (row.hasOwnProperty(key)) row[key] = parseFloat(row[key]);

                if (isNaN(value)) {
                    var keyElem = bodyElement.find("[name^='tcEdit_" + key + "']");
                    keyElem.addClass("tc_warning");
                    valid = false;
                    continue;
                }
                value = value.toString();
            }

            if (type == 'checkbox') {
                checkboxId = key.substring(key.lastIndexOf('_')+1, key.length);
                key = key.substring(0, key.lastIndexOf('_'));

                if (!newValues.hasOwnProperty(key) || newValues[key].constructor !== Array) {
                    oldValues[key] = row[key] || null;
                    newValues[key] = [];
                }

                if (value === true) {
                    value = this.data.table.pool[key][checkboxId];
                    newValues[key].push(value);
                }
                continue;
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
                if (oldValues[y].constructor === Array) {
                    newUndo[y] = newUndo[y] || [];
                    for (var n = 0; n < oldValues[y].length; ++n) {
                        newUndo[y][n] = this.decodeHtmlEntities(oldValues[y][n]);
                    }
                }
                else {
                    newUndo[y] = this.decodeHtmlEntities(oldValues[y]);
                }
            }
        }

        var newRow = {};
        for (var z in newValues) {
            if (newValues.hasOwnProperty(z)) {
                if (newValues[z].constructor === Array) {
                    newRow[z] = newRow[z] || [];
                    for (var o = 0; o < newValues[z].length; ++o) {
                        newRow[z][o] = this.decodeHtmlEntities(newValues[z][o]);
                    }
                } else {
                    newRow[z] = this.decodeHtmlEntities(newValues[z]);
                }
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
        var newRow = this.data.table.template.addTpl || {};
        var pool = this.data.table.pool || {};
        var element, key, value, keyIdx;
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

                if (element.is("input:checkbox")) {
                    if (element.is(":checked")) {
                        keyIdx = key.substring(key.lastIndexOf('_')+1, key.length);
                        key =key.substring(0, key.lastIndexOf('_'));
                        value = pool[key][keyIdx] || "";
                        if (!newRow.hasOwnProperty(key) || newRow[key].constructor !== Array) {
                            newRow[key] = [];
                        }
                        newRow[key].push(value);
                    }
                } else {
                    newRow[key] = value;
                }
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
        var settings = this.data.table || {};
        var html = '';
        var template = null;
        if (settings.hasOwnProperty("template"))
            if (settings.template.hasOwnProperty("addTpl"))
                template = settings.template.addTpl;

        for (var i = 0; i < cols.length; ++i) {
            var id = cols[i].id;
            var title = cols[i].title;
            var type = cols[i].type;
            var pool = null;
            var hasMethod = cols[i].hasOwnProperty("method") ? true : false;
            var editable = cols[i].hasOwnProperty("editable") ? cols[i].editable : false;
            var value = (template !== null && template.hasOwnProperty(id)) ? template[id] : null;

            if (hasMethod || type === 'method' || type === 'actionArray' || !editable) {
                continue;
            }

            html += '<div class="form-group row">';
            html += '<label for="tcEdit_' + id + '" class="control-label col-md-4">' + title + '</label>';

            if (type === 'number') {
                html += '<div class="col-md-push-3 col-md-5">';
            } else {
                html += '<div class="col-md-8">';
            }

            if (settings.hasOwnProperty("pool")) {
                if (settings.pool.hasOwnProperty(id)) {
                    if (settings.pool[id].constructor === Array) {
                        if (type !== 'multichoice') {
                            type = 'dropdown';
                        }
                        pool = settings.pool[id];
                    }
                }
            }

            switch (type) {
                default:
                case 'undefined':
                case 'string':
                    html += '<input type="text" class="form-control" name="tcEdit_' + id + '" ' + 
                        (value === null ? '' : 'value="' + value + '"' ) + '/>';
                    break;
                case 'number':
                    var frac = Math.pow(10, settings.settings.decimals);
                    html += '<input type="number" class="form-control" ' + 
                        'step="' + (frac?(1/frac):1) + '" name="tcEdit_' + id + '" ' + 
                        (value === null ? 'value="0"' : 'value="' + value + '"') + '/>';
                    break;
                case 'percent':
                    html += '<input type="number" class="form-control" ' + 
                        'step="0.1" name="tcEdit_' + id + '"' + 
                        (value === null ? 'value="0"' : 'value="' + value + '"') + '/>';
                    break;
                case 'dropdown':
                    html += '<select class="form-control" name="tcEdit_' + id + '">';
                    var selected = (value !== null) ? ' selected' : '';
                    html += '<option' + selected + ' disabled>Velg en...</option>';
                    for (var j = 0; j < pool.length; ++j) {
                        selected = (value === pool[j]) ? ' selected' : '';
                        html += '<option' + selected + '>' + pool[j] + '</option>';
                    }
                    html += '</select>';
                    break;
                case 'multichoice':
                    for (var k = 0; k < pool.length; ++k) {
                        html += '<div class="checkbox"><label><input type="checkbox" name="tcEdit_' + id + '_' + k + '">' +
                            pool[k] + '</label></div>';
                    }
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
    };

    /********************************************************************************
     *** COMMENT *** COMMENT *** COMMENT *** COMMENT *** COMMENT *** COMMENT ***
     *******************************************************************************/

    /********************************************************************************
     *** COMMENT *** COMMENT *** COMMENT *** COMMENT *** COMMENT *** COMMENT ***
     *******************************************************************************/

    /********************************************************************************
     *** COMMENT *** COMMENT *** COMMENT *** COMMENT *** COMMENT *** COMMENT ***
     *******************************************************************************/


    this.addCommentLink = function(){
        var ctx = this;
        var comment = el.getElementsByClassName("tcComment")[0];
        if (comment === undefined) return;

        var actionMenu = el.getElementsByClassName("tcActionMenu")[0];
        var editButton = $(actionMenu).find(".commentEdit");
        if (editButton.length === 0) {
            editButton = $('<a class="tcActionRow commentEdit" tabindex="0">Rediger kommentar</a>');
            $(actionMenu).append(editButton);
        }

        // var editButton = $(comment).find(".commentEdit");
        // if (editButton.length === 0) {
        //     editButton = $('<span class="commentEdit"></span>');
        //     $(comment).append(editButton);
        // }

        editButton.on("click", editComment);

        function editComment() {
            ctx.spawnCommentModal();
        }
    };

    this.spawnCommentModal = function() {
        var ctx = this;
        var container = $('#CommentModal');
        var body = container.find(".modal-body");

        var commentArea = $('<textarea onkeyup="TableCreator.updateCommentEditor(this); return false;"></textarea>');

        var comment = "";
        if(this.data.hasOwnProperty("table"))
            if (this.data.table.hasOwnProperty("comment"))
                comment = this.data.table.comment;

        commentArea.val(this.decodeHtmlEntities(comment));

        body.html(commentArea);
        body.append($('<div class="charactersLeft"><span>check</span></div>'));

        this.constructor.updateCommentEditor(commentArea.get(0));

        var commentButton = container.find("#CommentSave");
        commentButton.off("click").on("click", commentClickEvent);

        function commentClickEvent(){
            return ctx.saveCommentAction(container);
        }

        container.modal('show');
        commentArea.height(commentArea.prop('scrollHeight') + 2);
        commentArea.focus().select();
    };

    this.saveCommentAction = function(bodyElement) {
        var ctx = this;
        var textarea = bodyElement.find("textarea");
        var comment = textarea.val();

        if (comment.length > 900) {
            return;
        }

        var ajaxData = {
            SchemaId: this.settings.schemaId,
            InstanceId: this.settings.instanceId,
            RowId: -1,
            Data: JSON.stringify({ "tcTableComment": comment })
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
            var modal = $('#CommentModal');
            var errorDiv = $('#CommentModal .errorDiv');
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
            if(data.Success === false) {
                ctx.setModalError("#CommentModal", data.Message, data.Errors);
                return;
            }

            ctx.data.table.comment = data.SavedComment;
            ctx.build().activate();
            $('#CommentModal').modal('hide');
        }


    };

    this.decodeHtmlEntities = function(s) { //https://github.com/jprichardson/string.js/blob/master/dist/string.js
        var ctx = this;
        s = s || "";
        s = s.toString();
        // Licensed under MIT.
        // Copyright (C) 2012-2014 JP Richardson jprichardson@gmail.com
        s = s.replace(/&#(\d+);?/g, function (_, code) {
            return String.fromCharCode(code);
        })
        .replace(/&#[xX]([A-Fa-f0-9]+);?/g, function (_, hex) {
            return String.fromCharCode(parseInt(hex, 16));
        })
        .replace(/&([^;\W]+;?)/g, function (m, e) {
            var ee = e.replace(/;$/, '');
            var target = ctx.ENTITIES[e] || (e.match(/;$/) && ctx.ENTITIES[ee]);

            if (typeof target === 'number') {
                return String.fromCharCode(target);
            }
            else if (typeof target === 'string') {
                return target;
            }
            else {
                return m;
            }
        });
        return s;
    };

    this.ENTITIES = {
        // Licensed under MIT.
        // Copyright (C) 2012-2014 JP Richardson jprichardson@gmail.com
        "amp" : "&",
        "gt" : ">",
        "lt" : "<",
        "quot" : "\"",
        "apos" : "'",
        "AElig" : 198,
        "Aacute" : 193,
        "Acirc" : 194,
        "Agrave" : 192,
        "Aring" : 197,
        "Atilde" : 195,
        "Auml" : 196,
        "Ccedil" : 199,
        "ETH" : 208,
        "Eacute" : 201,
        "Ecirc" : 202,
        "Egrave" : 200,
        "Euml" : 203,
        "Iacute" : 205,
        "Icirc" : 206,
        "Igrave" : 204,
        "Iuml" : 207,
        "Ntilde" : 209,
        "Oacute" : 211,
        "Ocirc" : 212,
        "Ograve" : 210,
        "Oslash" : 216,
        "Otilde" : 213,
        "Ouml" : 214,
        "THORN" : 222,
        "Uacute" : 218,
        "Ucirc" : 219,
        "Ugrave" : 217,
        "Uuml" : 220,
        "Yacute" : 221,
        "aacute" : 225,
        "acirc" : 226,
        "aelig" : 230,
        "agrave" : 224,
        "aring" : 229,
        "atilde" : 227,
        "auml" : 228,
        "ccedil" : 231,
        "eacute" : 233,
        "ecirc" : 234,
        "egrave" : 232,
        "eth" : 240,
        "euml" : 235,
        "iacute" : 237,
        "icirc" : 238,
        "igrave" : 236,
        "iuml" : 239,
        "ntilde" : 241,
        "oacute" : 243,
        "ocirc" : 244,
        "ograve" : 242,
        "oslash" : 248,
        "otilde" : 245,
        "ouml" : 246,
        "szlig" : 223,
        "thorn" : 254,
        "uacute" : 250,
        "ucirc" : 251,
        "ugrave" : 249,
        "uuml" : 252,
        "yacute" : 253,
        "yuml" : 255,
        "copy" : 169,
        "reg" : 174,
        "nbsp" : 160,
        "iexcl" : 161,
        "cent" : 162,
        "pound" : 163,
        "curren" : 164,
        "yen" : 165,
        "brvbar" : 166,
        "sect" : 167,
        "uml" : 168,
        "ordf" : 170,
        "laquo" : 171,
        "not" : 172,
        "shy" : 173,
        "macr" : 175,
        "deg" : 176,
        "plusmn" : 177,
        "sup1" : 185,
        "sup2" : 178,
        "sup3" : 179,
        "acute" : 180,
        "micro" : 181,
        "para" : 182,
        "middot" : 183,
        "cedil" : 184,
        "ordm" : 186,
        "raquo" : 187,
        "frac14" : 188,
        "frac12" : 189,
        "frac34" : 190,
        "iquest" : 191,
        "times" : 215,
        "divide" : 247,
        "OElig;" : 338,
        "oelig;" : 339,
        "Scaron;" : 352,
        "scaron;" : 353,
        "Yuml;" : 376,
        "fnof;" : 402,
        "circ;" : 710,
        "tilde;" : 732,
        "Alpha;" : 913,
        "Beta;" : 914,
        "Gamma;" : 915,
        "Delta;" : 916,
        "Epsilon;" : 917,
        "Zeta;" : 918,
        "Eta;" : 919,
        "Theta;" : 920,
        "Iota;" : 921,
        "Kappa;" : 922,
        "Lambda;" : 923,
        "Mu;" : 924,
        "Nu;" : 925,
        "Xi;" : 926,
        "Omicron;" : 927,
        "Pi;" : 928,
        "Rho;" : 929,
        "Sigma;" : 931,
        "Tau;" : 932,
        "Upsilon;" : 933,
        "Phi;" : 934,
        "Chi;" : 935,
        "Psi;" : 936,
        "Omega;" : 937,
        "alpha;" : 945,
        "beta;" : 946,
        "gamma;" : 947,
        "delta;" : 948,
        "epsilon;" : 949,
        "zeta;" : 950,
        "eta;" : 951,
        "theta;" : 952,
        "iota;" : 953,
        "kappa;" : 954,
        "lambda;" : 955,
        "mu;" : 956,
        "nu;" : 957,
        "xi;" : 958,
        "omicron;" : 959,
        "pi;" : 960,
        "rho;" : 961,
        "sigmaf;" : 962,
        "sigma;" : 963,
        "tau;" : 964,
        "upsilon;" : 965,
        "phi;" : 966,
        "chi;" : 967,
        "psi;" : 968,
        "omega;" : 969,
        "thetasym;" : 977,
        "upsih;" : 978,
        "piv;" : 982,
        "ensp;" : 8194,
        "emsp;" : 8195,
        "thinsp;" : 8201,
        "zwnj;" : 8204,
        "zwj;" : 8205,
        "lrm;" : 8206,
        "rlm;" : 8207,
        "ndash;" : 8211,
        "mdash;" : 8212,
        "lsquo;" : 8216,
        "rsquo;" : 8217,
        "sbquo;" : 8218,
        "ldquo;" : 8220,
        "rdquo;" : 8221,
        "bdquo;" : 8222,
        "dagger;" : 8224,
        "Dagger;" : 8225,
        "bull;" : 8226,
        "hellip;" : 8230,
        "permil;" : 8240,
        "prime;" : 8242,
        "Prime;" : 8243,
        "lsaquo;" : 8249,
        "rsaquo;" : 8250,
        "oline;" : 8254,
        "frasl;" : 8260,
        "euro;" : 8364,
        "image;" : 8465,
        "weierp;" : 8472,
        "real;" : 8476,
        "trade;" : 8482,
        "alefsym;" : 8501,
        "larr;" : 8592,
        "uarr;" : 8593,
        "rarr;" : 8594,
        "darr;" : 8595,
        "harr;" : 8596,
        "crarr;" : 8629,
        "lArr;" : 8656,
        "uArr;" : 8657,
        "rArr;" : 8658,
        "dArr;" : 8659,
        "hArr;" : 8660,
        "forall;" : 8704,
        "part;" : 8706,
        "exist;" : 8707,
        "empty;" : 8709,
        "nabla;" : 8711,
        "isin;" : 8712,
        "notin;" : 8713,
        "ni;" : 8715,
        "prod;" : 8719,
        "sum;" : 8721,
        "minus;" : 8722,
        "lowast;" : 8727,
        "radic;" : 8730,
        "prop;" : 8733,
        "infin;" : 8734,
        "ang;" : 8736,
        "and;" : 8743,
        "or;" : 8744,
        "cap;" : 8745,
        "cup;" : 8746,
        "int;" : 8747,
        "there4;" : 8756,
        "sim;" : 8764,
        "cong;" : 8773,
        "asymp;" : 8776,
        "ne;" : 8800,
        "equiv;" : 8801,
        "le;" : 8804,
        "ge;" : 8805,
        "sub;" : 8834,
        "sup;" : 8835,
        "nsub;" : 8836,
        "sube;" : 8838,
        "supe;" : 8839,
        "oplus;" : 8853,
        "otimes;" : 8855,
        "perp;" : 8869,
        "sdot;" : 8901,
        "lceil;" : 8968,
        "rceil;" : 8969,
        "lfloor;" : 8970,
        "rfloor;" : 8971,
        "lang;" : 9001,
        "rang;" : 9002,
        "loz;" : 9674,
        "spades;" : 9824,
        "clubs;" : 9827,
        "hearts;" : 9829,
        "diams;" : 9830
    };


    return this;
}

TableCreator.updateCommentEditor = function(textarea) {
    // remove newlines
    textarea.value = textarea.value.replace(/\n/g, '');

    // set textarea height
    var highest = (textarea.scrollHeight > textarea.offsetHeight) ? textarea.scrollHeight : textarea.offsetHeight;
    textarea.style.height = highest +'px'; 

    // constrain length of comment
    var length = textarea.value.length;
    var pasteSpan = $("#CommentModal .charactersLeft span");
    var charLeft = 900 - length;
    pasteSpan.text(charLeft);
    if (charLeft >= 0) {
        textarea.classList.remove("minus");
        $("#CommentModal #CommentSave").prop("disabled", false);
    } else {
        textarea.classList.add("minus");
        $("#CommentModal #CommentSave").prop("disabled", true);
    }
};
