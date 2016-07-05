var tableC = {};

tableC.methods = {
  "sum" : function(args) {
    var total = 0;
    for (var arg = 0; arg < args.length; ++arg) {
      total += data.tbody[0][args[arg]];
    }
    return total;
  }
};

tableC.buildTable = function (args) {
    var data = args['data'];
    var el = args['el'];
		var colDictionary = [];
			for(var itr = 0; itr < data.thead.cols.length; ++itr) {
				colDictionary[itr] = data.thead.cols[itr];
				colDictionary[data.thead.cols[itr].id] = data.thead.cols[itr];
			}
		var numColumns = data.thead.cols.length;
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
        var id = headerRow.hasOwnProperty("id") ? headerRow.id : null;
        var title = headerRow.hasOwnProperty("title") ? headerRow.title : null;
        html += '<th>' + title + '</th>';
    }
    html += '</tr>';

    html += '</thead><tbody>';
    for (var line = 0; line < data.tbody.length; ++line) {
        var dataLine = data.tbody[line];
        html += '<tr>';

		var column = data.thead.cols;

        for (var x = 0; x < column.length; ++x) {
        	var id = column[x].id;
            var value = dataLine.hasOwnProperty(id) ? dataLine[id] : "";
            var cls = column[x].hasOwnProperty("class") ? column[x].class : "";
        	var clsAttr = column[x].hasOwnProperty("class") ? ' class="' + column[x].class + '"' : '';
            if(!column[x].hasOwnProperty("type") || column[x].type === "string"){
        		html += '<td' + clsAttr + '>' + value + '</td>';
        	} 
            else if (column[x].hasOwnProperty("method")) {
    			var method = column[x].method;
    			var methodCall = method.substr(0, method.indexOf('('));
    			var columnString = method.substring(method.lastIndexOf('(')+1, method.lastIndexOf(')'));
    			var columns = columnString.split(',');

    			var answer = NaN;
    			if(tableC.methods.hasOwnProperty(methodCall)) {
    				var call = tableC.methods[methodCall];
    				console.log(call);
    				answer = call(columns);
    			}

    			html += '<td class="' + methodCall + ' ' + cls + '">' + answer + '</td>';

            } else if (column[x].hasOwnProperty("type")) {
                html += '<td class="' + column[x].type + ' ' + cls + '">' + dataLine[id] + '</td>';
        	} else {
        		html += '<td' + clsAttr + '></td>'
        	}
        }

        html += '</tr>';
    }
    html += '</tbody>' + '</table>';

    el.innerHTML = html;
}
