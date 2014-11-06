sentio.realtime.timeline = sentio_realtime_timeline;

function sentio_realtime_timeline() {
	'use strict';

	var margin = { top: 10, right: 10, bottom: 20, left: 40 };
	var height = 100, width = 600;
	var duration = 750;
	var now = new Date(Date.now() - duration);

	var value = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return d[1]; }
	};

	var scale = {
		x: d3.time.scale(),
		y: d3.scale.linear()
	};

	var axis = {
		x: d3.svg.axis().scale(scale.x).orient('bottom'),
		y: d3.svg.axis().scale(scale.y).orient('left')
	};

	var line = d3.svg.line();
	line.x(function(d, i) { 
		return scale.x(value.x(d, i));
	});
	line.y(function(d, i) {
		return scale.y(value.y(d, i));
	});

	function chart(selection){
		selection.each(function(data){

			// May want to convert the data up front??

			// Calculate the x and y extents from the data
			var xExtent = d3.extent(data.slice(0, data.length - 1), value.x);
			var yExtent = d3.extent(data, value.y);

			// Set up the x and y scales
			scale.x
				.domain(xExtent)
				.range([0, width - margin.left - margin.right]);
			scale.y
				.domain(yExtent)
				.range([height - margin.top - margin.bottom, 0]);


			// Create a selection for the svg element
			var svg = d3.select(this).selectAll('svg').data([data]);

			// On first creation, build the chart structure
			var gEnter = svg.enter().append('svg').append('g');
			gEnter.append('path').attr('class', 'line');
			gEnter.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + scale.y.range()[0] + ')').call(axis.x);
			gEnter.append('g').attr('class', 'y axis').call(axis.y);

			// Set the parameters for the svg element (enter/update)
			svg.attr('width', width).attr('height', height);

			// update the margins on the main draw group
			var g = svg.select('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			// Select and draw the line
			g.select('.line')
				.attr('d', line);

			console.log((scale.x(xExtent[0] + 1000) - scale.x(xExtent[0])));

			// Select and draw the x axis
			g.select('.x.axis')
				.attr('transform', 'translate(0,' + scale.y.range()[0] + ')')
				.transition().duration(1000).ease('linear')
					.call(axis.x);

			g.select('.y.axis')
				.transition().duration(1000).ease('linear')
					.call(axis.y);

		});
	}

	function tick() {
		var now = new Date();

		
	}

	chart.width = function(value){
		if(null == value) return width;
		width = value;
		return chart;
	};
	chart.height = function(value){
		if(null == value) return height;
		height = value;
		return chart;
	};

	return chart;
}