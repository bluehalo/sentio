/*! sentio Version: 0.2.4 */
var sentio = {};
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
	var _playing;

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
		if(_playing === true) {
			// need to update the lwm
			_model.lwm(_calculateLwm());
			window.setTimeout(_update, _model.size());
		}
	}

	function _play() {
		if(!_playing) {
			// Start the update loop
			_playing = true;
			_update();
		}
	}

	function _pause() {
		// Setting playing to false will pause the update loop
		_playing = false;
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

		_play();
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

	controller.play = function() {
		_play();
		return controller;
	};

	controller.pause = function() {
		_pause();
		return controller;
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
	var id = 'timeline_clip_' + Date.now();
	var margin = { top: 10, right: 10, bottom: 20, left: 40 };
	var height = 100, width = 600;

	// Duration of the transition, also this is the minimum buffer time
	var duration = 300;

	/**
	 * Callback function for hovers over the markers. Invokes this function
	 * with the d[2] data from the marker payload
	 */
	var markerHoverCallback = null;

	// Default accessors for the dimensions of the data
	var value = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return d[1]; }
	};

	var xExtent = [undefined, undefined];
	var yExtent = [undefined, undefined];

	// Default scales for x and y dimensions
	var scale = {
		x: d3.time.scale(),
		y: d3.scale.linear()
	};

	// Default Axis definitions
	var axis = {
		x: d3.svg.axis().scale(scale.x).orient('bottom'),
		y: d3.svg.axis().scale(scale.y).orient('left').ticks(4)
	};

	// Line generator for the plot
	var line = d3.svg.line().interpolate('linear');
	line.x(function(d, i) {
		return scale.x(value.x(d, i));
	});
	line.y(function(d, i) {
		return scale.y(value.y(d, i));
	});

	// Area generator for the plot
	var area = d3.svg.area().interpolate('linear');
	area.x(function(d, i) {
		return scale.x(value.x(d, i));
	});
	area.y1(function(d, i) {
		return scale.y(value.y(d, i));
	});

	// Brush filter
	var filter = {
		enabled: false,
		brush: d3.svg.brush(),
		dispatch: d3.dispatch('filter', 'filterstart', 'filterend')
	};

	var element = {
		svg: undefined,
		g: {
			container: undefined,
			xAxis: undefined,
			yAxis: undefined,
			plot: undefined,
			markers: undefined,
			brush: undefined
		},
		clipPath: undefined
	};

	var data = [], markers = [];

	// Chart create/init method
	function chart(selection){}

	// Perform all initial chart construction and setup
	chart.init = function(container){
		// Create the SVG element
		element.svg = container.append('svg');

		// Add the defs and add the clip path definition
		element.clipPath = element.svg.append('defs').append('clipPath').attr('id', id).append('rect');

		// Append a container for everything
		element.g.container = element.svg.append('g');

		// Append the path group (which will have the clip path and the line path
		element.g.plot = element.g.container.append('g').attr('clip-path', 'url(#' + id + ')');
		element.g.plot.append('path').attr('class', 'area');
		element.g.plot.append('path').attr('class', 'line');

		element.g.markers = element.g.container.append('g').attr('class', 'markers').attr('clip-path', 'url(#' + id + ')');

		// If the filter is enabled, add it
		if(filter.enabled) {
			element.g.brush = element.g.container.append('g').attr('class', 'x brush');
			element.g.brush.call(filter.brush)
				.selectAll('rect').attr('y', -6);
			filter.brush
				.on('brushend', brushend)
				.on('brushstart', brushstart)
				.on('brush', brush);
		}

		// Append groups for the axes
		element.g.xAxis = element.g.container.append('g').attr('class', 'x axis');
		element.g.yAxis = element.g.container.append('g').attr('class', 'y axis');


		return chart;
	};

	// Update the chart data
	chart.data = function(value) {
		if(!arguments.length) { return data; }
		data = value;
		element.g.plot.datum(data);
		return chart;
	};

	/**
	 * Accepts the hovered element and conditionally invokes
	 * the marker hover callback if both the function and data
	 * are non-null
	 */
	function invokeMarkerCallback(d) {
		// fire an event with the payload from d[2]
		if(null != d[2] && null != markerHoverCallback) {
			markerHoverCallback(d[2]);
		}
	}

	/**
	 * Draws the appropriate marker lines, whether
	 * coming from enter or update of data
	 */
	function drawMarkerLines(selection) {
		selection
			.attr("x1", function(d) {
				return scale.x(d[0]);
			})
			.attr("x2", function(d) {
				return scale.x(d[0]);
			})
			.attr("y1", scale.y.range()[1])
			.attr("y2", scale.y.range()[0])
			.on('mouseover', invokeMarkerCallback);
	}
	
	/**
	 * Draws the appropriate marker text, whether
	 * coming from enter or update of data
	 */
	function drawMarkerText(selection) {
		
		var ySize = scale.y.range()[0] - scale.y.range()[1];
		ySize = ySize * 0.2;
		
		selection
			.attr("x", function(d) {
				return scale.x(d[0]);
			})
			.attr("y", ySize)
			.text(function(d) { return d[1]; })
			.on('mouseover', invokeMarkerCallback);
	}
	
	function redrawMarkers() {
		element.g.markers
			.selectAll('.marker')
			.attr('transform', null)
			// if any marker is outside the X-window, mark it for deletion
			.attr('delete', function(d) {
				return scale.x(d[0]) < 0;
			});
		
		// Fade out and remove markers with lines outside of range
		element.g.markers.selectAll('[delete=true]')
			.attr('opacity', 1)
			.transition(500)
			.attr('opacity', 0)
			.remove();
		
		drawMarkerLines( element.g.markers.selectAll('line') );
		drawMarkerText( element.g.markers.selectAll('text') );
		
	}
	
	// Update the chart markers
	chart.markers = function(value) {
		if(!arguments.length) { return markers; }
		markers = value;
		
		if(markers.length === 0) {
			return chart;
		}
		
		// remove all current markers in favor of the new set
		element.g.markers.selectAll('.marker')
			.interrupt().remove();
		
		// add data to the container of markers
		var markData = element.g.markers
		  .selectAll('.marker')
		    .data(markers)
		    .enter();
		
		/*
		 * markerGroup is a collection of the line
		 * and label for a particular marker
		 */
		var markerGroup = markData.append('g')
		    .attr('class', 'marker');
		
		// Add the line to the marker group
		drawMarkerLines(markerGroup.append('line') );
		
		// Text can show on hover or always
		drawMarkerText( markerGroup.append('text') );
		
		return chart;
	};

	chart.redraw = function() {
		// Set up the scales
		scale.x.range([0, width - margin.left - margin.right]);
		scale.y.range([height - margin.top - margin.bottom, 0]);

		// Append the clip path
		element.clipPath
			.attr('width', width - margin.left - margin.right)
			.attr('height', height - margin.top - margin.bottom);

		// Now update the size of the svg pane
		element.svg.attr('width', width).attr('height', height);

		// Append groups for the axes
		element.g.xAxis.attr('transform', 'translate(0,' + scale.y.range()[0] + ')');

		// update the margins on the main draw group
		element.g.container.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		// Update the domains of the scales
		scale.x.domain(getExtent(value.x, xExtent, [Date.now() - 60000, Date.now()]));
		scale.y.domain(getExtent(value.y, yExtent, [0, 10]));

		// Select and draw the x and y axis
		element.g.xAxis.transition().duration(duration).call(axis.x);
		element.g.yAxis.transition().duration(duration).call(axis.y);

		// Update the line
		element.g.plot.select('.area').transition().duration(duration).attr('d', area.y0(scale.y.range()[0]));
		element.g.plot.select('.line').transition().duration(duration).attr('d', line);
		
		// Update the markers
		redrawMarkers();

		// If filter is enabled, update the brush
		if(filter.enabled) {
			filter.brush.x(scale.x);
			element.g.brush
				.call(filter.brush)
				.selectAll('rect')
					.attr('height', height - margin.top - margin.bottom + 7);
		}

		return chart;
	};


	function getExtent(accessorFn, configuredExtent, defaultExtent) {
		// Calculate the domain
		var nExtent = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
		data.forEach(function(element, index){
			var v = accessorFn(element);
			if(nExtent[0] > v) { nExtent[0] = v; }
			if(nExtent[1] < v) { nExtent[1] = v; }
		});

		if(Number.POSITIVE_INFINITY === nExtent[0] && Number.NEGATIVE_INFINITY === nExtent[1]){ nExtent = defaultExtent; }
		if(nExtent[0] >= nExtent[1]) { nExtent[1] = nExtent[0] + 10; }

		if(null != configuredExtent){
			if(null != configuredExtent[0]) { nExtent[0] = configuredExtent[0]; }
			if(null != configuredExtent[1]) { nExtent[1] = configuredExtent[1]; }
		}

		return nExtent;
	}

	function brushstart() {
		var isEmpty = filter.brush.empty();
		var min = (isEmpty)? undefined : filter.brush.extent()[0].getTime();
		var max = (isEmpty)? undefined : filter.brush.extent()[1].getTime();

		filter.dispatch.filterstart([isEmpty, min, max]);
	}
	function brush() {
		var isEmpty = filter.brush.empty();
		var min = (isEmpty)? undefined : filter.brush.extent()[0].getTime();
		var max = (isEmpty)? undefined : filter.brush.extent()[1].getTime();

		filter.dispatch.filter([isEmpty, min, max]);
	}
	function brushend() {
		var isEmpty = filter.brush.empty();
		var min = (isEmpty)? undefined : filter.brush.extent()[0].getTime();
		var max = (isEmpty)? undefined : filter.brush.extent()[1].getTime();

		filter.dispatch.filterend([isEmpty, min, max]);
	}

	// Basic Getters/Setters
	chart.width = function(v) {
		if(!arguments.length) { return width; }
		width = v;
		return chart;
	};
	chart.height = function(v) {
		if(!arguments.length) { return height; }
		height = v;
		return chart;
	};
	chart.xAxis = function(v) {
		if(!arguments.length) { return axis.x; }
		axis.x = v;
		return chart;
	};
	chart.yAxis = function(v) {
		if(!arguments.length) { return axis.y; }
		axis.y = v;
		return chart;
	};
	chart.xScale = function(v) {
		if(!arguments.length) { return scale.x; }
		scale.x = v;
		axis.x.scale(v);
		return chart;
	};
	chart.yScale = function(v) {
		if(!arguments.length) { return scale.y; }
		scale.y = v;
		axis.y.scale(v);
		return chart;
	};
	chart.interpolation = function(v) {
		if(!arguments.length) { return line.interpolate(); }
		line.interpolate(v);
		area.interpolate(v);
		return chart;
	};
	chart.xValue = function(v) {
		if(!arguments.length) { return value.x; }
		value.x = v;
		return chart;
	};
	chart.yValue = function(v) {
		if(!arguments.length) { return value.y; }
		value.y = v;
		return chart;
	};
	chart.xExtent = function(v) {
		if(!arguments.length) { return xExtent; }
		xExtent = v;
		return chart;
	};
	chart.yExtent = function(v) {
		if(!arguments.length) { return yExtent; }
		yExtent = v;
		return chart;
	};
	chart.duration = function(v) {
		if(!arguments.length) { return duration; }
		duration = v;
		return chart;
	};
	chart.filter = function(v) {
		if(!arguments.length) { return filter.dispatch; }
		filter.enabled = v;
		return chart;
	};
	chart.margin = function(v) {
		if(!arguments.length) { return margin; }
		margin = v;
		return chart;
	};

	chart.markerHover = function(f){
		if(!arguments.length) { return markerHoverCallback; }
		markerHoverCallback = f;
		return chart;
	};

	return chart;
}
var sentio_realtime = sentio.realtime = {};
sentio.realtime.timeline = sentio_realtime_timeline;

