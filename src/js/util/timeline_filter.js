function timelineFilter(config) {

	/**
	 * Private variables
	 */
	var _brush;
	var _enabled = false;


	/**
	 * Private Functions
	 */

	function setEnabled(v) {
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
		var selection = d3.brushSelection(node);

		if(null != selection && _brushEnabled && Array.isArray(selection)) {
			selection = selection.map(scale.invert)
		}
		else {
			selection = undefined;
		}

		return selection;
	}

	function cleanFilter(filter) {
		if(!Array.isArray(filter) || filter.length != 2 || isNaN(filter[0]) || isNaN(filter[1])) {
			filter = undefined;
		}

		return filter;
	}

	/*
	 * Set the state of the filter, return true if filter changed
	 */
	function setBrushSelection(node, scale, ne, oe) {
		var oe = cleanFilter(oe);
		ne = cleanFilter(ne);

		// Fire the event if the extents are different
		var suppressEvent = ne === oe || (null != ne && null != oe && ne[0] === oe[0] && ne[1] === oe[1]);
		var clearFilter = (null == ne || ne[0] >= ne[1]);

		// either clear the filter or assert it
		if(clearFilter) {
			_brush.move(node, undefined);
		} else {
			_brush.move(node, [ scale(new Date(ne[0])), scale(new Date(ne[1])) ]);
		}

		// fire the event if anything changed
		return !(suppressEvent);

	}

	/*
	 * Constructor/initialization method
	 */
	function _instance(config) {
		if (null != config) {
			if (null != config.brush) { setBrush(config.brush); }
			if (null != config.scale) { setScale(_scale = config.scale); }
			if (null != config.node) { setNode(_node = config.node); }

			if (null != config.enabled) { setEnabled(config.enabled); }
		}
	}


	/**
	 * Public API
	 */

	/*
	 * Get/Set the brush to use
	 */
	_instance.brush = function(v) {
		if(!arguments.length) { return _brush; }
		_brush = v;
		return _instance;
	};

	/*
	 * Get/Set the enabled state
	 */
	_instance.enabled = function(v) {
		if(!arguments.length) { return _enabled; }
		setEnabled(v);
		return _instance;
	};

	_instance.getFilter = function(node, scale) {
		return getBrushSelection(node, scale);
	};

	_instance.setFilter = function(newValue, oldValue) {
		return setBrushSelection(node, scale, newValue, oldValue);
	};

	// Initialize the model
	_instance(config);

	return _instance;
}

export { timelineFilter };
