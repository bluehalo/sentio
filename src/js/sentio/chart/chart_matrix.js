sentio.chart.matrix = sentio_chart_matrix;

function sentio_chart_matrix() {
	'use strict';

	// Chart dimensions
	var _boxSize = 16;
	var _boxMargin = 1;
	var _margin = { top: 20, right: 2, bottom: 2, left: 64 };

	// Transition duration
	var _duration = 500;

	// d3 dispatcher for handling events
	var _dispatch = d3.dispatch('onmouseover', 'onmouseout', 'onclick');

	// Function handlers
	var _fn = {
		onMouseOver: function(d, i) {
			_dispatch.onmouseover(d, this);
		},
		onMouseOut: function(d, i) {
			_dispatch.onmouseout(d, this);
		},
		onClick: function(d, i) {
			_dispatch.onclick(d, this);
		},
		seriesKey: function(d, i) { return d.key; },
		seriesLabel: function(d, i) { return d.label; },
		seriesValues: function(d, i) { return d.values; },
		key: function(d, i) { return d.key; },
		value: function(d, i) { return d.value; }
	};

	// Extents
	var _extent = {
		x: sentio.util.extent().getValue(_fn.key),
		value: sentio.util.extent().getValue(_fn.value),
		multi: sentio.util.multiExtent()
	};

	// Scales for x, y, and color
	var _scale = {
		x: d3.scale.linear(),
		y: d3.scale.ordinal(),
		color: d3.scale.linear().range(['#e7e7e7', '#008500'])
	};

	var _axis = {
		x: d3.svg.axis().scale(_scale.x).orient('top').outerTickSize(0).innerTickSize(2)
	};

	var _element = {
		div: undefined,
		svg: undefined,
		g: {
			chart: undefined,
			xAxis: undefined
		}
	};

	var _data = [];

	var _instance = function () {};

	_instance.init = function(d3Container) {
		// Add the svg element
		_element.div = d3Container.append('div').attr('class', 'sentio matrix');
		_element.svg = _element.div.append('svg');

		// Add the axis
		_element.g.xAxis = _element.svg.append('g').attr('class', 'x axis');

		_instance.resize();

		return _instance;
	};

	_instance.data = function(d) {
		if(!arguments.length) {
			return _data;
		}
		_data = d || [];
		return _instance;
	};

	_instance.resize = function() { };

	_instance.redraw = function() {
		// Determine the number of rows to render
		var rowCount = _data.length;

		// Determine the number of boxes to render (assume complete data)
		var boxes = [];
		if(rowCount > 0) {
			boxes = _fn.seriesValues(_data[0]);
		}
		var boxCount = boxes.length;

		// Dimensions of the visualization
		var boxSpan = _boxMargin + _boxSize;

		// calculate the width/height of the svg
		var width = boxCount*boxSpan + _boxMargin,
			height = rowCount*boxSpan + _boxMargin;

		// scale the svg to the right size
		_element.svg
			.attr('width', width + _margin.left + _margin.right)
			.attr('height', height + _margin.top + _margin.bottom);

		// Cofigure the scales
		_scale.x.domain(_extent.x.getExtent(boxes)).range([0, width - _boxMargin - boxSpan]);
		_scale.color.domain(_extent.multi.values(_fn.seriesValues).extent(_extent.value).getExtent(_data));

		// Draw the x axis
		_element.g.xAxis.attr('transform', 'translate(' + (_margin.left + _boxMargin + _boxSize/2) + "," + _margin.top + ")");
		_element.g.xAxis.call(_axis.x);

		/**
		 * Chart Manipulation
		 */
		// Row Join and Update using the series name as the join function
		var row = _element.svg.selectAll('g.row').data(_data, _fn.key);
		row.transition().duration(_duration*2)
			.attr('transform', function(d, i){
				return 'translate(' + _margin.left + ',' + (_margin.top + (boxSpan*i)) + ')';
			});

		// Row Enter - when a row enters, we append a g element as row
		var rowEnter = row.enter().append('g');
		rowEnter
			.attr('class', 'row')
			.attr('transform', function(d, i){ return 'translate(' + _margin.left + ',' + (_margin.top + (boxSpan*i)) + ')'; });

		// Also must append the label of the row
		rowEnter.append('text')
			.attr('class', 'series label')
			.style('text-anchor', 'end')
			.attr('x', -6)
			.attr('y', _boxMargin + (_boxSize/2))
			.attr('dy', '.32em')
			.text(_fn.seriesLabel);

		// Also must append a line
		rowEnter.append('line')
			.attr('class', 'series tick')
			.attr('x1', -3)
			.attr('x2', 0)
			.attr('y1', _boxMargin + (_boxSize/2))
			.attr('y2', _boxMargin + (_boxSize/2));

		// Row Exit
		row.exit()
			.transition().duration(_duration)
			.remove();

		// Cell Join and Update on Row Enter
		var rowEnterCell = rowEnter.selectAll('rect.cell').data(_fn.seriesValues, _fn.key);
		rowEnterCell.enter().append('rect')
			.attr('class', 'cell')
			.style('fill', function(d) {
				return _scale.color(_fn.value(d));
			})
			.attr('x', function(d, i){ return _scale.x(_fn.key(d)) + _boxMargin; })
			.attr('y', _boxMargin)
			.attr('height', _boxSize)
			.attr('width', _boxSize)
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut)
			.on('click', _fn.onClick);

		// Cell Join and Update on Row Update
		var rowUpdateCell = row.selectAll('rect.cell').data(_fn.seriesValues, _fn.key);
		// Update
		rowUpdateCell
			.transition().duration(_duration)
			.style('fill', function(d) {
				return _scale.color(_fn.value(d));
			})
			.attr('x', function(d, i){ return _scale.x(_fn.key(d)) + _boxMargin; })
			.attr('y', _boxMargin);
		// Enter
		rowUpdateCell.enter().append('rect')
			.attr('class', 'cell')
			.style('fill', function(d) {
				return _scale.color(_fn.value(d));
			})
			.attr('x', function(d, i){ return _scale.x(_fn.key(d)) + _boxMargin; })
			.attr('y', _boxMargin)
			.attr('height', _boxSize)
			.attr('width', _boxSize)
			.style('opacity', 0.1)
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut)
			.transition().duration(_duration)
				.style('opacity', 1);
		// Exit
		rowUpdateCell.exit()
			.style('opacity', 1)
			.transition().duration(_duration)
				.attr('width', 0)
				.style('opacity', 0.1)
				.remove();

		return _instance;
	};


	_instance.boxSize = function(v) {
		if(!arguments.length) { return _boxSize; }
		_boxSize = v;
		return _instance;
	};
	_instance.boxMargin = function(v) {
		if(!arguments.length) { return _boxMargin; }
		_boxMargin = v;
		return _instance;
	};
	_instance.margin = function(v) {
		if(!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};

	_instance.duration = function(v) {
		if(!arguments.length) { return _duration; }
		_duration = v;
		return _instance;
	};

	_instance.seriesKey = function(v) {
		if(!arguments.length) { return _fn.seriesKey; }
		_fn.seriesKey = v;
		return _instance;
	};
	_instance.seriesLabel = function(v) {
		if(!arguments.length) { return _fn.seriesLabel; }
		_fn.seriesLabel = v;
		return _instance;
	};
	_instance.seriesValues = function(v) {
		if(!arguments.length) { return _fn.seriesValues; }
		_fn.seriesValues = v;
		return _instance;
	};
	_instance.key = function(v) {
		if(!arguments.length) { return _fn.key; }
		_fn.key = v;
		return _instance;
	};
	_instance.value = function(v) {
		if(!arguments.length) { return _fn.value; }
		_fn.value = v;
		_extent.value.getValue(v);
		return _instance;
	};

	_instance.colorScale = function(v) {
		if(!arguments.length) { return _scale.color; }
		_scale.color = v;
		return _instance;
	};
	_instance.xScale = function(v) {
		if(!arguments.length) { return _scale.xScale; }
		_scale.xScale = v;
		_axis.x.scale(v);
		return _instance;
	};
	_instance.yScale = function(v) {
		if(!arguments.length) { return _scale.yScale; }
		_scale.yScale = v;
		return _instance;
	};

	_instance.xExtent = function(v) {
		if(!arguments.length) { return _extent.x; }
		_extent.x = v;
		return _instance;
	};
	_instance.yExtent = function(v) {
		if(!arguments.length) { return _extent.y; }
		_extent.y = v;
		return _instance;
	};
	_instance.valueExtent = function(v) {
		if(!arguments.length) { return _extent.value; }
		_extent.value = v;
		return _instance;
	};

	_instance.dispatch = function(v) {
		if(!arguments.length) { return _dispatch; }
		return _instance;
	};

	return _instance;
}