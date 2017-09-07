function extent(config) {

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {
		defaultValue: [ 0, 10 ],
		overrideValue: undefined,
		paddingValue: [ 0, 0 ]

	};

	var _fn = {
		getValue: function(d) { return d; },
		filter: function() { return true; }
	};


	/**
	 * Private Functions
	 */

	function setDefaultValue(v) {
		if (null == v || 2 !== v.length || isNaN(v[0]) || isNaN(v[1]) || v[0] >= v[1]) {
			throw new Error('Default extent must be a two element ordered array of numbers');
		}
		_config.defaultValue = v;
	}

	function setOverrideValue(v) {
		if (null != v && 2 !== v.length) {
			throw new Error('Extent override must be a two element array or null/undefined');
		}
		_config.overrideValue = v;
	}

	function setPaddingValue(v) {
		if (null != v && 2 !== v.length) {
			throw new Error('Extent padding must be a two element array or null/undefined');
		}
		_config.paddingValue = v;
	}

	function setGetValue(v) {
		if (typeof v !== 'function') {
			throw new Error('Value getter must be a function');
		}

		_fn.getValue = v;
	}

	function setFilter(v) {
		if (typeof v !== 'function') {
			throw new Error('Filter must be a function');
		}

		_fn.filter = v;
	}


	/*
	 * Constructor/initialization method
	 */
	function _instance(extentConfig) {
		if (null != extentConfig) {
			if (null != extentConfig.defaultValue) { setDefaultValue(extentConfig.defaultValue); }
			if (null != extentConfig.overrideValue) { setOverrideValue(extentConfig.overrideValue); }
			if (null != extentConfig.paddingValue) { setPaddingValue(extentConfig.paddingValue); }
			if (null != extentConfig.getValue) { setGetValue(extentConfig.getValue); }
			if (null != extentConfig.filter) { setFilter(extentConfig.filter); }
		}
	}


	/**
	 * Public API
	 */

	/*
	 * Get/Set the default value for the extent
	 */
	_instance.defaultValue = function(v) {
		if (!arguments.length) { return _config.defaultValue; }
		setDefaultValue(v);
		return _instance;
	};

	/*
	 * Get/Set the override value for the extent
	 */
	_instance.overrideValue = function(v) {
		if (!arguments.length) { return _config.overrideValue; }
		setOverrideValue(v);
		return _instance;
	};

	/*
	 * Get/Set the padding value for the extent
	 */
	_instance.paddingValue = function(v) {
		if (!arguments.length) { return _config.paddingValue; }
		setPaddingValue(v);
		return _instance;
	};

	/*
	 * Get/Set the value accessor for the extent
	 */
	_instance.getValue = function(v) {
		if (!arguments.length) { return _fn.getValue; }
		setGetValue(v);
		return _instance;
	};

	/*
	 * Get/Set the filter fn for the extent
	 */
	_instance.filter = function(v) {
		if (!arguments.length) { return _fn.filter; }
		setFilter(v);
		return _instance;
	};

	/*
	 * Calculate the extent given some data.
	 * - Default values are used in the absence of data
	 * - Override values are used to clamp or extend the extent
	 */
	_instance.getExtent = function(data) {
		var toReturn;
		var ov = _config.overrideValue;

		// Check to see if we need to calculate the extent (if override isn't fully specified)
		if (null == ov || null == ov[0] || null == ov[1]) {

			// Since the override isn't complete, we need to calculate the extent
			toReturn = [ Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY ];
			var foundData = false;

			if (null != data) {
				// Iterate over each element of the data
				data.forEach(function(element, i) {
					// If the element passes the filter, then update the extent
					if (_fn.filter(element, i)) {
						foundData = true;
						var v = _fn.getValue(element, i);
						toReturn[0] = Math.min(toReturn[0], v);
						toReturn[1] = Math.max(toReturn[1], v);
					}
				});
			}

			// If we didn't find any data, use the default values
			if (!foundData) {
				toReturn = _config.defaultValue;
			}

			// Apply the overrides
			// - Since we're in this conditional, only one or zero overrides were specified
			if (null != ov) {
				if (null != ov[0]) {
					toReturn[0] = ov[0];
				}
				if (null != ov[1]) {
					toReturn[1] = ov[1];
				}
			}

			var pv = _config.paddingValue;
			if (null != pv && null != pv[0] && (null == ov || null == ov[0])) {
				// Only apply the padding if there was no override
				toReturn[0] -= _config.paddingValue[0];
			}
			if (null != pv && null != pv[1] && (null == ov || null == ov[1])) {
				toReturn[1] += _config.paddingValue[1];
			}

		}
		else {
			// Since the override is fully specified, use it
			toReturn = ov;
		}

		// Verify that the extent is valid
		if (toReturn[0] > toReturn[1]) {
			toReturn[1] = toReturn[0];
		}

		return toReturn;
	};


	// Initialize the model
	_instance(config);

	return _instance;
}

export { extent };
