/*! sentio Version: 0.3.12 */
var sentio = {};
var sentio_util = sentio.util = {};
sentio.util.extent = sentio_util_extent;

function sentio_util_extent(config) {
	'use strict';

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {
		defaultValue: [0, 10],
		overrideValue: undefined
	};

	var _fn = {
		getValue: function(d) { return d; },
		filter: function(d) { return true; }
	};


	/**
	 * Private Functions
	 */

	function setDefaultValue(v) {
		if(null != v && 2 !== v.length && !Number.isNaN(v[0]) && !Number.isNaN(v[1]) && v[0] < v[1]) {
			throw new Error('Default extent must be a two element ordered array of numbers');
		}
		_config.defaultValue = v;
	}

	function setOverrideValue(v) {
		if(null != v && 2 !== v.length) {
			throw new Error('Extent override must be a two element array or null/undefined');
		}
		_config.overrideValue = v;
	}

	function setGetValue(v) {
		if(typeof v !== 'function') {
			throw new Error('Value getter must be a function');
		}

		_fn.getValue = v;
	}

	function setFilter(v) {
		if(typeof v !== 'function') {
			throw new Error('Filter must be a function');
		}


		_fn.filter = v;
	}

	/*
	 * Constructor/initialization method
	 */
	function extent(extentConfig) {
		if(null != extentConfig) {
			if(null != extentConfig.defaultValue) { setDefaultValue(extentConfig.defaultValue); }
			if(null != extentConfig.overrideValue) { setOverrideValue(extentConfig.overrideValue); }
			if(null != extentConfig.getValue) { setGetValue(extentConfig.getValue); }
			if(null != extentConfig.filter) { setFilter(extentConfig.filter); }
		}
	}


	/**
	 * Public API
	 */

	/*
	 * Get/Set the default value for the extent
	 */
	extent.defaultValue = function(v) {
		if(!arguments.length) { return _config.defaultValue; }
		setDefaultValue(v);
		return extent;
	};

	/*
	 * Get/Set the override value for the extent
	 */
	extent.overrideValue = function(v) {
		if(!arguments.length) { return _config.overrideValue; }
		setOverrideValue(v);
		return extent;
	};

	/*
	 * Get/Set the value accessor for the extent
	 */
	extent.getValue = function(v) {
		if(!arguments.length) { return _fn.getValue; }
		setGetValue(v);
		return extent;
	};

	/*
	 * Get/Set the filter fn for the extent
	 */
	extent.filter = function(v) {
		if(!arguments.length) { return _fn.filter; }
		setFilter(v);
		return extent;
	};

	/*
	 * Calculate the extent given some data.
	 * - Default values are used in the absence of data
	 * - Override values are used to clamp or extend the extent
	 */
	extent.getExtent = function(data) {
		var toReturn;
		var ov = _config.overrideValue;

		// Check to see if we need to calculate the extent
		if(null == ov || null == ov[0] || null == ov[1]) {
			// Since the override isn't complete, we need to calculate the extent
			toReturn = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
			var foundData = false;

			if(null != data) {
				// Iterate over each element of the data
				data.forEach(function(element) {
					// If the element passes the filter, then update the extent
					if(_fn.filter(element)) {
						foundData = true;
						var v = _fn.getValue(element);
						toReturn[0] = Math.min(toReturn[0], v);
						toReturn[1] = Math.max(toReturn[1], v);
					}
				});
			}

			// If we didn't find any data, use the default values
			if(!foundData) {
				toReturn = _config.defaultValue;
			}

			// Apply the overrides
			// - Since we're in this conditional, only one or zero overrides were specified
			if(null != ov) {
				if(null != ov[0]) {
					// Set the lower override
					toReturn[0] = ov[0];
					if(toReturn[0] > toReturn[1]) {
						toReturn[1] = toReturn[0];
					}
				}
				if(null != ov[1]) { 
					toReturn[1] = ov[1];
					if(toReturn[1] < toReturn[0]) {
						toReturn[0] = toReturn[1];
					}
				}
			}
		} else {
			// Since the override is fully specified, use it
			toReturn = ov;
		}

		return toReturn;
	};


	// Initialize the model
	extent(config);

	return extent;
}
var sentio_model = sentio.model = {};
sentio.model.bins = sentio_model_bins;

