import { axisTop as d3_axisTop } from 'd3-axis';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { scaleLinear as d3_scaleLinear, scaleOrdinal as d3_scaleOrdinal } from 'd3-scale';

import { default as extent } from '../../model/extent';
import { default as multiExtent } from '../../model/multi-extent';

export default function matrix() {

	/**
	 * Style stuff
	 */

	// Cell dimensions
	var _cellSize = 16;
	var _cellMargin = 1;

	// Margin between plot and svg borders
	var _margin = { top: 20, right: 2, bottom: 2, left: 64 };

	// Transition duration
	var _duration = 500;


	/**
	 * Configuration of accessors to data
	 */

	// Various configuration functions
	var _fn = {
		key: function(d) { return d.key; },
		value: function(d) { return d.value; }
	};


	/**
	 * Extents, Axes, and Scales
	 */

	// Extents
	var _extent = {
		x: extent().getValue(function(d, i) { return _fn.key(d, i); }),
		value: extent(),
		multi: multiExtent()
	};

	// Scales for x, y, and color
	var _scale = {
		x: d3_scaleLinear(),
		y: d3_scaleOrdinal(),
		color: d3_scaleLinear().range([ '#e7e7e7', '#008500' ])
	};

	// X axis
	var _axis = {
		x: d3_axisTop().scale(_scale.x).tickSizeOuter(0).tickSizeInner(2)
	};


	/**
	 * Common DOM elements
	 */
	var _element = {
		div: undefined,
		svg: undefined,
		g: {
			chart: undefined,
			xAxis: undefined
		}
	};

	/**
	 * Data and Series
	 */

	// The main data array
	var _data = [];

	// The series definition
	var _series = [];


	/**
	 * Events
	 */

	// d3 dispatcher for handling events
	var _dispatch = d3_dispatch(
		'cellMouseover', 'cellMouseout', 'cellClick',
		'rowMouseover', 'rowMouseout', 'rowClick');

	function updateActiveSeries(d, i) {
		var seriesLabels = _element.g.chart.selectAll('.row text');

		if(null != d) {
			// Set the highlight on the row
			var seriesKey = d.key;
			seriesLabels.classed('active', function(series) { return series.key == seriesKey; });
		}
		else {
			// Now update the style
			seriesLabels.classed('active', false);
		}
	}

	function rowMouseover(d, i) {
		updateActiveSeries(d, i);
		_dispatch.call('rowMouseover', this, d, i);
	}

	function rowMouseout(d, i) {
		updateActiveSeries();
		_dispatch.call('rowMouseout', this, d, i);
	}

	function rowClick(d, i) {
		_dispatch.call('rowClick', this, d, i);
	}

	function cellMouseover(d, i) {
		_dispatch.call('cellMouseover', this, d, i);
	}

	function cellMouseout(d, i) {
		_dispatch.call('cellMouseout', this, d, i);
	}

	function cellClick(d, i) {
		_dispatch.call('cellClick', this, d, i);
	}


	var _instance = function () {};

	_instance.init = function(d3Container) {

		// Add the svg element
		_element.div = d3Container.append('div').attr('class', 'sentio matrix');
		_element.svg = _element.div.append('svg');

		// Add the axis
		_element.g.xAxis = _element.svg.append('g').attr('class', 'x axis');

		// Add a group for the chart itself
		_element.g.chart = _element.svg.append('g').attr('class', 'chart');

		return _instance;

	};

	_instance.resize = function() { }

	_instance.redraw = function() {

		// Determine the number of rows/boxes to render
		var rowCount = _series.length;
		var boxCount = _data.length;

		// Dimensions of the visualization
		var cellSpan = _cellMargin + _cellSize;

		// calculate the width/height of the svg
		var width = boxCount * cellSpan + _cellMargin,
			height = rowCount * cellSpan + _cellMargin;

		// scale the svg to the right size
		_element.svg
			.attr('width', width + _margin.left + _margin.right)
			.attr('height', height + _margin.top + _margin.bottom);

		// Configure the scales
		_scale.x
			.domain(_extent.x.getExtent(_data))
			.range([ 0, width - _cellMargin - cellSpan ]);

		_scale.color
			.domain(_extent.multi.extent(_extent.value).series(_series).getExtent(_data));

		// Draw the x axis
		_element.g.xAxis.attr('transform', 'translate(' + (_margin.left + _cellMargin + _cellSize / 2) + "," + _margin.top + ")");
		_element.g.xAxis.call(_axis.x);


		/**
		 * Chart Manipulation
		 */

		/*
		 * Row Join
		 */
		var row = _element.g.chart
			.selectAll('g.row')
			.data(_series, function(d) { return d.key; });

		/*
		 * Row Update Only
		 */

		/*
		 * Row Enter Only
		 * Build the row structure
		 */
		var rowEnter = row.enter().append('g');
		rowEnter
			.style('opacity', '0.1')
			.attr('class', 'row')
			.attr('transform', function(d, i) { return 'translate(' + _margin.left + ',' + (_margin.top + (cellSpan * i)) + ')'; })
			.on('mouseover', rowMouseover)
			.on('mouseout', rowMouseout)
			.on('click', rowClick);

		// Also must append the label of the row
		rowEnter.append('text')
			.attr('class', 'series label')
			.style('text-anchor', 'end')
			.attr('x', -6)
			.attr('y', _cellMargin + (_cellSize / 2))
			.attr('dy', '.32em');

		// Also must append a line
		rowEnter.append('line')
			.attr('class', 'series tick')
			.attr('x1', -3)
			.attr('x2', 0)
			.attr('y1', _cellMargin + (_cellSize / 2))
			.attr('y2', _cellMargin + (_cellSize / 2));

		/*
		 * Row Enter + Update
		 */

		// Transition rows to their new positions
		var rowEnterUpdate = rowEnter.merge(row);
		rowEnterUpdate.transition().duration(_duration)
			.style('opacity', '1')
			.attr('transform', function(d, i) {
				return 'translate(' + _margin.left + ',' + (_margin.top + (cellSpan * i)) + ')';
			});

		// Update the series labels in case they changed
		rowEnterUpdate.select('text.series.label')
			.text(function(d) { return d.label; });

		/*
		 * Row Exit
		 */
		row.exit()
			.transition().duration(_duration)
			.style('opacity', '0.1')
			.remove();


		/*
		 * Cell Join - Will be done on row enter + exit
		 */
		var rowCell = rowEnterUpdate
			.selectAll('rect.cell')
			.data(function(s) {
				return _data.map((function(d, i) {
					return { key: _fn.key(d, i), value: s.getValue(d, i) };
				}));
			}, _fn.key);

		/*
		 * Cell Update Only
		 */

		/*
		 * Cell Enter Only
		 */
		var rowCellEnter = rowCell.enter().append('rect')
			.attr('class', 'cell')
			.style('opacity', '0.1')
			.style('fill', function(d, i) { return _scale.color(d.value); })
			.attr('x', function(d, i) { return _scale.x(d.key) + _cellMargin; })
			.attr('y', _cellMargin)
			.attr('height', _cellSize)
			.attr('width', _cellSize)
			.on('mouseover', cellMouseover)
			.on('mouseout', cellMouseout)
			.on('click', cellClick);

		/*
		 * Cell Enter + Update
		 * Update fill, move to proper x coordinate
		 */
		var rowCellEnterUpdate = rowCellEnter.merge(rowCell);
		rowCellEnterUpdate.transition().duration(_duration)
			.style('opacity', '1')
			.attr('x', function(d, i) { return _scale.x(d.key) + _cellMargin; })
			.style('fill', function(d, i) { return _scale.color(d.value); });

		/*
		 * Cell Remove
		 */
		rowCell.exit().transition().duration(_duration)
			.attr('width', 0)
			.style('opacity', '0.1')
			.remove();

		return _instance;
	};


	_instance.data = function(v) {
		if (!arguments.length) {
			return _data;
		}
		_data = (null != v)? v : [];
		return _instance;
	};

	_instance.series = function(v) {
		if (!arguments.length) {
			return _series;
		}
		_series = (null != v)? v : [];
		return _instance;
	};

	_instance.cellSize = function(v) {
		if(!arguments.length) { return _cellSize; }
		_cellSize = v;
		return _instance;
	};
	_instance.cellMargin = function(v) {
		if(!arguments.length) { return _cellMargin; }
		_cellMargin = v;
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

	_instance.key = function(v) {
		if(!arguments.length) { return _fn.key; }
		_fn.key = v;
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
		_extent.x.getValue(function(d, i) { return v(d, i); });
		return _instance;
	};
	_instance.valueExtent = function(v) {
		if(!arguments.length) { return _extent.value; }
		_extent.value = v;
		return _instance;
	};

	_instance.dispatch = function() {
		return _dispatch;
	};

	return _instance;
}
