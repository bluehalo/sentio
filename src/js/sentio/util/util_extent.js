sentio.util.extent = sentio_util_extent;

function sentio_util_extent(config) {
	'use strict';

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {
		_defaultValue: [0, 10],
		_overrideValue: undefined
	};

	var _fn = {
		getValue: function(d) { return d; },
		filter: function(d) { return true; }
	};


	/**
	 * Private Functions
	 */

	function setDefaultValue(v) {
		if(null != v && 2 !== v.length) {
			throw new Error('Default extent must be a two element array or null/undefined');
		}
		_config.defaultValue = v;
	}

	function setOverrideValue(v) {
		if(null != v && 2 !== v.length) {
			throw new Error('Extent override must be a two element array or null/undefined');
		}
		_config.overrideValue = v;
	}

	function setGetValue(v) {
		//if(is not a function) {
		//	throw new Error('Value getter must be a function');
		//}

		_fn.getValue = v;
	}

	function setFilter(v) {
		//if(is not a function) {
		//	throw new Error('Filter must be a function');
		//}

		_fn.filter = v;
	}

	/*
	 * Constructor/initialization method
	 */
	function extent(extentConfig) {
		if(null != extentConfig.defaultValue) { setDefaultValue(extentConfig.defaultValue); }
		if(null != extentConfig.overrideValue) { setOverrideValue(extentConfig.overrideValue); }
		if(null != extentConfig.getValue) { setGetValue(extentConfig.getValue); }
		if(null != extentConfig.filter) { setFilter(extentConfig.filter); }
	}


	/**
	 * Public API
	 */

	/*
	 * Get/Set the default value for the extent
	 */
	extent.defaultValue = function(v) {
		if(!arguments.length) { return _config.defaultValue; }
		setDefaultValue(v);
		return extent;
	};

	/*
	 * Get/Set the override value for the extent
	 */
	extent.overrideValue = function(v) {
		if(!arguments.length) { return _config.overrideValue; }
		setOverrideValue(v);
		return extent;
	};

	/*
	 * Get/Set the value accessor for the extent
	 */
	extent.getValue = function(v) {
		if(!arguments.length) { return _fn.getValue; }
		setGetValue(v);
		return extent;
	};

	/*
	 * Get/Set the filter fn for the extent
	 */
	extent.filter = function(v) {
		if(!arguments.length) { return _fn.filter; }
		setFilter(v);
		return extent;
	};

	/*
	 * Calculate the extent given some data
	 */
	extent.getExtent = function(data) {
		var toReturn;
		var ov = _config.overrideValue;

		// Check to see if we need to calculate the extent
		if(null == ov || null == ov[0] && null == ov[1]) {
			// Since the override isn't complete, we need to calculate the extent
			toReturn = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];

			// Iterate over each element of the data
			data.forEach(function(element) {
				// If the element passes the filter, then update the extent
				if(_fn.filter(element)) {
					var v = _fn.getValue(element);
					toReturn[0] = Math.min(toReturn[0], v);
					toReturn[1] = Math.max(toReturn[1], v);
				}
			});

			// Apply the overrides
			// - Since we're in this conditional, only one or zero overrides were specified
			if(null != ov) {
				if(null != ov[0] && toReturn[1] > ov[0]) { toReturn[0] = ov[0]; }
				if(null != ov[1] && toReturn[0] < ov[1]) { toReturn[1] = ov[1]; }
			}
		} else {
			toReturn = ov;
		}

		if(toReturn[0] > toReturn[1]) {
			toReturn = _config.defaultValue;
		}
		return toReturn;
	};


	// Initialize the model
	extent(config);

	return extent;
}