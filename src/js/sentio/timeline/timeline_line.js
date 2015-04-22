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