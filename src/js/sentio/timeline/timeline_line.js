sentio.timeline.line = sentio_timeline_line;

function sentio_timeline_line() {
	'use strict';

	// Layout properties
	var _id = 'timeline_line_' + Date.now();
	var _margin = { top: 10, right: 10, bottom: 20, left: 40 };
	var _height = 100, _width = 600;

	// Duration of the transition, also this is the minimum buffer time
	var _duration = 300;

	/*
	 * Callback function for hovers over the markers. Invokes this function
	 * with the data from the marker payload
	 */
	var _markerHoverCallback = null;

	// Default accessors for the dimensions of the data
	var _value = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return d[1]; }
	};

	// Accessors for the positions of the markers
	var _markerValue = {
		x: function(d, i) { return d[0]; },
		label: function(d, i) { return d[1]; }
	};

	var now = Date.now();
	var _extent = {
		x: sentio.util.extent({
			defaultValue: [new Date(now - 60000*5), new Date(now)],
			getValue: function(d) { return d[0]; }
		}),
		y: sentio.util.extent({
			getValue: function(d) { return d[1]; }
		})
	};

	// Default scales for x and y dimensions
	var _scale = {
		x: d3.time.scale(),
		y: d3.scale.linear()
	};

	// Default Axis definitions
	var _axis = {
		x: d3.svg.axis().scale(_scale.x).orient('bottom'),
		y: d3.svg.axis().scale(_scale.y).orient('left').ticks(3)
	};

	// g elements
	var _element = {
		svg: undefined,
		g: {
			container: undefined,
			plot: undefined,
			xAxis: undefined,
			yAxis: undefined,
			line: undefined,
			area: undefined,
			markers: undefined,
			brush: undefined
		},
		plotClipPath: undefined,
		markerClipPath: undefined
	};

	// Line generator for the plot
	var _line = d3.svg.line().interpolate('linear');
	_line.x(function(d, i) {
		return _scale.x(_value.x(d, i));
	});
	_line.y(function(d, i) {
		return _scale.y(_value.y(d, i));
	});

	// Area generator for the plot
	var _area = d3.svg.area().interpolate('linear');
	_area.x(function(d, i) {
		return _scale.x(_value.x(d, i));
	});
	_area.y1(function(d, i) {
		return _scale.y(_value.y(d, i));
	});

	// Brush filter
	var _filter = {
		enabled: false,
		brush: d3.svg.brush(),
		dispatch: d3.dispatch('filter', 'filterstart', 'filterend')
	};

	var _data = [], _markers = [];

	function brushstart() {
		var isEmpty = _filter.brush.empty();
		var min = (isEmpty)? undefined : _filter.brush.extent()[0].getTime();
		var max = (isEmpty)? undefined : _filter.brush.extent()[1].getTime();

		_filter.dispatch.filterstart([isEmpty, min, max]);
	}
	function brush() {
		var isEmpty = _filter.brush.empty();
		var min = (isEmpty)? undefined : _filter.brush.extent()[0].getTime();
		var max = (isEmpty)? undefined : _filter.brush.extent()[1].getTime();

		_filter.dispatch.filter([isEmpty, min, max]);
	}
	function brushend() {
		var isEmpty = _filter.brush.empty();
		var min = (isEmpty)? undefined : _filter.brush.extent()[0].getTime();
		var max = (isEmpty)? undefined : _filter.brush.extent()[1].getTime();

		_filter.dispatch.filterend([isEmpty, min, max]);
	}

	// Chart create/init method
	function chart(selection){}

	/*
	 * Initialize the chart (should only call this once). Performs all initial chart
	 * creation and setup
	 */
	chart.init = function(container){
		// Create the SVG element
		_element.svg = container.append('svg');

		// Add the defs and add the clip path definition
		_element.plotClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'plot_' + _id).append('rect');
		_element.markerClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'marker_' + _id).append('rect');

		// Append a container for everything
		_element.g.container = _element.svg.append('g');

		// Append the path group (which will have the clip path and the line path
		_element.g.plot = _element.g.container.append('g').attr('clip-path', 'url(#' + _id + ')');

		// Append the line path groups
		_element.g.line = _element.g.plot.append('g');
		_element.g.line.append('path').attr('class', 'line');
		_element.g.area = _element.g.plot.append('g');
		_element.g.area.append('path').attr('class', 'area');

		// Append a group for the markers
		_element.g.markers = _element.g.container.append('g').attr('class', 'markers').attr('clip-path', 'url(#' + _id + ')');

		// If the filter is enabled, add it
		if(_filter.enabled) {
			_element.g.brush = _element.g.container.append('g').attr('class', 'x brush');
			_element.g.brush.call(_filter.brush)
				.selectAll('rect').attr('y', -6);
			_filter.brush
				.on('brushend', brushend)
				.on('brushstart', brushstart)
				.on('brush', brush);
		}

		// Append groups for the axes
		_element.g.xAxis = _element.g.container.append('g').attr('class', 'x axis');
		_element.g.yAxis = _element.g.container.append('g').attr('class', 'y axis');

		chart.resize();

		return chart;
	};

	/*
	 * Set the chart data
	 */
	chart.data = function(value) {
		if(!arguments.length) { return _data; }
		_data = value;
		_element.g.line.datum(_data);
		_element.g.area.datum(_data);
		return chart;
	};

	/*
	 * Set the markers data
	 */
	chart.markers = function(v) {
		if(!arguments.length) { return _markers; }
		_markers = v;
		return chart;
	};

	/*
	 * Accepts the hovered element and conditionally invokes
	 * the marker hover callback if both the function and data
	 * are non-null
	 */
	function invokeMarkerCallback(d) {
		// fire an event with the payload
		if(null != _markerHoverCallback) {
			_markerHoverCallback(d);
		}
	}

	/*
	 * Updates all the elements that depend on the size of the various components
	 */
	chart.resize = function() {
		var now = Date.now();

		// Set up the scales
		_scale.x.range([0, Math.max(0, _width - _margin.left - _margin.right)]);
		_scale.y.range([Math.max(0, _height - _margin.top - _margin.bottom), 0]);

		// Append the clip path
		_element.plotClipPath
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.top - _margin.bottom));
		_element.markerClipPath
			.attr('transform', 'translate(0, -' + _margin.top + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.bottom));

		// Now update the size of the svg pane
		_element.svg.attr('width', _width).attr('height', _height);

		// Update the positions of the axes
		_element.g.xAxis.attr('transform', 'translate(0,' + _scale.y.range()[0] + ')');
		_element.g.yAxis.attr('class', 'y axis');

		// update the margins on the main draw group
		_element.g.container.attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

		return chart;
	};

	/*
	 * Redraw the graphic
	 */
	chart.redraw = function() {
		// Update the x domain (to the latest time window)
		_scale.x.domain(_extent.x.getExtent(_data));

		// Update the y domain (based on configuration and data)
		_scale.y.domain(_extent.y.getExtent(_data));

		// Update the plot elements
		updateAxes();
		updateLine();
		updateMarkers();
		updateFilter();

		return chart;
	};

	function updateAxes() {
		if(null != _axis.x) {
			_element.g.xAxis.call(_axis.x);
		}
		if(null != _axis.y) {
			_element.g.yAxis.call(_axis.y);
		}
	}

	function updateLine() {
		// Select and draw the line
		_element.g.line.select('.line').attr('d', _line);
		_element.g.area.select('.area').attr('d', _area.y0(_scale.y.range()[0]));
	}

	function updateMarkers() {
		// Join
		var markerJoin = _element.g.markers
			.selectAll('.marker')
			.data(_markers, function(d) { 
				return _markerValue.x(d); 
			});

		// Enter
		var markerEnter = markerJoin.enter().append('g')
			.attr('class', 'marker')
			.on('mouseover', invokeMarkerCallback);

		var lineEnter = markerEnter.append('line');
		var textEnter = markerEnter.append('text');

		var lineUpdate = markerJoin.select('line');
		var textUpdate = markerJoin.select('text');

		lineEnter
			.attr('y1', function(d) { return _scale.y.range()[1]; })
			.attr('y2', function(d) { return _scale.y.range()[0]; });

		textEnter
			.attr('dy', '0em')
			.attr('y', -3)
			.attr('text-anchor', 'middle')
			.text(function(d) { return _markerValue.label(d); });

		// Update
		lineUpdate
			.attr('x1', function(d) { return _scale.x(_markerValue.x(d)); })
			.attr('x2', function(d) { return _scale.x(_markerValue.x(d)); });

		textUpdate
			.attr('x', function(d) { return _scale.x(_markerValue.x(d)); });

		// Exit
		var markerExit = markerJoin.exit().remove();

	}

	function updateFilter() {
		// If filter is enabled, update the brush
		if(_filter.enabled) {
			_filter.brush.x(_scale.x);

			var nExtent = _extent.x.getExtent(_data);
			var extent;
			if(!_filter.brush.empty()) {
				extent = _filter.brush.extent();
			}

			if(null != extent) {
				if(extent[0].getTime() == nExtent[0].getTime() && extent[1].getTime() == nExtent[1].getTime()) {
					// Reassert the brush, but do not fire the event
					_filter.brush.extent(nExtent);
				} else if(nExtent[0] >= nExtent[1]) {
					// The brush is empty or invalid, so clear it
					_filter.brush.clear();
					_filter.brush.event(_element.g.brush);
				} else {
					// Reassert the brush and fire the event
					_filter.brush.extent(nExtent);
					_filter.brush.event(_element.g.brush);
				}
			}

			_element.g.brush
				.call(_filter.brush)
				.selectAll('rect')
					.attr('height', _height - _margin.top - _margin.bottom + 7);
		}
	}

	// Basic Getters/Setters
	chart.width = function(v){
		if(!arguments.length) { return _width; }
		_width = v;
		return chart;
	};
	chart.height = function(v){
		if(!arguments.length) { return _height; }
		_height = v;
		return chart;
	};
	chart.xAxis = function(v){
		if(!arguments.length) { return _axis.x; }
		_axis.x = v;
		return chart;
	};
	chart.yAxis = function(v){
		if(!arguments.length) { return _axis.y; }
		_axis.y = v;
		return chart;
	};
	chart.xScale = function(v){
		if(!arguments.length) { return _scale.x; }
		_scale.x = v;
		if(null != _axis.x) {
			_axis.x.scale(v);
		}
		return chart;
	};
	chart.yScale = function(v){
		if(!arguments.length) { return _scale.y; }
		_scale.y = v;
		if(null != _axis.y) {
			_axis.y.scale(v);
		}
		return chart;
	};
	chart.interpolation = function(v){
		if(!arguments.length) { return _line.interpolate(); }
		_line.interpolate(v);
		_area.interpolate(v);
		return chart;
	};
	chart.xValue = function(v){
		if(!arguments.length) { return _value.x; }
		_value.x = v;
		return chart;
	};
	chart.yValue = function(v){
		if(!arguments.length) { return _value.y; }
		_value.y = v;
		return chart;
	};
	chart.markerXValue = function(v){
		if(!arguments.length) { return _markerValue.x; }
		_markerValue.x = v;
		return chart;
	};
	chart.markerLabelValue = function(v){
		if(!arguments.length) { return _markerValue.label; }
		_markerValue.label = v;
		return chart;
	};
	chart.yExtent = function(v){
		if(!arguments.length) { return _extent.y; }
		_extent.y = v;
		return chart;
	};
	chart.xExtent = function(v){
		if(!arguments.length) { return _extent.x; }
		_extent.x = v;
		return chart;
	};
	chart.duration = function(v) {
		if(!arguments.length) { return _duration; }
		_duration = v;
		return chart;
	};
	chart.filter = function(v) {
		if(!arguments.length) { return _filter.dispatch; }
		_filter.enabled = v;
		return chart;
	};

	return chart;
}