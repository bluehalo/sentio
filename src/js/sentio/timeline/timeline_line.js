sentio.timeline.line = sentio_timeline_line;

function sentio_timeline_line() {
	'use strict';

	// Layout properties
	var _id = 'timeline_line_' + Date.now();
	var _margin = { top: 10, right: 10, bottom: 20, left: 40 };
	var _height = 100, _width = 600;

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
			defaultValue: [now - 60000*5, now],
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
			plots: undefined,
			xAxis: undefined,
			yAxis: undefined,
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
	function _instance(selection){}

	/*
	 * Initialize the chart (should only call this once). Performs all initial chart
	 * creation and setup
	 */
	_instance.init = function(container){
		// Create the SVG element
		_element.svg = container.append('svg');

		// Add the defs and add the clip path definition
		_element.plotClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'plot_' + _id).append('rect');
		_element.markerClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'marker_' + _id).append('rect');

		// Append a container for everything
		_element.g.container = _element.svg.append('g');

		// Append the path group (which will have the clip path and the line path
		_element.g.plots = _element.g.container.append('g').attr('class', 'plots').attr('clip-path', 'url(#plot_' + _id + ')');

		// Append a group for the markers
		_element.g.markers = _element.g.container.append('g').attr('class', 'markers').attr('clip-path', 'url(#marker_' + _id + ')');

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

		_instance.resize();

		return _instance;
	};

	/*
	 * Set the _instance data
	 */
	_instance.data = function(v) {
		if(!arguments.length) { return _data; }
		_data = v;

		return _instance;
	};

	/*
	 * Set the markers data
	 */
	_instance.markers = function(v) {
		if(!arguments.length) { return _markers; }
		_markers = v;
		return _instance;
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
	_instance.resize = function() {
		var now = Date.now();

		// Set up the scales
		_scale.x.range([0, Math.max(0, _width - _margin.left - _margin.right)]);
		_scale.y.range([Math.max(0, _height - _margin.top - _margin.bottom), 0]);

		// Append the clip path
		_element.plotClipPath
			.attr('transform', 'translate(0, -' + _margin.top + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.bottom));
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

		return _instance;
	};

	// Multi Extent Combiner
	function multiExtent(data, extent) {
		var nExtent;
		data.forEach(function(element) {
			var tExtent = extent.getExtent(element.data);
			if(!nExtent){
				nExtent = tExtent;
			} else {
				nExtent[0] = Math.min(nExtent[0], tExtent[0]);
				nExtent[1] = Math.max(nExtent[1], tExtent[1]);
			}
		});
		if(null == nExtent) {
			nExtent = extent.getExtent([]);
		}
		return nExtent;
	}

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {
		// Need to grab the filter extent before we change anything
		var filterExtent = (_filter.enabled && !_filter.brush.empty())? _filter.brush.extent() : undefined;

		// Update the x domain (to the latest time window)
		_scale.x.domain(multiExtent(_data, _extent.x));

		// Update the y domain (based on configuration and data)
		_scale.y.domain(multiExtent(_data, _extent.y));

		// Update the plot elements
		updateAxes();
		updateLine();
		updateMarkers();
		updateFilter(filterExtent);

		return _instance;
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
		// Join
		var plotJoin = _element.g.plots
			.selectAll('.plot')
			.data(_data, function(d) { 
				return d.key; 
			});

		// Enter
		var plotEnter = plotJoin.enter().append('g')
			.attr('class', 'plot');

		plotEnter.append('g').append('path').attr('class', function(d) { return ((d.cssClass)? d.cssClass : '') + ' line'; });
		plotEnter.append('g').append('path').attr('class', function(d) { return ((d.cssClass)? d.cssClass : '') + ' area'; });

		var lineUpdate = plotJoin.select('.line');
		var areaUpdate = plotJoin.select('.area');

		// Update
		lineUpdate.datum(function(d) { return d.data; }).attr('d', _line);
		areaUpdate.datum(function(d) { return d.data; }).attr('d', _area.y0(_scale.y.range()[0]));

		// Exit
		var plotExit = plotJoin.exit();
		plotExit.remove();

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

	function updateFilter(extent) {
		// If filter is enabled, update the brush
		if(_filter.enabled) {
			_filter.brush.x(_scale.x);

			var nExtent = multiExtent(_data, _extent.x);

			if(null != extent) {
				// Interset extent and new extent
				nExtent = [new Date(Math.max(nExtent[0], extent[0])), new Date(Math.min(nExtent[1], extent[1]))];

				if(extent[0].getTime() == nExtent[0].getTime() && extent[1].getTime() == nExtent[1].getTime()) {
					// The brush hasn't changed, so reassert it
					_filter.brush.extent(extent);
				} else if(nExtent[0] >= nExtent[1]) {
					// The brush is empty or invalid, so clear it
					_filter.brush.clear();
					_filter.brush.event(_element.g.brush);
				} else {
					// The brush has changed but is valid, so reassert a clipped brush
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
	_instance.width = function(v){
		if(!arguments.length) { return _width; }
		_width = v;
		return _instance;
	};
	_instance.height = function(v){
		if(!arguments.length) { return _height; }
		_height = v;
		return _instance;
	};
	_instance.margin = function(v){
		if(!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};
	_instance.interpolation = function(v){
		if(!arguments.length) { return _line.interpolate(); }
		_line.interpolate(v);
		_area.interpolate(v);
		return _instance;
	};
	_instance.xAxis = function(v){
		if(!arguments.length) { return _axis.x; }
		_axis.x = v;
		return _instance;
	};
	_instance.yAxis = function(v){
		if(!arguments.length) { return _axis.y; }
		_axis.y = v;
		return _instance;
	};
	_instance.xScale = function(v){
		if(!arguments.length) { return _scale.x; }
		_scale.x = v;
		if(null != _axis.x) {
			_axis.x.scale(v);
		}
		return _instance;
	};
	_instance.yScale = function(v){
		if(!arguments.length) { return _scale.y; }
		_scale.y = v;
		if(null != _axis.y) {
			_axis.y.scale(v);
		}
		return _instance;
	};
	_instance.xValue = function(v){
		if(!arguments.length) { return _value.x; }
		_value.x = v;
		return _instance;
	};
	_instance.yValue = function(v){
		if(!arguments.length) { return _value.y; }
		_value.y = v;
		return _instance;
	};
	_instance.yExtent = function(v){
		if(!arguments.length) { return _extent.y; }
		_extent.y = v;
		return _instance;
	};
	_instance.xExtent = function(v){
		if(!arguments.length) { return _extent.x; }
		_extent.x = v;
		return _instance;
	};
	_instance.markerXValue = function(v){
		if(!arguments.length) { return _markerValue.x; }
		_markerValue.x = v;
		return _instance;
	};
	_instance.markerLabelValue = function(v){
		if(!arguments.length) { return _markerValue.label; }
		_markerValue.label = v;
		return _instance;
	};
	_instance.markerHover = function(v) {
		if(!arguments.length) { return _markerHoverCallback; }
		_markerHoverCallback = v;
		return _instance;
	};
	_instance.filter = function(v) {
		if(!arguments.length) { return _filter.dispatch; }
		_filter.enabled = v;
		return _instance;
	};

	return _instance;
}