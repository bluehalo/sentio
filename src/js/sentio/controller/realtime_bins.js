sentio.controller.realtime = sentio_controller_realtime;

function sentio_controller_realtime(config) {
	'use strict';

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {};

	// The bins
	var bins;


	/**
	 * Private Functions
	 */

	// create/init method
	function layout(realtimeConfig) {
		
	}



	/**
	 * Public API
	 */

	/*
	 * Get/Set the bins
	 */
	layout.bins = function(v) {
		if(!arguments.length) { return bins.bins(); }
		bins.bins(v);

		return layout;
	};

	// Initialize the layout
	layout(config);

	return layout;
}