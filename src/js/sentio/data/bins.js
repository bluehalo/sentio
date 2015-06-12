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
	var getValue = function(d) { return d; };


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
		while(data.length > 0 && data[data.length - 1][0] > bins.hwm) {
			data.pop();
		}

		// if we emptied the array, add an element for the lwm
		data.push([bins.lwm, []]);

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
			var i = getIndex(getValue(element));
			if(i >= 0 && i < data.length) {
				(data[i][1]).push(element);
			}
		});
	}

	function clearData() {
		// Iterate through all the bins and clear them
		data.forEach(function(bin) {
			bin[1] = 0;
		});
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
		clearData();

		// Load the data according to the new settings
		addData(oldData);
	}

	// create/init method
	function layout(binConfig) {
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
	layout.setData = function(data) {
		clearData();
		addData(data);
		return layout;
	};

	/*
	 * Clears the data currently in the bin layout
	 */
	layout.clearData = function() {
		clearData();
		return layout;
	};

	/*
	 * Add an array of data objects to the bins
	 */
	layout.addData = function(dataToAdd) {
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
		bins.lwm = v;

		calculateHwm();
		updateState();

		return layout;
	};

	/*
	 * Get/Set the value accessor function
	 */
	layout.getValue = function(v) {
		if(!arguments.length) { return getValue; }
		getValue = v;

		return layout;
	};

	/*
	 * Get/Set the bin size
	 */
	layout.binSize = function(v) {
		if(!arguments.length) { return bins.size; }
		bins.size = v;

		return layout;
	};

	/*
	 * Get/Set the bin count
	 */
	layout.binCount = function(v) {
		if(!arguments.length) { return bins.count; }
		bins.count = v;

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