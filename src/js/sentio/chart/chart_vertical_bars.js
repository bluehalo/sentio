sentio.chart.verticalBars = sentio_chart_vertical_bars;

function sentio_chart_vertical_bars() {
	'use strict';

	// Layout properties
	var _id = 'vertical_bars_' + Date.now();
	var _margin = { top: 0, right: 0, bottom: 0, left: 0 };
	var _width = 100;
	var _barHeight = 24;
	var _barPadding = 2;
	var _duration = 500;

	// d3 dispatcher for handling events
	var _dispatch = d3.dispatch('onmouseover', 'onmouseout', 'onclick');
	var _fn = {
		onMouseOver: function(d, i) {
			_dispatch.onmouseover(d, this);
		},
		onMouseOut: function(d, i) {
			_dispatch.onmouseout(d, this);
		},
		onClick: function(d, i) {
			_dispatch.onclick(d, this);
		}
	};

	// Default accessors for the dimensions of the data
	var _value = {
		key: function(d, i) { return d.key; },
		value: function(d, i) { return d.value; },
		label: function(d, i) { return d.key + ' (' + d.value + ')'; }
	};

	// Default scales for x and y dimensions
	var _scale = {
		x: d3.scale.linear(),
		y: d3.scale.linear()
	};

	// Extents
	var _extent = {
		width: sentio.util.extent({
			defaultValue: [0, 10],
			getValue: _value.value
		})
	};

	// elements
	var _element = {
		div: undefined
	};

	var _data = [];

	// Chart create/init method
	function _instance(selection){}

	/*
	 * Initialize the chart (should only call this once). Performs all initial chart
	 * creation and setup
	 */
	_instance.init = function(container){
		// Create the DIV element
		_element.div = container.append('div').attr('class', 'sentio bars-vertical');
		_instance.resize();

		return _instance;
	};

	/*
	 * Set the _instance data
	 */
	_instance.data = function(v) {
		if(!arguments.length) { return _data; }
		_data = v || [];

		return _instance;
	};

	/*
	 * Updates all the elements that depend on the size of the various components
	 */
	_instance.resize = function() {
		// Set up the x scale (y is fixed)
		_scale.x.range([0, _width - _margin.right - _margin.left]);

		return _instance;
	};

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {

		// Update the x domain
		_scale.x.domain(_extent.width.getExtent(_data));

		// Update the y domain (based on configuration and data)
		_scale.y.domain([0, _data.length]);
		_scale.y.range([0, (_barHeight + _barPadding) * _data.length]);

		// Data Join
		var div = _element.div.selectAll('div.bar')
			.data(_data, _value.key);

		// Update Only

		// Enter
		var bar = div.enter().append('div')
			.attr('class', 'bar')
			.style('top', (_scale.y.range()[1] + _margin.top + _margin.bottom - _barHeight) + 'px')
			.style('height', _barHeight + 'px')
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut)
			.on('click', _fn.onClick)
			.style('opacity', 0.01);

		bar.append('div')
			.attr('class', 'bar-label');

		// Enter + Update
		div.transition().duration(_duration)
			.style('opacity', 1)
			.style('width', function(d, i) { return _scale.x(_value.value(d, i)) + 'px'; })
			.style('top', function(d, i) { return (_scale.y(i) + _margin.top) + 'px'; })
			.style('left', _margin.left + 'px');

		div.select('div.bar-label')
			.html(_value.label)
			.style('max-width', (_scale.x.range()[1] - 10) + 'px');

		// Exit
		div.exit()
			.transition().duration(_duration)
			.style('opacity', 0.01)
			.style('top', (_scale.y.range()[1] + _margin.top + _margin.bottom - _barHeight) + 'px' )
			.remove();

		// Update the size of the parent div
		_element.div
			.style('height', (_margin.bottom + _margin.top + _scale.y.range()[1]) + 'px');

		return _instance;
	};


	// Basic Getters/Setters
	_instance.width = function(v) {
		if(!arguments.length) { return _width; }
		_width = v;
		return _instance;
	};
	_instance.barHeight = function(v) {
		if(!arguments.length) { return _barHeight; }
		_barHeight = v;
		return _instance;
	};
	_instance.barPadding = function(v) {
		if(!arguments.length) { return _barPadding; }
		_barPadding = v;
		return _instance;
	};
	_instance.margin = function(v) {
		if(!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};
	_instance.key = function(v) {
		if(!arguments.length) { return _value.key; }
		_value.key = v;
		return _instance;
	};
	_instance.value = function(v) {
		if(!arguments.length) { return _value.value; }
		_value.value = v;
		_extent.width.getValue(v);
		return _instance;
	};
	_instance.label = function(v) {
		if(!arguments.length) { return _value.label; }
		_value.label = v;
		return _instance;
	};
	_instance.widthExtent = function(v) {
		if(!arguments.length) { return _extent.width; }
		_extent.width = v;
		return _instance;
	};
	_instance.dispatch = function(v) {
		if(!arguments.length) { return _dispatch; }
		return _instance;
	};
	_instance.duration = function(v) {
		if(!arguments.length) { return _duration; }
		_duration = v;
		return _instance;
	};

	return _instance;
}