function sentio_model_bins(config) {
	'use strict';

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {
		// The number of bins in our model
		count: 1,

		// The size of a bin in key value units
		size: undefined,

		// The min and max bins
		lwm: undefined,
		hwm: undefined
	};

	var _fn = {
		// The default function for creating the seed value for a bin
		createSeed: function() { return []; },

		// The default key function
		getKey: function(d) { return d; },

		// The default value function
		getValue: function(d) { return d; },

		// The default function for updating a bin given a new value
		updateBin: function(bin, d) { bin[1].push(d); }
	};

	// The data (an array of object containers)
	var _data = [];


	/**
	 * Private Functions
	 */

	// Get the index given the value
	function getIndex(v) {
		if(null == _config.size || null == _config.lwm) {
			return 0;
		}

		return Math.floor((v - _config.lwm)/_config.size);
	}

	function calculateHwm() {
		_config.hwm = _config.lwm + (_config.count * _config.size);
	}

	function updateState() {
		// drop stuff below the lwm
		while(_data.length > 0 && _data[0][0] < _config.lwm) {
			_data.shift();
		}

		// drop stuff above the hwm
		while(_data.length > 0 && _data[_data.length - 1][0] >= _config.hwm) {
			_data.pop();
		}

		// if we emptied the array, add an element for the lwm
		if(_data.length === 0) {
			_data.push([_config.lwm, _fn.createSeed()]);
		}

		// fill in any missing values from the lowest bin to the lwm
		for(var i=_data[0][0] - _config.size; i >= _config.lwm; i -= _config.size) {
			_data.unshift([i, _fn.createSeed()]);
		}

		// pad above the hwm
		while(_data[_data.length - 1][0] < _config.hwm - _config.size) {
			_data.push([_data[_data.length-1][0] + _config.size, _fn.createSeed()]);
		}
	}

	function addData(dataToAdd) {
		dataToAdd.forEach(function(element) {
			var i = getIndex(_fn.getKey(element));
			if(i >= 0 && i < _data.length) {
				_fn.updateBin(_data[i], _fn.getValue(element));
			}
		});
	}

	function clearData() {
		_data.length = 0;
	}


	/*
	 * Constructor/initialization method
	 */
	function model(binConfig) {
		if(null == binConfig || null == binConfig.size || null == binConfig.count || null == binConfig.lwm) {
			throw new Error('You must provide an initial size, count, and lwm');
		}
		_config.size = binConfig.size;
		_config.count = binConfig.count;
		_config.lwm = binConfig.lwm;

		if(null != binConfig.createSeed) { _fn.createSeed = binConfig.createSeed; }
		if(null != binConfig.getKey) { _fn.getKey = binConfig.getKey; }
		if(null != binConfig.getValue) { _fn.getValue = binConfig.getValue; }
		if(null != binConfig.updateBin) { _fn.updateBin = binConfig.updateBin; }

		calculateHwm();
		updateState();
	}


	/**
	 * Public API
	 */

	/*
	 * Resets the model with the new data
	 */
	model.set = function(data) {
		clearData();
		updateState();
		addData(data);
		return model;
	};

	/*
	 * Clears the data currently in the bin model
	 */
	model.clear = function() {
		clearData();
		updateState();
		return model;
	};

	/*
	 * Add an array of data objects to the bins
	 */
	model.add = function(dataToAdd) {
		addData(dataToAdd);
		return model;
	};

	/*
	 * Get/Set the low water mark value
	 */
	model.lwm = function(v) {
		if(!arguments.length) { return _config.lwm; }

		var oldLwm = _config.lwm;
		_config.lwm = Number(v);

		calculateHwm();

		if((oldLwm - _config.lwm) % _config.size !== 0) {
			// the difference between watermarks is not a multiple of the bin size, so we need to reset
			clearData();
		}

		updateState();

		return model;
	};

	/*
	 * Get the high water mark
	 */
	model.hwm = function() {
		return _config.hwm;
	};

	/*
	 * Get/Set the key function used to determine the key value for indexing into the bins
	 */
	model.getKey = function(v) {
		if(!arguments.length) { return _fn.getKey; }
		_fn.getKey = v;

		clearData();
		updateState();

		return model;
	};

	/*
	 * Get/Set the value function for determining what value is added to the bin
	 */
	model.getValue = function(v) {
		if(!arguments.length) { return _fn.getValue; }
		_fn.getValue = v;

		clearData();
		updateState();

		return model;
	};

	/*
	 * Get/Set the Update bin function for determining how to update the state of a bin when a new value is added to it
	 */
	model.updateBin = function(v) {
		if(!arguments.length) { return _fn.updateBin; }
		_fn.updateBin = v;

		clearData();
		updateState();

		return model;
	};

	/*
	 * Get/Set the seedFn for populating 
	 */
	model.createSeed = function(v) {
		if(!arguments.length) { return _fn.createSeed; }
		_fn.createSeed = v;

		clearData();
		updateState();

		return model;
	};

	/*
	 * Get/Set the bin size
	 */
	model.size = function(v) {
		if(!arguments.length) { return _config.size; }

		if(Number(v) < 1) {
			throw new Error('Bin size must be a positive integer');
		}

		// Only change stuff if the size actually changes
		if(Number(v) !== _config.size) {
			_config.size = Number(v);
			calculateHwm();
			clearData();
			updateState();
		}

		return model;
	};

	/*
	 * Get/Set the bin count
	 */
	model.count = function(v) {
		if(!arguments.length) { return _config.count; }

		if(Number(v) < 1) {
			throw new Error('Bin count must be a positive integer');
		}

		// Only change stuff if the count actually changes
		if(Number(v) !== _config.count) {
			_config.count = Math.floor(Number(v));
			calculateHwm();
			updateState();
		}

		return model;
	};

	/*
	 * Accessor for the bins of data
	 */
	model.bins = function() {
		return _data;
	};

	// Initialize the model
	model(config);

	return model;
}
var sentio_controller = sentio.controller = {};
sentio.controller.rtBins = sentio_controller_rtBins;

