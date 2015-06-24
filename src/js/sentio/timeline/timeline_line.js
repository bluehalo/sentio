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
		drawMarkerLines(markerGroup.append('line'));

		// Text can show on hover or always
		drawMarkerText(markerGroup.append('text'));

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
		if(null != element.g.xAxis && null != axis.x) {
			element.g.xAxis.transition().duration(duration).call(axis.x);
		}
		if(null != element.g.yAxis && null != axis.y) {
			element.g.yAxis.transition().duration(duration).call(axis.y);
		}

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
		if(null != axis.x) {
			axis.x.scale(v);
		}
		return chart;
	};
	chart.yScale = function(v) {
		if(!arguments.length) { return scale.y; }
		scale.y = v;
		if(null != axis.y) {
			axis.y.scale(v);
		}
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
	chart.margin = function(v){
		if(!arguments.length) { return margin; }
		margin = v;
		return chart;
	};

	return chart;
}