function sentio_realtime_timeline() {
	'use strict';

	// Layout properties
	var id = 'rt_timeline_clip_' + Date.now();
	var margin = { top: 10, right: 10, bottom: 20, left: 40 };
	var height = 100, width = 600;

	// Default data delay, this is how far offset "now" is
	var delay = 10000;

	// Interval of the timeline, this is the amount of time being displayed by the timeline
	var interval = 60000;

	// Duration of the transition, also this is the minimum buffer time
	var duration = {
		reveal: 300,
		animate: 300
	};
	
	/**
	 * Callback function for hovers over the markers. Invokes this function
	 * with the d[2] data from the marker payload
	 */
	var markerHoverCallback = null;

	// Is the timeline running?
	var running = false;

	// Transition used for normal mode
	var transition = d3.select({}).transition()
		.duration(duration.reveal)
		.ease('linear');

	// Is the timeline running in efficient mode?
	var efficient = {
		enabled: false,
		fps: 10
	};

	// Default accessors for the dimensions of the data
	var value = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return d[1]; }
	};

	var yExtent = [undefined, undefined];

	// Default scales for x and y dimensions
	var scale = {
		x: d3.time.scale(),
		y: d3.scale.linear()
	};

	// Default Axis definitions
	var axis = {
		x: d3.svg.axis().scale(scale.x).orient('bottom'),
		y: d3.svg.axis().scale(scale.y).orient('left').ticks(4)
	};

	var element = {
		svg: undefined,
		g: {
			container: undefined,
			xAxis: undefined,
			yAxis: undefined,
			line: undefined,
			markers: undefined
		},
		clipPath: undefined
	};

	// Line generator for the plot
	var line = d3.svg.line().interpolate('linear');
	line.x(function(d, i) {
		return scale.x(value.x(d, i));
	});
	line.y(function(d, i) {
		return scale.y(value.y(d, i));
	});

	var data = [], markers = [];

	// Chart create/init method
	function chart(selection){}

	// Perform all initial chart construction and setup
	chart.init = function(container){
		// Create the SVG element
		element.svg = container.append('svg');

		// Add the defs and add the clip path definition
		element.clipPath = element.svg.append('defs').append('clipPath').attr('id', id).append('rect');

		// Append a container for everything
		element.g.container = element.svg.append('g');

		// Append the path group (which will have the clip path and the line path
		element.g.line = element.g.container.append('g').attr('clip-path', 'url(#' + id + ')');
		element.g.line.append('path').attr('class', 'line');
		
		element.g.markers = element.g.container.append('g').attr('class', 'markers').attr('clip-path', 'url(#' + id + ')');
		
		// Append groups for the axes
		element.g.xAxis = element.g.container.append('g').attr('class', 'x axis');
		element.g.yAxis = element.g.container.append('g').attr('class', 'y axis');

		return chart;
	};

	// Update the chart data
	chart.data = function(value){
		if(!arguments.length) { return data; }
		data = value;
		element.g.line.datum(data);
		return chart;
	};
	
	/**
	 * Accepts the hovered element and conditionally invokes
	 * the marker hover callback if both the function and data
	 * are non-null
	 */
	function invokeMarkerCallback(d) {
		// fire an event with the payload from d[2]
		if(null != d[2] && null != markerHoverCallback) {
			markerHoverCallback(d[2]);
		}
	}
	
	/**
	 * Draws the appropriate marker lines, whether
	 * coming from enter or update of data
	 */
	function drawMarkerLines(selection) {
		selection
			.attr("x1", function(d) {
				return scale.x(d[0]);
			})
			.attr("x2", function(d) {
				return scale.x(d[0]);
			})
			.attr("y1", scale.y.range()[1])
			.attr("y2", scale.y.range()[0])
			.on('mouseover', invokeMarkerCallback);
	}
	
	/**
	 * Draws the appropriate marker text, whether
	 * coming from enter or update of data
	 */
	function drawMarkerText(selection) {
		
		var ySize = scale.y.range()[0] - scale.y.range()[1];
		ySize = ySize * 0.2;
		
		selection
			.attr("x", function(d) {
				return scale.x(d[0]);
			})
			.attr("y", ySize)
			.text(function(d) { return d[1]; })
			.on('mouseover', invokeMarkerCallback);
	}
	
	chart.markers = function(value) {
		if(!arguments.length) { return markers; }
		markers = value;
		
		if(markers.length === 0) {
			return chart;
		}
		
		// add data to the container of markers
		var markData = element.g.markers
		  .selectAll('.marker')
		    .data(markers)
		    .enter();
		
		/*
		 * markerGroup is a collection of the line
		 * and label for a particular marker
		 */
		var markerGroup = markData.append('g')
		    .attr('class', 'marker');
		
		// Add the line to the marker group
		drawMarkerLines(markerGroup.append('line') );
		
		// Text can show on hover or always
		drawMarkerText( markerGroup.append('text') );
		
		return chart;
	};

	chart.redraw = function(){
		var now = Date.now();

		// Set up the scales
		scale.x.range([0, width - margin.left - margin.right]);
		scale.y.range([height - margin.top - margin.bottom, 0]);

		// Append the clip path
		element.clipPath
			.attr('width', width - margin.left - margin.right)
			.attr('height', height - margin.top - margin.bottom);

		// Now update the size of the svg pane
		element.svg.attr('width', width).attr('height', height);

		// Append groups for the axes
		element.g.xAxis.attr('transform', 'translate(0,' + scale.y.range()[0] + ')');
		element.g.yAxis.attr('class', 'y axis');

		// update the margins on the main draw group
		element.g.container.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		return chart;
	};

	function tick() {
		// If not running, let the loop die
		if(!running) return;

		// Store the current time
		var now = new Date();

		var extent = getYExtent(now);

		// Update the domains of the scales
		scale.x.domain([now - delay - interval - duration.reveal, now - delay - duration.reveal]);
		scale.y.domain(extent);

		if(null == efficient || !efficient.enabled){
			normalTick(now);
		} else {
			efficientTick(now);
		}
	}
	
	function executeTick(now) {
		// Select and draw the x axis
		element.g.xAxis.call(axis.x);
		
		// Select and draw the y axis
		element.g.yAxis.call(axis.y);
		
		var translate = scale.x(now - delay - interval - 2*duration.reveal);
		
		tickLine(translate);
		tickMarkers(translate);
	}
	
	function tickLine(translate) {
		// Select and draw the line
		element.g.line.select('.line').attr('d', line).attr('transform', null);
		element.g.line.select('.line').transition()
			.attr('transform', 'translate(' + translate + ')');
	}
	
	function tickMarkers(translate) {
		element.g.markers
			.selectAll('.marker')
			.attr('transform', null)
			// if any marker is outside the X-window, mark it for deletion
			.attr('delete', function(d) {
				return scale.x(d[0]) < 0;
			});
		
		// Fade out and remove markers with lines outside of range
		element.g.markers.selectAll('[delete=true]')
			.attr('opacity', 1)
			.transition(500)
			.attr('opacity', 0)
			.remove();
		
		drawMarkerLines( element.g.markers.selectAll('line') );
		drawMarkerText( element.g.markers.selectAll('text') );
		
		element.g.markers
			.selectAll('.marker')
			.transition()
			.attr('transform', 'translate(' + translate + ')');
		
	}

	function normalTick(now) {
		transition = transition.each(function(){
			executeTick(now);
		}).transition().each('start', tick);
	}

	function efficientTick(now) {
		executeTick(now);

		// Schedule the next update
		window.setTimeout(tick, 1000/efficient.fps);
	}

	function getYExtent(now){
		// Calculate the domain of the y axis
		var nExtent = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
		data.forEach(function(element, index){
			var y = value.y(element);
			var x = value.x(element);

			if(x < now - delay  + duration.reveal) {
				if(nExtent[0] > y) { nExtent[0] = y; }
				if(nExtent[1] < y) { nExtent[1] = y; }
			}
		});

		if(Number.POSITIVE_INFINITY === nExtent[0] && Number.NEGATIVE_INFINITY === nExtent[1]){ nExtent = [0, 10]; }
		if(nExtent[0] >= nExtent[1]) { nExtent[1] = nExtent[0] + 1; }
		nExtent[1] += (nExtent[1] - nExtent[0]) * 0.1;

		if(null != yExtent){
			if(null != yExtent[0]) { nExtent[0] = yExtent[0]; }
			if(null != yExtent[1]) { nExtent[1] = yExtent[1]; }
		}

		return nExtent;
	}

	chart.start = function(){
		if(running){ return; }

		running = true;
		tick();
	};

	chart.stop = function(){
		if(!running) { return; }

		running = false;
	};

	chart.restart = function(){
		chart.stop();
		chart.start();
	};

	// Basic Getters/Setters
	chart.width = function(v){
		if(!arguments.length) { return width; }
		width = v;
		return chart;
	};
	chart.height = function(v){
		if(!arguments.length) { return height; }
		height = v;
		return chart;
	};
	chart.xAxis = function(v){
		if(!arguments.length) { return axis.x; }
		axis.x = v;
		return chart;
	};
	chart.yAxis = function(v){
		if(!arguments.length) { return axis.y; }
		axis.y = v;
		return chart;
	};
	chart.xScale = function(v){
		if(!arguments.length) { return scale.x; }
		scale.x = v;
		axis.x.scale(v);
		return chart;
	};
	chart.yScale = function(v){
		if(!arguments.length) { return scale.y; }
		scale.y = v;
		axis.y.scale(v);
		return chart;
	};
	chart.interpolation = function(v){
		if(!arguments.length) { return line.interpolate(); }
		line.interpolate(v);
		return chart;
	};
	chart.xValue = function(v){
		if(!arguments.length) { return value.x; }
		value.x = v;
		return chart;
	};
	chart.yValue = function(v){
		if(!arguments.length) { return value.y; }
		value.y = v;
		return chart;
	};
	chart.interval = function(v){
		if(!arguments.length) { return interval; }
		interval = v;
		return chart;
	};
	chart.delay = function(v){
		if(!arguments.length) { return delay; }
		delay = v;
		return chart;
	};
	chart.yExtent = function(v){
		if(!arguments.length) { return yExtent; }
		yExtent = v;
		return chart;
	};
	chart.duration = function(v){
		if(!arguments.length) { return duration; }
		duration = v;
		transition.duration(duration.reveal);
		return chart;
	};
	chart.efficient = function(v){
		if(!arguments.length) { return efficient; }
		efficient = v;
		return chart;
	};

	chart.markerHover = function(f){
		if(!arguments.length) { return markerHoverCallback; }
		markerHoverCallback = f;
		return chart;
	};

	return chart;
}