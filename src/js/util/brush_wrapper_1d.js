function brushWrapper1d(config) {

	/**
	 * Private variables
	 */
	var _brush;
	var _enabled = false;


	/**
	 * Private Functions
	 */

	function setEnabled(v) {
		// Should probably fire event for new brush state
		_enabled = v;
	}

	function getEnabled() {
		return _enabled && null != _brush;
	}

	/*
	 * Get the current state of the filter
	 * Returns undefined if the filter is disabled or not set, millisecond time otherwise
	 */
	function getBrushSelection(node, scale) {
		var selection = undefined;

		if(_enabled && null != node && null != scale) {
			selection = d3.brushSelection(node);

			if (null != selection && Array.isArray(selection)) {
				selection = selection.map(scale.invert)
			}
			else {
				selection = undefined;
			}
		}

		return selection;
	}

	function cleanBrushSelection(filter) {
		if(!Array.isArray(filter) || filter.length != 2 || isNaN(filter[0]) || isNaN(filter[1])) {
			filter = undefined;
		}

		return filter;
	}

	/*
	 * Set the state of the filter, return true if filter changed
	 */
	function setBrushSelection(groupSelection, scale, n, o) {
		o = cleanBrushSelection(o);
		n = cleanBrushSelection(n);

		// Fire the event if the extents are different
		var suppressEvent = n === o || (null != n && null != o && n[0] === o[0] && n[1] === o[1]);

		var clearFilter = (null == n || n[0] >= n[1]);

		// either clear the filter or assert it
		if(clearFilter) {
			_brush.move(groupSelection, undefined);
		} else {
			_brush.move(groupSelection, [ scale(n[0]), scale(n[1]) ]);
		}

		// If there's no actual change to the filter, don't apply it
		if(!suppressEvent) {
			// Fire filter change events
		}
	}

	/*
	 * Constructor/initialization method
	 */
	function _instance(config) {
		if (null != config) {
			if (null != config.brush) { _brush = config.brush; }
			if (null != config.enabled) { setEnabled(config.enabled); }
		}
	}


	/**
	 * Public API
	 */

	// Get/Set brush
	_instance.brush = function(v) {
		if(!arguments.length) { return _brush; }
		_brush = v;
		return _instance;
	};

	// Get/Set enabled state
	_instance.enabled = function(v) {
		if(!arguments.length) { return getEnabled(); }
		setEnabled(v);
		return _instance;
	};

	_instance.getBrushSelection = function(node, scale) {
		return getBrushSelection(node, scale);
	};

	_instance.setBrushSelection = function(groupSelection, scale, newValue, oldValue) {
		return setBrushSelection(groupSelection, scale, newValue, oldValue);
	};

	// Initialize the model
	_instance(config);

	return _instance;
}

export { brushWrapper1d };
