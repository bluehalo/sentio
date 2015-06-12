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