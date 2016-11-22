function timelineFilter(config) {

	/**
	 * Private variables
	 */

	var _brush = d3.svg.brush();
	var _enabled = false;

	/**
	 * Private Functions
	 */

	function setBrush(v) {
		_brush = v;
	}

	function setEnabled(v) {
		_enabled = v;
	}

	/*
	 * Get the current state of the filter
	 * Returns undefined if the filter is disabled or not set, millisecond time otherwise
	 */
	function getFilter() {
		var extent;
		if(_enabled && !_brush.empty()) {
			extent = _brush.extent();
			if(null != extent) {
				extent = [ extent[0].getTime(), extent[1].getTime() ];
			}
		}

		return extent;
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
	function setFilter(ne) {
		var oe = cleanFilter(getFilter());
		ne = cleanFilter(ne);

		// Fire the event if the extents are different
		var suppressEvent = ne === oe || (null != ne && null != oe && ne[0] === oe[0] && ne[1] === oe[1]);
		var clearFilter = (null == ne || ne[0] >= ne[1]);

		// either clear the filter or assert it
		if(clearFilter) {
			_brush.clear();
		} else {
			_brush.extent([ new Date(ne[0]), new Date(ne[1]) ]);
		}

		// fire the event if anything changed
		return !(suppressEvent);

	}

	/*
	 * Constructor/initialization method
	 */
	function _instance(config) {
		if (null != config) {
			if (null != config.brush) {
				setBrush(config.brush);
			}
			if (null != config.enabled) {
				setEnabled(config.enabled);
			}
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
		setBrush(v);
		return _instance;
	};

	/*
	 * Get/Set the values accessor function
	 */
	_instance.enabled = function(v) {
		if(!arguments.length) { return _enabled; }
		setEnabled(v);
		return _instance;
	};

	_instance.getFilter = function() {
		return getFilter();
	};

	_instance.setFilter = function(v) {
		return setFilter(v);
	};

	// Initialize the model
	_instance(config);

	return _instance;
}

export { timelineFilter };
