sentio.chart.matrix = sentio_chart_matrix;

function sentio_chart_matrix() {
	"use strict";
	var _axis;
	var _data = [];
	var _dayMs = 60000*60*24;

    // Elements
    var _element = {
        div: undefined,
        svg: undefined,
        g: undefined
    };

    // Extents
    var _extent = {
        width : []
    };

	// d3 dispatcher for handling events
    var _dispatch = d3.dispatch('onmouseover', 'onmouseout');
    var _fn = {
        onMouseOver: function(d, i) {
            _dispatch.onmouseover(d, this);
        },
        onMouseOut: function(d, i) {
            _dispatch.onmouseout(d, this);
        },
        highlights: function(d, i) { return d.highlights; },
        key: function(d, i) { return d.key; },
        label: function(d, i) { return d.key + ' (' + d.value + ')'; },
        values: function(d, i) { return d.values; }
    };

    // Default settings
    var _settings = {
        color :		["#a60000", "#e7e7e7", "#008500"],
        margin :	{ top: 50, right: 50, bottom: 10, left: 225 },
        boxDim :	16,
        boxMargin :	1,
        highlight :	2,
        duration: 500
    };

    //TODO: add getters/setters for scale and axis.  But we have to do something specific with the axis with scale changes or something.


    // Default scales for x and y dimensions
    var _scale = {
        x: d3.time.scale.utc(),
        y: d3.scale.ordinal(),
        color: d3.scale.linear().domain([-1, 0, 1]).range(_settings.color)
    };

	var _instance = function (selection) {};

	_instance.data = function(d) {
		if(!arguments.length) {
			return _data;
		}
		_data = d || [];
		return _instance;
	};

	_instance.init = function(d3Container) {
	    // Add the svg element
	    _element.div = d3Container;
		_element.div.attr("class", "sentio matrix");
		_element.svg = d3Container.append("svg");

		// Set up axes
		var gXAxis2 = _element.svg.append("g").attr("class", "context axis").attr("transform", "translate(" + (_settings.margin.left) + "," + (_settings.margin.top - 20) + ")");
		var gXAxis1 = _element.svg.append("g").attr("class", "x axis").attr("transform", "translate(" + (_settings.margin.left) + "," + (_settings.margin.top - _settings.boxMargin) + ")");
		var xAxis1 = d3.svg.axis().scale(_scale.x).orient("top").outerTickSize(0).ticks(d3.time.monday.utc, 1);
		var xAxis2 = d3.svg.axis().scale(_scale.x).orient("top").innerTickSize(-(20)).outerTickSize(0).ticks(d3.time.month.utc, 1);

		_axis = { x1: xAxis1, x2: xAxis2 };
		_element.g = { x1: gXAxis1, x2: gXAxis2 };

		return _instance;
	};

	_instance.draw = function() {
	    // TODO: other things worth checking at start? (_extent.width?)
		// Bail out if data is missing
		if(undefined === _data){
			return;
		}

		// Work out the extent of the chart
		var keys = _data.map(_fn.key);
		var start = { date: new Date(_extent.width[0]), epoch: _extent.width[0] };
		var end = { date: new Date(_extent.width[1]), epoch: _extent.width[1]};

		// Calculate some convenience date range properties
		var days = (end.epoch - start.epoch)/_dayMs;
		var multiYear = (end.date.getUTCFullYear() - start.date.getUTCFullYear()) !== 0;
		var multiMonth = multiYear || (end.date.getUTCMonth() - start.date.getUTCMonth()) !== 0;

		// Dimensions of the visualization
		var boxDim = _settings.boxDim;
		var boxMargin = _settings.boxMargin;
		var span = _settings.boxMargin + _settings.boxDim;

		// calculate the width/height of the svg
		var margin = _settings.margin;
		var width = days*span + boxMargin,
			height = keys.length*span + boxMargin;

		_element.div
			.style("width", (width + margin.left + margin.right) + "px")
			.style("height", (height + margin.top + margin.bottom) + "px");

		// scale the svg to the right size
		_element.svg
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom);

		// Add the data to the xScale and xAxes
		_scale.x.domain([start.date, end.date]).range([0, days*span]);
		_element.g.x1.call(_axis.x1);
		_element.g.x2.call(_axis.x2);

		/**
		 * Chart Manipulation
		 */
		// Row Join and Update using the series name as the join function
		var row = _element.svg.selectAll("g.row").data(_data, _fn.key);
		row.transition().duration(_settings.duration*2)
			.attr("transform", function(d, i){
				return "translate(" + margin.left + "," + (margin.top + (span*i)) + ")";
			});

		// Row Enter - when a row enters, we append a g element as row
		var rowEnter = row.enter().append("g");
		rowEnter
			.attr("class", "row")
			.attr("transform", function(d, i){ return "translate(" + margin.left + "," + (margin.top + (span*i)) + ")"; });

		// Also must append the label of the row
		rowEnter.append("text")
			.attr("class", "series label")
			.style("text-anchor", "end")
			.attr("x", -6)
			.attr("y", boxMargin + (boxDim/2))
			.attr("dy", ".32em")
			.text(function(d){ return d.label; });

		// Also must append a line
		rowEnter.append("line")
			.attr("class", "series tick")
			.attr("x1", -3)
			.attr("x2", 0)
			.attr("y1", boxMargin + (boxDim/2))
			.attr("y2", boxMargin + (boxDim/2));

		// Row Exit
		row.exit()
			.transition().duration(_settings.duration)
			.remove();

		// Cell Join and Update on Row Enter
		var rowEnterCell = rowEnter.selectAll("rect.cell").data(_fn.values, function(d) { return d[0]; });
		rowEnterCell.enter().append("rect")
			.attr("class", "cell")
			.style("fill", function(d) {
				return _scale.color(d[1]);
			})
			.attr("x", function(d, i){ return _scale.x(d[0]) + boxMargin; })
			.attr("y", boxMargin)
			.attr("height", boxDim)
			.attr("width", boxDim)
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut);

		// Create the highlight rectangles for this row
		var rowEnterHighlight = rowEnter.selectAll("rect.highlight").data(_fn.highlights, function(d) { return d[0]; });
		rowEnterHighlight.enter().append("rect")
			.attr("class", "highlight")
			.attr("x", function(d, i){ return _scale.x(d[0]) + boxMargin; })
			.attr("y", boxMargin + boxDim - _settings.highlight)
			.attr("width", function(d, i){ return _scale.x(d[1]) - _scale.x(d[0]) + boxDim; })
			.attr("height", _settings.highlight);


		// Cell Join and Update on Row Update
		var rowUpdateCell = row.selectAll("rect.cell").data(_fn.values, function(d) { return d[0]; });
		// Update
		rowUpdateCell
			.transition().duration(_settings.duration)
			.style("fill", function(d) {
				return _scale.color(d[1]);
			})
			.attr("x", function(d, i){ return _scale.x(d[0]) + boxMargin; })
			.attr("y", boxMargin);
		// Enter
		rowUpdateCell.enter().append("rect")
			.attr("class", "cell")
			.style("fill", function(d) {
				return _scale.color(d[1]);
			})
			.attr("x", function(d, i){ return _scale.x(d[0]) + boxMargin; })
			.attr("y", boxMargin)
			.attr("height", boxDim)
			.attr("width", boxDim)
			.style("opacity", 0.1)
			.on("mouseover", _fn.onMouseOver)
			.on("mouseout", _fn.onMouseOut)
			.transition().duration(_settings.duration)
				.style("opacity", 1);
		// Exit
		rowUpdateCell.exit()
			.style("opacity", 1)
			.transition().duration(_settings.duration)
				.attr("width", 0)
				.style("opacity", 0.1)
				.remove();

		// Create the highlight rectangles for this row on row update
		var rowUpdateHighlight = row.selectAll("rect.highlight").data(_fn.highlights, function(d) { return d[0]; });
		// Update
		rowUpdateHighlight
			.transition().duration(_settings.duration)
			.attr("x", function(d, i){ return _scale.x(d[0]) + boxMargin; })
			.attr("y", boxMargin + boxDim - _settings.highlight)
			.attr("width", function(d, i){ return _scale.x(d[1]) - _scale.x(d[0]) + boxDim; })
			.attr("height", _settings.highlight);
		// Enter
		rowUpdateHighlight.enter().append("rect")
			.attr("class", "highlight")
			.attr("x", function(d, i){ return _scale.x(d[0]) + boxMargin; })
			.attr("y", boxMargin + boxDim - _settings.highlight)
			.attr("width", 0)
			.attr("height", _settings.highlight)
			.transition().duration(_settings.duration)
				.attr("width", function(d, i){ return _scale.x(d[1]) - _scale.x(d[0]) + boxDim; });
		// Exit
		rowUpdateHighlight.exit()
			.transition().duration(_settings.duration)
				.attr("width", 0)
				.remove();

		return _instance;
	};

    // Settings getter/setters
	_instance.boxDim = function(v) {
		if(!arguments.length) { return _settings.boxDim; }
		_settings.boxDim = v;
		return _instance;
	};

	_instance.boxMargin = function(v) {
		if(!arguments.length) { return _settings.boxMargin; }
		_settings.boxMargin = v;
		return _instance;
	};

	_instance.color = function(v) {
		if(!arguments.length) { return _settings.color; }
		_settings.color = v;
		return _instance;
	};

	_instance.duration = function(v) {
      		if(!arguments.length) { return _settings.duration; }
      		_settings.duration = v;
      		return _instance;
      	};

	_instance.highlight = function(v) {
		if(!arguments.length) { return _settings.highlight; }
		_settings.highlight = v;
		return _instance;
	};

	_instance.margin = function(v) {
		if(!arguments.length) { return _settings.margin; }
		_settings.margin = v;
		return _instance;
	};

	// Scale getter/setters
    _instance.colorScale = function(v) {
        // TODO: implement
    };

	_instance.xScale = function(v) {
		// TODO: implement
	};

    _instance.yScale = function(v) {
        // TODO: implement
    };

    // Extent getter/setters
    _instance.widthExtent = function(v) {
        if(!arguments.length) { return _extent.width; }
        _extent.width = v;
        return _instance;
    };

	return _instance;
}