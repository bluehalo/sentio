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

	// The default function for creating the seed value for a bin
	var seedFn = function() { return []; };

	// The default key function
	var keyFn = function(d) { return d; };

	// The default value function
	var valueFn = function(d) { return d; };

	// The default function for updating a bin given a new value
	var updateBinFn = function(bin, d) { bin[1].push(d); };


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
			data.push([bins.lwm, seedFn()]);
		}

		// fill in any missing values from the lowest bin to the lwm
		for(var i=data[0][0] - bins.size; i >= bins.lwm; i -= bins.size) {
			data.unshift([i, seedFn()]);
		}

		// pad above the hwm
		while(data[data.length - 1][0] < bins.hwm - bins.size) {
			data.push([data[data.length-1][0] + bins.size, seedFn()]);
		}
	}

	function addData(dataToAdd) {
		dataToAdd.forEach(function(element) {
			var i = getIndex(keyFn(element));
			if(i >= 0 && i < data.length) {
				updateBinFn(data[i], valueFn(element));
			}
		});
	}

	function clearData() {
		data.length = 0;
	}

	// create/init method
	function layout(binConfig) {
		if(null == binConfig.size || null == binConfig.count || null == binConfig.lwm) {
			throw new Error('You must provide an initial size, count, lwm, and seed');
		}
		bins.size = binConfig.size;
		bins.count = binConfig.count;
		bins.lwm = binConfig.lwm;
		if(null != binConfig.seed) { bins.seed = binConfig.seed; }
		if(null != binConfig.keyFn) { keyFn = binConfig.keyFn; }
		if(null != binConfig.valueFn) { valueFn = binConfig.valueFn; }
		if(null != binConfig.updateBinFn) { updateBinFn = binConfig.updateBinFn; }

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
		updateState();
		addData(data);
		return layout;
	};

	/*
	 * Clears the data currently in the bin layout
	 */
	layout.clear = function() {
		clearData();
		updateState();
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
	 * Get/Set the low water mark value
	 */
	layout.lwm = function(v) {
		if(!arguments.length) { return bins.lwm; }

		var oldLwm = bins.lwm;
		bins.lwm = Number(v);

		calculateHwm();

		if((oldLwm - bins.lwm) % bins.size !== 0) {
			// the difference between watermarks is not a multiple of the bin size, so we need to reset
			clearData();
		}

		updateState();

		return layout;
	};

	/*
	 * Get/Set the key function used to determine the key value for indexing into the bins
	 */
	layout.keyFn = function(v) {
		if(!arguments.length) { return keyFn; }
		keyFn = v;

		clearData();
		updateState();

		return layout;
	};

	/*
	 * Get/Set the value function for determining what value is added to the bin
	 */
	layout.valueFn = function(v) {
		if(!arguments.length) { return valueFn; }
		valueFn = v;

		clearData();
		updateState();

		return layout;
	};

	/*
	 * Get/Set the Update bin function for determining how to update the state of a bin when a new value is added to it
	 */
	layout.updateBinFn = function(v) {
		if(!arguments.length) { return updateBinFn; }
		updateBinFn = v;

		clearData();
		updateState();

		return layout;
	};

	/*
	 * Get/Set the seedFn for populating 
	 */
	layout.seedFn = function(v) {
		if(!arguments.length) { return seedFn; }
		seedFn = v;

		clearData();
		updateState();

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

		if(Number(v) !== bins.size) {
			bins.size = Number(v);
			calculateHwm();
			clearData();
			updateState();
		}

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

		if(Number(v) !== bins.count) {
			bins.count = Math.floor(Number(v));
			calculateHwm();
			updateState();
		}

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