/*
 * Controller wrapper for the bin model. Assumes binSize is in milliseconds.
 * Every time binSize elapses, updates the lwm to keep the bins shifting.
 */
function sentio_controller_rtBins(config) {
	'use strict';

	/**
	 * Private variables
	 */
	var _config = {
		delay: 0,
		binSize: 0,
		binCount: 0
	};

	// The bins
	var _model;
	var _running;

	/**
	 * Private Functions
	 */

	function _calculateLwm() {
		// Assume the hwm is now plus two binSize
		var hwm = Date.now() + 2*_model.size();

		// Trunc the hwm down to a round value based on the binSize
		hwm = Math.floor(hwm/_model.size()) * _model.size();

		// Derive the lwm from the hwm
		var lwm = hwm - _model.size() * _model.count();

		return lwm;
	}

	function _update() {
		if(_running === true) {
			// need to update the lwm
			_model.lwm(_calculateLwm());
			window.setTimeout(_update, _model.size());
		}
	}

	function _start() {
		if(!_running) {
			// Start the update loop
			_running = true;
			_update();
		}
	}

	function _stop() {
		// Setting running to false will stop the update loop
		_running = false;
	}

	// create/init method
	function controller(rtConfig) {
		if(null == rtConfig || null == rtConfig.binCount || null == rtConfig.binSize) {
			throw new Error('You must provide an initial binSize and binCount');
		}

		_config.binSize = rtConfig.binSize;
		_config.binCount = rtConfig.binCount;

		if(null != rtConfig.delay) {
			_config.delay = rtConfig.delay;
		}

		_model = sentio.model.bins({
			size: _config.binSize,
			count: _config.binCount + 2,
			lwm: 0
		});
		_model.lwm(_calculateLwm());

		_start();
	}



	/**
	 * Public API
	 */

	/*
	 * Get the model bins
	 */
	controller.model = function() {
		return _model;
	};

	controller.bins = function() {
		return _model.bins();
	};

	controller.start = function() {
		_start();
		return controller;
	};

	controller.stop = function() {
		_stop();
		return controller;
	};

	controller.running = function() {
		return _running;
	};

	controller.add = function(v) {
		_model.add(v);
		return controller;
	};

	controller.clear = function() {
		_model.clear();
		return controller;
	};

	controller.binSize = function(v) {
		if(!arguments.length) { return _config.binSize; }

		if(Number(v) < 1) {
			throw new Error('Bin size must be a positive integer');
		}

		_config.binSize = v;
		_model.size(v);
		_model.lwm(_calculateLwm());

		return controller;
	};

	controller.binCount = function(v) {
		if(!arguments.length) { return _config.binCount; }

		if(Number(v) < 1) {
			throw new Error('Bin count must be a positive integer');
		}

		_config.binCount = v;
		_model.count(v + 2);
		_model.lwm(_calculateLwm());

		return controller;
	};

	// Initialize the layout
	controller(config);

	return controller;
}
var sentio_timeline = sentio.timeline = {};
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
var sentio_realtime = sentio.realtime = {};
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