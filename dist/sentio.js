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
	var line = d3.svg.line().interpolate('basis');
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
		if(!running){ return; }

		// Store the current time
		var now = new Date();

		var extent = getYExtent(now);

		// Update the domains of the scales
		scale.x.domain([now - delay - interval, now - delay]);
		scale.y.domain(extent);

		// Select and draw the line
		element.g.line.select('.line').attr('d', line).attr('transform', null);

		// Select and draw the x axis
		element.g.xAxis
			.transition().duration(duration.reveal).ease('linear')
				.call(axis.x);

		// Select and draw the y axis
		element.g.yAxis
			.transition().duration(duration.animate)
				.call(axis.y);

		element.g.line.select('.line').transition().duration(duration.reveal).ease('linear')
			.attr('transform', 'translate(-' + scale.x(now - delay - interval + duration.reveal) + ')')
			.each('end', tick);

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
		return chart;
	};

	return chart;
}
angular.module('sentio.realtime', []);
angular.module('sentio.realtime').directive('rtTimeline', function($document, $window, $timeout, $log) {
	'use strict';

	return {
		restrict : 'A',
		scope : {
			model: '=',
			interval: '=',
			delay: '=',
			yExtent: '=',
			duration: '=',
			resizeWidth: '@',
			resizeHeight: '@'
		},
		replace : false,
		link : function(scope, element, attrs, controller) {
			var timelineElement = d3.select(element[0]);
			var timeline = sentio.realtime.timeline();
			timeline.init(timelineElement);

			scope.$watchCollection('model', function(n, o){
				if(null == o && null == n){ return; }

				timeline.data(n).redraw();
				timeline.start();
			});

			scope.$watch('interval', function(n, o){
				if(null == o && null == n){ return; }

				timeline.interval(n).redraw();
			});

			scope.$watch('delay', function(n, o){
				if(null == o && null == n){ return; }

				timeline.delay(n).redraw();
			});

			scope.$watch('yExtent', function(n, o){
				if(null == o && null == n){ return; }

				timeline.yExtent(n).redraw();
			});

			scope.$watch('duration', function(n, o){
				if(null == o && null == n){ return; }

				timeline.duration(n);
			});

			// Manage resizing the chart
			var resizeWidth = (null != attrs.resizeWidth);
			var resizeHeight = (null != attrs.resizeHeight);
			var resizeTimer;
			var window = angular.element($window);

			var doResize = function() {

				// Get the raw body element
				var body = $document[0].body;

				// Cache the old overflow style
				var overflow = body.style.overflow;
				body.style.overflow = 'hidden';

				// Get the raw parent
				var rawElement = element[0];
				// Derive height/width of the parent (there are several ways to do this depending on the parent)
				var parentWidth = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;
				var parentHeight = rawElement.attributes.height | rawElement.style.height | rawElement.clientHeight;

				// Calculate the new width/height based on the parent and the resize size
				var width = (resizeWidth)? parentWidth - attrs.resizeWidth : undefined;
				var height = (resizeHeight)? parentHeight - attrs.resizeHeight : undefined;

				// Reapply the old overflow setting
				body.style.overflow = overflow;

				console.log('resize rt.timeline height: ' + height + ' width: ' + width);

				// Apply the new width and height
				if(resizeWidth){ timeline.width(width); }
				if(resizeHeight){ timeline.height(height); }

				timeline.redraw();
			};
			var delayResize = function(){
				if(undefined !== resizeTimer){
					$timeout.cancel(resizeTimer);
				}
				resizeTimer = $timeout(doResize, 200);
			};

			if(resizeWidth || resizeHeight){
				window.on('resize', delayResize);
				delayResize();
			}
			scope.$on('$destroy', function () {
				window.off('resize', delayResize);
			});
		}
	};
});
