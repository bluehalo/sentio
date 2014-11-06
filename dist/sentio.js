/*! sentio Version: 0.1.0 */
var sentio = {};
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
		reveal: 750,
		animate: 300
	};

	// Is the timeline running?
	var running = false;

	// Default accessors for the dimensions of the data
	var value = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return d[1]; }
	};

	// Default scales for x and y dimensions
	var scale = {
		x: d3.time.scale(),
		y: d3.scale.linear()
	};

	// Default Axis definitions
	var axis = {
		x: d3.svg.axis().scale(scale.x).orient('bottom'),
		y: d3.svg.axis().scale(scale.y).orient('left')
	};

	var element = {
		g: undefined
	};

	// Line generator for the plot
	var line = d3.svg.line();
	line.x(function(d, i) {
		return scale.x(value.x(d, i));
	});
	line.y(function(d, i) {
		return scale.y(value.y(d, i));
	});


	// Chart create/init method
	function chart(selection){
		selection.each(function(data){
			var now = Date.now();

			// Set up the scales
			scale.x.range([0, width - margin.left - margin.right]);
			scale.y.range([height - margin.top - margin.bottom, 0]);

			// Create a selection for the svg element
			var svg = d3.select(this).selectAll('svg').data([data]);

			// On first creation, build the chart structure
			var svgEnter = svg.enter().append('svg');

			// Append the clip path
			svgEnter.append('defs').append('clipPath').attr('id', id).append('rect')
				.attr('width', width - margin.left - margin.right)
				.attr('height', height - margin.top - margin.bottom);

			// Now update the size of the svg pane
			svg.attr('width', width).attr('height', height);

			// Append a container for everything
			var gEnter = svgEnter.append('g');

			// Append the path group (which will have the clip path and the line path
			gEnter.append('g').attr('clip-path', 'url(#' + id + ')')
				.append('path').attr('class', 'line');

			// Append groups for the axes
			gEnter.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + scale.y.range()[0] + ')');
			gEnter.append('g').attr('class', 'y axis');

			// update the margins on the main draw group
			element.g = svg.select('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		});
	}

	function tick() {

		// If not running, let the loop die
		if(!running){ return; }

		// Store the current time
		var now = new Date();

		// Update the domains of the scales
		scale.x.domain([now - delay - interval, now - delay]);
		scale.y.domain([0, 70]);

		// Select and draw the line
		element.g.select('.line').attr('d', line).attr('transform', null);

		// Select and draw the x axis
		element.g.select('.x.axis')
			.transition().duration(duration.reveal).ease('linear')
				.call(axis.x);

		// Select and draw the y axis
		element.g.select('.y.axis')
			.transition().duration(duration.reveal).ease('linear')
				.call(axis.y);

		element.g.select('.line').transition().duration(duration.reveal).ease('linear')
			.attr('transform', 'translate(-' + scale.x(now - delay - interval + duration.reveal) + ')')
			.each('end', tick);

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

	chart.width = function(value){
		if(null == value) { return width; }
		width = value;
		return chart;
	};
	chart.height = function(value){
		if(null == value) { return height; }
		height = value;
		return chart;
	};

	return chart;
}