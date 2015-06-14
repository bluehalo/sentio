sentio.model.bins = sentio_model_bins;

function sentio_model_bins(config) {
	'use strict';

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {
		// The number of bins in our layout
		count: 1,

		// The size of a bin in key value units
		size: undefined,

		// The min and max bins
		lwm: undefined,
		hwm: undefined
	};

	var _fn = {
		// The default function for creating the seed value for a bin
		createSeed: function() { return []; },

		// The default key function
		getKey: function(d) { return d; },

		// The default value function
		getValue: function(d) { return d; },

		// The default function for updating a bin given a new value
		updateBin: function(bin, d) { bin[1].push(d); }
	};

	// The data (an array of object containers)
	var _data = [];


	/**
	 * Private Functions
	 */

	// Get the index given the value
	function getIndex(v) {
		if(null == _config.size || null == _config.lwm) {
			return 0;
		}

		return Math.floor((v - _config.lwm)/_config.size);
	}

	function calculateHwm() {
		_config.hwm = _config.lwm + (_config.count * _config.size);
	}

	function updateState() {
		// drop stuff below the lwm
		while(_data.length > 0 && _data[0][0] < _config.lwm) {
			_data.shift();
		}

		// drop stuff above the hwm
		while(_data.length > 0 && _data[_data.length - 1][0] >= _config.hwm) {
			_data.pop();
		}

		// if we emptied the array, add an element for the lwm
		if(_data.length === 0) {
			_data.push([_config.lwm, _fn.createSeed()]);
		}

		// fill in any missing values from the lowest bin to the lwm
		for(var i=_data[0][0] - _config.size; i >= _config.lwm; i -= _config.size) {
			_data.unshift([i, _fn.createSeed()]);
		}

		// pad above the hwm
		while(_data[_data.length - 1][0] < _config.hwm - _config.size) {
			_data.push([_data[_data.length-1][0] + _config.size, _fn.createSeed()]);
		}
	}

	function addData(dataToAdd) {
		dataToAdd.forEach(function(element) {
			var i = getIndex(_fn.getKey(element));
			if(i >= 0 && i < _data.length) {
				_fn.updateBin(_data[i], _fn.getValue(element));
			}
		});
	}

	function clearData() {
		_data.length = 0;
	}


	/*
	 * Constructor/initialization method
	 */
	function layout(binConfig) {
		if(null == binConfig.size || null == binConfig.count || null == binConfig.lwm) {
			throw new Error('You must provide an initial size, count, and lwm');
		}
		_config.size = binConfig.size;
		_config.count = binConfig.count;
		_config.lwm = binConfig.lwm;

		if(null != binConfig.createSeed) { _fn.createSeed = binConfig.createSeed; }
		if(null != binConfig.getKey) { _fn.getKey = binConfig.getKey; }
		if(null != binConfig.getValue) { _fn.getValue = binConfig.getValue; }
		if(null != binConfig.updateBin) { _fn.updateBin = binConfig.updateBin; }

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
		if(!arguments.length) { return _config.lwm; }

		var oldLwm = _config.lwm;
		_config.lwm = Number(v);

		calculateHwm();

		if((oldLwm - _config.lwm) % _config.size !== 0) {
			// the difference between watermarks is not a multiple of the bin size, so we need to reset
			clearData();
		}

		updateState();

		return layout;
	};

	/*
	 * Get the high water mark
	 */
	layout.hwm = function() {
		return _config.hwm;
	};

	/*
	 * Get/Set the key function used to determine the key value for indexing into the bins
	 */
	layout.getKey = function(v) {
		if(!arguments.length) { return _fn.getKey; }
		_fn.getKey = v;

		clearData();
		updateState();

		return layout;
	};

	/*
	 * Get/Set the value function for determining what value is added to the bin
	 */
	layout.getValue = function(v) {
		if(!arguments.length) { return _fn.getValue; }
		_fn.getValue = v;

		clearData();
		updateState();

		return layout;
	};

	/*
	 * Get/Set the Update bin function for determining how to update the state of a bin when a new value is added to it
	 */
	layout.updateBin = function(v) {
		if(!arguments.length) { return _fn.updateBin; }
		_fn.updateBin = v;

		clearData();
		updateState();

		return layout;
	};

	/*
	 * Get/Set the seedFn for populating 
	 */
	layout.createSeed = function(v) {
		if(!arguments.length) { return _fn.createSeed; }
		_fn.createSeed = v;

		clearData();
		updateState();

		return layout;
	};

	/*
	 * Get/Set the bin size
	 */
	layout.size = function(v) {
		if(!arguments.length) { return _config.size; }

		if(Number(v) < 1) {
			throw new Error('Bin size must be a positive integer');
		}

		// Only change stuff if the size actually changes
		if(Number(v) !== _config.size) {
			_config.size = Number(v);
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
		if(!arguments.length) { return _config.count; }

		if(Number(v) < 1) {
			throw new Error('Bin count must be a positive integer');
		}

		// Only change stuff if the count actually changes
		if(Number(v) !== _config.count) {
			_config.count = Math.floor(Number(v));
			calculateHwm();
			updateState();
		}

		return layout;
	};

	/*
	 * Accessor for the bins of data
	 */
	layout.bins = function() {
		return _data;
	};

	// Initialize the layout
	layout(config);

	return layout;
}