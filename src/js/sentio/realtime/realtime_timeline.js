sentio.realtime.timeline = sentio_realtime_timeline;

function sentio_realtime_timeline() {
	'use strict';

	// Layout properties
	var _id = 'rt_timeline_' + Date.now();
	var _margin = { top: 20, right: 10, bottom: 20, left: 40 };
	var _height = 100, _width = 600;

	// Default data delay, this is the difference between now and the latest tick shown on the timeline
	var _delay = 0;

	// Interval of the timeline, this is the amount of time being displayed by the timeline
	var _interval = 60000;

	/*
	 * Callback function for hovers over the markers. Invokes this function
	 * with the data from the marker payload
	 */
	var _markerHoverCallback = null;

	// Is the timeline running?
	var _running = false;
	var _timeout = null;

	// Is the timeline running in efficient mode?
	var _fps = 32;

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

	var _yExtent = [undefined, undefined];

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
			markers: undefined
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

	var _data = [], _markers = [];

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

		// Append a container for the plot (space inside the axes)
		_element.g.plot = _element.g.container.append('g').attr('clip-path', 'url(#plot_' + _id + ')');

		// Append the line path group and add the line path
		_element.g.line = _element.g.plot.append('g');
		_element.g.line.append('path').attr('class', 'line');

		// Append a group for the markers
		_element.g.markers = _element.g.container.append('g').attr('class', 'markers').attr('clip-path', 'url(#marker_' + _id + ')');

		// Append groups for the axes
		_element.g.xAxis = _element.g.container.append('g').attr('class', 'x axis');
		_element.g.yAxis = _element.g.container.append('g').attr('class', 'y axis');

		chart.resize();

		return chart;
	};

	/*
	 * Set the chart data
	 */
	chart.data = function(v) {
		if(!arguments.length) { return _data; }
		_data = v;
		_element.g.line.datum(_data);
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
	 * This is the main update loop function. It is called every time the
	 * chart is updating to proceed through time.
	 */ 
	function tick() {
		// If not running, let the loop die
		if(!_running) return;

		chart.redraw();

		// Schedule the next update
		_timeout = window.setTimeout(tick, (_fps > 0)? 1000/_fps : 0);
	}

	/*
	 * Redraw the graphic
	 */
	chart.redraw = function() {
		// Store the current time
		var now = new Date();

		// Update the x domain (to the latest time window)
		_scale.x.domain([now - _delay - _interval, now - _delay]);

		// Update the y domain (based on configuration and data)
		_scale.y.domain(getYExtent(now));

		// Update the plot elements
		updateAxes();
		updateLine();
		updateMarkers();

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
		var path = _element.g.line.select('.line').attr('d', _line);
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
		var markerExit = markerJoin.exit();

		if(_fps < 20 && _fps > 0) {
			markerExit
				.attr('opacity', 1)
				.transition().duration(500/_fps)
				.attr('opacity', 0.1)
				.remove();
		} else {
			markerExit.remove();
		}
	}

	function getYExtent(now){
		// Calculate the domain of the y axis
		var nExtent = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
		_data.forEach(function(element, index){
			var y = _value.y(element);
			var x = _value.x(element);

			if(x < now - _delay && x > now - _delay - _interval) {
				if(nExtent[0] > y) { nExtent[0] = y; }
				if(nExtent[1] < y) { nExtent[1] = y; }
			}
		});

		if(Number.POSITIVE_INFINITY === nExtent[0] && Number.NEGATIVE_INFINITY === nExtent[1]){ nExtent = [0, 10]; }
		if(nExtent[0] >= nExtent[1]) { nExtent[1] = nExtent[0] + 1; }
		nExtent[1] += (nExtent[1] - nExtent[0]) * 0.1;

		if(null != _yExtent){
			if(null != _yExtent[0]) { nExtent[0] = _yExtent[0]; }
			if(null != _yExtent[1]) { nExtent[1] = _yExtent[1]; }
		}

		return nExtent;
	}

	chart.start = function(){
		if(_running){ return; }
		_running = true;

		tick();
	};

	chart.stop = function(){
		_running = false;

		if(_timeout != null) {
			window.clearTimeout(_timeout);
		}
	};

	chart.restart = function(){
		chart.stop();
		chart.start();
	};

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
	chart.interval = function(v){
		if(!arguments.length) { return _interval; }
		_interval = v;
		return chart;
	};
	chart.delay = function(v){
		if(!arguments.length) { return _delay; }
		_delay = v;
		return chart;
	};
	chart.yExtent = function(v){
		if(!arguments.length) { return _yExtent; }
		_yExtent = v;
		return chart;
	};
	chart.fps = function(v){
		if(!arguments.length) { return _fps; }
		_fps = v;
		if(_running) {
			chart.restart();
		}

		return chart;
	};
	chart.markerHover = function(v){
		if(!arguments.length) { return _markerHoverCallback; }
		_markerHoverCallback = v;
		return chart;
	};
	chart.margin = function(v){
		if(!arguments.length) { return _margin; }
		_margin = v;
		return chart;
	};

	return chart;
}