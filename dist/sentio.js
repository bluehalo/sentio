/*! sentio Version: 0.7.7 */
if(null == sentio) { var sentio = {}; }
var sentio_util = sentio.util = {};
sentio.util.extent = sentio_util_extent;

function sentio_util_extent(config) {
	'use strict';

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {
		defaultValue: [0, 10],
		overrideValue: undefined
	};

	var _fn = {
		getValue: function(d, i) { return d; },
		filter: function(d, i) { return true; }
	};


	/**
	 * Private Functions
	 */

	function setDefaultValue(v) {
		if(null == v || 2 !== v.length || isNaN(v[0]) || isNaN(v[1]) || v[0] >= v[1]) {
			throw new Error('Default extent must be a two element ordered array of numbers');
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
		if(typeof v !== 'function') {
			throw new Error('Value getter must be a function');
		}

		_fn.getValue = v;
	}

	function setFilter(v) {
		if(typeof v !== 'function') {
			throw new Error('Filter must be a function');
		}

		_fn.filter = v;
	}

	/*
	 * Constructor/initialization method
	 */
	function _instance(extentConfig) {
		if(null != extentConfig) {
			if(null != extentConfig.defaultValue) { setDefaultValue(extentConfig.defaultValue); }
			if(null != extentConfig.overrideValue) { setOverrideValue(extentConfig.overrideValue); }
			if(null != extentConfig.getValue) { setGetValue(extentConfig.getValue); }
			if(null != extentConfig.filter) { setFilter(extentConfig.filter); }
		}
	}


	/**
	 * Public API
	 */

	/*
	 * Get/Set the default value for the extent
	 */
	_instance.defaultValue = function(v) {
		if(!arguments.length) { return _config.defaultValue; }
		setDefaultValue(v);
		return _instance;
	};

	/*
	 * Get/Set the override value for the extent
	 */
	_instance.overrideValue = function(v) {
		if(!arguments.length) { return _config.overrideValue; }
		setOverrideValue(v);
		return _instance;
	};

	/*
	 * Get/Set the value accessor for the extent
	 */
	_instance.getValue = function(v) {
		if(!arguments.length) { return _fn.getValue; }
		setGetValue(v);
		return _instance;
	};

	/*
	 * Get/Set the filter fn for the extent
	 */
	_instance.filter = function(v) {
		if(!arguments.length) { return _fn.filter; }
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

		// Check to see if we need to calculate the extent
		if(null == ov || null == ov[0] || null == ov[1]) {
			// Since the override isn't complete, we need to calculate the extent
			toReturn = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
			var foundData = false;

			if(null != data) {
				// Iterate over each element of the data
				data.forEach(function(element, i) {
					// If the element passes the filter, then update the extent
					if(_fn.filter(element, i)) {
						foundData = true;
						var v = _fn.getValue(element, i);
						toReturn[0] = Math.min(toReturn[0], v);
						toReturn[1] = Math.max(toReturn[1], v);
					}
				});
			}

			// If we didn't find any data, use the default values
			if(!foundData) {
				toReturn = _config.defaultValue;
			}

			// Apply the overrides
			// - Since we're in this conditional, only one or zero overrides were specified
			if(null != ov) {
				if(null != ov[0]) {
					// Set the lower override
					toReturn[0] = ov[0];
					if(toReturn[0] > toReturn[1]) {
						toReturn[1] = toReturn[0];
					}
				}
				if(null != ov[1]) { 
					toReturn[1] = ov[1];
					if(toReturn[1] < toReturn[0]) {
						toReturn[0] = toReturn[1];
					}
				}
			}
		} else {
			// Since the override is fully specified, use it
			toReturn = ov;
		}

		return toReturn;
	};


	// Initialize the model
	_instance(config);

	return _instance;
}
sentio.util.multiExtent = sentio_util_multi_extent;

function sentio_util_multi_extent(config) {
	'use strict';

	/**
	 * Private variables
	 */

	var _fn = {
		values: function(d) { return d.values; }
	};

	var _extent = sentio.util.extent();

	/**
	 * Private Functions
	 */

	function setExtent(v) {
		_extent = v;
	}

	/*
	 * Constructor/initialization method
	 */
	function _instance(config) {
		if(null != config && null != config.extent) {
			setExtent(config.extent);
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
	_instance.values = function(v) {
		if(!arguments.length) { return _fn.values; }
		_fn.values = v;
		return _instance;
	};

	/*
	 * Calculate the extent given some data.
	 * - Default values are used in the absence of data
	 * - Override values are used to clamp or extend the extent
	 */
	_instance.getExtent = function(data) {
		var toReturn;

		data.forEach(function(e) {
			var tExtent = _extent.getExtent(_fn.values(e));
			if(null == toReturn) {
				toReturn = tExtent;
			}
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
var sentio_model = sentio.model = {};
sentio.model.bins = sentio_model_bins;

function sentio_model_bins(config) {
	'use strict';

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {
		// The number of bins in our model
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
		updateBin: function(bin, d) { bin[1].push(d); },

		// The default function for counting the contents of the bins (includes code for backward compatibility)
		countBin: function(bin) {
			// If the bin contains a number, just return it
			if (typeof bin[1] === 'number') {
				return bin[1];
			}
			// If the bin contains an array of data, return the number of items
			if (bin[1].hasOwnProperty('length')) {
				return bin[1].length;
			}
			return 0;
		},

		// The default function to be called after items are added to the bins
		afterAdd: function(bins, currentCount, previousCount) {},

		// The default function to be called after the bins are updated
		afterUpdate: function(bins, currentCount, previousCount) {}
	};

	// The data (an array of object containers)
	var _data = [];

	// A cached total count of all the objects in the bins
	var _dataCount = 0;


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
		var bin;
		var prevCount = _dataCount;

		// drop stuff below the lwm
		while(_data.length > 0 && _data[0][0] < _config.lwm) {
			bin = _data.shift();
			_dataCount -= _fn.countBin(bin);
		}

		// drop stuff above the hwm
		while(_data.length > 0 && _data[_data.length - 1][0] >= _config.hwm) {
			bin = _data.pop();
			_dataCount -= _fn.countBin(bin);
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
		if (_fn.afterUpdate) {
			_fn.afterUpdate.call(model, _data, _dataCount, prevCount);
		}
	}

	function addData(dataToAdd) {
		var prevCount = _dataCount;

		dataToAdd.forEach(function(element) {
			var i = getIndex(_fn.getKey(element));
			if(i >= 0 && i < _data.length) {
				var value = _fn.getValue(element);
				var prevBinCount = _fn.countBin(_data[i]);
				_fn.updateBin.call(model, _data[i], value);
				_dataCount += _fn.countBin(_data[i]) - prevBinCount;
			}
		});
		if (_fn.afterAdd) {
			_fn.afterAdd.call(model, _data, _dataCount, prevCount);
		}
	}

	function clearData() {
		_data.length = 0;
		_dataCount = 0;
	}


	/*
	 * Constructor/initialization method
	 */
	function model(binConfig) {
		if(null == binConfig || null == binConfig.size || null == binConfig.count || null == binConfig.lwm) {
			throw new Error('You must provide an initial size, count, and lwm');
		}
		_config.size = binConfig.size;
		_config.count = binConfig.count;
		_config.lwm = binConfig.lwm;

		if(null != binConfig.createSeed) { _fn.createSeed = binConfig.createSeed; }
		if(null != binConfig.getKey) { _fn.getKey = binConfig.getKey; }
		if(null != binConfig.getValue) { _fn.getValue = binConfig.getValue; }
		if(null != binConfig.updateBin) { _fn.updateBin = binConfig.updateBin; }
		if(null != binConfig.countBin) { _fn.countBin = binConfig.countBin; }
		if(null != binConfig.afterAdd) { _fn.afterAdd = binConfig.afterAdd; }
		if(null != binConfig.afterUpdate) { _fn.afterUpdate = binConfig.afterUpdate; }

		calculateHwm();
		updateState();
	}


	/**
	 * Public API
	 */

	/**
	 * Resets the model with the new data
	 */
	model.set = function(data) {
		clearData();
		updateState();
		addData(data);
		return model;
	};

	/**
	 * Clears the data currently in the bin model
	 */
	model.clear = function() {
		clearData();
		updateState();
		return model;
	};

	/**
	 * Add an array of data objects to the bins
	 */
	model.add = function(dataToAdd) {
		addData(dataToAdd);
		return model;
	};

	/**
	 * Get/Set the low water mark value
	 */
	model.lwm = function(v) {
		if(!arguments.length) { return _config.lwm; }

		var oldLwm = _config.lwm;
		_config.lwm = Number(v);

		calculateHwm();

		if((oldLwm - _config.lwm) % _config.size !== 0) {
			// the difference between watermarks is not a multiple of the bin size, so we need to reset
			clearData();
		}

		updateState();

		return model;
	};

	/**
	 * Get the high water mark
	 */
	model.hwm = function() {
		return _config.hwm;
	};

	/**
	 * Get/Set the key function used to determine the key value for indexing into the bins
	 */
	model.getKey = function(v) {
		if(!arguments.length) { return _fn.getKey; }
		_fn.getKey = v;

		clearData();
		updateState();

		return model;
	};

	/**
	 * Get/Set the value function for determining what value is added to the bin
	 */
	model.getValue = function(v) {
		if(!arguments.length) { return _fn.getValue; }
		_fn.getValue = v;

		clearData();
		updateState();

		return model;
	};

	/**
	 * Get/Set the Update bin function for determining how to update the state of a bin when a new value is added to it
	 */
	model.updateBin = function(v) {
		if(!arguments.length) { return _fn.updateBin; }
		_fn.updateBin = v;

		clearData();
		updateState();

		return model;
	};

	/**
	 * Get/Set the seed function for populating
	 */
	model.createSeed = function(v) {
		if(!arguments.length) { return _fn.createSeed; }
		_fn.createSeed = v;

		clearData();
		updateState();

		return model;
	};

	/**
	 * Get/Set the countBin function for populating
	 */
	model.countBin = function(v) {
		if(!arguments.length) { return _fn.countBin; }
		_fn.countBin = v;

		clearData();
		updateState();

		return model;
	};

	/**
	 * Get/Set the afterAdd callback function
	 */
	model.afterAdd = function(v) {
		if(!arguments.length) { return _fn.afterAdd; }
		_fn.afterAdd = v;
		return model;
	};

	/**
	 * Get/Set the afterAdd callback function
	 */
	model.afterUpdate = function(v) {
		if(!arguments.length) { return _fn.afterUpdate; }
		_fn.afterUpdate = v;
		return model;
	};

	/**
	 * Get/Set the bin size configuration
	 */
	model.size = function(v) {
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

		return model;
	};

	/**
	 * Get/Set the bin count configuration
	 */
	model.count = function(v) {
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

		return model;
	};

	/**
	 * Accessor for the bins of data
	 * @returns {Array} Returns the complete array of bins
	 */
	model.bins = function() {
		return _data;
	};

	/**
	 * Accessor for the cached count of all the data in the bins, calculated for each bin by the countBin() function
	 * @returns {number} The count of data in the bins
	 */
	model.itemCount = function() {
		return _dataCount;
	};

	/**
	 * Clears all the data in the bin with the given index
	 * @param {number} i The index into the bins array of the bin to clear
	 * @returns {number} The number of items in the bin that was cleared, as returned by countBin() function
	 */
	model.clearBin = function(i) {
		if (i >= 0 && i < _data.length) {
			var count = _fn.countBin(_data[i]);
			_dataCount -= count;
			_data[i][1] = _fn.createSeed();
			return count;
		}
		return 0;
	};

	// Initialize the model
	model(config);

	return model;
}
var sentio_controller = sentio.controller = {};
sentio.controller.rtBins = sentio_controller_rtBins;

/*
 * Controller wrapper for the bin model. Assumes binSize is in milliseconds.
 * Every time binSize elapses, updates the lwm to keep the bins shifting.
 */
function sentio_controller_rtBins(config) {
	'use strict';

	/**
	 * Private variables
	 */
	var _config = {
		delay: 0,
		binSize: 0,
		binCount: 0
	};

	// The bins
	var _model;
	var _running;

	/**
	 * Private Functions
	 */

	function _calculateLwm() {
		// Assume the hwm is now plus two binSize
		var hwm = Date.now() + 2*_model.size();

		// Trunc the hwm down to a round value based on the binSize
		hwm = Math.floor(hwm/_model.size()) * _model.size();

		// Derive the lwm from the hwm
		var lwm = hwm - _model.size() * _model.count();

		return lwm;
	}

	function _update() {
		if(_running === true) {
			// need to update the lwm
			_model.lwm(_calculateLwm());
			window.setTimeout(_update, _model.size());
		}
	}

	function _start() {
		if(!_running) {
			// Start the update loop
			_running = true;
			_update();
		}
	}

	function _stop() {
		// Setting running to false will stop the update loop
		_running = false;
	}

	// create/init method
	function controller(rtConfig) {
		if(null == rtConfig || null == rtConfig.binCount || null == rtConfig.binSize) {
			throw new Error('You must provide an initial binSize and binCount');
		}

		_config.binSize = rtConfig.binSize;
		_config.binCount = rtConfig.binCount;

		if(null != rtConfig.delay) {
			_config.delay = rtConfig.delay;
		}

		_model = sentio.model.bins({
			size: _config.binSize,
			count: _config.binCount + 2,
			lwm: 0
		});
		_model.lwm(_calculateLwm());

		_start();
	}



	/**
	 * Public API
	 */

	/*
	 * Get the model bins
	 */
	controller.model = function() {
		return _model;
	};

	controller.bins = function() {
		return _model.bins();
	};

	controller.start = function() {
		_start();
		return controller;
	};

	controller.stop = function() {
		_stop();
		return controller;
	};

	controller.running = function() {
		return _running;
	};

	controller.add = function(v) {
		_model.add(v);
		return controller;
	};

	controller.clear = function() {
		_model.clear();
		return controller;
	};

	controller.binSize = function(v) {
		if(!arguments.length) { return _config.binSize; }

		if(Number(v) < 1) {
			throw new Error('Bin size must be a positive integer');
		}

		_config.binSize = v;
		_model.size(v);
		_model.lwm(_calculateLwm());

		return controller;
	};

	controller.binCount = function(v) {
		if(!arguments.length) { return _config.binCount; }

		if(Number(v) < 1) {
			throw new Error('Bin count must be a positive integer');
		}

		_config.binCount = v;
		_model.count(v + 2);
		_model.lwm(_calculateLwm());

		return controller;
	};

	// Initialize the layout
	controller(config);

	return controller;
}
var sentio_chart = sentio.chart = {};
sentio.chart.donut = sentio_chart_donut;

function sentio_chart_donut() {
	'use strict';

	// Chart height/width
	var _width = 400;
	var _height = 400;
	var _margin = { top: 2, bottom: 2, right: 2, left: 2 };

	// Inner and outer radius settings
	var _radius;
	var _innerRadiusRatio = 0.7;

	// Transition duration
	var _duration = 500;

	// Legend configuration
	var _legend = {
		enabled: true,
		markSize: 16,
		markMargin: 8,
		labelOffset: 2,
		position: 'center', // only option right now
		layout: 'vertical'
	};

	// d3 dispatcher for handling events
	var _dispatch = d3.dispatch('onMouseOver', 'onMouseOut', 'onClick');

	// Function handlers
	var _fn = {
		updateActiveElement: function(d) {
			var legendEntries = _element.gLegend.selectAll('g.entry');
			var arcs = _element.gChart.selectAll('path.arc');

			if(null != d && null != d.data) {
				d = d.data;
			}

			if(null != d) {
				// Set the highlight on the row
				var key = _fn.key(d);
				legendEntries.classed('active', function(e){
					return _fn.key(e) == key;
				});
				arcs.classed('active', function(e){
					return _fn.key(e.data) == key;
				});
			}
			else {
				legendEntries.classed('active', false);
				arcs.classed('active', false);
			}
		},
		onMouseOver: function(d, i) {
			_fn.updateActiveElement(d);
			_dispatch.onMouseOver(d, this);
		},
		onMouseOut: function(d, i) {
			_fn.updateActiveElement();
			_dispatch.onMouseOut(d, this);
		},
		onClick: function(d, i) {
			_dispatch.onClick(d, this);
		},
		key: function(d, i) { return d.key; },
		value: function(d, i) { return d.value; },
		label: function(d, i) { return d.key + ' (' + d.value + ')'; }
	};


	// Extents
	var _extent = {
	};

	var _scale = {
		color: d3.scale.category10()
	};

	var _layout = {
		arc: d3.svg.arc(),
		pie: d3.layout.pie().value(_fn.value).sort(null)
	};

	// elements
	var _element = {
		div: undefined,
		svg: undefined,
		gChart: undefined,
		legend: undefined
	};

	var _data = [];

	// Chart create/init method
	function _instance(selection){}

	/*
	 * Initialize the chart (should only call this once). Performs all initial chart
	 * creation and setup
	 */
	_instance.init = function(container){
		// Create the DIV element
		_element.div = container.append('div').attr('class', 'sentio donut');

		// Create the svg element
		_element.svg = _element.div.append('svg');

		// Create the main chart group
		_element.gChart = _element.svg.append('g').attr('class', 'chart');

		// Create a group for the legend
		_element.gLegend = _element.svg.append('g').attr('class', 'legend');

		_instance.resize();

		return _instance;
	};

	/*
	 * Set the _instance data
	 */
	_instance.data = function(v) {
		if(!arguments.length) { return _data; }
		_data = v || [];
		return _instance;
	};

	/*
	 * Updates all the elements that depend on the size of the various components
	 */
	_instance.resize = function() {
		var chartWidth = _width - _margin.right - _margin.left;
		var chartHeight = _height - _margin.top - _margin.bottom;
		_radius = (Math.min(chartHeight, chartWidth))/2;

		_element.svg
			.attr('width', _width)
			.attr('height', _height);

		_element.gChart
			.attr('transform', 'translate(' + (_margin.left + _radius) + ',' + (_margin.top + _radius) + ')');

		// The outer radius is half of the lesser of the two (chartWidth/chartHeight)
		_layout.arc.innerRadius(_radius * _innerRadiusRatio).outerRadius(_radius);

		// Update legend positioning
		_element.gLegend.attr('transform', legendTransform());

		return _instance;
	};

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {

		redrawChart();

		if (_legend.enabled) {
			redrawLegend();
		}

		return _instance;
	};

	/**
	 * Private functions
	 */
	function redrawChart() {
		/*
		 * Join the data
		 */
		var g = _element.gChart.selectAll('path.arc')
			.data(_layout.pie(_data), function(d, i) { return _fn.key(d.data, i); });

		/*
		 * Update Only
		 */

		/*
		 * Enter Only
		 * Create the path, add the arc class, register the callbacks
		 * Grow from 0 for both start and end angles
		 */
		var gEnter = g.enter().append('path')
			.attr('class', 'arc')
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut)
			.on('click', _fn.onClick)
			.each(function(d) { this._current = { startAngle: 0, endAngle: 0 }; });

		/*
		 * Enter + Update
		 * Apply the update from current angle to next angle
		 */
		g.transition().duration(_duration)
			.attrTween('d', function(d) {
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					return _layout.arc(interpolate(t));
				};
			});

		g.attr('key', function(d, i) { return _fn.key(d.data, i); })
			.attr('fill', function(d, i) { return _scale.color(_fn.key(d.data, i)); });

		g.exit().remove();
	}

	function legendTransform() {
		var entrySpan = _legend.markSize + _legend.markMargin;

		// Only option is 'center' for now
		if (_legend.position === 'center') {
			// The center position of the chart
			var centerX = _margin.left + _radius;
			var centerY = _margin.top + _radius;
			var legendWidth = (null == _element.gLegend._maxWidth)? 0 : _element.gLegend._maxWidth;
			var legendHeight = entrySpan*_data.length + _legend.markMargin;

			var offsetX = legendWidth/2;
			var offsetY = legendHeight/2;

			return 'translate(' + (centerX - offsetX) + ',' + (centerY - offsetY) + ')';
		} else {
			// TODO
		}
	}

	function redrawLegend() {
		/*
		 * Join the data
		 */
		var gLegendGroup = _element.gLegend.selectAll('g.entry')
			.data(_data, function(d, i) { return _fn.key(d, i); });

		/*
		 * Enter Only
		 * Create a g (gLegendGroup) to add the rect & text label,
		 * register the callbacks, apply the transform to position each gLegendGroup
		 */
		var gLegendGroupEnter = gLegendGroup.enter().append('g')
			.attr('class', 'entry')
			.attr('transform', function(d, i) { return 'translate(0, ' + (i*(_legend.markSize + _legend.markMargin)) + ')'; } )
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut)
			.on('click', _fn.onClick);

		// Add the legend's rect
		var rect = gLegendGroupEnter
			.append('rect')
			.attr('width', _legend.markSize)
			.attr('height', _legend.markSize);

		// Add the legend text
		gLegendGroupEnter
			.append('text')
			.attr('x', _legend.markSize + _legend.markMargin)
			.attr('y', _legend.markSize - _legend.labelOffset);

		/*
		 * Enter + Update
		 */
		gLegendGroup.select('text')
			.text(function(d, i) { return _fn.label(d, i); });

		gLegendGroup.select('rect')
			.style('fill', function(d) { return _scale.color(_fn.key(d)); });

		// Position each rect on both enter and update to fully account for changing widths and sizes
		gLegendGroup
			// Iterate over all the legend keys to get the max width and store it in gLegendGroup._maxWidth
			.each(function(d, i) {
				if (i === 0) {
					// Reset
					_element.gLegend._maxWidth = this.getBBox().width;
				} else {
					_element.gLegend._maxWidth = Math.max(this.getBBox().width, _element.gLegend._maxWidth);
				}
			});

		// Reassert the legend position
		_element.gLegend.attr('transform', legendTransform());

		gLegendGroup.exit().remove();
	}

	// Basic Getters/Setters
	_instance.width = function(v) {
		if(!arguments.length) { return _width; }
		_width = v;
		return _instance;
	};
	_instance.height = function(v) {
		if(!arguments.length) { return _height; }
		_height = v;
		return _instance;
	};

	_instance.innerRadiusRatio = function(v) {
		if(!arguments.length) { return _innerRadiusRatio; }
		_innerRadiusRatio = v;
		return _instance;
	};

	_instance.duration = function(v) {
		if(!arguments.length) { return _duration; }
		_duration = v;
		return _instance;
	};

	_instance.key = function(v) {
		if(!arguments.length) { return _fn.key; }
		_fn.key = v;
		return _instance;
	};
	_instance.value = function(v) {
		if(!arguments.length) { return _fn.value; }
		_fn.value = v;
		_layout.pie.value(v);
		return _instance;
	};
	_instance.label = function(v) {
		if(!arguments.length) { return _fn.label; }
		_fn.label = v;
		return _instance;
	};
	_instance.color = function(v) {
		if(!arguments.length) { return _scale.color; }
		_scale.color = v;
		return _instance;
	};

	_instance.dispatch = function(v) {
		if(!arguments.length) { return _dispatch; }
		return _instance;
	};

	_instance.legend = function(v) {
		if(!arguments.length) { return _legend; }
		_legend = v;
		return _instance;
	};

	return _instance;
}
sentio.chart.matrix = sentio_chart_matrix;

function sentio_chart_matrix() {
	'use strict';

	// Chart dimensions
	var _cellSize = 16;
	var _cellMargin = 1;
	var _margin = { top: 20, right: 2, bottom: 2, left: 64 };

	// Transition duration
	var _duration = 500;

	// d3 dispatcher for handling events
	var _dispatch = d3.dispatch('onMouseOverCell', 'onMouseOutCell', 'onClickCell', 'onMouseOverRow', 'onMouseOutRow', 'onClickRow');

	// Function handlers
	var _fn = {
		updateActiveSeries: function(d) {
			var seriesLabels = _element.g.chart.selectAll('.row text');

			if(null != d) {
				// Set the highlight on the row
				var seriesKey = _fn.seriesKey(d);
				seriesLabels.classed('active', function(series, i){ return _fn.seriesKey(series) == seriesKey; });
			}
			else {
				// Now update the style
				seriesLabels.classed('active', false);
			}
		},
		onMouseOverRow: function(d, i) {
			_fn.updateActiveSeries(d);
			_dispatch.onMouseOverRow(d, this);
		},
		onMouseOutRow: function(d, i) {
			_fn.updateActiveSeries();
			_dispatch.onMouseOutRow(d, this);
		},
		onClickRow: function(d, i) {
			_dispatch.onClickRow(d, this);
		},
		onMouseOverCell: function(d, i) {
			_dispatch.onMouseOverCell(d, this);
		},
		onMouseOutCell: function(d, i) {
			_dispatch.onMouseOutCell(d, this);
		},
		onClickCell: function(d, i) {
			_dispatch.onClickCell(d, this);
		},
		seriesKey: function(d, i) { return d.key; },
		seriesLabel: function(d, i) { return d.label; },
		seriesValues: function(d, i) { return d.values; },
		key: function(d, i) { return d.key; },
		value: function(d, i) { return d.value; }
	};

	// Extents
	var _extent = {
		x: sentio.util.extent().getValue(_fn.key),
		value: sentio.util.extent().getValue(_fn.value),
		multi: sentio.util.multiExtent()
	};

	// Scales for x, y, and color
	var _scale = {
		x: d3.scale.linear(),
		y: d3.scale.ordinal(),
		color: d3.scale.linear().range(['#e7e7e7', '#008500'])
	};

	var _axis = {
		x: d3.svg.axis().scale(_scale.x).orient('top').outerTickSize(0).innerTickSize(2)
	};

	var _element = {
		div: undefined,
		svg: undefined,
		g: {
			chart: undefined,
			xAxis: undefined
		}
	};

	var _data = [];

	var _instance = function () {};

	_instance.init = function(d3Container) {
		// Add the svg element
		_element.div = d3Container.append('div').attr('class', 'sentio matrix');
		_element.svg = _element.div.append('svg');

		// Add the axis
		_element.g.xAxis = _element.svg.append('g').attr('class', 'x axis');

		// Add a group for the chart itself
		_element.g.chart = _element.svg.append('g').attr('class', 'chart');

		_instance.resize();

		return _instance;
	};

	_instance.data = function(d) {
		if(!arguments.length) {
			return _data;
		}
		_data = d || [];
		return _instance;
	};

	_instance.resize = function() { };

	_instance.redraw = function() {
		// Determine the number of rows to render
		var rowCount = _data.length;

		// Determine the number of boxes to render (assume complete data)
		var boxes = [];
		if(rowCount > 0) {
			boxes = _fn.seriesValues(_data[0]);
		}
		var boxCount = boxes.length;

		// Dimensions of the visualization
		var cellSpan = _cellMargin + _cellSize;

		// calculate the width/height of the svg
		var width = boxCount*cellSpan + _cellMargin,
			height = rowCount*cellSpan + _cellMargin;

		// scale the svg to the right size
		_element.svg
			.attr('width', width + _margin.left + _margin.right)
			.attr('height', height + _margin.top + _margin.bottom);

		// Configure the scales
		_scale.x.domain(_extent.x.getExtent(boxes)).range([0, width - _cellMargin - cellSpan]);
		_scale.color.domain(_extent.multi.values(_fn.seriesValues).extent(_extent.value).getExtent(_data));

		// Draw the x axis
		_element.g.xAxis.attr('transform', 'translate(' + (_margin.left + _cellMargin + _cellSize/2) + "," + _margin.top + ")");
		_element.g.xAxis.call(_axis.x);

		/**
		 * Chart Manipulation
		 */

		/*
		 * Row Join
		 */
		var row = _element.g.chart.selectAll('g.row').data(_data, _fn.seriesKey);

		/*
		 * Row Update Only
		 */

		/*
		 * Row Enter Only
		 * Build the row structure
		 */
		var rowEnter = row.enter().append('g');
		rowEnter
			.style('opacity', 0.1)
			.attr('class', 'row')
			.attr('transform', function(d, i) { return 'translate(' + _margin.left + ',' + (_margin.top + (cellSpan*i)) + ')'; })
			.on('mouseover', _fn.onMouseOverRow)
			.on('mouseout', _fn.onMouseOutRow)
			.on('click', _fn.onClickRow);

		// Also must append the label of the row
		rowEnter.append('text')
			.attr('class', 'series label')
			.style('text-anchor', 'end')
			.attr('x', -6)
			.attr('y', _cellMargin + (_cellSize/2))
			.attr('dy', '.32em');

		// Also must append a line
		rowEnter.append('line')
			.attr('class', 'series tick')
			.attr('x1', -3)
			.attr('x2', 0)
			.attr('y1', _cellMargin + (_cellSize/2))
			.attr('y2', _cellMargin + (_cellSize/2));

		/*
		 * Row Enter + Update
		 */
		// Transition rows to their new positions
		row.transition().duration(_duration)
			.style('opacity', 1)
			.attr('transform', function(d, i){
				return 'translate(' + _margin.left + ',' + (_margin.top + (cellSpan*i)) + ')';
			});

		// Update the series labels in case they changed
		row.select('text.series.label')
			.text(_fn.seriesLabel);

		/*
		 * Row Exit
		 */
		row.exit()
			.transition().duration(_duration)
			.style('opacity', 0.1)
			.remove();


		/*
		 * Cell Join - Will be done on row enter + exit
		 */
		var rowCell = row.selectAll('rect.cell').data(_fn.seriesValues, _fn.key);

		/*
		 * Cell Update Only
		 */

		/*
		 * Cell Enter Only
		 */
		rowCell.enter().append('rect')
			.attr('class', 'cell')
			.style('opacity', 0.1)
			.style('fill', function(d, i) { return _scale.color(_fn.value(d, i)); })
			.attr('x', function(d, i){ return _scale.x(_fn.key(d, i)) + _cellMargin; })
			.attr('y', _cellMargin)
			.attr('height', _cellSize)
			.attr('width', _cellSize)
			.on('mouseover', _fn.onMouseOverCell)
			.on('mouseout', _fn.onMouseOutCell)
			.on('click', _fn.onClickCell);

		/*
		 * Cell Enter + Update
		 * Update fill, move to proper x coordinate
		 */
		rowCell.transition().duration(_duration)
			.style('opacity', 1)
			.attr('x', function(d, i){ return _scale.x(_fn.key(d, i)) + _cellMargin; })
			.style('fill', function(d, i) { return _scale.color(_fn.value(d, i)); });

		/*
		 * Cell Remove
		 */
		rowCell.exit().transition().duration(_duration)
			.attr('width', 0)
			.style('opacity', 0.1)
			.remove();

		return _instance;
	};


	_instance.cellSize = function(v) {
		if(!arguments.length) { return _cellSize; }
		_cellSize = v;
		return _instance;
	};
	_instance.cellMargin = function(v) {
		if(!arguments.length) { return _cellMargin; }
		_cellMargin = v;
		return _instance;
	};
	_instance.margin = function(v) {
		if(!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};

	_instance.duration = function(v) {
		if(!arguments.length) { return _duration; }
		_duration = v;
		return _instance;
	};

	_instance.seriesKey = function(v) {
		if(!arguments.length) { return _fn.seriesKey; }
		_fn.seriesKey = v;
		return _instance;
	};
	_instance.seriesLabel = function(v) {
		if(!arguments.length) { return _fn.seriesLabel; }
		_fn.seriesLabel = v;
		return _instance;
	};
	_instance.seriesValues = function(v) {
		if(!arguments.length) { return _fn.seriesValues; }
		_fn.seriesValues = v;
		return _instance;
	};
	_instance.key = function(v) {
		if(!arguments.length) { return _fn.key; }
		_extent.x.getValue(v);
		_fn.key = v;
		return _instance;
	};
	_instance.value = function(v) {
		if(!arguments.length) { return _fn.value; }
		_fn.value = v;
		_extent.value.getValue(v);
		return _instance;
	};

	_instance.colorScale = function(v) {
		if(!arguments.length) { return _scale.color; }
		_scale.color = v;
		return _instance;
	};
	_instance.xScale = function(v) {
		if(!arguments.length) { return _scale.xScale; }
		_scale.xScale = v;
		_axis.x.scale(v);
		return _instance;
	};
	_instance.yScale = function(v) {
		if(!arguments.length) { return _scale.yScale; }
		_scale.yScale = v;
		return _instance;
	};

	_instance.xExtent = function(v) {
		if(!arguments.length) { return _extent.x; }
		_extent.x = v;
		return _instance;
	};
	_instance.yExtent = function(v) {
		if(!arguments.length) { return _extent.y; }
		_extent.y = v;
		return _instance;
	};
	_instance.valueExtent = function(v) {
		if(!arguments.length) { return _extent.value; }
		_extent.value = v;
		return _instance;
	};

	_instance.dispatch = function(v) {
		if(!arguments.length) { return _dispatch; }
		return _instance;
	};

	return _instance;
}
sentio.chart.verticalBars = sentio_chart_vertical_bars;

function sentio_chart_vertical_bars() {
	'use strict';

	// Layout properties
	var _id = 'vertical_bars_' + Date.now();
	var _margin = { top: 0, right: 0, bottom: 0, left: 0 };
	var _width = 100;
	var _barHeight = 24;
	var _barPadding = 2;
	var _duration = 500;

	// d3 dispatcher for handling events
	var _dispatch = d3.dispatch('onmouseover', 'onmouseout', 'onclick');
	var _fn = {
		onMouseOver: function(d, i) {
			_dispatch.onmouseover(d, this);
		},
		onMouseOut: function(d, i) {
			_dispatch.onmouseout(d, this);
		},
		onClick: function(d, i) {
			_dispatch.onclick(d, this);
		}
	};

	// Default accessors for the dimensions of the data
	var _value = {
		key: function(d, i) { return d.key; },
		value: function(d, i) { return d.value; },
		label: function(d, i) { return d.key + ' (' + d.value + ')'; }
	};

	// Default scales for x and y dimensions
	var _scale = {
		x: d3.scale.linear(),
		y: d3.scale.linear()
	};

	// Extents
	var _extent = {
		width: sentio.util.extent({
			defaultValue: [0, 10],
			getValue: _value.value
		})
	};

	// elements
	var _element = {
		div: undefined
	};

	var _data = [];

	// Chart create/init method
	function _instance(selection){}

	/*
	 * Initialize the chart (should only call this once). Performs all initial chart
	 * creation and setup
	 */
	_instance.init = function(container){
		// Create the DIV element
		_element.div = container.append('div').attr('class', 'sentio bars-vertical');
		_instance.resize();

		return _instance;
	};

	/*
	 * Set the _instance data
	 */
	_instance.data = function(v) {
		if(!arguments.length) { return _data; }
		_data = v || [];

		return _instance;
	};

	/*
	 * Updates all the elements that depend on the size of the various components
	 */
	_instance.resize = function() {
		// Set up the x scale (y is fixed)
		_scale.x.range([0, _width - _margin.right - _margin.left]);

		return _instance;
	};

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {

		// Update the x domain
		_scale.x.domain(_extent.width.getExtent(_data));

		// Update the y domain (based on configuration and data)
		_scale.y.domain([0, _data.length]);
		_scale.y.range([0, (_barHeight + _barPadding) * _data.length]);

		// Data Join
		var div = _element.div.selectAll('div.bar')
			.data(_data, _value.key);

		// Update Only

		// Enter
		var bar = div.enter().append('div')
			.attr('class', 'bar')
			.style('top', (_scale.y.range()[1] + _margin.top + _margin.bottom - _barHeight) + 'px')
			.style('height', _barHeight + 'px')
			.on('mouseover', _fn.onMouseOver)
			.on('mouseout', _fn.onMouseOut)
			.on('click', _fn.onClick)
			.style('opacity', 0.01);

		bar.append('div')
			.attr('class', 'bar-label');

		// Enter + Update
		div.transition().duration(_duration)
			.style('opacity', 1)
			.style('width', function(d, i) { return _scale.x(_value.value(d, i)) + 'px'; })
			.style('top', function(d, i) { return (_scale.y(i) + _margin.top) + 'px'; })
			.style('left', _margin.left + 'px');

		div.select('div.bar-label')
			.html(_value.label)
			.style('max-width', (_scale.x.range()[1] - 10) + 'px');

		// Exit
		div.exit()
			.transition().duration(_duration)
			.style('opacity', 0.01)
			.style('top', (_scale.y.range()[1] + _margin.top + _margin.bottom - _barHeight) + 'px' )
			.remove();

		// Update the size of the parent div
		_element.div
			.style('height', (_margin.bottom + _margin.top + _scale.y.range()[1]) + 'px');

		return _instance;
	};


	// Basic Getters/Setters
	_instance.width = function(v) {
		if(!arguments.length) { return _width; }
		_width = v;
		return _instance;
	};
	_instance.barHeight = function(v) {
		if(!arguments.length) { return _barHeight; }
		_barHeight = v;
		return _instance;
	};
	_instance.barPadding = function(v) {
		if(!arguments.length) { return _barPadding; }
		_barPadding = v;
		return _instance;
	};
	_instance.margin = function(v) {
		if(!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};
	_instance.key = function(v) {
		if(!arguments.length) { return _value.key; }
		_value.key = v;
		return _instance;
	};
	_instance.value = function(v) {
		if(!arguments.length) { return _value.value; }
		_value.value = v;
		_extent.width.getValue(v);
		return _instance;
	};
	_instance.label = function(v) {
		if(!arguments.length) { return _value.label; }
		_value.label = v;
		return _instance;
	};
	_instance.widthExtent = function(v) {
		if(!arguments.length) { return _extent.width; }
		_extent.width = v;
		return _instance;
	};
	_instance.dispatch = function(v) {
		if(!arguments.length) { return _dispatch; }
		return _instance;
	};
	_instance.duration = function(v) {
		if(!arguments.length) { return _duration; }
		_duration = v;
		return _instance;
	};

	return _instance;
}
var sentio_timeline = sentio.timeline = {};
sentio.timeline.line = sentio_timeline_line;

function sentio_timeline_line() {
	'use strict';

	// Layout properties
	var _id = 'timeline_line_' + Date.now();
	var _margin = { top: 10, right: 10, bottom: 20, left: 40 };
	var _height = 100, _width = 600;

	/*
	 * Callback function for hovers over the markers. Invokes this function
	 * with the data from the marker payload
	 */
	var _markerHoverCallback = null;

	// Default accessors for the dimensions of the data
	var _value = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return d[1]; }
	};

	// Accessors for the positions of the markers
	var _markerValue = {
		x: function(d, i) { return d[0]; },
		label: function(d, i) { return d[1]; }
	};

	var now = Date.now();
	var _extent = {
		x: sentio.util.extent({
			defaultValue: [now - 60000*5, now],
			getValue: function(d) { return d[0]; }
		}),
		y: sentio.util.extent({
			getValue: function(d) { return d[1]; }
		})
	};
	var _multiExtent = sentio.util.multiExtent().values(function(d) { return d.data; });

	// Default scales for x and y dimensions
	var _scale = {
		x: d3.time.scale(),
		y: d3.scale.linear()
	};

	// Default Axis definitions
	var _axis = {
		x: d3.svg.axis().scale(_scale.x).orient('bottom'),
		y: d3.svg.axis().scale(_scale.y).orient('left').ticks(3)
	};

	// g elements
	var _element = {
		svg: undefined,
		g: {
			container: undefined,
			plots: undefined,
			xAxis: undefined,
			yAxis: undefined,
			markers: undefined,
			brush: undefined
		},
		plotClipPath: undefined,
		markerClipPath: undefined
	};

	// Line generator for the plot
	var _line = d3.svg.line().interpolate('linear');
	_line.x(function(d, i) {
		return _scale.x(_value.x(d, i));
	});
	_line.y(function(d, i) {
		return _scale.y(_value.y(d, i));
	});

	// Area generator for the plot
	var _area = d3.svg.area().interpolate('linear');
	_area.x(function(d, i) {
		return _scale.x(_value.x(d, i));
	});
	_area.y1(function(d, i) {
		return _scale.y(_value.y(d, i));
	});

	// Brush filter
	var _filter = {
		enabled: false,
		brush: d3.svg.brush(),
		dispatch: d3.dispatch('filter', 'filterstart', 'filterend')
	};

	var _data = [];

	var _markers = {
		values: [],
		dispatch: d3.dispatch('onclick')
	};

	function brushstart() {
		var extent = getFilter();
		var isEmpty = (null == extent);

		var min = (isEmpty)? undefined : extent[0];
		var max = (isEmpty)? undefined : extent[1];

		_filter.dispatch.filterstart([isEmpty, min, max]);
	}
	function brush() {
		var extent = getFilter();
		var isEmpty = (null == extent);

		var min = (isEmpty)? undefined : extent[0];
		var max = (isEmpty)? undefined : extent[1];

		_filter.dispatch.filter([isEmpty, min, max]);
	}
	function brushend() {
		var extent = getFilter();
		var isEmpty = (null == extent);

		var min = (isEmpty)? undefined : extent[0];
		var max = (isEmpty)? undefined : extent[1];

		_filter.dispatch.filterend([isEmpty, min, max]);
	}

	// Chart create/init method
	function _instance(selection){}

	/*
	 * Initialize the chart (should only call this once). Performs all initial chart
	 * creation and setup
	 */
	_instance.init = function(container){
		// Create a container div
		_element.div = container.append('div').attr('class', 'sentio timeline');

		// Create the SVG element
		_element.svg = _element.div.append('svg');

		// Add the defs and add the clip path definition
		_element.plotClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'plot_' + _id).append('rect');
		_element.markerClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'marker_' + _id).append('rect');

		// Append a container for everything
		_element.g.container = _element.svg.append('g');

		// Append the path group (which will have the clip path and the line path
		_element.g.plots = _element.g.container.append('g').attr('class', 'plots').attr('clip-path', 'url(#plot_' + _id + ')');

		// If the filter is enabled, add it
		if(_filter.enabled) {
			_element.g.brush = _element.g.container.append('g').attr('class', 'x brush');
			_element.g.brush.call(_filter.brush)
				.selectAll('rect').attr('y', -6);
			_filter.brush
				.on('brushend', brushend)
				.on('brushstart', brushstart)
				.on('brush', brush);
		}

		// Append a group for the markers
		_element.g.markers = _element.g.container.append('g').attr('class', 'markers').attr('clip-path', 'url(#marker_' + _id + ')');

		// Append groups for the axes
		_element.g.xAxis = _element.g.container.append('g').attr('class', 'x axis');
		_element.g.yAxis = _element.g.container.append('g').attr('class', 'y axis');

		_instance.resize();

		return _instance;
	};

	/*
	 * Set the _instance data
	 */
	_instance.data = function(v) {
		if(!arguments.length) { return _data; }
		_data = v;

		return _instance;
	};

	/*
	 * Set the markers data
	 */
	_instance.markers = function(v) {
		if(!arguments.length) { return _markers.dispatch; }
		_markers.values = v;
		return _instance;
	};

	/*
	 * Accepts the hovered element and conditionally invokes
	 * the marker hover callback if both the function and data
	 * are non-null
	 */
	function invokeMarkerCallback(d) {
		// fire an event with the payload
		if(null != _markerHoverCallback) {
			_markerHoverCallback(d);
		}
	}

	function markerClicked(d) {
		_markers.dispatch.onclick(d);
	}

	/*
	 * Updates all the elements that depend on the size of the various components
	 */
	_instance.resize = function() {
		var now = Date.now();

		// Set up the scales
		_scale.x.range([0, Math.max(0, _width - _margin.left - _margin.right)]);
		_scale.y.range([Math.max(0, _height - _margin.top - _margin.bottom), 0]);

		// Append the clip path
		_element.plotClipPath
			.attr('transform', 'translate(0, -' + _margin.top + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.bottom));
		_element.markerClipPath
			.attr('transform', 'translate(0, -' + _margin.top + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.bottom));

		// Now update the size of the svg pane
		_element.svg.attr('width', _width).attr('height', _height);

		// Update the positions of the axes
		_element.g.xAxis.attr('transform', 'translate(0,' + _scale.y.range()[0] + ')');
		_element.g.yAxis.attr('class', 'y axis');

		// update the margins on the main draw group
		_element.g.container.attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

		return _instance;
	};

	// Multi Extent Combiner
	function multiExtent(data, extent) {
		return _multiExtent.extent(extent).getExtent(data);
	}

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {
		// Need to grab the filter extent before we change anything
		var filterExtent = getFilter();

		// Update the x domain (to the latest time window)
		_scale.x.domain(multiExtent(_data, _extent.x));

		// Update the y domain (based on configuration and data)
		_scale.y.domain(multiExtent(_data, _extent.y));

		// Update the plot elements
		updateAxes();
		updateLine();
		updateMarkers();
		updateFilter(filterExtent);

		return _instance;
	};

	function updateAxes() {
		if(null != _axis.x) {
			_element.g.xAxis.call(_axis.x);
		}
		if(null != _axis.y) {
			_element.g.yAxis.call(_axis.y);
		}
	}

	function updateLine() {
		// Join
		var plotJoin = _element.g.plots
			.selectAll('.plot')
			.data(_data, function(d) { 
				return d.key; 
			});

		// Enter
		var plotEnter = plotJoin.enter().append('g')
			.attr('class', 'plot');

		plotEnter.append('g').append('path').attr('class', function(d) { return ((d.cssClass)? d.cssClass : '') + ' line'; });
		plotEnter.append('g').append('path').attr('class', function(d) { return ((d.cssClass)? d.cssClass : '') + ' area'; });

		var lineUpdate = plotJoin.select('.line');
		var areaUpdate = plotJoin.select('.area');

		// Update
		lineUpdate.datum(function(d) { return d.data; }).attr('d', _line);
		areaUpdate.datum(function(d) { return d.data; }).attr('d', _area.y0(_scale.y.range()[0]));

		// Exit
		var plotExit = plotJoin.exit();
		plotExit.remove();

	}

	function updateMarkers() {
		// Join
		var markerJoin = _element.g.markers
			.selectAll('.marker')
			.data(_markers.values, function(d) {
				return _markerValue.x(d); 
			});

		// Enter
		var markerEnter = markerJoin.enter().append('g')
			.attr('class', 'marker')
			.on('mouseover', invokeMarkerCallback)
			.on('click', markerClicked);

		var lineEnter = markerEnter.append('line');
		var textEnter = markerEnter.append('text');

		var lineUpdate = markerJoin.select('line');
		var textUpdate = markerJoin.select('text');

		lineEnter
			.attr('y1', function(d) { return _scale.y.range()[1]; })
			.attr('y2', function(d) { return _scale.y.range()[0]; });

		textEnter
			.attr('dy', '0em')
			.attr('y', -3)
			.attr('text-anchor', 'middle')
			.text(function(d) { return _markerValue.label(d); });

		// Update
		lineUpdate
			.attr('x1', function(d) { return _scale.x(_markerValue.x(d)); })
			.attr('x2', function(d) { return _scale.x(_markerValue.x(d)); });

		textUpdate
			.attr('x', function(d) { return _scale.x(_markerValue.x(d)); });

		// Exit
		var markerExit = markerJoin.exit().remove();

	}

	/*
	 * Get the current state of the filter
	 * Returns undefined if the filter is disabled or not set, millsecond time otherwise
	 */
	function getFilter() {
		var extent;
		if(_filter.enabled && !_filter.brush.empty()) {
			extent = _filter.brush.extent();
			if(null != extent) {
				extent = [ extent[0].getTime(), extent[1].getTime() ];
			}
		}

		return extent;
	}

	/*
	 * Set the state of the filter, firing events if necessary
	 */
	function setFilter(newExtent, oldExtent) {
		// Fire the event if the extents are different
		var suppressEvent = newExtent == oldExtent || newExtent == null || oldExtent == null || (newExtent[0] == oldExtent[0] && newExtent[1] == oldExtent[1]);
		var clearFilter = (null == newExtent || newExtent[0] >= newExtent[1]);

		// either clear the filter or assert it
		if(clearFilter) {
			_filter.brush.clear();
		} else {
			_filter.brush.extent([ new Date(newExtent[0]), new Date(newExtent[1]) ]);
		}

		// fire the event if anything changed
		if(!suppressEvent) {
			_filter.brush.event(_element.g.brush);
		}
	}

	/*
	 * Update the state of the existing filter (if any) on the plot.
	 * 
	 * This method accepts the extent of the brush before any plot changes were applied
	 * and updates the brush to be redrawn on the plot after the plot changes are applied.
	 * There is also logic to clip the brush if the extent has moved such that the brush
	 * has moved partially out of the plot boundaries, as well as to clear the brush if it
	 * has moved completely outside of the boundaries of the plot.
	 */
	function updateFilter(extent) {
		// Don't need to do anything if filtering is not enabled
		if(_filter.enabled) {
			// Reassert the x scale of the brush (in case the scale has changed)
			_filter.brush.x(_scale.x);

			// Derive the overall plot extent from the collection of series
			var plotExtent = multiExtent(_data, _extent.x);

			// If there was no previous extent, then there is no brush to update
			if(null != extent) {
				// Clip extent by the full extent of the plot (this is in case we've slipped off the visible plot)
				var nExtent = [ Math.max(plotExtent[0], extent[0]), Math.min(plotExtent[1], extent[1]) ];
				setFilter(nExtent, extent);
			}

			_element.g.brush
				.call(_filter.brush)
				.selectAll('rect')
					.attr('height', _height - _margin.top - _margin.bottom + 7);
		}
	}

	// Basic Getters/Setters
	_instance.width = function(v){
		if(!arguments.length) { return _width; }
		_width = v;
		return _instance;
	};
	_instance.height = function(v){
		if(!arguments.length) { return _height; }
		_height = v;
		return _instance;
	};
	_instance.margin = function(v){
		if(!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};
	_instance.interpolation = function(v){
		if(!arguments.length) { return _line.interpolate(); }
		_line.interpolate(v);
		_area.interpolate(v);
		return _instance;
	};
	_instance.xAxis = function(v){
		if(!arguments.length) { return _axis.x; }
		_axis.x = v;
		return _instance;
	};
	_instance.yAxis = function(v){
		if(!arguments.length) { return _axis.y; }
		_axis.y = v;
		return _instance;
	};
	_instance.xScale = function(v){
		if(!arguments.length) { return _scale.x; }
		_scale.x = v;
		if(null != _axis.x) {
			_axis.x.scale(v);
		}
		return _instance;
	};
	_instance.yScale = function(v){
		if(!arguments.length) { return _scale.y; }
		_scale.y = v;
		if(null != _axis.y) {
			_axis.y.scale(v);
		}
		return _instance;
	};
	_instance.xValue = function(v){
		if(!arguments.length) { return _value.x; }
		_value.x = v;
		return _instance;
	};
	_instance.yValue = function(v){
		if(!arguments.length) { return _value.y; }
		_value.y = v;
		return _instance;
	};
	_instance.yExtent = function(v){
		if(!arguments.length) { return _extent.y; }
		_extent.y = v;
		return _instance;
	};
	_instance.xExtent = function(v){
		if(!arguments.length) { return _extent.x; }
		_extent.x = v;
		return _instance;
	};
	_instance.markerXValue = function(v){
		if(!arguments.length) { return _markerValue.x; }
		_markerValue.x = v;
		return _instance;
	};
	_instance.markerLabelValue = function(v){
		if(!arguments.length) { return _markerValue.label; }
		_markerValue.label = v;
		return _instance;
	};
	_instance.markerHover = function(v) {
		if(!arguments.length) { return _markerHoverCallback; }
		_markerHoverCallback = v;
		return _instance;
	};
	_instance.filter = function(v) {
		if(!arguments.length) { return _filter.dispatch; }
		_filter.enabled = v;
		return _instance;
	};

	// Expects milliseconds time
	_instance.setFilter = function(extent) {
		var oldExtent = getFilter();
		if(null != extent && extent.length === 2) {
			// Convert to Dates and assert filter
			if(extent[0] instanceof Date) {
				extent[0] = extent[0].getTime();
			}
			if(extent[1] instanceof Date) {
				extent[1] = extent[1].getTime();
			}
		}

		setFilter(extent, oldExtent);
		_instance.redraw();
		return _instance;
	};

	return _instance;
}
var sentio_realtime = sentio.realtime = {};
sentio.realtime.timeline = sentio_realtime_timeline;

function sentio_realtime_timeline() {
	'use strict';

	// Default data delay, this is the difference between now and the latest tick shown on the timeline
	var _delay = 0;

	// Interval of the timeline, this is the amount of time being displayed by the timeline
	var _interval = 60000;

	// Is the timeline running?
	var _running = false;
	var _timeout = null;

	// What is the refresh rate?
	var _fps = 32;

	var _instance = sentio.timeline.line();
	_instance.yExtent().filter(function(d) {
		var x = _instance.xValue()(d);
		var xExtent = _instance.xExtent().getExtent();
		return (x < xExtent[1] && x > xExtent[0]);
	});

	/*
	 * This is the main update loop function. It is called every time the
	 * _instance is updating to proceed through time.
	 */ 
	function tick() {
		// If not running, let the loop die
		if(!_running) return;

		_instance.redraw();

		// Schedule the next update
		_timeout = window.setTimeout(tick, (_fps > 0)? 1000/_fps : 0);
	}

	/*
	 * Redraw the graphic
	 */
	var parentRedraw = _instance.redraw;
	_instance.redraw = function() {
		// Update the x domain (to the latest time window)
		var now = new Date();
		_instance.xExtent().overrideValue([now - _delay - _interval, now - _delay]);

		parentRedraw();
		return _instance;
	};

	_instance.start = function() {
		if(_running){ return; }
		_running = true;

		tick();
		return _instance;
	};

	_instance.stop = function() {
		_running = false;

		if(_timeout != null) {
			window.clearTimeout(_timeout);
		}
		return _instance;
	};

	_instance.restart = function() {
		_instance.stop();
		_instance.start();
		return _instance;
	};

	_instance.interval = function(v) {
		if(!arguments.length) { return _interval; }
		_interval = v;
		return _instance;
	};

	_instance.delay = function(v) {
		if(!arguments.length) { return _delay; }
		_delay = v;
		return _instance;
	};

	_instance.fps = function(v){
		if(!arguments.length) { return _fps; }
		_fps = v;
		if(_running) {
			_instance.restart();
		}
		return _instance;
	};

	return _instance;
}
var sentio_line = sentio.line = {};
sentio.line.line = sentio_line_line;
function sentio_line_line() {
	'use strict';

	// Layout properties
	var _id = 'line_line_' + Date.now();
	// var _margin = { top: 20, right: 200, bottom: 50, left: 40 };

	var _margin = { top: 20, right: 40, bottom: 50, left: 40 };
	var _height = 100, _width = 800;

	var lockYAxis = true;	// Set whether the Y axis will automatically change as data changes.
	var lockedY = 1;		// Set default max Y axis value.
	var stacked = false;	// Set whether different series will stack on top of eachother rather than overlay.
	var showMarkers = true;	// Set default boolean for showing markers
	var max_ticks = 30;		// Set default max number of ticks for the x axis.
	var x_ticks = 30;		// Set default number of ticks for the x axis.

	// Values for tracking mouse movements on graph and selected elements.
	var cx, cy, y, targetX;
	var selected = {
		points: [],
		markers: []
	};

	// Container for legend information to be passed out of sentio.
	var legend_content = {
		series: undefined,
		markers: undefined,
	};

	/*
	 * Array of series slugs that are hidden from the user.
	 */
	var hidden_series = [];

	/*
	 * Callback function for hovers over the markers. Invokes this function
	 * with the data from the marker payload
	 */
	var _markerHoverCallback = null;

	/*
	 * Callback function for hovers over plot points.
	 */
	var _hoverCallback = null;

	/*
	 * Callback function to pass legend information
	 */
	var _legendCallback = null;

	// Default accessors for the dimensions of the data
	var _value = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return d[1]; }
	};

	// Default accessors for point information.
	var _pointValue = {
		x: function(d, i) { return d[0]; },
		y: function(d, i) { return stacked ? d[2] : d[1]; },
		series: function(d, i) { return d[3]; },
		slug: function(d, i) { return d[4]; }
	};

	// Accessors for the positions of the markers
	var _markerValue = {
		label: function(d, i) { return d[0]; },
		slug: function(d, i) { return d[1]; },
		start: function(d, i) { return d[2]; },
		end: function(d, i) { return d[3]; }
	};

	var now = Date.now();
	var _extent = {
		x: sentio.util.extent({
			defaultValue: [now - 60000*5, now],
			getValue: function(d) { return d[0]; }
		}),
		y: sentio.util.extent({
			getValue: function(d) { return stacked ? d[2] : d[1]; }
		})
	};
	var _multiExtent = sentio.util.multiExtent().values(function(d) { return d.data; });

	// Default scales for x and y dimensions
	var _scale = {
		x: d3.time.scale(),
		y: d3.scale.linear(),
		color: d3.scale.category10(),
		marker_color: d3.scale.category20()
	};

	// Default Axis definitions
	var _axis = {
		x: d3.svg.axis().scale(_scale.x).orient('bottom').ticks(x_ticks).tickFormat(d3.time.format("%m/%d/%y")),
		y: d3.svg.axis().scale(_scale.y).orient('left').ticks(10)
	};

	// g elements
	var _element = {
		svg: undefined,
		g: {
			mouseContainer: undefined,
			hoverLine: undefined,
			container: undefined,
			markers: undefined,
			plots: undefined,
			xAxis: undefined,
			yAxis: undefined,
			points: undefined,
			brush: undefined
		},
		plotClipPath: undefined,
		markerClipPath: undefined,
		pointClipPath: undefined
	};

	// Line generator for the plot
	var _line = d3.svg.line().interpolate('basis');
	_line.x(function(d, i) {
		return _scale.x(_value.x(d, i));
	});
	_line.y(function(d, i) {
		return stacked ? _scale.y(d[2]) : _scale.y(_value.y(d, i));
	});

	// Area generator for the plot
	var _area = d3.svg.area().interpolate('basis');
	_area.x(function(d, i) {
		return _scale.x(_value.x(d, i));
	});
	_area.y1(function(d, i) {
		return stacked ? _scale.y(d[2]) : _scale.y(_value.y(d, i));
	});

	// Brush filter
	var _filter = {
		enabled: false,
		brush: d3.svg.brush(),
		dispatch: d3.dispatch('filter', 'filterstart', 'filterend')
	};

	// Array for various plot data
	var _data = [];

	var _points = [];

	var _markers = {
		values: [],
		dispatch: d3.dispatch('onclick')
	};

	function brushstart() {
		var extent = getFilter();
		var isEmpty = (null == extent);

		var min = (isEmpty)? undefined : extent[0];
		var max = (isEmpty)? undefined : extent[1];

		_filter.dispatch.filterstart([isEmpty, min, max]);
	}
	function brush() {
		var extent = getFilter();
		var isEmpty = (null == extent);

		var min = (isEmpty)? undefined : extent[0];
		var max = (isEmpty)? undefined : extent[1];

		_filter.dispatch.filter([isEmpty, min, max]);
	}
	function brushend() {
		var extent = getFilter();
		var isEmpty = (null == extent);

		var min = (isEmpty)? undefined : extent[0];
		var max = (isEmpty)? undefined : extent[1];

		_filter.dispatch.filterend([isEmpty, min, max]);
	}

	// Default attributes for configurable tooltip
	var tooltip = d3.select("body")
	    .append("div")
	    .style("position", "absolute")
	    .style("z-index", "10")
	    .style("visibility", "hidden")
	    .style('background-color', 'rgba(0,0,0,0.8')
	    .style('border-radius', '5px')
	    .style('padding', '3px')
	    .style('pointer-events', 'none');

	// Chart create/init method
	function _instance(selection){}

	/*
	 * Initialize the chart (should only call this once). Performs all initial chart
	 * creation and setup
	 */
	_instance.init = function(container){
		// Create a container div
		_element.div = container.append('div').attr('class', 'sentio line');

		// Create the SVG element
		_element.svg = _element.div.append('svg');

		// Add the defs and add the clip path definition
		_element.markerClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'marker_' + _id).append('rect');
		_element.plotClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'plot_' + _id).append('rect');
		_element.pointClipPath = _element.svg.append('defs').append('clipPath').attr('id', 'point_' + _id).append('rect');

		// Append a container for everything as well as mouse handlers
		_element.g.container = _element.svg.append('g')
			.attr('class', 'g-main')
			.on("mousemove", function () {
				handleMouseMove();
			})
			.on("mouseover", function () {
				// Prevents triggering when over graph margins and axes
				if (d3.event.offsetX > 0 && d3.event.offsetY > 0) {
					_element.g.hoverLine.style('display', 'block');
				}
			})
			.on("mouseout", function () {
				_element.g.hoverLine.style('display', 'none');
				tooltip.style("visibility", "hidden");
			});

		// Append elements for capturing mouse events.
		_element.g.mouseContainer = _element.g.container.append('rect')
			.attr('class', 'mouse-container')
			.style('visibility', 'hidden')
			.attr('x', '0')
			.attr('y', '0');
		_element.g.hoverLine = _element.g.container.append('line')
			.attr('class', 'hover-line')
			.attr('x1', '10')
			.attr('y1', '0')
			.attr('x2', '10')
			.style('stroke', 'gray')
			.attr('stroke-dasharray', ('5,5'))
			.style('stroke-width', '1.5')
			.style('display', 'none');

		// Append groups for the axes
		_element.g.xAxis = _element.g.container.append('g').attr('class', 'x axis');
		_element.g.yAxis = _element.g.container.append('g').attr('class', 'y axis');

		// Append a group for the markers
		_element.g.markers = _element.g.container.append('g').attr('class', 'markers').attr('clip-path', 'url(#marker_' + _id + ')');

		// Append the path group (which will have the clip path and the line path
		_element.g.plots = _element.g.container.append('g').attr('class', 'plots').attr('clip-path', 'url(#plot_' + _id + ')');

		_element.g.points = _element.g.container.append('g').attr('class', 'points').attr('clip-path', 'url(#point_' + _id + ')');

		// If the filter is enabled, add it
		if(_filter.enabled) {
			_element.g.brush = _element.g.container.append('g').attr('class', 'x brush');
			_element.g.brush.call(_filter.brush)
				.selectAll('rect').attr('y', -6);
			_filter.brush
				.on('brushend', brushend)
				.on('brushstart', brushstart)
				.on('brush', brush);
		}

		_instance.resize();

		return _instance;
	};

	/* 
	 * Generates stacked y values in the order that _data arrives in.
	 */
	function stack() {
		for (var i = 0; i < _data.length; i++) {
			for (var j = 0; j < _data[i].data.length; j++) {
				_data[i].data[j].push(i === 0 ? _data[i].data[j][1] : (_data[i-1].data[j][2] + _data[i].data[j][1]));
			}
		}
	}

	/*
	 * Generates point values from data.  Each point is a unique set of data with x, y, and series information.
	 */
	function generatePoints() {
		_points = [];
		for (var i = 0; i < _data.length; i++) {
			for (var j = 0; j < _data[i].data.length; j++) {
				_points.push([_data[i].data[j][0], _data[i].data[j][1], _data[i].data[j][2], _data[i].key, _data[i].name]);
			}
		}
	}

	/*
	 * Hide all markers on the graph.
	 */
	function toggleMarkers() {
		_element.g.markers
			.selectAll('.marker')
			.transition().duration(200)
			.attr('opacity', showMarkers ? '1' : '0');
	}

	/*
	 * Set the _instance data
	 */
	_instance.data = function(v) {
		if(!arguments.length) { return _data; }
		_data = v;

		// Update stacked and point data every time it is available.
		stack();
		generatePoints();

		return _instance;
	};

	/*
	 * Set the markers data
	 */
	_instance.markers = function(v) {
		if(!arguments.length) { return _markers.dispatch; }
		_markers.values = v;
		return _instance;
	};

	/*
	 * Accepts the hovered element and conditionally invokes
	 * the marker hover callback if both the function and data
	 * are non-null
	 */
	function invokeMarkerCallback(d) {
		// fire an event with the payload
		if(null != _markerHoverCallback) {
			_markerHoverCallback(d);
		}
	}

	function markerClicked(d) {
		_markers.dispatch.onclick(d);
	}

	/*
	 * Accepts object of selected elements and attempts to call
	 * the callback function. 
	 */
	function invokeHoverCallback(d) {
		if(null != _hoverCallback) {
			return _hoverCallback(d);
		}
	}

	/*
	 * Accepts series information and attempts to call
	 * the callback function.
	 */
	function invokeLegendCallback(d) {
		if (null != _legendCallback) {
			return _legendCallback(d);
		}
	}

	/*
	 * Function to handle mouse movement on the graph and gather selected elements.
	 */
	function handleMouseMove() {
		// Grab current mouse position information.
		cx = d3.event.offsetX;
		cy = d3.event.offsetY;
		y = d3.event.y;

		// Set initial values
		targetX = cx;
		selected.points = [];
		selected.markers = [];

		// bind to a point if it exists
		_element.g.points.selectAll('.point')
			.each(function(d) {
				if (Math.abs(_scale.x(_pointValue.x(d)) - cx) < 5) {
					targetX = _scale.x(_pointValue.x(d));
					selected.points.push(d);
				}
			});

		// Find any markers in that range
		_element.g.markers.selectAll('.marker')
			.each(function(d) {
				if (targetX >= _scale.x(_markerValue.start(d)) && targetX <= _scale.x(_markerValue.end(d))) {
					selected.markers.push(d);
				}
			});

		// Adjust position of tooltip and pass selected elements to callback function.
		if (selected.points.length > 0 && cx > 0 && cy > 0) {
			tooltip.style("visibility", "visible");
			tooltip.style("top", y+"px").style("left",d3.event.x+"px");
			tooltip.html(invokeHoverCallback({d: selected}));
		} else {
			// Hide tooltip if no elements are selected.
			tooltip.style("visibility", "hidden");
		}

		// Update position of hover line.
		_element.g.hoverLine
			.attr('x1', targetX)
			.attr('x2', targetX);
	}

	/*
	 * Updates all the elements that depend on the size of the various components
	 */
	_instance.resize = function() {
		var now = Date.now();

		// Set up the scales
		_scale.x.range([0, Math.max(0, _width - _margin.left - _margin.right)]);
		_scale.y.range([Math.max(0, _height - _margin.top - _margin.bottom), 0]);

		// Update mouse capture elements
		_element.g.mouseContainer
			.attr('transform', 'translate(0, -' + _margin.top + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.bottom));
		_element.g.hoverLine
			.attr('y2', function(d) { return _scale.y.range()[0]; });

		// Append the clip path
		_element.plotClipPath
			.attr('transform', 'translate(0, -' + _margin.top + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.bottom));
		_element.markerClipPath
			.attr('transform', 'translate(0, -' + _margin.top + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.bottom));
		_element.pointClipPath
			.attr('transform', 'translate(-5, -' + (_margin.top - 5) + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right + 10))
			.attr('height', Math.max(0, _height - _margin.bottom + 5));

		// Now update the size of the svg pane
		_element.svg.attr('width', _width).attr('height', _height);

		// Update the positions of the axes
		_element.g.xAxis.attr('transform', 'translate(0,' + _scale.y.range()[0] + ')');
		_element.g.yAxis.attr('class', 'y axis');

		// update the margins on the main draw group
		_element.g.container.attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

		// Restrict count of x axis ticks based off of element width.
		max_ticks = parseInt(_width / 20);

		return _instance;
	};

	// Multi Extent Combiner
	function multiExtent(data, extent) {
		return _multiExtent.extent(extent).getExtent(data);
	}

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {
		// Need to grab the filter extent before we change anything
		var filterExtent = getFilter();

		// Update the x domain (to the latest time window)
		_scale.x.domain(multiExtent(_data, _extent.x));

		// Update the y domain (based on configuration and data)
		// When locked, the y axis will change if the extent is larger.
		var y = multiExtent(_data, _extent.y)[1];
		if (lockYAxis) { y = y > lockedY ? y : lockedY; }
		lockedY = y;
		_scale.y.domain([0,y]);

		// Update the plot elements
		updateAxes();
		updateLine();
		updateMarkers();
		updatePoints();
		updateLegend();
		updateFilter(filterExtent);

		return _instance;
	};

	function updateAxes() {
		// Prevent x axis labels from overlapping by limiting tick count.
		_axis.x = _axis.x.ticks(x_ticks > max_ticks ? max_ticks : x_ticks);
		_axis.y = _axis.y.ticks(_scale.y.domain()[1] < 10 ? _scale.y.domain()[1] : 10);

		// Rotate axis labels by default to prevent overlap.
		if(null != _axis.x) {
			_element.g.xAxis
				.transition().call(_axis.x)
				.selectAll("text")
				.style("text-anchor", "end")
				.attr("transform", "rotate(-45)");
		}
		if(null != _axis.y) {
			_element.g.yAxis
				.transition().call(_axis.y);
		}
	}

	/*
	 * Line data format:
	 * 	_line = [
	 *		{ key: 'series_1',
	 		  data: [[x1,y1], [x2,y2], ...],
	 		  name: 'series 1',
	 		  total: 1000
	 		},
	 		{ key: 'series_2'
	 		  data: [[x3,y3], ...],
			  name: 'series 2',
			  total: 3000
	 		},
	 		...	
	 *	]
	 */
	
	function updateLine() {

		// Join
		var plotJoin = _element.g.plots
			.selectAll('.plot')
			.data(_data, function(d) { return d.key; });

		var plotEnter = plotJoin.enter().append('g')
			.attr('class', 'plot');

		// Enter
		plotEnter.append('g').append('path')
			.attr('class', 'line')
			.attr('id', function(d) { return 'path-'+d.key; })
			.attr('stroke', function(d, i) { return _scale.color(i); })
			.attr('stroke-width', '2px')
			.attr('stroke-opacity', function(d) {
				return hidden_series.indexOf(d.key) === -1 ? '0.9' : '0';
			})
			.attr('fill', 'none');
		plotEnter.append('g').append('path')
			.attr('class', 'area')
			.attr('id', function(d) { return 'area-'+d.key; })
			.attr('stroke', 'none')
			.attr('fill', function(d, i) { return _scale.color(i); })
			.attr('fill-opacity', function(d) {
				return hidden_series.indexOf(d.key) === -1 ? '0.05' : '0';
			});

		var lineUpdate = plotJoin.select('.line');
		var areaUpdate = plotJoin.select('.area');

		// // Update
		lineUpdate.datum(function(d) { return d.data; }).transition().duration(500).attr('d', _line);
		areaUpdate.datum(function(d) { return d.data; }).transition().duration(500).attr('d', _area.y0(_scale.y.range()[0]));

		plotJoin.exit().select('.line')
			.attr('d', _line);

		plotJoin.exit().select('.area')
			.attr('d', _area.y0(_scale.y.range()[0]));

		// Exit
		var plotExit = plotJoin.exit()
			.transition().duration(500).remove();
	}

	/*
	 * Stores legend information from data series.
	 */
	function updateLegend() {
		legend_content.series = _data.map(function(series, i) {
			return [series.key, series.name, series.total, _scale.color(i)];
		});

		invokeLegendCallback({d: legend_content});
	}

	/*
	 * _points format (After conversion from line data)
	 * 	_points = [
	 *				[x1, y1, 'series_1', 'series 1'],
	 *				[x2, y2, 'series_2', 'series 2'],
	 *				...
	 *	]
	 */
	function updatePoints() {

		var pointJoin = _element.g.points
			.selectAll('.point')
			.data(_points, function(d) {
				return 'pt-'+_pointValue.series(d)+'-'+_pointValue.x(d);
			});

		var pointEnter = pointJoin.enter().append('g')
			.attr('class', 'point');

		var circleEnter = pointEnter.append('circle');
		var circleUpdate = pointJoin.select('circle');

		circleEnter
			.attr('class', function(d) { return 'pt-'+_pointValue.series(d); })
			.attr('r', 3)
			.attr('stroke', 'white')
			.attr('stroke-opacity', function(d) {
				return hidden_series.indexOf(_pointValue.series(d)) === -1 ? '1' : '0'; // Hide points if related series is hidden.
			})
			.attr('stroke-width', 2)
			.attr('fill', 'white')
			.attr('fill-opacity', 0);

		circleUpdate.transition().duration(500)
			.attr('class', function(d) { return 'pt-'+_pointValue.series(d); })
			.attr('cx', function(d) {return _scale.x(_pointValue.x(d));})
			.attr('cy', function(d) {return _scale.y(_pointValue.y(d));});

		//exit
		pointJoin.exit()
			.remove();
	}

	/* 
	 * Marker update function
	 *
	 * There are five child elements to each marker element:
	 * 	Start line, end line, start point, end point, and marker area.
	 *
	 * _marker format:
	 * 	_marker = {
	 *		values: 
	 *			[
	 *				['label1', 'slug_1', start_x1, end_x1],
	 *				['label2', 'slug_2', start_x2, end_x2]
	 *				...
	 *			]
	 *  }
	 */
	function updateMarkers() {
		// Join
		var markerJoin = _element.g.markers
			.selectAll('.marker')
			.data(_markers.values, function(d) {
				return _markerValue.slug(d); 
			});

		// Enter
		var markerEnter = markerJoin.enter().append('g')
			.attr('class', 'marker');

		var areaEnter = markerEnter.append('rect');
		var startEnter = markerEnter.append('line');
		var endEnter = markerEnter.append('line');
		var startPointEnter = markerEnter.append('circle');
		var endPointEnter = markerEnter.append('circle');

		var areaUpdate = markerJoin.select('rect');
		var startUpdate = markerJoin.select('.start');
		var endUpdate = markerJoin.select('.end');
		var startPointUpdate = markerJoin.select('.start-ind');
		var endPointUpdate = markerJoin.select('.end-ind');

		startPointEnter
			.attr('class', 'start-ind')
			.attr('r', '3')
			.attr('stroke', function(d, i) {return _scale.marker_color(i);})
			.attr('stroke-opacity', '1')
			.attr('stroke-width', '2')
			.attr('fill', 'white')
			.attr('fill-opacity', '0')
			.attr('cx', function(d) { return _scale.x(_markerValue.start(d)); });

		endPointEnter
			.attr('class', 'end-ind')
			.attr('r', '3')
			.attr('stroke', function(d, i) {return _scale.marker_color(i);})
			.attr('stroke-opacity', '1')
			.attr('stroke-width', '2')
			.attr('fill', 'white')
			.attr('fill-opacity', '0')
			.attr('cx', function(d) { return _scale.x(_markerValue.end(d)); });

		startEnter
			.attr('class', 'start')
			.attr('y1', function(d) { return _scale.y.range()[1]; })
			.attr('y2', function(d) { return _scale.y.range()[0]; })
			.attr('stroke', function(d, i) {return _scale.marker_color(i);})
			.attr('x1', function(d) { return _scale.x(_markerValue.start(d)); })
			.attr('x2', function(d) { return _scale.x(_markerValue.start(d)); });

		endEnter
			.attr('class', 'end')
			.attr('x1', function(d) { return _scale.x(_markerValue.end(d)); })
			.attr('x2', function(d) { return _scale.x(_markerValue.end(d)); })
			.attr('y1', function(d) { return _scale.y.range()[1]; })
			.attr('y2', function(d) { return _scale.y.range()[0]; })
			.attr('stroke', function(d, i) {return _scale.marker_color(i);});

		areaEnter
			.attr('y', '0')
			.attr('x', function(d) { return _scale.x(_markerValue.start(d)); })
			.attr('width', function(d) { 
				return _scale.x(_markerValue.end(d)) - _scale.x(_markerValue.start(d));
			})
			.attr('height', function(d) { return _scale.y.range()[0]; })
			.attr('fill', function(d, i) {return _scale.marker_color(i);})
			.attr('fill-opacity', '0.1');

		startPointUpdate.transition().duration(500)
			.attr('cx', function(d) { return _scale.x(_markerValue.start(d)); });

		endPointUpdate.transition().duration(500)
			.attr('cx', function(d) { return _scale.x(_markerValue.end(d)); });

		startUpdate.transition().duration(500)
			.attr('x1', function(d) { return _scale.x(_markerValue.start(d)); })
			.attr('x2', function(d) { return _scale.x(_markerValue.start(d)); });

		endUpdate.transition().duration(500)
			.attr('x1', function(d) { return _scale.x(_markerValue.end(d)); })
			.attr('x2', function(d) { return _scale.x(_markerValue.end(d)); });

		areaUpdate.transition().duration(500)
			.attr('x', function(d) { return _scale.x(_markerValue.start(d)); })
			.attr('width', function(d) { 
				return _scale.x(_markerValue.end(d)) - _scale.x(_markerValue.start(d));
			});

		// Exit
		var markerExit = markerJoin.exit().remove();

	}

	/*
	 * Get the current state of the filter
	 * Returns undefined if the filter is disabled or not set, millsecond time otherwise
	 */
	function getFilter() {
		var extent;
		if(_filter.enabled && !_filter.brush.empty()) {
			extent = _filter.brush.extent();
			if(null != extent) {
				extent = [ extent[0].getTime(), extent[1].getTime() ];
			}
		}

		return extent;
	}

	/*
	 * Set the state of the filter, firing events if necessary
	 */
	function setFilter(newExtent, oldExtent) {
		// Fire the event if the extents are different
		var suppressEvent = newExtent == oldExtent || newExtent == null || oldExtent == null || (newExtent[0] == oldExtent[0] && newExtent[1] == oldExtent[1]);
		var clearFilter = (null == newExtent || newExtent[0] >= newExtent[1]);

		// either clear the filter or assert it
		if(clearFilter) {
			_filter.brush.clear();
		} else {
			_filter.brush.extent([ new Date(newExtent[0]), new Date(newExtent[1]) ]);
		}

		// fire the event if anything changed
		if(!suppressEvent) {
			_filter.brush.event(_element.g.brush);
		}
	}

	/*
	 * Update the state of the existing filter (if any) on the plot.
	 * 
	 * This method accepts the extent of the brush before any plot changes were applied
	 * and updates the brush to be redrawn on the plot after the plot changes are applied.
	 * There is also logic to clip the brush if the extent has moved such that the brush
	 * has moved partially out of the plot boundaries, as well as to clear the brush if it
	 * has moved completely outside of the boundaries of the plot.
	 */
	function updateFilter(extent) {
		// Don't need to do anything if filtering is not enabled
		if(_filter.enabled) {
			// Reassert the x scale of the brush (in case the scale has changed)
			_filter.brush.x(_scale.x);

			// Derive the overall plot extent from the collection of series
			var plotExtent = multiExtent(_data, _extent.x);

			// If there was no previous extent, then there is no brush to update
			if(null != extent) {
				// Clip extent by the full extent of the plot (this is in case we've slipped off the visible plot)
				var nExtent = [ Math.max(plotExtent[0], extent[0]), Math.min(plotExtent[1], extent[1]) ];
				setFilter(nExtent, extent);
			}

			_element.g.brush
				.call(_filter.brush)
				.selectAll('rect')
					.attr('height', _height - _margin.top - _margin.bottom + 7);
		}
	}

	/*
	 * Updates series and marker visuals when toggled to hide or show.
	 *
	 * Also updates stacked values for the data to show updated stack data when a series is hidden.
	 */
	_instance.toggleSeries = function(s) {
		var index = -1;
		var h_index = hidden_series.indexOf(s); // Determines if series is already hidden or not.

		/*
		 * Iterates through each data series to update values.  It first finds the index of the toggled series
		 * based off of the input key.  Then every subsequent series has its stacked values added or subtracted by 
		 * the toggled series to update values.
		 * 
		 * Probably a better way to do this.  There might be incorrect behavior depending on the order of toggled series.
		 */
		for (var i = 0; i < _data.length; i++) {
			if (index !== -1) {
				if (h_index == -1) {
					for (var j = 0; j < _data[i].data.length; j++) {
						_data[i].data[j][2] -= _data[index].data[j][1];
					}
				} else {
					for (var k = 0; k < _data[i].data.length; k++) {
						_data[i].data[k][2] += _data[index].data[k][1];
					}
				}
			} else if (_data[i].key === s) {
				index = i;
			}
		}

		// Update hidden series array 
		if (h_index == -1) {
			hidden_series.push(s);
		} else {
			hidden_series.splice(h_index, 1);
		}

		// Regenerate values for points.
		generatePoints();

		_instance.redraw();

		// Show or hide series and points.
		var targetPath = d3.select('#path-'+s);
		targetPath.transition().style('stroke-opacity', targetPath.style('stroke-opacity') == '0' ? '0.9' : '0');
		var targetArea = d3.select('#area-'+s);
		targetArea.transition().style('fill-opacity', targetArea.style('fill-opacity') == '0' ? '0.05' : '0');
		var targetPoints = d3.selectAll('.pt-'+s);
		targetPoints.transition().style('stroke-opacity', targetPoints.style('stroke-opacity') == '0' ? '1' : '0');
	};

	// Basic Getters/Setters
	_instance.xTicks = function(t) {
		if(!arguments.length) { return x_ticks; }
		x_ticks = t;
		return _instance;
	};
	_instance.yLock = function(l) {
		if(!arguments.length) { return lockYAxis; }
		lockYAxis = l;
		_instance.redraw();
		return _instance;
	};
	_instance.stacked = function(s) {
		if(!arguments.length) { return stacked; }
		stacked = s;
		_instance.redraw();
		return _instance;
	};
	_instance.showMarkers = function(b) {
		if (!arguments.length) { return showMarkers; }
		showMarkers = b;
		toggleMarkers();
		return _instance;
	};
	_instance.width = function(v){
		if(!arguments.length) { return _width; }
		_width = v;
		return _instance;
	};
	_instance.height = function(v){
		if(!arguments.length) { return _height; }
		_height = v;
		return _instance;
	};
	_instance.margin = function(v){
		if(!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};
	_instance.interpolation = function(v){
		if(!arguments.length) { return _line.interpolate(); }
		_line.interpolate(v);
		_area.interpolate(v);
		return _instance;
	};
	_instance.xAxis = function(v){
		if(!arguments.length) { return _axis.x; }
		_axis.x = v;
		return _instance;
	};
	_instance.yAxis = function(v){
		if(!arguments.length) { return _axis.y; }
		_axis.y = v;
		return _instance;
	};
	_instance.xScale = function(v){
		if(!arguments.length) { return _scale.x; }
		_scale.x = v;
		if(null != _axis.x) {
			_axis.x.scale(v);
		}
		return _instance;
	};
	_instance.yScale = function(v){
		if(!arguments.length) { return _scale.y; }
		_scale.y = v;
		if(null != _axis.y) {
			_axis.y.scale(v);
		}
		return _instance;
	};
	_instance.xValue = function(v){
		if(!arguments.length) { return _value.x; }
		_value.x = v;
		return _instance;
	};
	_instance.yValue = function(v){
		if(!arguments.length) { return _value.y; }
		_value.y = v;
		return _instance;
	};
	_instance.yExtent = function(v){
		if(!arguments.length) { return _extent.y; }
		_extent.y = v;
		return _instance;
	};
	_instance.xExtent = function(v){
		if(!arguments.length) { return _extent.x; }
		_extent.x = v;
		return _instance;
	};
	_instance.markerXValue = function(v){
		if(!arguments.length) { return _markerValue.x; }
		_markerValue.x = v;
		return _instance;
	};
	_instance.markerLabelValue = function(v){
		if(!arguments.length) { return _markerValue.label; }
		_markerValue.label = v;
		return _instance;
	};
	_instance.markerHover = function(v) {
		if(!arguments.length) { return _markerHoverCallback; }
		_markerHoverCallback = v;
		return _instance;
	};
	_instance.pointHover = function(v) {
		if(!arguments.length) { return _hoverCallback; }
		_hoverCallback = v;
		return _instance;
	};
	_instance.legendFn = function(v) {
		if (!arguments.length) { return _legendCallback; }
		_legendCallback = v;
		return _instance;
	};
	_instance.filter = function(v) {
		if(!arguments.length) { return _filter.dispatch; }
		_filter.enabled = v;
		return _instance;
	};

	// Expects milliseconds time
	_instance.setFilter = function(extent) {
		var oldExtent = getFilter();
		if(null != extent && extent.length === 2) {
			// Convert to Dates and assert filter
			if(extent[0] instanceof Date) {
				extent[0] = extent[0].getTime();
			}
			if(extent[1] instanceof Date) {
				extent[1] = extent[1].getTime();
			}
		}

		setFilter(extent, oldExtent);
		_instance.redraw();
		return _instance;
	};

	return _instance;
}