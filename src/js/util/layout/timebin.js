sentio.layout.timebin = sentio_layout_timebin;

function sentio_layout_timebin() {
	'use strict';

	// Default accessors for the dimensions of the data
	var value = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return d[1]; }
	};


	function timebin(points){
		
	}

	chart.interval = function(v){
		if(!arguments.length) { return filter.dispatch; }
		filter.enabled = v;
		return chart;
	};
	chart. = function(v){
		if(!arguments.length) { return filter.dispatch; }
		filter.enabled = v;
		return chart;
	};

	return timebin;
}