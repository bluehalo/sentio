/*! sentio Version: 0.2.3 */
var sentio = {};
var sentio_data = sentio.data = {};
sentio.data.bins = sentio_data_bins;

function sentio_data_bins(config) {
	'use strict';

	/**
	 * Private variables
	 */
	// Configuration
	var bins = {
		// The number of bins in our layout
		count: 1,

		// The size of a bin in key value units
		size: undefined,

		// The min and max bins
		lwm: undefined,
		hwm: undefined
	};

	// The data (an array of object containers)
	var data = [];

	// The default getValue function
	var valueFn = function(d) { return d; };


	/**
	 * Private Functions
	 */

	// Get the index given the value
	function getIndex(v) {
		if(null == bins.size || null == bins.lwm) {
			return 0;
		}

		return Math.floor((v - bins.lwm)/bins.size);
	}

	function calculateHwm() {
		bins.hwm = bins.lwm + (bins.count * bins.size);
	}

	function updateState() {
		// drop stuff below the lwm
		while(data.length > 0 && data[0][0] < bins.lwm) {
			data.shift();
		}

		// drop stuff above the hwm
		while(data.length > 0 && data[data.length - 1][0] >= bins.hwm) {
			data.pop();
		}

		// if we emptied the array, add an element for the lwm
		if(data.length === 0) {
			data.push([bins.lwm, []]);
		}

		// fill in any missing values from the lowest bin to the lwm
		for(var i=data[0][0] - bins.size; i >= bins.lwm; i -= bins.size) {
			data.unshift([i, []]);
		}

		// pad above the hwm
		while(data[data.length - 1][0] < bins.hwm - bins.size) {
			data.push([data[data.length-1][0] + bins.size, []]);
		}
	}

	function addData(dataToAdd) {
		dataToAdd.forEach(function(element) {
			var i = getIndex(valueFn(element));
			if(i >= 0 && i < data.length) {
				(data[i][1]).push(element);
			}
		});
	}

	function clearData(destroy) {
		if(destroy) {
			data.length = 0;
		} else {
			// Iterate through all the bins and clear them
			data.forEach(function(bin) {
				bin[1].length = 0;
			});
		}
	}

	function getData() {
		var d = [];
		data.forEach(function(bin){
			bin[1].forEach(function(element){
				d.push(element);
			});
		});
		return d;
	}

	function resetData() {
		// Store the data in a side array
		var oldData = getData();

		// Clear the state
		clearData(true);

		// Update the state of the array
		updateState();

		// Load the data according to the new settings
		addData(oldData);
	}

	// create/init method
	function layout(binConfig) {
		if(null == binConfig.size || null == binConfig.count || null == binConfig.lwm) {
			throw new Error('You must provide an initial size, count, and lwm');
		}
		bins = binConfig;

		calculateHwm();
		updateState();
	}


	/**
	 * Public API
	 */

	/*
	 * Resets the layout with the new data
	 */
	layout.set = function(data) {
		clearData();
		addData(data);
		return layout;
	};

	/*
	 * Clears the data currently in the bin layout
	 */
	layout.clear = function() {
		clearData();
		return layout;
	};

	/*
	 * Add an array of data objects to the bins
	 */
	layout.add = function(dataToAdd) {
		addData(dataToAdd);
		return layout;
	};

	/*
	 * Reset the whole layout (need to call this after changing bin count, size, accessor, etc)
	 */
	layout.reset = function() {
		resetData();
	};

	/*
	 * Get/Set the low water mark value
	 */
	layout.lwm = function(v) {
		if(!arguments.length) { return bins.lwm; }

		var oldLwm = bins.lwm;
		bins.lwm = Number(v);

		calculateHwm();

		if((oldLwm - bins.lwm) % bins.size !== 0) {
			// the difference between watermarks is not a multiple of the bin size, so we need to reset
			resetData();
		} else {
			updateState();
		}

		return layout;
	};

	/*
	 * Get/Set the value accessor function
	 */
	layout.value = function(v) {
		if(!arguments.length) { return valueFn; }
		valueFn = v;

		return layout;
	};

	/*
	 * Get/Set the bin size
	 */
	layout.size = function(v) {
		if(!arguments.length) { return bins.size; }

		if(Number(v) < 1) {
			throw new Error('Bin size must be a positive integer');
		}

		bins.size = Number(v);

		calculateHwm();
		resetData();
		return layout;
	};

	/*
	 * Get/Set the bin count
	 */
	layout.count = function(v) {
		if(!arguments.length) { return bins.count; }
		if(Number(v) < 1) {
			throw new Error('Bin count must be a positive integer');
		}

		bins.count = Math.floor(Number(v));

		calculateHwm();
		updateState();
		return layout;
	};

	/*
	 * Accessor for the bins of data
	 */
	layout.bins = function() {
		return data;
	};

	// Initialize the layout
	layout(config);

	return layout;
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
			line: undefined
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

	var data = [];

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

	function normalTick(now) {
		transition = transition.each(function(){

			// Select and draw the line
			element.g.line.select('.line').attr('d', line).attr('transform', null);

			// Select and draw the x axis
			element.g.xAxis.call(axis.x);

			// Select and draw the y axis
			element.g.yAxis.call(axis.y);

			element.g.line.select('.line').transition()
				.attr('transform', 'translate(' + scale.x(now - delay - interval - 2*duration.reveal) + ')');

		}).transition().each('start', tick);
	}

	function efficientTick(now) {
		// Select and draw the line
		element.g.line.select('.line').attr('d', line).attr('transform', null);

		// Select and draw the x axis
		element.g.xAxis.call(axis.x).call(axis.x);

		// Select and draw the y axis
		element.g.yAxis.call(axis.y);

		element.g.line.select('.line').attr('transform', 'translate(-' + scale.x(now - delay - interval + duration.reveal) + ')');

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

	return chart;
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
			brush: undefined
		},
		clipPath: undefined
	};

	var data = [];

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

	return chart;
}