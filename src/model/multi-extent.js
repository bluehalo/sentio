import { default as extent } from './extent';

export default function multiExtent(config) {

	var _extent = extent();
	var _series = [];

	function setExtent(v) {
		_extent = v;
	}

	function setSeries(v) {
		_series = v;
	}


	/*
	 * Constructor/initialization method
	 */
	function _instance(config) {

		if (null != config) {

			if (null != config.extent) {
				setExtent(config.extent);
			}

			if (null != config.series) {
				setSeries(config.series);
			}
		}

	}


	/**
	 * Public API
	 */

	/*
	 * Get/Set the extent to use
	 */
	_instance.extent = function(v) {
		if(!arguments.length) { return _extent; }
		setExtent(v);
		return _instance;
	};


	/*
	 * Get/Set the values accessor function
	 */
	_instance.series = function(v) {
		if(!arguments.length) { return _series; }
		_series = v;
		return _instance;
	};


	/*
	 * Calculate the extent given some data.
	 * - Default values are used in the absence of data
	 * - Override values are used to clamp or extend the extent
	 */
	_instance.getExtent = function(data) {
		var toReturn;

		// Iterate over each series
		_series.forEach(function(s) {

			// Update the extent to set the value getter
			_extent.getValue(s.getValue);

			// Get the extent of the current series
			var tExtent = _extent.getExtent(data);

			// If it's null, use the new extent
			if (null == toReturn) {
				toReturn = tExtent;
			}
			// Otherwise combine the extents
			else {
				toReturn[0] = Math.min(toReturn[0], tExtent[0]);
				toReturn[1] = Math.max(toReturn[1], tExtent[1]);
			}
		});

		// In case there was no data
		if(null == toReturn) {
			toReturn = _extent.getExtent([]);
		}

		return toReturn;
	};

	// Initialize the model
	_instance(config);

	return _instance;
}
