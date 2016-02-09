sentio.chart.donut = sentio_chart_donut;

function sentio_chart_donut() {
	'use strict';

	// Chart height/width
	var _width = 460;
	var _height = 300;

	// Inner and outer radius settings
	var _innerRadiusRatio = 0.7;

	// Transition duration
	var _duration = 500;

	// Legend configuration
	var _legend = {
		enabled: true,
		markSize: 16,
		position: 'center', // only option right now
		layout: 'vertical'
	};

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
		key: function(d, i) { return d.key; },
		value: function(d, i) { return d.value; },
		label: function(d, i) { return d.key + ' (' + d.value + ')'; }
	};


	// Extents
	var _extent = {
	};

	var _scale = {
		color: d3.scale.category10()
	};

	var _layout = {
		arc: d3.svg.arc(),
		pie: d3.layout.pie().value(_fn.value).sort(null)
	};

	// elements
	var _element = {
		div: undefined,
		svg: undefined,
		gChart: undefined,
		legend: undefined
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
		_element.div = container.append('div').attr('class', 'donut');

		// Create the svg element
		_element.svg = _element.div.append('svg');

		// Create the main chart group
		_element.gChart = _element.svg.append('g').attr('class', 'chart');

		// Create a group for the legend
		_element.gLegend = _element.svg.append('g').attr('class', 'legend');

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
		_element.svg
			.attr('width', _width)
			.attr('height', _height);

		_element.gChart
			.attr('transform', 'translate(' + (_width / 2) + ',' + (_height / 2) + ')');

		// The outer radius is half of the width of the chart itself
		var radius = _width/2;
		_layout.arc.innerRadius(radius * _innerRadiusRatio).outerRadius(radius);

		// Update legend positioning
		_element.gLegend.selectAll('g.legend-group')
			.attr('transform', legendTransform);

		return _instance;
	};

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {

		redrawChart();

		if (_legend.enabled) {
			redrawLegend();
		}

		return _instance;
	};

	/**
	 * Private functions
	 */
	function redrawChart() {
		/*
		 * Join the data
		 */
		var g = _element.gChart.selectAll('path.arc')
			.data(_layout.pie(_data), function(d) { return _fn.key(d.data); });

		/*
		 * Update Only
		 */

		/*
		 * Enter Only
		 * Create the path, add the arc class, register the callbacks
		 * Grow from 0 for both start and end angles
		 */
		var gEnter = g.enter().append('path')
			.attr('class', 'arc')
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut)
			.on('click', _fn.onClick)
			.each(function(d) { this._current = { startAngle: 0, endAngle: 0 }; });

		/*
		 * Enter + Update
		 * Apply the update from current angle to next angle
		 */
		g.transition().duration(_duration)
			.attrTween('d', function(d) {
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					return _layout.arc(interpolate(t));
				};
			});

		g.attr('key', function(d) { return _fn.key(d.data); })
			.attr('fill', function(d, i) { return _scale.color(_fn.key(d.data)); });

		g.exit().remove();
	}

	function legendTransform(d, i) {
		var height, vert;
		var offset = 0;
		height = _legend.markSize + 2;
		horz = _legend.markSize;

		// Only option is 'center' for now
		if (_legend.position === 'center') {
			var centerHeight = _height/2;

			offset = centerHeight - height * _scale.color.domain().length / 2;

			var centerWidth = _width/2;
			var horz = centerWidth - _element.gLegend._maxWidth/2;
			vert = (i * height) + offset;
			return 'translate(' + horz + ',' + vert + ')';
		} else {
			// TODO
		}
	}

	function redrawLegend() {
		/*
		 * Join the data
		 */
		var gLegendGroup = _element.gLegend.selectAll('g.legend-group')
			.data(_data, function(d) { return _fn.key(d); });

		/*
		 * Enter Only
		 * Create a g (gLegendGroup) to add the rect & text label,
		 * register the callbacks, apply the transform to position each gLegendGroup
		 */
		var gLegendGroupEnter = gLegendGroup.enter()
			.append('g')
			.attr('class', 'legend-group');

		// Add the legend's rect
		var rect = gLegendGroupEnter
			.append("rect")
			.attr('width', _legend.markSize)
			.attr('height', _legend.markSize)
			.style('fill', function(d) { return _scale.color(_fn.key(d)); });

		// Add the legend text
		gLegendGroupEnter
			.append('text')
			.attr('x', _legend.markSize + 2)
			.attr('y', _legend.markSize - 2)
			.text(function(d) { return _fn.key(d); });

		// Set up events
		gLegendGroupEnter
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut)
			.on('click', _fn.onClick);

		// Position each rect on both enter and update to fully account for changing widths and sizes
		var height, vert;
		gLegendGroupEnter
			// Iterate over all the legend keys to get the max width and store it in gLegendGroup._maxWidth
			.each(function(d, i) {
				if (i === 0) {
					// Reset
					_element.gLegend._maxWidth = this.getBBox().width;
				} else {
					_element.gLegend._maxWidth = Math.max(this.getBBox().width, _element.gLegend._maxWidth);
				}
			})
			.attr('transform', legendTransform);

	}

	// Basic Getters/Setters
	_instance.width = function(v) {
		if(!arguments.length) { return _width; }
		_width = v;
		return _instance;
	};
	_instance.height = function(v) {
		if(!arguments.length) { return _height; }
		_height = v;
		return _instance;
	};

	_instance.innerRadiusRatio = function(v) {
		if(!arguments.length) { return _innerRadiusRatio; }
		_innerRadiusRatio = v;
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
	_instance.value = function(v) {
		if(!arguments.length) { return _fn.value; }
		_fn.value = v;
		_layout.pie.value(v);
		return _instance;
	};
	_instance.label = function(v) {
		if(!arguments.length) { return _fn.label; }
		_fn.label = v;
		return _instance;
	};
	_instance.color = function(v) {
		if(!arguments.length) { return _scale.color; }
		_scale.color = v;
		return _instance;
	};

	_instance.dispatch = function(v) {
		if(!arguments.length) { return _dispatch; }
		return _instance;
	};

	_instance.legend = function(v) {
		if(!arguments.length) { return _legend; }
		_legend = v;
		return _instance;
	};

	return _instance;
}