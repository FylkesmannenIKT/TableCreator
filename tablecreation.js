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

var tableC = {};

tableC.buildTable = function (args) {
    var data = args.data;
    var el = args.el;
    var colDictionary = [];
        for(var itr = 0; itr < data.thead.cols.length; ++itr) {
            colDictionary[itr] = data.thead.cols[itr];
            colDictionary[data.thead.cols[itr].id] = data.thead.cols[itr];
        }
    var html = '<table class="data_table"><thead>';

    for (var headrow = 0; headrow < data.thead.rows.length; ++headrow) {
        var rowList = data.thead.rows[headrow];
        html += '<tr>';
        for (var hrCol = 0; hrCol < rowList.length; ++hrCol) {
            var hrColumn = rowList[hrCol];
            var colspan = hrColumn.hasOwnProperty("colspan") ? ' colspan="' + hrColumn.colspan + '"' : '';
            var title = hrColumn.hasOwnProperty("title") ? hrColumn.title : '';
            html += '<th ' + colspan + '>' + title + '</th>';
        }
        html += '</tr>';
    }

    html += '<tr>';
    for (var col = 0; col < data.thead.cols.length; ++col) {
        var headerRow = data.thead.cols[col];
        var headerTitle = headerRow.hasOwnProperty("title") ? headerRow.title : null;
        html += '<th>' + headerTitle + '</th>';
    }
    html += '</tr>';

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
                var answer = tableC.parseMethod(method, dataLine);
                html += '<td class="' + cls + '">' + answer + '</td>';

            }
            else if (column[x].hasOwnProperty("type"))
            {
                switch(column[x].type)
                {
                    case 'method':
                        html += '<td class="' + column[x].type + ' ' + cls + '">' + tableC.parseMethod(value, dataLine) + '</td>';
                        break;
                    case 'string':
                    case 'undefined':
                        html += '<td class="tcLeftAlign ' + column[x].type + ' ' + cls + '">' + value + '</td>';
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

        html += '</tr>';
    }
    html += '</tbody>';
    if(data.tfoot.hasOwnProperty("cols") && Array.isArray(data.tfoot.cols) && data.tfoot.cols.length > 0) {
        html += '<tfoot><tr>';
        for (var y = 0; y < data.tfoot.cols.length; ++y)
        {
            var fCol = data.tfoot.cols[y];
            if(fCol.hasOwnProperty("title")) {
                html += '<td>' + fCol.title + '</td>';
            }
            else if (fCol.hasOwnProperty("method")) {
                html += '<td>' + tableC.parseColumnMethod(fCol.method, data) + '</td>';
            }
            else {
                html += '<td></td>';
            }
        }
        html += '</tfoot></tr>';
    }
    html += '</table>';

    el.innerHTML = html;
};

tableC.methods = {
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

tableC.parseColumnMethod = function(methodString, data) {
    var parts = methodString.replace(/\s+/g, "");
    parts = parts.split(/([\,\(\)])/).clean();
    console.log(data);
    return methodString;
};

tableC.parseMethod = function(methodString, rowItem) {
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
        // column name
        else if (rowItem.hasOwnProperty(token)) {
            argArrayStack[argArrayStack.length-1].push(rowItem[token]);
        }
        // negative values
        else if (token.charAt(0) === '-' && rowItem.hasOwnProperty(token.slice(1))) {
            argArrayStack[argArrayStack.length-1].push(-rowItem[token.slice(1)]);
        }
        // numbers
        else if (token.isNumeric()) {
            argArrayStack[argArrayStack.length-1].push(parseFloat(token));
        }
        // end of scope
        else if (token === ')') {
            var args = argArrayStack.pop();
            var call = operatorStack.pop();
            var result = tableC.methods[call](args);
            argArrayStack[argArrayStack.length-1].push(result);
        }

    }

    var value = parseFloat(argArrayStack.pop()).toFixed(0);
    value = isNaN(value) ? "" : value;
    return value;
};