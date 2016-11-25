/*! @asymmetrik/sentio-2.0.7 - Copyright Asymmetrik, Ltd. 2007-2017 - All Rights Reserved.*/
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.sentio = global.sentio || {})));
}(this, (function (exports) { 'use strict';

function donut() {

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
	var _dispatch = d3.dispatch('mouseover', 'mouseout', 'click');

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
		mouseover: function(d, i) {
			_fn.updateActiveElement(d);
			_dispatch.mouseover(d, this);
		},
		mouseout: function(d, i) {
			_fn.updateActiveElement();
			_dispatch.mouseout(d, this);
		},
		click: function(d, i) {
			_dispatch.click(d, this);
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
			.on('mouseover', _fn.mouseover)
			.on('mouseout', _fn.mouseout)
			.on('click', _fn.click)
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
			.on('mouseover', _fn.mouseover)
			.on('mouseout', _fn.mouseout)
			.on('click', _fn.click);

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

function extent(config) {

	/**
	 * Private variables
	 */
	// Configuration
	var _config = {
		defaultValue: [0, 10],
		overrideValue: undefined
	};

	var _fn = {
		getValue: function(d) { return d; },
		filter: function() { return true; }
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

function multiExtent(config) {

	/**
	 * Private variables
	 */

	var _fn = {
		values: function(d) { return d.values; }
	};

	var _extent = extent();

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

function matrix() {

	// Chart dimensions
	var _cellSize = 16;
	var _cellMargin = 1;
	var _margin = { top: 20, right: 2, bottom: 2, left: 64 };

	// Transition duration
	var _duration = 500;

	// d3 dispatcher for handling events
	var _dispatch = d3.dispatch('cellMouseover', 'cellMouseout', 'cellClick', 'rowMouseover', 'rowMouseout', 'rowClick');

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
		rowMouseover: function(d, i) {
			_fn.updateActiveSeries(d);
			_dispatch.rowMouseover(d, this);
		},
		rowMouseout: function(d, i) {
			_fn.updateActiveSeries();
			_dispatch.rowMouseout(d, this);
		},
		rowClick: function(d, i) {
			_dispatch.rowClick(d, this);
		},
		cellMouseover: function(d, i) {
			_dispatch.cellMouseover(d, this);
		},
		cellMouseout: function(d, i) {
			_dispatch.cellMouseout(d, this);
		},
		cellClick: function(d, i) {
			_dispatch.cellClick(d, this);
		},
		seriesKey: function(d) { return d.key; },
		seriesLabel: function(d) { return d.label; },
		seriesValues: function(d) { return d.values; },
		key: function(d) { return d.key; },
		value: function(d) { return d.value; }
	};

	// Extents
	var _extent = {
		x: extent().getValue(_fn.key),
		value: extent().getValue(_fn.value),
		multi: multiExtent()
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
			.on('mouseover', _fn.rowMouseover)
			.on('mouseout', _fn.rowMouseout)
			.on('click', _fn.rowClick);

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
			.on('mouseover', _fn.cellMouseover)
			.on('mouseout', _fn.cellMouseout)
			.on('click', _fn.cellClick);

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

function verticalBars() {

	// Layout properties
	var _margin = { top: 0, right: 0, bottom: 0, left: 0 };
	var _width = 100;
	var _barHeight = 24;
	var _barPadding = 2;
	var _duration = 500;

	// d3 dispatcher for handling events
	var _dispatch = d3.dispatch('mouseover', 'mouseout', 'click');
	var _fn = {
		mouseover: function(d, i) {
			_dispatch.mouseover(d, this);
		},
		mouseout: function(d, i) {
			_dispatch.mouseout(d, this);
		},
		click: function(d, i) {
			_dispatch.click(d, this);
		}
	};

	// Default accessors for the dimensions of the data
	var _value = {
		key: function(d) { return d.key; },
		value: function(d) { return d.value; },
		label: function(d) { return d.key + ' (' + d.value + ')'; }
	};

	// Default scales for x and y dimensions
	var _scale = {
		x: d3.scale.linear(),
		y: d3.scale.linear()
	};

	// Extents
	var _extent = {
		width: extent({
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
			.on('mouseover', _fn.mouseover)
			.on('mouseout', _fn.mouseout)
			.on('click', _fn.click)
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

var chart = {
	donut: donut,
	matrix: matrix,
	verticalBars: verticalBars
};

function bins(config) {

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
		_config.size = Number(binConfig.size);
		_config.count = Number(binConfig.count);
		_config.lwm = Number(binConfig.lwm);

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
	 * Get/Set the afterUpdate callback function
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

		v = Number(v);
		if(v < 1) {
			throw new Error('Bin size must be a positive integer');
		}

		// Only change stuff if the size actually changes
		if(v !== _config.size) {
			_config.size = v;
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

		v = Number(v);
		if(v < 1) {
			throw new Error('Bin count must be a positive integer');
		}

		// Only change stuff if the count actually changes
		if(v !== _config.count) {
			_config.count = Math.floor(v);
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

/*
 * Controller wrapper for the bin model. Assumes binSize is in milliseconds.
 * Every time binSize elapses, updates the lwm to keep the bins shifting.
 */
function rtBins(config) {

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

		_config.binSize = Number(rtConfig.binSize);
		_config.binCount = Number(rtConfig.binCount);

		if(null != rtConfig.delay) {
			_config.delay = Number(rtConfig.delay);
		}

		_model = bins({
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

		v = Number(v);
		if(v < 1) {
			throw new Error('Bin size must be a positive integer');
		}

		_config.binSize = v;
		_model.size(v);
		_model.lwm(_calculateLwm());

		return controller;
	};

	controller.binCount = function(v) {
		if(!arguments.length) { return _config.binCount; }

		v = Number(v);
		if(v < 1) {
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

var controller = { rtBins: rtBins };

var model = {
	bins: bins
};

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
	function setFilter(ne, oe) {
		var oe = cleanFilter(oe);
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

	_instance.setFilter = function(n, o) {
		return setFilter(n, o);
	};

	// Initialize the model
	_instance(config);

	return _instance;
}

function line() {

	// Layout properties
	var _id = 'timeline_line_' + Date.now();
	var _margin = { top: 10, right: 10, bottom: 20, left: 40 };
	var _height = 100, _width = 600;

	// Default accessors for the dimensions of the data
	var _value = {
		x: function(d) { return d[0]; },
		y: function(d) { return d[1]; }
	};

	// Accessors for the positions of the markers
	var _markerValue = {
		x: function(d, i) { return d[0]; },
		label: function(d, i) { return d[1]; }
	};

	var now = Date.now();
	var _extent = {
		x: extent({
			defaultValue: [now - 60000*5, now],
			getValue: function(d) { return d[0]; }
		}),
		y: extent({
			getValue: function(d) { return d[1]; }
		})
	};
	var _multiExtent = multiExtent().values(function(d) { return d.data; });

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
	var _filter = timelineFilter();

	var _dispatch = d3.dispatch('filter', 'filterstart', 'filterend', 'markerClick', 'markerMouseover', 'markerMouseout');
	var _data = [];

	var _markers = {
		values: []
	};

	function brushstart() {
		_dispatch.filterstart(_filter.getFilter());
	}
	function brush() {
		_dispatch.filter(_filter.getFilter());
	}
	function brushend() {
		_dispatch.filterend(_filter.getFilter());
	}

	// Chart create/init method
	function _instance(selection) {}

	/*
	 * Initialize the chart (should only call this once). Performs all initial chart
	 * creation and setup
	 */
	_instance.init = function(container) {
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

		// Add the filter brush element and set up brush callbacks
		_element.g.brush = _element.g.container.append('g').attr('class', 'x brush');
		_filter.brush()
			.on('brushend', brushend)
			.on('brushstart', brushstart)
			.on('brush', brush);

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
		if(!arguments.length) { return _markers.values; }
		_markers.values = v;
		return _instance;
	};

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

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {
		// Need to grab the filter extent before we change anything
		var filterExtent = _filter.getFilter();

		// Update the x domain (to the latest time window)
		_scale.x.domain(_multiExtent.extent(_extent.x).getExtent(_data));

		// Update the y domain (based on configuration and data)
		_scale.y.domain(_multiExtent.extent(_extent.y).getExtent(_data));

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
			.on('mouseover', _dispatch.markerMouseover)
			.on('mouseout', _dispatch.markerMouseout)
			.on('click', _dispatch.markerClick);

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
	 * Update the state of the existing filter (if any) on the plot.
	 *
	 * This method accepts the extent of the brush before any plot changes were applied
	 * and updates the brush to be redrawn on the plot after the plot changes are applied.
	 * There is also logic to clip the brush if the extent has moved such that the brush
	 * has moved partially out of the plot boundaries, as well as to clear the brush if it
	 * has moved completely outside of the boundaries of the plot.
	 */
	function updateFilter(extent$$1) {
		// Reassert the x scale of the brush (in case the scale has changed)
		_filter.brush().x(_scale.x);

		// Derive the overall plot extent from the collection of series
		var plotExtent = _multiExtent.extent(_extent.x).getExtent(_data);

		// If there was no previous extent, then there is no brush to update
		if(null != extent$$1) {
			// Clip extent by the full extent of the plot (this is in case we've slipped off the visible plot)
			var nExtent = [ Math.max(plotExtent[0], extent$$1[0]), Math.min(plotExtent[1], extent$$1[1]) ];
			setFilter(nExtent, extent$$1);
		}

		_element.g.brush
			.call(_filter.brush())
			.selectAll('rect')
			.attr('y', -6)
				.attr('height', _height - _margin.top - _margin.bottom + 7);

		_element.g.brush
			.style('display', (_filter.enabled())? 'unset' : 'none');
	}

	function setFilter(n, o) {
		if(_filter.setFilter(n, o)) {
			_filter.brush().event(_element.g.brush);
		}
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
	_instance.margin = function(v) {
		if(!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};
	_instance.interpolation = function(v) {
		if(!arguments.length) { return _line.interpolate(); }
		_line.interpolate(v);
		_area.interpolate(v);
		return _instance;
	};
	_instance.xAxis = function(v) {
		if(!arguments.length) { return _axis.x; }
		_axis.x = v;
		return _instance;
	};
	_instance.yAxis = function(v) {
		if(!arguments.length) { return _axis.y; }
		_axis.y = v;
		return _instance;
	};
	_instance.xScale = function(v) {
		if(!arguments.length) { return _scale.x; }
		_scale.x = v;
		if(null != _axis.x) {
			_axis.x.scale(v);
		}
		return _instance;
	};
	_instance.yScale = function(v) {
		if(!arguments.length) { return _scale.y; }
		_scale.y = v;
		if(null != _axis.y) {
			_axis.y.scale(v);
		}
		return _instance;
	};
	_instance.xValue = function(v) {
		if(!arguments.length) { return _value.x; }
		_value.x = v;
		return _instance;
	};
	_instance.yValue = function(v) {
		if(!arguments.length) { return _value.y; }
		_value.y = v;
		return _instance;
	};
	_instance.yExtent = function(v) {
		if(!arguments.length) { return _extent.y; }
		_extent.y = v;
		return _instance;
	};
	_instance.xExtent = function(v) {
		if(!arguments.length) { return _extent.x; }
		_extent.x = v;
		return _instance;
	};
	_instance.markerXValue = function(v) {
		if(!arguments.length) { return _markerValue.x; }
		_markerValue.x = v;
		return _instance;
	};
	_instance.markerLabelValue = function(v) {
		if(!arguments.length) { return _markerValue.label; }
		_markerValue.label = v;
		return _instance;
	};
	_instance.filter = function(v) {
		if(!arguments.length) { return _filter.enabled; }
		_filter.enabled(v);
		return _instance;
	};
	_instance.dispatch = function(v) {
		if(!arguments.length) { return _dispatch; }
		return _instance;
	};
	_instance.setFilter = function(v) {
		return setFilter(v, _filter.getFilter());
	};
	_instance.getFilter = function() {
		return _filter.getFilter();
	};

	return _instance;
}

function timeline() {

	// Default data delay, this is the difference between now and the latest tick shown on the timeline
	var _delay = 0;

	// Interval of the timeline, this is the amount of time being displayed by the timeline
	var _interval = 60000;

	// Is the timeline running?
	var _running = false;
	var _timeout = null;

	// What is the refresh rate?
	var _fps = 32;

	var _instance = line();
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

var realtime = {
	timeline: timeline
};

var timeline$1 = {
	line: line
};

var util = {
	extent: extent,
	multiExtent: multiExtent,
	timelineFilter: timelineFilter
};

exports.chart = chart;
exports.controller = controller;
exports.model = model;
exports.realtime = realtime;
exports.timeline = timeline$1;
exports.util = util;

Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL3NlbnRpby9qcy9jaGFydC9kb251dC5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL3NlbnRpby9qcy91dGlsL2V4dGVudC5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL3NlbnRpby9qcy91dGlsL211bHRpX2V4dGVudC5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL3NlbnRpby9qcy9jaGFydC9tYXRyaXguanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9zZW50aW8vanMvY2hhcnQvdmVydGljYWxfYmFycy5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL3NlbnRpby9qcy9jaGFydC9pbmRleC5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL3NlbnRpby9qcy9tb2RlbC9iaW5zLmpzIiwiL1VzZXJzL3JlYmxhY2UvZ2l0L0Bhc3ltbWV0cmlrL3NlbnRpby1qcy9zcmMvc2VudGlvL2pzL2NvbnRyb2xsZXIvcmVhbHRpbWVfYmlucy5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL3NlbnRpby9qcy9jb250cm9sbGVyL2luZGV4LmpzIiwiL1VzZXJzL3JlYmxhY2UvZ2l0L0Bhc3ltbWV0cmlrL3NlbnRpby1qcy9zcmMvc2VudGlvL2pzL21vZGVsL2luZGV4LmpzIiwiL1VzZXJzL3JlYmxhY2UvZ2l0L0Bhc3ltbWV0cmlrL3NlbnRpby1qcy9zcmMvc2VudGlvL2pzL3V0aWwvdGltZWxpbmVfZmlsdGVyLmpzIiwiL1VzZXJzL3JlYmxhY2UvZ2l0L0Bhc3ltbWV0cmlrL3NlbnRpby1qcy9zcmMvc2VudGlvL2pzL3RpbWVsaW5lL2xpbmUuanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9zZW50aW8vanMvcmVhbHRpbWUvdGltZWxpbmUuanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9zZW50aW8vanMvcmVhbHRpbWUvaW5kZXguanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9zZW50aW8vanMvdGltZWxpbmUvaW5kZXguanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9zZW50aW8vanMvdXRpbC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBkb251dCgpIHtcblxuXHQvLyBDaGFydCBoZWlnaHQvd2lkdGhcblx0dmFyIF93aWR0aCA9IDQwMDtcblx0dmFyIF9oZWlnaHQgPSA0MDA7XG5cdHZhciBfbWFyZ2luID0geyB0b3A6IDIsIGJvdHRvbTogMiwgcmlnaHQ6IDIsIGxlZnQ6IDIgfTtcblxuXHQvLyBJbm5lciBhbmQgb3V0ZXIgcmFkaXVzIHNldHRpbmdzXG5cdHZhciBfcmFkaXVzO1xuXHR2YXIgX2lubmVyUmFkaXVzUmF0aW8gPSAwLjc7XG5cblx0Ly8gVHJhbnNpdGlvbiBkdXJhdGlvblxuXHR2YXIgX2R1cmF0aW9uID0gNTAwO1xuXG5cdC8vIExlZ2VuZCBjb25maWd1cmF0aW9uXG5cdHZhciBfbGVnZW5kID0ge1xuXHRcdGVuYWJsZWQ6IHRydWUsXG5cdFx0bWFya1NpemU6IDE2LFxuXHRcdG1hcmtNYXJnaW46IDgsXG5cdFx0bGFiZWxPZmZzZXQ6IDIsXG5cdFx0cG9zaXRpb246ICdjZW50ZXInLCAvLyBvbmx5IG9wdGlvbiByaWdodCBub3dcblx0XHRsYXlvdXQ6ICd2ZXJ0aWNhbCdcblx0fTtcblxuXHQvLyBkMyBkaXNwYXRjaGVyIGZvciBoYW5kbGluZyBldmVudHNcblx0dmFyIF9kaXNwYXRjaCA9IGQzLmRpc3BhdGNoKCdtb3VzZW92ZXInLCAnbW91c2VvdXQnLCAnY2xpY2snKTtcblxuXHQvLyBGdW5jdGlvbiBoYW5kbGVyc1xuXHR2YXIgX2ZuID0ge1xuXHRcdHVwZGF0ZUFjdGl2ZUVsZW1lbnQ6IGZ1bmN0aW9uKGQpIHtcblx0XHRcdHZhciBsZWdlbmRFbnRyaWVzID0gX2VsZW1lbnQuZ0xlZ2VuZC5zZWxlY3RBbGwoJ2cuZW50cnknKTtcblx0XHRcdHZhciBhcmNzID0gX2VsZW1lbnQuZ0NoYXJ0LnNlbGVjdEFsbCgncGF0aC5hcmMnKTtcblxuXHRcdFx0aWYobnVsbCAhPSBkICYmIG51bGwgIT0gZC5kYXRhKSB7XG5cdFx0XHRcdGQgPSBkLmRhdGE7XG5cdFx0XHR9XG5cblx0XHRcdGlmKG51bGwgIT0gZCkge1xuXHRcdFx0XHQvLyBTZXQgdGhlIGhpZ2hsaWdodCBvbiB0aGUgcm93XG5cdFx0XHRcdHZhciBrZXkgPSBfZm4ua2V5KGQpO1xuXHRcdFx0XHRsZWdlbmRFbnRyaWVzLmNsYXNzZWQoJ2FjdGl2ZScsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRcdHJldHVybiBfZm4ua2V5KGUpID09IGtleTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGFyY3MuY2xhc3NlZCgnYWN0aXZlJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdFx0cmV0dXJuIF9mbi5rZXkoZS5kYXRhKSA9PSBrZXk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGxlZ2VuZEVudHJpZXMuY2xhc3NlZCgnYWN0aXZlJywgZmFsc2UpO1xuXHRcdFx0XHRhcmNzLmNsYXNzZWQoJ2FjdGl2ZScsIGZhbHNlKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG1vdXNlb3ZlcjogZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0X2ZuLnVwZGF0ZUFjdGl2ZUVsZW1lbnQoZCk7XG5cdFx0XHRfZGlzcGF0Y2gubW91c2VvdmVyKGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0bW91c2VvdXQ6IGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdF9mbi51cGRhdGVBY3RpdmVFbGVtZW50KCk7XG5cdFx0XHRfZGlzcGF0Y2gubW91c2VvdXQoZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRjbGljazogZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0X2Rpc3BhdGNoLmNsaWNrKGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0a2V5OiBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBkLmtleTsgfSxcblx0XHR2YWx1ZTogZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZC52YWx1ZTsgfSxcblx0XHRsYWJlbDogZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZC5rZXkgKyAnICgnICsgZC52YWx1ZSArICcpJzsgfVxuXHR9O1xuXG5cblx0Ly8gRXh0ZW50c1xuXHR2YXIgX2V4dGVudCA9IHtcblx0fTtcblxuXHR2YXIgX3NjYWxlID0ge1xuXHRcdGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKClcblx0fTtcblxuXHR2YXIgX2xheW91dCA9IHtcblx0XHRhcmM6IGQzLnN2Zy5hcmMoKSxcblx0XHRwaWU6IGQzLmxheW91dC5waWUoKS52YWx1ZShfZm4udmFsdWUpLnNvcnQobnVsbClcblx0fTtcblxuXHQvLyBlbGVtZW50c1xuXHR2YXIgX2VsZW1lbnQgPSB7XG5cdFx0ZGl2OiB1bmRlZmluZWQsXG5cdFx0c3ZnOiB1bmRlZmluZWQsXG5cdFx0Z0NoYXJ0OiB1bmRlZmluZWQsXG5cdFx0bGVnZW5kOiB1bmRlZmluZWRcblx0fTtcblxuXHR2YXIgX2RhdGEgPSBbXTtcblxuXHQvLyBDaGFydCBjcmVhdGUvaW5pdCBtZXRob2Rcblx0ZnVuY3Rpb24gX2luc3RhbmNlKHNlbGVjdGlvbil7fVxuXG5cdC8qXG5cdCAqIEluaXRpYWxpemUgdGhlIGNoYXJ0IChzaG91bGQgb25seSBjYWxsIHRoaXMgb25jZSkuIFBlcmZvcm1zIGFsbCBpbml0aWFsIGNoYXJ0XG5cdCAqIGNyZWF0aW9uIGFuZCBzZXR1cFxuXHQgKi9cblx0X2luc3RhbmNlLmluaXQgPSBmdW5jdGlvbihjb250YWluZXIpe1xuXHRcdC8vIENyZWF0ZSB0aGUgRElWIGVsZW1lbnRcblx0XHRfZWxlbWVudC5kaXYgPSBjb250YWluZXIuYXBwZW5kKCdkaXYnKS5hdHRyKCdjbGFzcycsICdzZW50aW8gZG9udXQnKTtcblxuXHRcdC8vIENyZWF0ZSB0aGUgc3ZnIGVsZW1lbnRcblx0XHRfZWxlbWVudC5zdmcgPSBfZWxlbWVudC5kaXYuYXBwZW5kKCdzdmcnKTtcblxuXHRcdC8vIENyZWF0ZSB0aGUgbWFpbiBjaGFydCBncm91cFxuXHRcdF9lbGVtZW50LmdDaGFydCA9IF9lbGVtZW50LnN2Zy5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdjaGFydCcpO1xuXG5cdFx0Ly8gQ3JlYXRlIGEgZ3JvdXAgZm9yIHRoZSBsZWdlbmRcblx0XHRfZWxlbWVudC5nTGVnZW5kID0gX2VsZW1lbnQuc3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpO1xuXG5cdFx0X2luc3RhbmNlLnJlc2l6ZSgpO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBTZXQgdGhlIF9pbnN0YW5jZSBkYXRhXG5cdCAqL1xuXHRfaW5zdGFuY2UuZGF0YSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2RhdGE7IH1cblx0XHRfZGF0YSA9IHYgfHwgW107XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBVcGRhdGVzIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBkZXBlbmQgb24gdGhlIHNpemUgb2YgdGhlIHZhcmlvdXMgY29tcG9uZW50c1xuXHQgKi9cblx0X2luc3RhbmNlLnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjaGFydFdpZHRoID0gX3dpZHRoIC0gX21hcmdpbi5yaWdodCAtIF9tYXJnaW4ubGVmdDtcblx0XHR2YXIgY2hhcnRIZWlnaHQgPSBfaGVpZ2h0IC0gX21hcmdpbi50b3AgLSBfbWFyZ2luLmJvdHRvbTtcblx0XHRfcmFkaXVzID0gKE1hdGgubWluKGNoYXJ0SGVpZ2h0LCBjaGFydFdpZHRoKSkvMjtcblxuXHRcdF9lbGVtZW50LnN2Z1xuXHRcdFx0LmF0dHIoJ3dpZHRoJywgX3dpZHRoKVxuXHRcdFx0LmF0dHIoJ2hlaWdodCcsIF9oZWlnaHQpO1xuXG5cdFx0X2VsZW1lbnQuZ0NoYXJ0XG5cdFx0XHQuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgKF9tYXJnaW4ubGVmdCArIF9yYWRpdXMpICsgJywnICsgKF9tYXJnaW4udG9wICsgX3JhZGl1cykgKyAnKScpO1xuXG5cdFx0Ly8gVGhlIG91dGVyIHJhZGl1cyBpcyBoYWxmIG9mIHRoZSBsZXNzZXIgb2YgdGhlIHR3byAoY2hhcnRXaWR0aC9jaGFydEhlaWdodClcblx0XHRfbGF5b3V0LmFyYy5pbm5lclJhZGl1cyhfcmFkaXVzICogX2lubmVyUmFkaXVzUmF0aW8pLm91dGVyUmFkaXVzKF9yYWRpdXMpO1xuXG5cdFx0Ly8gVXBkYXRlIGxlZ2VuZCBwb3NpdGlvbmluZ1xuXHRcdF9lbGVtZW50LmdMZWdlbmQuYXR0cigndHJhbnNmb3JtJywgbGVnZW5kVHJhbnNmb3JtKCkpO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBSZWRyYXcgdGhlIGdyYXBoaWNcblx0ICovXG5cdF9pbnN0YW5jZS5yZWRyYXcgPSBmdW5jdGlvbigpIHtcblxuXHRcdHJlZHJhd0NoYXJ0KCk7XG5cblx0XHRpZiAoX2xlZ2VuZC5lbmFibGVkKSB7XG5cdFx0XHRyZWRyYXdMZWdlbmQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBQcml2YXRlIGZ1bmN0aW9uc1xuXHQgKi9cblx0ZnVuY3Rpb24gcmVkcmF3Q2hhcnQoKSB7XG5cdFx0Lypcblx0XHQgKiBKb2luIHRoZSBkYXRhXG5cdFx0ICovXG5cdFx0dmFyIGcgPSBfZWxlbWVudC5nQ2hhcnQuc2VsZWN0QWxsKCdwYXRoLmFyYycpXG5cdFx0XHQuZGF0YShfbGF5b3V0LnBpZShfZGF0YSksIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIF9mbi5rZXkoZC5kYXRhLCBpKTsgfSk7XG5cblx0XHQvKlxuXHRcdCAqIFVwZGF0ZSBPbmx5XG5cdFx0ICovXG5cblx0XHQvKlxuXHRcdCAqIEVudGVyIE9ubHlcblx0XHQgKiBDcmVhdGUgdGhlIHBhdGgsIGFkZCB0aGUgYXJjIGNsYXNzLCByZWdpc3RlciB0aGUgY2FsbGJhY2tzXG5cdFx0ICogR3JvdyBmcm9tIDAgZm9yIGJvdGggc3RhcnQgYW5kIGVuZCBhbmdsZXNcblx0XHQgKi9cblx0XHR2YXIgZ0VudGVyID0gZy5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG5cdFx0XHQuYXR0cignY2xhc3MnLCAnYXJjJylcblx0XHRcdC5vbignbW91c2VvdmVyJywgX2ZuLm1vdXNlb3Zlcilcblx0XHRcdC5vbignbW91c2VvdXQnLCBfZm4ubW91c2VvdXQpXG5cdFx0XHQub24oJ2NsaWNrJywgX2ZuLmNsaWNrKVxuXHRcdFx0LmVhY2goZnVuY3Rpb24oZCkgeyB0aGlzLl9jdXJyZW50ID0geyBzdGFydEFuZ2xlOiAwLCBlbmRBbmdsZTogMCB9OyB9KTtcblxuXHRcdC8qXG5cdFx0ICogRW50ZXIgKyBVcGRhdGVcblx0XHQgKiBBcHBseSB0aGUgdXBkYXRlIGZyb20gY3VycmVudCBhbmdsZSB0byBuZXh0IGFuZ2xlXG5cdFx0ICovXG5cdFx0Zy50cmFuc2l0aW9uKCkuZHVyYXRpb24oX2R1cmF0aW9uKVxuXHRcdFx0LmF0dHJUd2VlbignZCcsIGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0dmFyIGludGVycG9sYXRlID0gZDMuaW50ZXJwb2xhdGUodGhpcy5fY3VycmVudCwgZCk7XG5cdFx0XHRcdHRoaXMuX2N1cnJlbnQgPSBpbnRlcnBvbGF0ZSgwKTtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKHQpIHtcblx0XHRcdFx0XHRyZXR1cm4gX2xheW91dC5hcmMoaW50ZXJwb2xhdGUodCkpO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cblx0XHRnLmF0dHIoJ2tleScsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIF9mbi5rZXkoZC5kYXRhLCBpKTsgfSlcblx0XHRcdC5hdHRyKCdmaWxsJywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gX3NjYWxlLmNvbG9yKF9mbi5rZXkoZC5kYXRhLCBpKSk7IH0pO1xuXG5cdFx0Zy5leGl0KCkucmVtb3ZlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBsZWdlbmRUcmFuc2Zvcm0oKSB7XG5cdFx0dmFyIGVudHJ5U3BhbiA9IF9sZWdlbmQubWFya1NpemUgKyBfbGVnZW5kLm1hcmtNYXJnaW47XG5cblx0XHQvLyBPbmx5IG9wdGlvbiBpcyAnY2VudGVyJyBmb3Igbm93XG5cdFx0aWYgKF9sZWdlbmQucG9zaXRpb24gPT09ICdjZW50ZXInKSB7XG5cdFx0XHQvLyBUaGUgY2VudGVyIHBvc2l0aW9uIG9mIHRoZSBjaGFydFxuXHRcdFx0dmFyIGNlbnRlclggPSBfbWFyZ2luLmxlZnQgKyBfcmFkaXVzO1xuXHRcdFx0dmFyIGNlbnRlclkgPSBfbWFyZ2luLnRvcCArIF9yYWRpdXM7XG5cdFx0XHR2YXIgbGVnZW5kV2lkdGggPSAobnVsbCA9PSBfZWxlbWVudC5nTGVnZW5kLl9tYXhXaWR0aCk/IDAgOiBfZWxlbWVudC5nTGVnZW5kLl9tYXhXaWR0aDtcblx0XHRcdHZhciBsZWdlbmRIZWlnaHQgPSBlbnRyeVNwYW4qX2RhdGEubGVuZ3RoICsgX2xlZ2VuZC5tYXJrTWFyZ2luO1xuXG5cdFx0XHR2YXIgb2Zmc2V0WCA9IGxlZ2VuZFdpZHRoLzI7XG5cdFx0XHR2YXIgb2Zmc2V0WSA9IGxlZ2VuZEhlaWdodC8yO1xuXG5cdFx0XHRyZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKGNlbnRlclggLSBvZmZzZXRYKSArICcsJyArIChjZW50ZXJZIC0gb2Zmc2V0WSkgKyAnKSc7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFRPRE9cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiByZWRyYXdMZWdlbmQoKSB7XG5cdFx0Lypcblx0XHQgKiBKb2luIHRoZSBkYXRhXG5cdFx0ICovXG5cdFx0dmFyIGdMZWdlbmRHcm91cCA9IF9lbGVtZW50LmdMZWdlbmQuc2VsZWN0QWxsKCdnLmVudHJ5Jylcblx0XHRcdC5kYXRhKF9kYXRhLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBfZm4ua2V5KGQsIGkpOyB9KTtcblxuXHRcdC8qXG5cdFx0ICogRW50ZXIgT25seVxuXHRcdCAqIENyZWF0ZSBhIGcgKGdMZWdlbmRHcm91cCkgdG8gYWRkIHRoZSByZWN0ICYgdGV4dCBsYWJlbCxcblx0XHQgKiByZWdpc3RlciB0aGUgY2FsbGJhY2tzLCBhcHBseSB0aGUgdHJhbnNmb3JtIHRvIHBvc2l0aW9uIGVhY2ggZ0xlZ2VuZEdyb3VwXG5cdFx0ICovXG5cdFx0dmFyIGdMZWdlbmRHcm91cEVudGVyID0gZ0xlZ2VuZEdyb3VwLmVudGVyKCkuYXBwZW5kKCdnJylcblx0XHRcdC5hdHRyKCdjbGFzcycsICdlbnRyeScpXG5cdFx0XHQuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gJ3RyYW5zbGF0ZSgwLCAnICsgKGkqKF9sZWdlbmQubWFya1NpemUgKyBfbGVnZW5kLm1hcmtNYXJnaW4pKSArICcpJzsgfSApXG5cdFx0XHQub24oJ21vdXNlb3ZlcicsIF9mbi5tb3VzZW92ZXIpXG5cdFx0XHQub24oJ21vdXNlb3V0JywgX2ZuLm1vdXNlb3V0KVxuXHRcdFx0Lm9uKCdjbGljaycsIF9mbi5jbGljayk7XG5cblx0XHQvLyBBZGQgdGhlIGxlZ2VuZCdzIHJlY3Rcblx0XHR2YXIgcmVjdCA9IGdMZWdlbmRHcm91cEVudGVyXG5cdFx0XHQuYXBwZW5kKCdyZWN0Jylcblx0XHRcdC5hdHRyKCd3aWR0aCcsIF9sZWdlbmQubWFya1NpemUpXG5cdFx0XHQuYXR0cignaGVpZ2h0JywgX2xlZ2VuZC5tYXJrU2l6ZSk7XG5cblx0XHQvLyBBZGQgdGhlIGxlZ2VuZCB0ZXh0XG5cdFx0Z0xlZ2VuZEdyb3VwRW50ZXJcblx0XHRcdC5hcHBlbmQoJ3RleHQnKVxuXHRcdFx0LmF0dHIoJ3gnLCBfbGVnZW5kLm1hcmtTaXplICsgX2xlZ2VuZC5tYXJrTWFyZ2luKVxuXHRcdFx0LmF0dHIoJ3knLCBfbGVnZW5kLm1hcmtTaXplIC0gX2xlZ2VuZC5sYWJlbE9mZnNldCk7XG5cblx0XHQvKlxuXHRcdCAqIEVudGVyICsgVXBkYXRlXG5cdFx0ICovXG5cdFx0Z0xlZ2VuZEdyb3VwLnNlbGVjdCgndGV4dCcpXG5cdFx0XHQudGV4dChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBfZm4ubGFiZWwoZCwgaSk7IH0pO1xuXG5cdFx0Z0xlZ2VuZEdyb3VwLnNlbGVjdCgncmVjdCcpXG5cdFx0XHQuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7IHJldHVybiBfc2NhbGUuY29sb3IoX2ZuLmtleShkKSk7IH0pO1xuXG5cdFx0Ly8gUG9zaXRpb24gZWFjaCByZWN0IG9uIGJvdGggZW50ZXIgYW5kIHVwZGF0ZSB0byBmdWxseSBhY2NvdW50IGZvciBjaGFuZ2luZyB3aWR0aHMgYW5kIHNpemVzXG5cdFx0Z0xlZ2VuZEdyb3VwXG5cdFx0XHQvLyBJdGVyYXRlIG92ZXIgYWxsIHRoZSBsZWdlbmQga2V5cyB0byBnZXQgdGhlIG1heCB3aWR0aCBhbmQgc3RvcmUgaXQgaW4gZ0xlZ2VuZEdyb3VwLl9tYXhXaWR0aFxuXHRcdFx0LmVhY2goZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0XHRpZiAoaSA9PT0gMCkge1xuXHRcdFx0XHRcdC8vIFJlc2V0XG5cdFx0XHRcdFx0X2VsZW1lbnQuZ0xlZ2VuZC5fbWF4V2lkdGggPSB0aGlzLmdldEJCb3goKS53aWR0aDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRfZWxlbWVudC5nTGVnZW5kLl9tYXhXaWR0aCA9IE1hdGgubWF4KHRoaXMuZ2V0QkJveCgpLndpZHRoLCBfZWxlbWVudC5nTGVnZW5kLl9tYXhXaWR0aCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0Ly8gUmVhc3NlcnQgdGhlIGxlZ2VuZCBwb3NpdGlvblxuXHRcdF9lbGVtZW50LmdMZWdlbmQuYXR0cigndHJhbnNmb3JtJywgbGVnZW5kVHJhbnNmb3JtKCkpO1xuXG5cdFx0Z0xlZ2VuZEdyb3VwLmV4aXQoKS5yZW1vdmUoKTtcblx0fVxuXG5cdC8vIEJhc2ljIEdldHRlcnMvU2V0dGVyc1xuXHRfaW5zdGFuY2Uud2lkdGggPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF93aWR0aDsgfVxuXHRcdF93aWR0aCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmhlaWdodCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2hlaWdodDsgfVxuXHRcdF9oZWlnaHQgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmlubmVyUmFkaXVzUmF0aW8gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9pbm5lclJhZGl1c1JhdGlvOyB9XG5cdFx0X2lubmVyUmFkaXVzUmF0aW8gPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmR1cmF0aW9uID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZHVyYXRpb247IH1cblx0XHRfZHVyYXRpb24gPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmtleSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmtleTsgfVxuXHRcdF9mbi5rZXkgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS52YWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLnZhbHVlOyB9XG5cdFx0X2ZuLnZhbHVlID0gdjtcblx0XHRfbGF5b3V0LnBpZS52YWx1ZSh2KTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UubGFiZWwgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5sYWJlbDsgfVxuXHRcdF9mbi5sYWJlbCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmNvbG9yID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfc2NhbGUuY29sb3I7IH1cblx0XHRfc2NhbGUuY29sb3IgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmRpc3BhdGNoID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZGlzcGF0Y2g7IH1cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdF9pbnN0YW5jZS5sZWdlbmQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9sZWdlbmQ7IH1cblx0XHRfbGVnZW5kID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdHJldHVybiBfaW5zdGFuY2U7XG59XG5cbmV4cG9ydCB7IGRvbnV0IH07XG4iLCJmdW5jdGlvbiBleHRlbnQoY29uZmlnKSB7XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgdmFyaWFibGVzXG5cdCAqL1xuXHQvLyBDb25maWd1cmF0aW9uXG5cdHZhciBfY29uZmlnID0ge1xuXHRcdGRlZmF1bHRWYWx1ZTogWzAsIDEwXSxcblx0XHRvdmVycmlkZVZhbHVlOiB1bmRlZmluZWRcblx0fTtcblxuXHR2YXIgX2ZuID0ge1xuXHRcdGdldFZhbHVlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuXHRcdGZpbHRlcjogZnVuY3Rpb24oKSB7IHJldHVybiB0cnVlOyB9XG5cdH07XG5cblxuXHQvKipcblx0ICogUHJpdmF0ZSBGdW5jdGlvbnNcblx0ICovXG5cblx0ZnVuY3Rpb24gc2V0RGVmYXVsdFZhbHVlKHYpIHtcblx0XHRpZihudWxsID09IHYgfHwgMiAhPT0gdi5sZW5ndGggfHwgaXNOYU4odlswXSkgfHwgaXNOYU4odlsxXSkgfHwgdlswXSA+PSB2WzFdKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0RlZmF1bHQgZXh0ZW50IG11c3QgYmUgYSB0d28gZWxlbWVudCBvcmRlcmVkIGFycmF5IG9mIG51bWJlcnMnKTtcblx0XHR9XG5cdFx0X2NvbmZpZy5kZWZhdWx0VmFsdWUgPSB2O1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0T3ZlcnJpZGVWYWx1ZSh2KSB7XG5cdFx0aWYobnVsbCAhPSB2ICYmIDIgIT09IHYubGVuZ3RoKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0V4dGVudCBvdmVycmlkZSBtdXN0IGJlIGEgdHdvIGVsZW1lbnQgYXJyYXkgb3IgbnVsbC91bmRlZmluZWQnKTtcblx0XHR9XG5cdFx0X2NvbmZpZy5vdmVycmlkZVZhbHVlID0gdjtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldEdldFZhbHVlKHYpIHtcblx0XHRpZih0eXBlb2YgdiAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdWYWx1ZSBnZXR0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cdFx0fVxuXG5cdFx0X2ZuLmdldFZhbHVlID0gdjtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldEZpbHRlcih2KSB7XG5cdFx0aWYodHlwZW9mIHYgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignRmlsdGVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXHRcdH1cblxuXHRcdF9mbi5maWx0ZXIgPSB2O1xuXHR9XG5cblx0Lypcblx0ICogQ29uc3RydWN0b3IvaW5pdGlhbGl6YXRpb24gbWV0aG9kXG5cdCAqL1xuXHRmdW5jdGlvbiBfaW5zdGFuY2UoZXh0ZW50Q29uZmlnKSB7XG5cdFx0aWYobnVsbCAhPSBleHRlbnRDb25maWcpIHtcblx0XHRcdGlmKG51bGwgIT0gZXh0ZW50Q29uZmlnLmRlZmF1bHRWYWx1ZSkgeyBzZXREZWZhdWx0VmFsdWUoZXh0ZW50Q29uZmlnLmRlZmF1bHRWYWx1ZSk7IH1cblx0XHRcdGlmKG51bGwgIT0gZXh0ZW50Q29uZmlnLm92ZXJyaWRlVmFsdWUpIHsgc2V0T3ZlcnJpZGVWYWx1ZShleHRlbnRDb25maWcub3ZlcnJpZGVWYWx1ZSk7IH1cblx0XHRcdGlmKG51bGwgIT0gZXh0ZW50Q29uZmlnLmdldFZhbHVlKSB7IHNldEdldFZhbHVlKGV4dGVudENvbmZpZy5nZXRWYWx1ZSk7IH1cblx0XHRcdGlmKG51bGwgIT0gZXh0ZW50Q29uZmlnLmZpbHRlcikgeyBzZXRGaWx0ZXIoZXh0ZW50Q29uZmlnLmZpbHRlcik7IH1cblx0XHR9XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBQdWJsaWMgQVBJXG5cdCAqL1xuXG5cdC8qXG5cdCAqIEdldC9TZXQgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBleHRlbnRcblx0ICovXG5cdF9pbnN0YW5jZS5kZWZhdWx0VmFsdWUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jb25maWcuZGVmYXVsdFZhbHVlOyB9XG5cdFx0c2V0RGVmYXVsdFZhbHVlKHYpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogR2V0L1NldCB0aGUgb3ZlcnJpZGUgdmFsdWUgZm9yIHRoZSBleHRlbnRcblx0ICovXG5cdF9pbnN0YW5jZS5vdmVycmlkZVZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfY29uZmlnLm92ZXJyaWRlVmFsdWU7IH1cblx0XHRzZXRPdmVycmlkZVZhbHVlKHYpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogR2V0L1NldCB0aGUgdmFsdWUgYWNjZXNzb3IgZm9yIHRoZSBleHRlbnRcblx0ICovXG5cdF9pbnN0YW5jZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmdldFZhbHVlOyB9XG5cdFx0c2V0R2V0VmFsdWUodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBHZXQvU2V0IHRoZSBmaWx0ZXIgZm4gZm9yIHRoZSBleHRlbnRcblx0ICovXG5cdF9pbnN0YW5jZS5maWx0ZXIgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5maWx0ZXI7IH1cblx0XHRzZXRGaWx0ZXIodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBDYWxjdWxhdGUgdGhlIGV4dGVudCBnaXZlbiBzb21lIGRhdGEuXG5cdCAqIC0gRGVmYXVsdCB2YWx1ZXMgYXJlIHVzZWQgaW4gdGhlIGFic2VuY2Ugb2YgZGF0YVxuXHQgKiAtIE92ZXJyaWRlIHZhbHVlcyBhcmUgdXNlZCB0byBjbGFtcCBvciBleHRlbmQgdGhlIGV4dGVudFxuXHQgKi9cblx0X2luc3RhbmNlLmdldEV4dGVudCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgdG9SZXR1cm47XG5cdFx0dmFyIG92ID0gX2NvbmZpZy5vdmVycmlkZVZhbHVlO1xuXG5cdFx0Ly8gQ2hlY2sgdG8gc2VlIGlmIHdlIG5lZWQgdG8gY2FsY3VsYXRlIHRoZSBleHRlbnRcblx0XHRpZihudWxsID09IG92IHx8IG51bGwgPT0gb3ZbMF0gfHwgbnVsbCA9PSBvdlsxXSkge1xuXHRcdFx0Ly8gU2luY2UgdGhlIG92ZXJyaWRlIGlzbid0IGNvbXBsZXRlLCB3ZSBuZWVkIHRvIGNhbGN1bGF0ZSB0aGUgZXh0ZW50XG5cdFx0XHR0b1JldHVybiA9IFtOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5ORUdBVElWRV9JTkZJTklUWV07XG5cdFx0XHR2YXIgZm91bmREYXRhID0gZmFsc2U7XG5cblx0XHRcdGlmKG51bGwgIT0gZGF0YSkge1xuXHRcdFx0XHQvLyBJdGVyYXRlIG92ZXIgZWFjaCBlbGVtZW50IG9mIHRoZSBkYXRhXG5cdFx0XHRcdGRhdGEuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LCBpKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGVsZW1lbnQgcGFzc2VzIHRoZSBmaWx0ZXIsIHRoZW4gdXBkYXRlIHRoZSBleHRlbnRcblx0XHRcdFx0XHRpZihfZm4uZmlsdGVyKGVsZW1lbnQsIGkpKSB7XG5cdFx0XHRcdFx0XHRmb3VuZERhdGEgPSB0cnVlO1xuXHRcdFx0XHRcdFx0dmFyIHYgPSBfZm4uZ2V0VmFsdWUoZWxlbWVudCwgaSk7XG5cdFx0XHRcdFx0XHR0b1JldHVyblswXSA9IE1hdGgubWluKHRvUmV0dXJuWzBdLCB2KTtcblx0XHRcdFx0XHRcdHRvUmV0dXJuWzFdID0gTWF0aC5tYXgodG9SZXR1cm5bMV0sIHYpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHdlIGRpZG4ndCBmaW5kIGFueSBkYXRhLCB1c2UgdGhlIGRlZmF1bHQgdmFsdWVzXG5cdFx0XHRpZighZm91bmREYXRhKSB7XG5cdFx0XHRcdHRvUmV0dXJuID0gX2NvbmZpZy5kZWZhdWx0VmFsdWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFwcGx5IHRoZSBvdmVycmlkZXNcblx0XHRcdC8vIC0gU2luY2Ugd2UncmUgaW4gdGhpcyBjb25kaXRpb25hbCwgb25seSBvbmUgb3IgemVybyBvdmVycmlkZXMgd2VyZSBzcGVjaWZpZWRcblx0XHRcdGlmKG51bGwgIT0gb3YpIHtcblx0XHRcdFx0aWYobnVsbCAhPSBvdlswXSkge1xuXHRcdFx0XHRcdC8vIFNldCB0aGUgbG93ZXIgb3ZlcnJpZGVcblx0XHRcdFx0XHR0b1JldHVyblswXSA9IG92WzBdO1xuXHRcdFx0XHRcdGlmKHRvUmV0dXJuWzBdID4gdG9SZXR1cm5bMV0pIHtcblx0XHRcdFx0XHRcdHRvUmV0dXJuWzFdID0gdG9SZXR1cm5bMF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKG51bGwgIT0gb3ZbMV0pIHtcblx0XHRcdFx0XHR0b1JldHVyblsxXSA9IG92WzFdO1xuXHRcdFx0XHRcdGlmKHRvUmV0dXJuWzFdIDwgdG9SZXR1cm5bMF0pIHtcblx0XHRcdFx0XHRcdHRvUmV0dXJuWzBdID0gdG9SZXR1cm5bMV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFNpbmNlIHRoZSBvdmVycmlkZSBpcyBmdWxseSBzcGVjaWZpZWQsIHVzZSBpdFxuXHRcdFx0dG9SZXR1cm4gPSBvdjtcblx0XHR9XG5cblx0XHRyZXR1cm4gdG9SZXR1cm47XG5cdH07XG5cblxuXHQvLyBJbml0aWFsaXplIHRoZSBtb2RlbFxuXHRfaW5zdGFuY2UoY29uZmlnKTtcblxuXHRyZXR1cm4gX2luc3RhbmNlO1xufVxuXG5leHBvcnQgeyBleHRlbnQgfTtcbiIsImltcG9ydCB7IGV4dGVudCB9IGZyb20gJy4vZXh0ZW50JztcblxuZnVuY3Rpb24gbXVsdGlFeHRlbnQoY29uZmlnKSB7XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgdmFyaWFibGVzXG5cdCAqL1xuXG5cdHZhciBfZm4gPSB7XG5cdFx0dmFsdWVzOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfVxuXHR9O1xuXG5cdHZhciBfZXh0ZW50ID0gZXh0ZW50KCk7XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgRnVuY3Rpb25zXG5cdCAqL1xuXG5cdGZ1bmN0aW9uIHNldEV4dGVudCh2KSB7XG5cdFx0X2V4dGVudCA9IHY7XG5cdH1cblxuXHQvKlxuXHQgKiBDb25zdHJ1Y3Rvci9pbml0aWFsaXphdGlvbiBtZXRob2Rcblx0ICovXG5cdGZ1bmN0aW9uIF9pbnN0YW5jZShjb25maWcpIHtcblx0XHRpZihudWxsICE9IGNvbmZpZyAmJiBudWxsICE9IGNvbmZpZy5leHRlbnQpIHtcblx0XHRcdHNldEV4dGVudChjb25maWcuZXh0ZW50KTtcblx0XHR9XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBQdWJsaWMgQVBJXG5cdCAqL1xuXG5cdC8qXG5cdCAqIEdldC9TZXQgdGhlIGV4dGVudCB0byB1c2Vcblx0ICovXG5cdF9pbnN0YW5jZS5leHRlbnQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9leHRlbnQ7IH1cblx0XHRzZXRFeHRlbnQodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBHZXQvU2V0IHRoZSB2YWx1ZXMgYWNjZXNzb3IgZnVuY3Rpb25cblx0ICovXG5cdF9pbnN0YW5jZS52YWx1ZXMgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi52YWx1ZXM7IH1cblx0XHRfZm4udmFsdWVzID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIENhbGN1bGF0ZSB0aGUgZXh0ZW50IGdpdmVuIHNvbWUgZGF0YS5cblx0ICogLSBEZWZhdWx0IHZhbHVlcyBhcmUgdXNlZCBpbiB0aGUgYWJzZW5jZSBvZiBkYXRhXG5cdCAqIC0gT3ZlcnJpZGUgdmFsdWVzIGFyZSB1c2VkIHRvIGNsYW1wIG9yIGV4dGVuZCB0aGUgZXh0ZW50XG5cdCAqL1xuXHRfaW5zdGFuY2UuZ2V0RXh0ZW50ID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciB0b1JldHVybjtcblxuXHRcdGRhdGEuZm9yRWFjaChmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgdEV4dGVudCA9IF9leHRlbnQuZ2V0RXh0ZW50KF9mbi52YWx1ZXMoZSkpO1xuXHRcdFx0aWYobnVsbCA9PSB0b1JldHVybikge1xuXHRcdFx0XHR0b1JldHVybiA9IHRFeHRlbnQ7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dG9SZXR1cm5bMF0gPSBNYXRoLm1pbih0b1JldHVyblswXSwgdEV4dGVudFswXSk7XG5cdFx0XHRcdHRvUmV0dXJuWzFdID0gTWF0aC5tYXgodG9SZXR1cm5bMV0sIHRFeHRlbnRbMV0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gSW4gY2FzZSB0aGVyZSB3YXMgbm8gZGF0YVxuXHRcdGlmKG51bGwgPT0gdG9SZXR1cm4pIHtcblx0XHRcdHRvUmV0dXJuID0gX2V4dGVudC5nZXRFeHRlbnQoW10pO1xuXHRcdH1cblxuXHRcdHJldHVybiB0b1JldHVybjtcblx0fTtcblxuXHQvLyBJbml0aWFsaXplIHRoZSBtb2RlbFxuXHRfaW5zdGFuY2UoY29uZmlnKTtcblxuXHRyZXR1cm4gX2luc3RhbmNlO1xufVxuXG5leHBvcnQgeyBtdWx0aUV4dGVudCB9O1xuIiwiaW1wb3J0IHsgZXh0ZW50IH0gZnJvbSAnLi4vdXRpbC9leHRlbnQnO1xuaW1wb3J0IHsgbXVsdGlFeHRlbnQgfSBmcm9tICcuLi91dGlsL211bHRpX2V4dGVudCc7XG5cbmZ1bmN0aW9uIG1hdHJpeCgpIHtcblxuXHQvLyBDaGFydCBkaW1lbnNpb25zXG5cdHZhciBfY2VsbFNpemUgPSAxNjtcblx0dmFyIF9jZWxsTWFyZ2luID0gMTtcblx0dmFyIF9tYXJnaW4gPSB7IHRvcDogMjAsIHJpZ2h0OiAyLCBib3R0b206IDIsIGxlZnQ6IDY0IH07XG5cblx0Ly8gVHJhbnNpdGlvbiBkdXJhdGlvblxuXHR2YXIgX2R1cmF0aW9uID0gNTAwO1xuXG5cdC8vIGQzIGRpc3BhdGNoZXIgZm9yIGhhbmRsaW5nIGV2ZW50c1xuXHR2YXIgX2Rpc3BhdGNoID0gZDMuZGlzcGF0Y2goJ2NlbGxNb3VzZW92ZXInLCAnY2VsbE1vdXNlb3V0JywgJ2NlbGxDbGljaycsICdyb3dNb3VzZW92ZXInLCAncm93TW91c2VvdXQnLCAncm93Q2xpY2snKTtcblxuXHQvLyBGdW5jdGlvbiBoYW5kbGVyc1xuXHR2YXIgX2ZuID0ge1xuXHRcdHVwZGF0ZUFjdGl2ZVNlcmllczogZnVuY3Rpb24oZCkge1xuXHRcdFx0dmFyIHNlcmllc0xhYmVscyA9IF9lbGVtZW50LmcuY2hhcnQuc2VsZWN0QWxsKCcucm93IHRleHQnKTtcblxuXHRcdFx0aWYobnVsbCAhPSBkKSB7XG5cdFx0XHRcdC8vIFNldCB0aGUgaGlnaGxpZ2h0IG9uIHRoZSByb3dcblx0XHRcdFx0dmFyIHNlcmllc0tleSA9IF9mbi5zZXJpZXNLZXkoZCk7XG5cdFx0XHRcdHNlcmllc0xhYmVscy5jbGFzc2VkKCdhY3RpdmUnLCBmdW5jdGlvbihzZXJpZXMsIGkpeyByZXR1cm4gX2ZuLnNlcmllc0tleShzZXJpZXMpID09IHNlcmllc0tleTsgfSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gTm93IHVwZGF0ZSB0aGUgc3R5bGVcblx0XHRcdFx0c2VyaWVzTGFiZWxzLmNsYXNzZWQoJ2FjdGl2ZScsIGZhbHNlKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJvd01vdXNlb3ZlcjogZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0X2ZuLnVwZGF0ZUFjdGl2ZVNlcmllcyhkKTtcblx0XHRcdF9kaXNwYXRjaC5yb3dNb3VzZW92ZXIoZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRyb3dNb3VzZW91dDogZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0X2ZuLnVwZGF0ZUFjdGl2ZVNlcmllcygpO1xuXHRcdFx0X2Rpc3BhdGNoLnJvd01vdXNlb3V0KGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0cm93Q2xpY2s6IGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdF9kaXNwYXRjaC5yb3dDbGljayhkLCB0aGlzKTtcblx0XHR9LFxuXHRcdGNlbGxNb3VzZW92ZXI6IGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdF9kaXNwYXRjaC5jZWxsTW91c2VvdmVyKGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0Y2VsbE1vdXNlb3V0OiBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRfZGlzcGF0Y2guY2VsbE1vdXNlb3V0KGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0Y2VsbENsaWNrOiBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRfZGlzcGF0Y2guY2VsbENsaWNrKGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0c2VyaWVzS2V5OiBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSxcblx0XHRzZXJpZXNMYWJlbDogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5sYWJlbDsgfSxcblx0XHRzZXJpZXNWYWx1ZXM6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9LFxuXHRcdGtleTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0sXG5cdFx0dmFsdWU6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH1cblx0fTtcblxuXHQvLyBFeHRlbnRzXG5cdHZhciBfZXh0ZW50ID0ge1xuXHRcdHg6IGV4dGVudCgpLmdldFZhbHVlKF9mbi5rZXkpLFxuXHRcdHZhbHVlOiBleHRlbnQoKS5nZXRWYWx1ZShfZm4udmFsdWUpLFxuXHRcdG11bHRpOiBtdWx0aUV4dGVudCgpXG5cdH07XG5cblx0Ly8gU2NhbGVzIGZvciB4LCB5LCBhbmQgY29sb3Jcblx0dmFyIF9zY2FsZSA9IHtcblx0XHR4OiBkMy5zY2FsZS5saW5lYXIoKSxcblx0XHR5OiBkMy5zY2FsZS5vcmRpbmFsKCksXG5cdFx0Y29sb3I6IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFsnI2U3ZTdlNycsICcjMDA4NTAwJ10pXG5cdH07XG5cblx0dmFyIF9heGlzID0ge1xuXHRcdHg6IGQzLnN2Zy5heGlzKCkuc2NhbGUoX3NjYWxlLngpLm9yaWVudCgndG9wJykub3V0ZXJUaWNrU2l6ZSgwKS5pbm5lclRpY2tTaXplKDIpXG5cdH07XG5cblx0dmFyIF9lbGVtZW50ID0ge1xuXHRcdGRpdjogdW5kZWZpbmVkLFxuXHRcdHN2ZzogdW5kZWZpbmVkLFxuXHRcdGc6IHtcblx0XHRcdGNoYXJ0OiB1bmRlZmluZWQsXG5cdFx0XHR4QXhpczogdW5kZWZpbmVkXG5cdFx0fVxuXHR9O1xuXG5cdHZhciBfZGF0YSA9IFtdO1xuXG5cdHZhciBfaW5zdGFuY2UgPSBmdW5jdGlvbiAoKSB7fTtcblxuXHRfaW5zdGFuY2UuaW5pdCA9IGZ1bmN0aW9uKGQzQ29udGFpbmVyKSB7XG5cdFx0Ly8gQWRkIHRoZSBzdmcgZWxlbWVudFxuXHRcdF9lbGVtZW50LmRpdiA9IGQzQ29udGFpbmVyLmFwcGVuZCgnZGl2JykuYXR0cignY2xhc3MnLCAnc2VudGlvIG1hdHJpeCcpO1xuXHRcdF9lbGVtZW50LnN2ZyA9IF9lbGVtZW50LmRpdi5hcHBlbmQoJ3N2ZycpO1xuXG5cdFx0Ly8gQWRkIHRoZSBheGlzXG5cdFx0X2VsZW1lbnQuZy54QXhpcyA9IF9lbGVtZW50LnN2Zy5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICd4IGF4aXMnKTtcblxuXHRcdC8vIEFkZCBhIGdyb3VwIGZvciB0aGUgY2hhcnQgaXRzZWxmXG5cdFx0X2VsZW1lbnQuZy5jaGFydCA9IF9lbGVtZW50LnN2Zy5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdjaGFydCcpO1xuXG5cdFx0X2luc3RhbmNlLnJlc2l6ZSgpO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuZGF0YSA9IGZ1bmN0aW9uKGQpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuIF9kYXRhO1xuXHRcdH1cblx0XHRfZGF0YSA9IGQgfHwgW107XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UucmVzaXplID0gZnVuY3Rpb24oKSB7IH07XG5cblx0X2luc3RhbmNlLnJlZHJhdyA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIERldGVybWluZSB0aGUgbnVtYmVyIG9mIHJvd3MgdG8gcmVuZGVyXG5cdFx0dmFyIHJvd0NvdW50ID0gX2RhdGEubGVuZ3RoO1xuXG5cdFx0Ly8gRGV0ZXJtaW5lIHRoZSBudW1iZXIgb2YgYm94ZXMgdG8gcmVuZGVyIChhc3N1bWUgY29tcGxldGUgZGF0YSlcblx0XHR2YXIgYm94ZXMgPSBbXTtcblx0XHRpZihyb3dDb3VudCA+IDApIHtcblx0XHRcdGJveGVzID0gX2ZuLnNlcmllc1ZhbHVlcyhfZGF0YVswXSk7XG5cdFx0fVxuXHRcdHZhciBib3hDb3VudCA9IGJveGVzLmxlbmd0aDtcblxuXHRcdC8vIERpbWVuc2lvbnMgb2YgdGhlIHZpc3VhbGl6YXRpb25cblx0XHR2YXIgY2VsbFNwYW4gPSBfY2VsbE1hcmdpbiArIF9jZWxsU2l6ZTtcblxuXHRcdC8vIGNhbGN1bGF0ZSB0aGUgd2lkdGgvaGVpZ2h0IG9mIHRoZSBzdmdcblx0XHR2YXIgd2lkdGggPSBib3hDb3VudCpjZWxsU3BhbiArIF9jZWxsTWFyZ2luLFxuXHRcdFx0aGVpZ2h0ID0gcm93Q291bnQqY2VsbFNwYW4gKyBfY2VsbE1hcmdpbjtcblxuXHRcdC8vIHNjYWxlIHRoZSBzdmcgdG8gdGhlIHJpZ2h0IHNpemVcblx0XHRfZWxlbWVudC5zdmdcblx0XHRcdC5hdHRyKCd3aWR0aCcsIHdpZHRoICsgX21hcmdpbi5sZWZ0ICsgX21hcmdpbi5yaWdodClcblx0XHRcdC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQgKyBfbWFyZ2luLnRvcCArIF9tYXJnaW4uYm90dG9tKTtcblxuXHRcdC8vIENvbmZpZ3VyZSB0aGUgc2NhbGVzXG5cdFx0X3NjYWxlLnguZG9tYWluKF9leHRlbnQueC5nZXRFeHRlbnQoYm94ZXMpKS5yYW5nZShbMCwgd2lkdGggLSBfY2VsbE1hcmdpbiAtIGNlbGxTcGFuXSk7XG5cdFx0X3NjYWxlLmNvbG9yLmRvbWFpbihfZXh0ZW50Lm11bHRpLnZhbHVlcyhfZm4uc2VyaWVzVmFsdWVzKS5leHRlbnQoX2V4dGVudC52YWx1ZSkuZ2V0RXh0ZW50KF9kYXRhKSk7XG5cblx0XHQvLyBEcmF3IHRoZSB4IGF4aXNcblx0XHRfZWxlbWVudC5nLnhBeGlzLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIChfbWFyZ2luLmxlZnQgKyBfY2VsbE1hcmdpbiArIF9jZWxsU2l6ZS8yKSArIFwiLFwiICsgX21hcmdpbi50b3AgKyBcIilcIik7XG5cdFx0X2VsZW1lbnQuZy54QXhpcy5jYWxsKF9heGlzLngpO1xuXG5cdFx0LyoqXG5cdFx0ICogQ2hhcnQgTWFuaXB1bGF0aW9uXG5cdFx0ICovXG5cblx0XHQvKlxuXHRcdCAqIFJvdyBKb2luXG5cdFx0ICovXG5cdFx0dmFyIHJvdyA9IF9lbGVtZW50LmcuY2hhcnQuc2VsZWN0QWxsKCdnLnJvdycpLmRhdGEoX2RhdGEsIF9mbi5zZXJpZXNLZXkpO1xuXG5cdFx0Lypcblx0XHQgKiBSb3cgVXBkYXRlIE9ubHlcblx0XHQgKi9cblxuXHRcdC8qXG5cdFx0ICogUm93IEVudGVyIE9ubHlcblx0XHQgKiBCdWlsZCB0aGUgcm93IHN0cnVjdHVyZVxuXHRcdCAqL1xuXHRcdHZhciByb3dFbnRlciA9IHJvdy5lbnRlcigpLmFwcGVuZCgnZycpO1xuXHRcdHJvd0VudGVyXG5cdFx0XHQuc3R5bGUoJ29wYWNpdHknLCAwLjEpXG5cdFx0XHQuYXR0cignY2xhc3MnLCAncm93Jylcblx0XHRcdC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiAndHJhbnNsYXRlKCcgKyBfbWFyZ2luLmxlZnQgKyAnLCcgKyAoX21hcmdpbi50b3AgKyAoY2VsbFNwYW4qaSkpICsgJyknOyB9KVxuXHRcdFx0Lm9uKCdtb3VzZW92ZXInLCBfZm4ucm93TW91c2VvdmVyKVxuXHRcdFx0Lm9uKCdtb3VzZW91dCcsIF9mbi5yb3dNb3VzZW91dClcblx0XHRcdC5vbignY2xpY2snLCBfZm4ucm93Q2xpY2spO1xuXG5cdFx0Ly8gQWxzbyBtdXN0IGFwcGVuZCB0aGUgbGFiZWwgb2YgdGhlIHJvd1xuXHRcdHJvd0VudGVyLmFwcGVuZCgndGV4dCcpXG5cdFx0XHQuYXR0cignY2xhc3MnLCAnc2VyaWVzIGxhYmVsJylcblx0XHRcdC5zdHlsZSgndGV4dC1hbmNob3InLCAnZW5kJylcblx0XHRcdC5hdHRyKCd4JywgLTYpXG5cdFx0XHQuYXR0cigneScsIF9jZWxsTWFyZ2luICsgKF9jZWxsU2l6ZS8yKSlcblx0XHRcdC5hdHRyKCdkeScsICcuMzJlbScpO1xuXG5cdFx0Ly8gQWxzbyBtdXN0IGFwcGVuZCBhIGxpbmVcblx0XHRyb3dFbnRlci5hcHBlbmQoJ2xpbmUnKVxuXHRcdFx0LmF0dHIoJ2NsYXNzJywgJ3NlcmllcyB0aWNrJylcblx0XHRcdC5hdHRyKCd4MScsIC0zKVxuXHRcdFx0LmF0dHIoJ3gyJywgMClcblx0XHRcdC5hdHRyKCd5MScsIF9jZWxsTWFyZ2luICsgKF9jZWxsU2l6ZS8yKSlcblx0XHRcdC5hdHRyKCd5MicsIF9jZWxsTWFyZ2luICsgKF9jZWxsU2l6ZS8yKSk7XG5cblx0XHQvKlxuXHRcdCAqIFJvdyBFbnRlciArIFVwZGF0ZVxuXHRcdCAqL1xuXHRcdC8vIFRyYW5zaXRpb24gcm93cyB0byB0aGVpciBuZXcgcG9zaXRpb25zXG5cdFx0cm93LnRyYW5zaXRpb24oKS5kdXJhdGlvbihfZHVyYXRpb24pXG5cdFx0XHQuc3R5bGUoJ29wYWNpdHknLCAxKVxuXHRcdFx0LmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQsIGkpe1xuXHRcdFx0XHRyZXR1cm4gJ3RyYW5zbGF0ZSgnICsgX21hcmdpbi5sZWZ0ICsgJywnICsgKF9tYXJnaW4udG9wICsgKGNlbGxTcGFuKmkpKSArICcpJztcblx0XHRcdH0pO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBzZXJpZXMgbGFiZWxzIGluIGNhc2UgdGhleSBjaGFuZ2VkXG5cdFx0cm93LnNlbGVjdCgndGV4dC5zZXJpZXMubGFiZWwnKVxuXHRcdFx0LnRleHQoX2ZuLnNlcmllc0xhYmVsKTtcblxuXHRcdC8qXG5cdFx0ICogUm93IEV4aXRcblx0XHQgKi9cblx0XHRyb3cuZXhpdCgpXG5cdFx0XHQudHJhbnNpdGlvbigpLmR1cmF0aW9uKF9kdXJhdGlvbilcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDAuMSlcblx0XHRcdC5yZW1vdmUoKTtcblxuXG5cdFx0Lypcblx0XHQgKiBDZWxsIEpvaW4gLSBXaWxsIGJlIGRvbmUgb24gcm93IGVudGVyICsgZXhpdFxuXHRcdCAqL1xuXHRcdHZhciByb3dDZWxsID0gcm93LnNlbGVjdEFsbCgncmVjdC5jZWxsJykuZGF0YShfZm4uc2VyaWVzVmFsdWVzLCBfZm4ua2V5KTtcblxuXHRcdC8qXG5cdFx0ICogQ2VsbCBVcGRhdGUgT25seVxuXHRcdCAqL1xuXG5cdFx0Lypcblx0XHQgKiBDZWxsIEVudGVyIE9ubHlcblx0XHQgKi9cblx0XHRyb3dDZWxsLmVudGVyKCkuYXBwZW5kKCdyZWN0Jylcblx0XHRcdC5hdHRyKCdjbGFzcycsICdjZWxsJylcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDAuMSlcblx0XHRcdC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIF9zY2FsZS5jb2xvcihfZm4udmFsdWUoZCwgaSkpOyB9KVxuXHRcdFx0LmF0dHIoJ3gnLCBmdW5jdGlvbihkLCBpKXsgcmV0dXJuIF9zY2FsZS54KF9mbi5rZXkoZCwgaSkpICsgX2NlbGxNYXJnaW47IH0pXG5cdFx0XHQuYXR0cigneScsIF9jZWxsTWFyZ2luKVxuXHRcdFx0LmF0dHIoJ2hlaWdodCcsIF9jZWxsU2l6ZSlcblx0XHRcdC5hdHRyKCd3aWR0aCcsIF9jZWxsU2l6ZSlcblx0XHRcdC5vbignbW91c2VvdmVyJywgX2ZuLmNlbGxNb3VzZW92ZXIpXG5cdFx0XHQub24oJ21vdXNlb3V0JywgX2ZuLmNlbGxNb3VzZW91dClcblx0XHRcdC5vbignY2xpY2snLCBfZm4uY2VsbENsaWNrKTtcblxuXHRcdC8qXG5cdFx0ICogQ2VsbCBFbnRlciArIFVwZGF0ZVxuXHRcdCAqIFVwZGF0ZSBmaWxsLCBtb3ZlIHRvIHByb3BlciB4IGNvb3JkaW5hdGVcblx0XHQgKi9cblx0XHRyb3dDZWxsLnRyYW5zaXRpb24oKS5kdXJhdGlvbihfZHVyYXRpb24pXG5cdFx0XHQuc3R5bGUoJ29wYWNpdHknLCAxKVxuXHRcdFx0LmF0dHIoJ3gnLCBmdW5jdGlvbihkLCBpKXsgcmV0dXJuIF9zY2FsZS54KF9mbi5rZXkoZCwgaSkpICsgX2NlbGxNYXJnaW47IH0pXG5cdFx0XHQuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBfc2NhbGUuY29sb3IoX2ZuLnZhbHVlKGQsIGkpKTsgfSk7XG5cblx0XHQvKlxuXHRcdCAqIENlbGwgUmVtb3ZlXG5cdFx0ICovXG5cdFx0cm93Q2VsbC5leGl0KCkudHJhbnNpdGlvbigpLmR1cmF0aW9uKF9kdXJhdGlvbilcblx0XHRcdC5hdHRyKCd3aWR0aCcsIDApXG5cdFx0XHQuc3R5bGUoJ29wYWNpdHknLCAwLjEpXG5cdFx0XHQucmVtb3ZlKCk7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cblx0X2luc3RhbmNlLmNlbGxTaXplID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfY2VsbFNpemU7IH1cblx0XHRfY2VsbFNpemUgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5jZWxsTWFyZ2luID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfY2VsbE1hcmdpbjsgfVxuXHRcdF9jZWxsTWFyZ2luID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UubWFyZ2luID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfbWFyZ2luOyB9XG5cdFx0X21hcmdpbiA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuZHVyYXRpb24gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kdXJhdGlvbjsgfVxuXHRcdF9kdXJhdGlvbiA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2Uuc2VyaWVzS2V5ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4uc2VyaWVzS2V5OyB9XG5cdFx0X2ZuLnNlcmllc0tleSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnNlcmllc0xhYmVsID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4uc2VyaWVzTGFiZWw7IH1cblx0XHRfZm4uc2VyaWVzTGFiZWwgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5zZXJpZXNWYWx1ZXMgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5zZXJpZXNWYWx1ZXM7IH1cblx0XHRfZm4uc2VyaWVzVmFsdWVzID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2Uua2V5ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4ua2V5OyB9XG5cdFx0X2V4dGVudC54LmdldFZhbHVlKHYpO1xuXHRcdF9mbi5rZXkgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS52YWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLnZhbHVlOyB9XG5cdFx0X2ZuLnZhbHVlID0gdjtcblx0XHRfZXh0ZW50LnZhbHVlLmdldFZhbHVlKHYpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmNvbG9yU2NhbGUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9zY2FsZS5jb2xvcjsgfVxuXHRcdF9zY2FsZS5jb2xvciA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnhTY2FsZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3NjYWxlLnhTY2FsZTsgfVxuXHRcdF9zY2FsZS54U2NhbGUgPSB2O1xuXHRcdF9heGlzLnguc2NhbGUodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnlTY2FsZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3NjYWxlLnlTY2FsZTsgfVxuXHRcdF9zY2FsZS55U2NhbGUgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLnhFeHRlbnQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9leHRlbnQueDsgfVxuXHRcdF9leHRlbnQueCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnlFeHRlbnQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9leHRlbnQueTsgfVxuXHRcdF9leHRlbnQueSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnZhbHVlRXh0ZW50ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZXh0ZW50LnZhbHVlOyB9XG5cdFx0X2V4dGVudC52YWx1ZSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuZGlzcGF0Y2ggPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kaXNwYXRjaDsgfVxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0cmV0dXJuIF9pbnN0YW5jZTtcbn1cblxuZXhwb3J0IHsgbWF0cml4IH07XG4iLCJpbXBvcnQgeyBleHRlbnQgfSBmcm9tICcuLi91dGlsL2V4dGVudCc7XG5cbmZ1bmN0aW9uIHZlcnRpY2FsQmFycygpIHtcblxuXHQvLyBMYXlvdXQgcHJvcGVydGllc1xuXHR2YXIgX21hcmdpbiA9IHsgdG9wOiAwLCByaWdodDogMCwgYm90dG9tOiAwLCBsZWZ0OiAwIH07XG5cdHZhciBfd2lkdGggPSAxMDA7XG5cdHZhciBfYmFySGVpZ2h0ID0gMjQ7XG5cdHZhciBfYmFyUGFkZGluZyA9IDI7XG5cdHZhciBfZHVyYXRpb24gPSA1MDA7XG5cblx0Ly8gZDMgZGlzcGF0Y2hlciBmb3IgaGFuZGxpbmcgZXZlbnRzXG5cdHZhciBfZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaCgnbW91c2VvdmVyJywgJ21vdXNlb3V0JywgJ2NsaWNrJyk7XG5cdHZhciBfZm4gPSB7XG5cdFx0bW91c2VvdmVyOiBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRfZGlzcGF0Y2gubW91c2VvdmVyKGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0bW91c2VvdXQ6IGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdF9kaXNwYXRjaC5tb3VzZW91dChkLCB0aGlzKTtcblx0XHR9LFxuXHRcdGNsaWNrOiBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRfZGlzcGF0Y2guY2xpY2soZCwgdGhpcyk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIERlZmF1bHQgYWNjZXNzb3JzIGZvciB0aGUgZGltZW5zaW9ucyBvZiB0aGUgZGF0YVxuXHR2YXIgX3ZhbHVlID0ge1xuXHRcdGtleTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0sXG5cdFx0dmFsdWU6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0sXG5cdFx0bGFiZWw6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5ICsgJyAoJyArIGQudmFsdWUgKyAnKSc7IH1cblx0fTtcblxuXHQvLyBEZWZhdWx0IHNjYWxlcyBmb3IgeCBhbmQgeSBkaW1lbnNpb25zXG5cdHZhciBfc2NhbGUgPSB7XG5cdFx0eDogZDMuc2NhbGUubGluZWFyKCksXG5cdFx0eTogZDMuc2NhbGUubGluZWFyKClcblx0fTtcblxuXHQvLyBFeHRlbnRzXG5cdHZhciBfZXh0ZW50ID0ge1xuXHRcdHdpZHRoOiBleHRlbnQoe1xuXHRcdFx0ZGVmYXVsdFZhbHVlOiBbMCwgMTBdLFxuXHRcdFx0Z2V0VmFsdWU6IF92YWx1ZS52YWx1ZVxuXHRcdH0pXG5cdH07XG5cblx0Ly8gZWxlbWVudHNcblx0dmFyIF9lbGVtZW50ID0ge1xuXHRcdGRpdjogdW5kZWZpbmVkXG5cdH07XG5cblx0dmFyIF9kYXRhID0gW107XG5cblx0Ly8gQ2hhcnQgY3JlYXRlL2luaXQgbWV0aG9kXG5cdGZ1bmN0aW9uIF9pbnN0YW5jZShzZWxlY3Rpb24pe31cblxuXHQvKlxuXHQgKiBJbml0aWFsaXplIHRoZSBjaGFydCAoc2hvdWxkIG9ubHkgY2FsbCB0aGlzIG9uY2UpLiBQZXJmb3JtcyBhbGwgaW5pdGlhbCBjaGFydFxuXHQgKiBjcmVhdGlvbiBhbmQgc2V0dXBcblx0ICovXG5cdF9pbnN0YW5jZS5pbml0ID0gZnVuY3Rpb24oY29udGFpbmVyKXtcblx0XHQvLyBDcmVhdGUgdGhlIERJViBlbGVtZW50XG5cdFx0X2VsZW1lbnQuZGl2ID0gY29udGFpbmVyLmFwcGVuZCgnZGl2JykuYXR0cignY2xhc3MnLCAnc2VudGlvIGJhcnMtdmVydGljYWwnKTtcblx0XHRfaW5zdGFuY2UucmVzaXplKCk7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIFNldCB0aGUgX2luc3RhbmNlIGRhdGFcblx0ICovXG5cdF9pbnN0YW5jZS5kYXRhID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZGF0YTsgfVxuXHRcdF9kYXRhID0gdiB8fCBbXTtcblxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogVXBkYXRlcyBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgZGVwZW5kIG9uIHRoZSBzaXplIG9mIHRoZSB2YXJpb3VzIGNvbXBvbmVudHNcblx0ICovXG5cdF9pbnN0YW5jZS5yZXNpemUgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBTZXQgdXAgdGhlIHggc2NhbGUgKHkgaXMgZml4ZWQpXG5cdFx0X3NjYWxlLngucmFuZ2UoWzAsIF93aWR0aCAtIF9tYXJnaW4ucmlnaHQgLSBfbWFyZ2luLmxlZnRdKTtcblxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogUmVkcmF3IHRoZSBncmFwaGljXG5cdCAqL1xuXHRfaW5zdGFuY2UucmVkcmF3ID0gZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBVcGRhdGUgdGhlIHggZG9tYWluXG5cdFx0X3NjYWxlLnguZG9tYWluKF9leHRlbnQud2lkdGguZ2V0RXh0ZW50KF9kYXRhKSk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIHkgZG9tYWluIChiYXNlZCBvbiBjb25maWd1cmF0aW9uIGFuZCBkYXRhKVxuXHRcdF9zY2FsZS55LmRvbWFpbihbMCwgX2RhdGEubGVuZ3RoXSk7XG5cdFx0X3NjYWxlLnkucmFuZ2UoWzAsIChfYmFySGVpZ2h0ICsgX2JhclBhZGRpbmcpICogX2RhdGEubGVuZ3RoXSk7XG5cblx0XHQvLyBEYXRhIEpvaW5cblx0XHR2YXIgZGl2ID0gX2VsZW1lbnQuZGl2LnNlbGVjdEFsbCgnZGl2LmJhcicpXG5cdFx0XHQuZGF0YShfZGF0YSwgX3ZhbHVlLmtleSk7XG5cblx0XHQvLyBVcGRhdGUgT25seVxuXG5cdFx0Ly8gRW50ZXJcblx0XHR2YXIgYmFyID0gZGl2LmVudGVyKCkuYXBwZW5kKCdkaXYnKVxuXHRcdFx0LmF0dHIoJ2NsYXNzJywgJ2JhcicpXG5cdFx0XHQuc3R5bGUoJ3RvcCcsIChfc2NhbGUueS5yYW5nZSgpWzFdICsgX21hcmdpbi50b3AgKyBfbWFyZ2luLmJvdHRvbSAtIF9iYXJIZWlnaHQpICsgJ3B4Jylcblx0XHRcdC5zdHlsZSgnaGVpZ2h0JywgX2JhckhlaWdodCArICdweCcpXG5cdFx0XHQub24oJ21vdXNlb3ZlcicsIF9mbi5tb3VzZW92ZXIpXG5cdFx0XHQub24oJ21vdXNlb3V0JywgX2ZuLm1vdXNlb3V0KVxuXHRcdFx0Lm9uKCdjbGljaycsIF9mbi5jbGljaylcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDAuMDEpO1xuXG5cdFx0YmFyLmFwcGVuZCgnZGl2Jylcblx0XHRcdC5hdHRyKCdjbGFzcycsICdiYXItbGFiZWwnKTtcblxuXHRcdC8vIEVudGVyICsgVXBkYXRlXG5cdFx0ZGl2LnRyYW5zaXRpb24oKS5kdXJhdGlvbihfZHVyYXRpb24pXG5cdFx0XHQuc3R5bGUoJ29wYWNpdHknLCAxKVxuXHRcdFx0LnN0eWxlKCd3aWR0aCcsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIF9zY2FsZS54KF92YWx1ZS52YWx1ZShkLCBpKSkgKyAncHgnOyB9KVxuXHRcdFx0LnN0eWxlKCd0b3AnLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiAoX3NjYWxlLnkoaSkgKyBfbWFyZ2luLnRvcCkgKyAncHgnOyB9KVxuXHRcdFx0LnN0eWxlKCdsZWZ0JywgX21hcmdpbi5sZWZ0ICsgJ3B4Jyk7XG5cblx0XHRkaXYuc2VsZWN0KCdkaXYuYmFyLWxhYmVsJylcblx0XHRcdC5odG1sKF92YWx1ZS5sYWJlbClcblx0XHRcdC5zdHlsZSgnbWF4LXdpZHRoJywgKF9zY2FsZS54LnJhbmdlKClbMV0gLSAxMCkgKyAncHgnKTtcblxuXHRcdC8vIEV4aXRcblx0XHRkaXYuZXhpdCgpXG5cdFx0XHQudHJhbnNpdGlvbigpLmR1cmF0aW9uKF9kdXJhdGlvbilcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDAuMDEpXG5cdFx0XHQuc3R5bGUoJ3RvcCcsIChfc2NhbGUueS5yYW5nZSgpWzFdICsgX21hcmdpbi50b3AgKyBfbWFyZ2luLmJvdHRvbSAtIF9iYXJIZWlnaHQpICsgJ3B4JyApXG5cdFx0XHQucmVtb3ZlKCk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIHNpemUgb2YgdGhlIHBhcmVudCBkaXZcblx0XHRfZWxlbWVudC5kaXZcblx0XHRcdC5zdHlsZSgnaGVpZ2h0JywgKF9tYXJnaW4uYm90dG9tICsgX21hcmdpbi50b3AgKyBfc2NhbGUueS5yYW5nZSgpWzFdKSArICdweCcpO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXG5cdC8vIEJhc2ljIEdldHRlcnMvU2V0dGVyc1xuXHRfaW5zdGFuY2Uud2lkdGggPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF93aWR0aDsgfVxuXHRcdF93aWR0aCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmJhckhlaWdodCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2JhckhlaWdodDsgfVxuXHRcdF9iYXJIZWlnaHQgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5iYXJQYWRkaW5nID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfYmFyUGFkZGluZzsgfVxuXHRcdF9iYXJQYWRkaW5nID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UubWFyZ2luID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfbWFyZ2luOyB9XG5cdFx0X21hcmdpbiA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmtleSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3ZhbHVlLmtleTsgfVxuXHRcdF92YWx1ZS5rZXkgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS52YWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3ZhbHVlLnZhbHVlOyB9XG5cdFx0X3ZhbHVlLnZhbHVlID0gdjtcblx0XHRfZXh0ZW50LndpZHRoLmdldFZhbHVlKHYpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5sYWJlbCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3ZhbHVlLmxhYmVsOyB9XG5cdFx0X3ZhbHVlLmxhYmVsID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2Uud2lkdGhFeHRlbnQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9leHRlbnQud2lkdGg7IH1cblx0XHRfZXh0ZW50LndpZHRoID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UuZGlzcGF0Y2ggPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kaXNwYXRjaDsgfVxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5kdXJhdGlvbiA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2R1cmF0aW9uOyB9XG5cdFx0X2R1cmF0aW9uID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdHJldHVybiBfaW5zdGFuY2U7XG59XG5cbmV4cG9ydCB7IHZlcnRpY2FsQmFycyB9O1xuIiwiaW1wb3J0IHsgZG9udXQgfSBmcm9tICcuL2RvbnV0JztcbmltcG9ydCB7IG1hdHJpeCB9IGZyb20gJy4vbWF0cml4JztcbmltcG9ydCB7IHZlcnRpY2FsQmFycyB9IGZyb20gJy4vdmVydGljYWxfYmFycyc7XG5cbnZhciBjaGFydCA9IHtcblx0ZG9udXQ6IGRvbnV0LFxuXHRtYXRyaXg6IG1hdHJpeCxcblx0dmVydGljYWxCYXJzOiB2ZXJ0aWNhbEJhcnNcbn07XG5cbmV4cG9ydCB7IGNoYXJ0IH07XG4iLCJmdW5jdGlvbiBiaW5zKGNvbmZpZykge1xuXG5cdC8qKlxuXHQgKiBQcml2YXRlIHZhcmlhYmxlc1xuXHQgKi9cblx0Ly8gQ29uZmlndXJhdGlvblxuXHR2YXIgX2NvbmZpZyA9IHtcblx0XHQvLyBUaGUgbnVtYmVyIG9mIGJpbnMgaW4gb3VyIG1vZGVsXG5cdFx0Y291bnQ6IDEsXG5cblx0XHQvLyBUaGUgc2l6ZSBvZiBhIGJpbiBpbiBrZXkgdmFsdWUgdW5pdHNcblx0XHRzaXplOiB1bmRlZmluZWQsXG5cblx0XHQvLyBUaGUgbWluIGFuZCBtYXggYmluc1xuXHRcdGx3bTogdW5kZWZpbmVkLFxuXHRcdGh3bTogdW5kZWZpbmVkXG5cdH07XG5cblx0dmFyIF9mbiA9IHtcblx0XHQvLyBUaGUgZGVmYXVsdCBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgdGhlIHNlZWQgdmFsdWUgZm9yIGEgYmluXG5cdFx0Y3JlYXRlU2VlZDogZnVuY3Rpb24oKSB7IHJldHVybiBbXTsgfSxcblxuXHRcdC8vIFRoZSBkZWZhdWx0IGtleSBmdW5jdGlvblxuXHRcdGdldEtleTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcblxuXHRcdC8vIFRoZSBkZWZhdWx0IHZhbHVlIGZ1bmN0aW9uXG5cdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG5cblx0XHQvLyBUaGUgZGVmYXVsdCBmdW5jdGlvbiBmb3IgdXBkYXRpbmcgYSBiaW4gZ2l2ZW4gYSBuZXcgdmFsdWVcblx0XHR1cGRhdGVCaW46IGZ1bmN0aW9uKGJpbiwgZCkgeyBiaW5bMV0ucHVzaChkKTsgfSxcblxuXHRcdC8vIFRoZSBkZWZhdWx0IGZ1bmN0aW9uIGZvciBjb3VudGluZyB0aGUgY29udGVudHMgb2YgdGhlIGJpbnMgKGluY2x1ZGVzIGNvZGUgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkpXG5cdFx0Y291bnRCaW46IGZ1bmN0aW9uKGJpbikge1xuXHRcdFx0Ly8gSWYgdGhlIGJpbiBjb250YWlucyBhIG51bWJlciwganVzdCByZXR1cm4gaXRcblx0XHRcdGlmICh0eXBlb2YgYmluWzFdID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRyZXR1cm4gYmluWzFdO1xuXHRcdFx0fVxuXHRcdFx0Ly8gSWYgdGhlIGJpbiBjb250YWlucyBhbiBhcnJheSBvZiBkYXRhLCByZXR1cm4gdGhlIG51bWJlciBvZiBpdGVtc1xuXHRcdFx0aWYgKGJpblsxXS5oYXNPd25Qcm9wZXJ0eSgnbGVuZ3RoJykpIHtcblx0XHRcdFx0cmV0dXJuIGJpblsxXS5sZW5ndGg7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9LFxuXG5cdFx0Ly8gVGhlIGRlZmF1bHQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIGl0ZW1zIGFyZSBhZGRlZCB0byB0aGUgYmluc1xuXHRcdGFmdGVyQWRkOiBmdW5jdGlvbihiaW5zLCBjdXJyZW50Q291bnQsIHByZXZpb3VzQ291bnQpIHt9LFxuXG5cdFx0Ly8gVGhlIGRlZmF1bHQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIHRoZSBiaW5zIGFyZSB1cGRhdGVkXG5cdFx0YWZ0ZXJVcGRhdGU6IGZ1bmN0aW9uKGJpbnMsIGN1cnJlbnRDb3VudCwgcHJldmlvdXNDb3VudCkge31cblx0fTtcblxuXHQvLyBUaGUgZGF0YSAoYW4gYXJyYXkgb2Ygb2JqZWN0IGNvbnRhaW5lcnMpXG5cdHZhciBfZGF0YSA9IFtdO1xuXG5cdC8vIEEgY2FjaGVkIHRvdGFsIGNvdW50IG9mIGFsbCB0aGUgb2JqZWN0cyBpbiB0aGUgYmluc1xuXHR2YXIgX2RhdGFDb3VudCA9IDA7XG5cblxuXHQvKipcblx0ICogUHJpdmF0ZSBGdW5jdGlvbnNcblx0ICovXG5cblx0Ly8gR2V0IHRoZSBpbmRleCBnaXZlbiB0aGUgdmFsdWVcblx0ZnVuY3Rpb24gZ2V0SW5kZXgodikge1xuXHRcdGlmKG51bGwgPT0gX2NvbmZpZy5zaXplIHx8IG51bGwgPT0gX2NvbmZpZy5sd20pIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdHJldHVybiBNYXRoLmZsb29yKCh2IC0gX2NvbmZpZy5sd20pL19jb25maWcuc2l6ZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjYWxjdWxhdGVId20oKSB7XG5cdFx0X2NvbmZpZy5od20gPSBfY29uZmlnLmx3bSArIChfY29uZmlnLmNvdW50ICogX2NvbmZpZy5zaXplKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZVN0YXRlKCkge1xuXHRcdHZhciBiaW47XG5cdFx0dmFyIHByZXZDb3VudCA9IF9kYXRhQ291bnQ7XG5cblx0XHQvLyBkcm9wIHN0dWZmIGJlbG93IHRoZSBsd21cblx0XHR3aGlsZShfZGF0YS5sZW5ndGggPiAwICYmIF9kYXRhWzBdWzBdIDwgX2NvbmZpZy5sd20pIHtcblx0XHRcdGJpbiA9IF9kYXRhLnNoaWZ0KCk7XG5cdFx0XHRfZGF0YUNvdW50IC09IF9mbi5jb3VudEJpbihiaW4pO1xuXHRcdH1cblxuXHRcdC8vIGRyb3Agc3R1ZmYgYWJvdmUgdGhlIGh3bVxuXHRcdHdoaWxlKF9kYXRhLmxlbmd0aCA+IDAgJiYgX2RhdGFbX2RhdGEubGVuZ3RoIC0gMV1bMF0gPj0gX2NvbmZpZy5od20pIHtcblx0XHRcdGJpbiA9IF9kYXRhLnBvcCgpO1xuXHRcdFx0X2RhdGFDb3VudCAtPSBfZm4uY291bnRCaW4oYmluKTtcblx0XHR9XG5cblx0XHQvLyBpZiB3ZSBlbXB0aWVkIHRoZSBhcnJheSwgYWRkIGFuIGVsZW1lbnQgZm9yIHRoZSBsd21cblx0XHRpZihfZGF0YS5sZW5ndGggPT09IDApIHtcblx0XHRcdF9kYXRhLnB1c2goW19jb25maWcubHdtLCBfZm4uY3JlYXRlU2VlZCgpXSk7XG5cdFx0fVxuXG5cdFx0Ly8gZmlsbCBpbiBhbnkgbWlzc2luZyB2YWx1ZXMgZnJvbSB0aGUgbG93ZXN0IGJpbiB0byB0aGUgbHdtXG5cdFx0Zm9yKHZhciBpPV9kYXRhWzBdWzBdIC0gX2NvbmZpZy5zaXplOyBpID49IF9jb25maWcubHdtOyBpIC09IF9jb25maWcuc2l6ZSkge1xuXHRcdFx0X2RhdGEudW5zaGlmdChbaSwgX2ZuLmNyZWF0ZVNlZWQoKV0pO1xuXHRcdH1cblxuXHRcdC8vIHBhZCBhYm92ZSB0aGUgaHdtXG5cdFx0d2hpbGUoX2RhdGFbX2RhdGEubGVuZ3RoIC0gMV1bMF0gPCBfY29uZmlnLmh3bSAtIF9jb25maWcuc2l6ZSkge1xuXHRcdFx0X2RhdGEucHVzaChbX2RhdGFbX2RhdGEubGVuZ3RoLTFdWzBdICsgX2NvbmZpZy5zaXplLCBfZm4uY3JlYXRlU2VlZCgpXSk7XG5cdFx0fVxuXHRcdGlmIChfZm4uYWZ0ZXJVcGRhdGUpIHtcblx0XHRcdF9mbi5hZnRlclVwZGF0ZS5jYWxsKG1vZGVsLCBfZGF0YSwgX2RhdGFDb3VudCwgcHJldkNvdW50KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBhZGREYXRhKGRhdGFUb0FkZCkge1xuXHRcdHZhciBwcmV2Q291bnQgPSBfZGF0YUNvdW50O1xuXG5cdFx0ZGF0YVRvQWRkLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdFx0dmFyIGkgPSBnZXRJbmRleChfZm4uZ2V0S2V5KGVsZW1lbnQpKTtcblx0XHRcdGlmKGkgPj0gMCAmJiBpIDwgX2RhdGEubGVuZ3RoKSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IF9mbi5nZXRWYWx1ZShlbGVtZW50KTtcblx0XHRcdFx0dmFyIHByZXZCaW5Db3VudCA9IF9mbi5jb3VudEJpbihfZGF0YVtpXSk7XG5cdFx0XHRcdF9mbi51cGRhdGVCaW4uY2FsbChtb2RlbCwgX2RhdGFbaV0sIHZhbHVlKTtcblx0XHRcdFx0X2RhdGFDb3VudCArPSBfZm4uY291bnRCaW4oX2RhdGFbaV0pIC0gcHJldkJpbkNvdW50O1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGlmIChfZm4uYWZ0ZXJBZGQpIHtcblx0XHRcdF9mbi5hZnRlckFkZC5jYWxsKG1vZGVsLCBfZGF0YSwgX2RhdGFDb3VudCwgcHJldkNvdW50KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBjbGVhckRhdGEoKSB7XG5cdFx0X2RhdGEubGVuZ3RoID0gMDtcblx0XHRfZGF0YUNvdW50ID0gMDtcblx0fVxuXG5cblx0Lypcblx0ICogQ29uc3RydWN0b3IvaW5pdGlhbGl6YXRpb24gbWV0aG9kXG5cdCAqL1xuXHRmdW5jdGlvbiBtb2RlbChiaW5Db25maWcpIHtcblx0XHRpZihudWxsID09IGJpbkNvbmZpZyB8fCBudWxsID09IGJpbkNvbmZpZy5zaXplIHx8IG51bGwgPT0gYmluQ29uZmlnLmNvdW50IHx8IG51bGwgPT0gYmluQ29uZmlnLmx3bSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdZb3UgbXVzdCBwcm92aWRlIGFuIGluaXRpYWwgc2l6ZSwgY291bnQsIGFuZCBsd20nKTtcblx0XHR9XG5cdFx0X2NvbmZpZy5zaXplID0gTnVtYmVyKGJpbkNvbmZpZy5zaXplKTtcblx0XHRfY29uZmlnLmNvdW50ID0gTnVtYmVyKGJpbkNvbmZpZy5jb3VudCk7XG5cdFx0X2NvbmZpZy5sd20gPSBOdW1iZXIoYmluQ29uZmlnLmx3bSk7XG5cblx0XHRpZihudWxsICE9IGJpbkNvbmZpZy5jcmVhdGVTZWVkKSB7IF9mbi5jcmVhdGVTZWVkID0gYmluQ29uZmlnLmNyZWF0ZVNlZWQ7IH1cblx0XHRpZihudWxsICE9IGJpbkNvbmZpZy5nZXRLZXkpIHsgX2ZuLmdldEtleSA9IGJpbkNvbmZpZy5nZXRLZXk7IH1cblx0XHRpZihudWxsICE9IGJpbkNvbmZpZy5nZXRWYWx1ZSkgeyBfZm4uZ2V0VmFsdWUgPSBiaW5Db25maWcuZ2V0VmFsdWU7IH1cblx0XHRpZihudWxsICE9IGJpbkNvbmZpZy51cGRhdGVCaW4pIHsgX2ZuLnVwZGF0ZUJpbiA9IGJpbkNvbmZpZy51cGRhdGVCaW47IH1cblx0XHRpZihudWxsICE9IGJpbkNvbmZpZy5jb3VudEJpbikgeyBfZm4uY291bnRCaW4gPSBiaW5Db25maWcuY291bnRCaW47IH1cblx0XHRpZihudWxsICE9IGJpbkNvbmZpZy5hZnRlckFkZCkgeyBfZm4uYWZ0ZXJBZGQgPSBiaW5Db25maWcuYWZ0ZXJBZGQ7IH1cblx0XHRpZihudWxsICE9IGJpbkNvbmZpZy5hZnRlclVwZGF0ZSkgeyBfZm4uYWZ0ZXJVcGRhdGUgPSBiaW5Db25maWcuYWZ0ZXJVcGRhdGU7IH1cblxuXHRcdGNhbGN1bGF0ZUh3bSgpO1xuXHRcdHVwZGF0ZVN0YXRlKCk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBQdWJsaWMgQVBJXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBSZXNldHMgdGhlIG1vZGVsIHdpdGggdGhlIG5ldyBkYXRhXG5cdCAqL1xuXHRtb2RlbC5zZXQgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0Y2xlYXJEYXRhKCk7XG5cdFx0dXBkYXRlU3RhdGUoKTtcblx0XHRhZGREYXRhKGRhdGEpO1xuXHRcdHJldHVybiBtb2RlbDtcblx0fTtcblxuXHQvKipcblx0ICogQ2xlYXJzIHRoZSBkYXRhIGN1cnJlbnRseSBpbiB0aGUgYmluIG1vZGVsXG5cdCAqL1xuXHRtb2RlbC5jbGVhciA9IGZ1bmN0aW9uKCkge1xuXHRcdGNsZWFyRGF0YSgpO1xuXHRcdHVwZGF0ZVN0YXRlKCk7XG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGQgYW4gYXJyYXkgb2YgZGF0YSBvYmplY3RzIHRvIHRoZSBiaW5zXG5cdCAqL1xuXHRtb2RlbC5hZGQgPSBmdW5jdGlvbihkYXRhVG9BZGQpIHtcblx0XHRhZGREYXRhKGRhdGFUb0FkZCk7XG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSBsb3cgd2F0ZXIgbWFyayB2YWx1ZVxuXHQgKi9cblx0bW9kZWwubHdtID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfY29uZmlnLmx3bTsgfVxuXG5cdFx0dmFyIG9sZEx3bSA9IF9jb25maWcubHdtO1xuXHRcdF9jb25maWcubHdtID0gTnVtYmVyKHYpO1xuXG5cdFx0Y2FsY3VsYXRlSHdtKCk7XG5cblx0XHRpZigob2xkTHdtIC0gX2NvbmZpZy5sd20pICUgX2NvbmZpZy5zaXplICE9PSAwKSB7XG5cdFx0XHQvLyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHdhdGVybWFya3MgaXMgbm90IGEgbXVsdGlwbGUgb2YgdGhlIGJpbiBzaXplLCBzbyB3ZSBuZWVkIHRvIHJlc2V0XG5cdFx0XHRjbGVhckRhdGEoKTtcblx0XHR9XG5cblx0XHR1cGRhdGVTdGF0ZSgpO1xuXG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgdGhlIGhpZ2ggd2F0ZXIgbWFya1xuXHQgKi9cblx0bW9kZWwuaHdtID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9jb25maWcuaHdtO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSBrZXkgZnVuY3Rpb24gdXNlZCB0byBkZXRlcm1pbmUgdGhlIGtleSB2YWx1ZSBmb3IgaW5kZXhpbmcgaW50byB0aGUgYmluc1xuXHQgKi9cblx0bW9kZWwuZ2V0S2V5ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4uZ2V0S2V5OyB9XG5cdFx0X2ZuLmdldEtleSA9IHY7XG5cblx0XHRjbGVhckRhdGEoKTtcblx0XHR1cGRhdGVTdGF0ZSgpO1xuXG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSB2YWx1ZSBmdW5jdGlvbiBmb3IgZGV0ZXJtaW5pbmcgd2hhdCB2YWx1ZSBpcyBhZGRlZCB0byB0aGUgYmluXG5cdCAqL1xuXHRtb2RlbC5nZXRWYWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmdldFZhbHVlOyB9XG5cdFx0X2ZuLmdldFZhbHVlID0gdjtcblxuXHRcdGNsZWFyRGF0YSgpO1xuXHRcdHVwZGF0ZVN0YXRlKCk7XG5cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIFVwZGF0ZSBiaW4gZnVuY3Rpb24gZm9yIGRldGVybWluaW5nIGhvdyB0byB1cGRhdGUgdGhlIHN0YXRlIG9mIGEgYmluIHdoZW4gYSBuZXcgdmFsdWUgaXMgYWRkZWQgdG8gaXRcblx0ICovXG5cdG1vZGVsLnVwZGF0ZUJpbiA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLnVwZGF0ZUJpbjsgfVxuXHRcdF9mbi51cGRhdGVCaW4gPSB2O1xuXG5cdFx0Y2xlYXJEYXRhKCk7XG5cdFx0dXBkYXRlU3RhdGUoKTtcblxuXHRcdHJldHVybiBtb2RlbDtcblx0fTtcblxuXHQvKipcblx0ICogR2V0L1NldCB0aGUgc2VlZCBmdW5jdGlvbiBmb3IgcG9wdWxhdGluZ1xuXHQgKi9cblx0bW9kZWwuY3JlYXRlU2VlZCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmNyZWF0ZVNlZWQ7IH1cblx0XHRfZm4uY3JlYXRlU2VlZCA9IHY7XG5cblx0XHRjbGVhckRhdGEoKTtcblx0XHR1cGRhdGVTdGF0ZSgpO1xuXG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSBjb3VudEJpbiBmdW5jdGlvbiBmb3IgcG9wdWxhdGluZ1xuXHQgKi9cblx0bW9kZWwuY291bnRCaW4gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5jb3VudEJpbjsgfVxuXHRcdF9mbi5jb3VudEJpbiA9IHY7XG5cblx0XHRjbGVhckRhdGEoKTtcblx0XHR1cGRhdGVTdGF0ZSgpO1xuXG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSBhZnRlckFkZCBjYWxsYmFjayBmdW5jdGlvblxuXHQgKi9cblx0bW9kZWwuYWZ0ZXJBZGQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5hZnRlckFkZDsgfVxuXHRcdF9mbi5hZnRlckFkZCA9IHY7XG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSBhZnRlclVwZGF0ZSBjYWxsYmFjayBmdW5jdGlvblxuXHQgKi9cblx0bW9kZWwuYWZ0ZXJVcGRhdGUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5hZnRlclVwZGF0ZTsgfVxuXHRcdF9mbi5hZnRlclVwZGF0ZSA9IHY7XG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSBiaW4gc2l6ZSBjb25maWd1cmF0aW9uXG5cdCAqL1xuXHRtb2RlbC5zaXplID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfY29uZmlnLnNpemU7IH1cblxuXHRcdHYgPSBOdW1iZXIodik7XG5cdFx0aWYodiA8IDEpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignQmluIHNpemUgbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXInKTtcblx0XHR9XG5cblx0XHQvLyBPbmx5IGNoYW5nZSBzdHVmZiBpZiB0aGUgc2l6ZSBhY3R1YWxseSBjaGFuZ2VzXG5cdFx0aWYodiAhPT0gX2NvbmZpZy5zaXplKSB7XG5cdFx0XHRfY29uZmlnLnNpemUgPSB2O1xuXHRcdFx0Y2FsY3VsYXRlSHdtKCk7XG5cdFx0XHRjbGVhckRhdGEoKTtcblx0XHRcdHVwZGF0ZVN0YXRlKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSBiaW4gY291bnQgY29uZmlndXJhdGlvblxuXHQgKi9cblx0bW9kZWwuY291bnQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jb25maWcuY291bnQ7IH1cblxuXHRcdHYgPSBOdW1iZXIodik7XG5cdFx0aWYodiA8IDEpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignQmluIGNvdW50IG11c3QgYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyJyk7XG5cdFx0fVxuXG5cdFx0Ly8gT25seSBjaGFuZ2Ugc3R1ZmYgaWYgdGhlIGNvdW50IGFjdHVhbGx5IGNoYW5nZXNcblx0XHRpZih2ICE9PSBfY29uZmlnLmNvdW50KSB7XG5cdFx0XHRfY29uZmlnLmNvdW50ID0gTWF0aC5mbG9vcih2KTtcblx0XHRcdGNhbGN1bGF0ZUh3bSgpO1xuXHRcdFx0dXBkYXRlU3RhdGUoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFjY2Vzc29yIGZvciB0aGUgYmlucyBvZiBkYXRhXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY29tcGxldGUgYXJyYXkgb2YgYmluc1xuXHQgKi9cblx0bW9kZWwuYmlucyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfZGF0YTtcblx0fTtcblxuXHQvKipcblx0ICogQWNjZXNzb3IgZm9yIHRoZSBjYWNoZWQgY291bnQgb2YgYWxsIHRoZSBkYXRhIGluIHRoZSBiaW5zLCBjYWxjdWxhdGVkIGZvciBlYWNoIGJpbiBieSB0aGUgY291bnRCaW4oKSBmdW5jdGlvblxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgY291bnQgb2YgZGF0YSBpbiB0aGUgYmluc1xuXHQgKi9cblx0bW9kZWwuaXRlbUNvdW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9kYXRhQ291bnQ7XG5cdH07XG5cblx0LyoqXG5cdCAqIENsZWFycyBhbGwgdGhlIGRhdGEgaW4gdGhlIGJpbiB3aXRoIHRoZSBnaXZlbiBpbmRleFxuXHQgKiBAcGFyYW0ge251bWJlcn0gaSBUaGUgaW5kZXggaW50byB0aGUgYmlucyBhcnJheSBvZiB0aGUgYmluIHRvIGNsZWFyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBudW1iZXIgb2YgaXRlbXMgaW4gdGhlIGJpbiB0aGF0IHdhcyBjbGVhcmVkLCBhcyByZXR1cm5lZCBieSBjb3VudEJpbigpIGZ1bmN0aW9uXG5cdCAqL1xuXHRtb2RlbC5jbGVhckJpbiA9IGZ1bmN0aW9uKGkpIHtcblx0XHRpZiAoaSA+PSAwICYmIGkgPCBfZGF0YS5sZW5ndGgpIHtcblx0XHRcdHZhciBjb3VudCA9IF9mbi5jb3VudEJpbihfZGF0YVtpXSk7XG5cdFx0XHRfZGF0YUNvdW50IC09IGNvdW50O1xuXHRcdFx0X2RhdGFbaV1bMV0gPSBfZm4uY3JlYXRlU2VlZCgpO1xuXHRcdFx0cmV0dXJuIGNvdW50O1xuXHRcdH1cblx0XHRyZXR1cm4gMDtcblx0fTtcblxuXHQvLyBJbml0aWFsaXplIHRoZSBtb2RlbFxuXHRtb2RlbChjb25maWcpO1xuXG5cdHJldHVybiBtb2RlbDtcbn1cblxuZXhwb3J0IHsgYmlucyB9O1xuIiwiaW1wb3J0IHsgYmlucyB9IGZyb20gJy4uL21vZGVsL2JpbnMnO1xuXG4vKlxuICogQ29udHJvbGxlciB3cmFwcGVyIGZvciB0aGUgYmluIG1vZGVsLiBBc3N1bWVzIGJpblNpemUgaXMgaW4gbWlsbGlzZWNvbmRzLlxuICogRXZlcnkgdGltZSBiaW5TaXplIGVsYXBzZXMsIHVwZGF0ZXMgdGhlIGx3bSB0byBrZWVwIHRoZSBiaW5zIHNoaWZ0aW5nLlxuICovXG5mdW5jdGlvbiBydEJpbnMoY29uZmlnKSB7XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgdmFyaWFibGVzXG5cdCAqL1xuXHR2YXIgX2NvbmZpZyA9IHtcblx0XHRkZWxheTogMCxcblx0XHRiaW5TaXplOiAwLFxuXHRcdGJpbkNvdW50OiAwXG5cdH07XG5cblx0Ly8gVGhlIGJpbnNcblx0dmFyIF9tb2RlbDtcblx0dmFyIF9ydW5uaW5nO1xuXG5cdC8qKlxuXHQgKiBQcml2YXRlIEZ1bmN0aW9uc1xuXHQgKi9cblxuXHRmdW5jdGlvbiBfY2FsY3VsYXRlTHdtKCkge1xuXHRcdC8vIEFzc3VtZSB0aGUgaHdtIGlzIG5vdyBwbHVzIHR3byBiaW5TaXplXG5cdFx0dmFyIGh3bSA9IERhdGUubm93KCkgKyAyKl9tb2RlbC5zaXplKCk7XG5cblx0XHQvLyBUcnVuYyB0aGUgaHdtIGRvd24gdG8gYSByb3VuZCB2YWx1ZSBiYXNlZCBvbiB0aGUgYmluU2l6ZVxuXHRcdGh3bSA9IE1hdGguZmxvb3IoaHdtL19tb2RlbC5zaXplKCkpICogX21vZGVsLnNpemUoKTtcblxuXHRcdC8vIERlcml2ZSB0aGUgbHdtIGZyb20gdGhlIGh3bVxuXHRcdHZhciBsd20gPSBod20gLSBfbW9kZWwuc2l6ZSgpICogX21vZGVsLmNvdW50KCk7XG5cblx0XHRyZXR1cm4gbHdtO1xuXHR9XG5cblx0ZnVuY3Rpb24gX3VwZGF0ZSgpIHtcblx0XHRpZihfcnVubmluZyA9PT0gdHJ1ZSkge1xuXHRcdFx0Ly8gbmVlZCB0byB1cGRhdGUgdGhlIGx3bVxuXHRcdFx0X21vZGVsLmx3bShfY2FsY3VsYXRlTHdtKCkpO1xuXHRcdFx0d2luZG93LnNldFRpbWVvdXQoX3VwZGF0ZSwgX21vZGVsLnNpemUoKSk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gX3N0YXJ0KCkge1xuXHRcdGlmKCFfcnVubmluZykge1xuXHRcdFx0Ly8gU3RhcnQgdGhlIHVwZGF0ZSBsb29wXG5cdFx0XHRfcnVubmluZyA9IHRydWU7XG5cdFx0XHRfdXBkYXRlKCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gX3N0b3AoKSB7XG5cdFx0Ly8gU2V0dGluZyBydW5uaW5nIHRvIGZhbHNlIHdpbGwgc3RvcCB0aGUgdXBkYXRlIGxvb3Bcblx0XHRfcnVubmluZyA9IGZhbHNlO1xuXHR9XG5cblx0Ly8gY3JlYXRlL2luaXQgbWV0aG9kXG5cdGZ1bmN0aW9uIGNvbnRyb2xsZXIocnRDb25maWcpIHtcblx0XHRpZihudWxsID09IHJ0Q29uZmlnIHx8IG51bGwgPT0gcnRDb25maWcuYmluQ291bnQgfHwgbnVsbCA9PSBydENvbmZpZy5iaW5TaXplKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IHByb3ZpZGUgYW4gaW5pdGlhbCBiaW5TaXplIGFuZCBiaW5Db3VudCcpO1xuXHRcdH1cblxuXHRcdF9jb25maWcuYmluU2l6ZSA9IE51bWJlcihydENvbmZpZy5iaW5TaXplKTtcblx0XHRfY29uZmlnLmJpbkNvdW50ID0gTnVtYmVyKHJ0Q29uZmlnLmJpbkNvdW50KTtcblxuXHRcdGlmKG51bGwgIT0gcnRDb25maWcuZGVsYXkpIHtcblx0XHRcdF9jb25maWcuZGVsYXkgPSBOdW1iZXIocnRDb25maWcuZGVsYXkpO1xuXHRcdH1cblxuXHRcdF9tb2RlbCA9IGJpbnMoe1xuXHRcdFx0c2l6ZTogX2NvbmZpZy5iaW5TaXplLFxuXHRcdFx0Y291bnQ6IF9jb25maWcuYmluQ291bnQgKyAyLFxuXHRcdFx0bHdtOiAwXG5cdFx0fSk7XG5cdFx0X21vZGVsLmx3bShfY2FsY3VsYXRlTHdtKCkpO1xuXG5cdFx0X3N0YXJ0KCk7XG5cdH1cblxuXG5cblx0LyoqXG5cdCAqIFB1YmxpYyBBUElcblx0ICovXG5cblx0Lypcblx0ICogR2V0IHRoZSBtb2RlbCBiaW5zXG5cdCAqL1xuXHRjb250cm9sbGVyLm1vZGVsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9tb2RlbDtcblx0fTtcblxuXHRjb250cm9sbGVyLmJpbnMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX21vZGVsLmJpbnMoKTtcblx0fTtcblxuXHRjb250cm9sbGVyLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG5cdFx0X3N0YXJ0KCk7XG5cdFx0cmV0dXJuIGNvbnRyb2xsZXI7XG5cdH07XG5cblx0Y29udHJvbGxlci5zdG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0X3N0b3AoKTtcblx0XHRyZXR1cm4gY29udHJvbGxlcjtcblx0fTtcblxuXHRjb250cm9sbGVyLnJ1bm5pbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX3J1bm5pbmc7XG5cdH07XG5cblx0Y29udHJvbGxlci5hZGQgPSBmdW5jdGlvbih2KSB7XG5cdFx0X21vZGVsLmFkZCh2KTtcblx0XHRyZXR1cm4gY29udHJvbGxlcjtcblx0fTtcblxuXHRjb250cm9sbGVyLmNsZWFyID0gZnVuY3Rpb24oKSB7XG5cdFx0X21vZGVsLmNsZWFyKCk7XG5cdFx0cmV0dXJuIGNvbnRyb2xsZXI7XG5cdH07XG5cblx0Y29udHJvbGxlci5iaW5TaXplID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfY29uZmlnLmJpblNpemU7IH1cblxuXHRcdHYgPSBOdW1iZXIodik7XG5cdFx0aWYodiA8IDEpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignQmluIHNpemUgbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXInKTtcblx0XHR9XG5cblx0XHRfY29uZmlnLmJpblNpemUgPSB2O1xuXHRcdF9tb2RlbC5zaXplKHYpO1xuXHRcdF9tb2RlbC5sd20oX2NhbGN1bGF0ZUx3bSgpKTtcblxuXHRcdHJldHVybiBjb250cm9sbGVyO1xuXHR9O1xuXG5cdGNvbnRyb2xsZXIuYmluQ291bnQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jb25maWcuYmluQ291bnQ7IH1cblxuXHRcdHYgPSBOdW1iZXIodik7XG5cdFx0aWYodiA8IDEpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignQmluIGNvdW50IG11c3QgYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyJyk7XG5cdFx0fVxuXG5cdFx0X2NvbmZpZy5iaW5Db3VudCA9IHY7XG5cdFx0X21vZGVsLmNvdW50KHYgKyAyKTtcblx0XHRfbW9kZWwubHdtKF9jYWxjdWxhdGVMd20oKSk7XG5cblx0XHRyZXR1cm4gY29udHJvbGxlcjtcblx0fTtcblxuXHQvLyBJbml0aWFsaXplIHRoZSBsYXlvdXRcblx0Y29udHJvbGxlcihjb25maWcpO1xuXG5cdHJldHVybiBjb250cm9sbGVyO1xufVxuXG5leHBvcnQgeyBydEJpbnMgfTtcbiIsImltcG9ydCB7IHJ0QmlucyB9IGZyb20gJy4vcmVhbHRpbWVfYmlucyc7XG5cbnZhciBjb250cm9sbGVyID0geyBydEJpbnM6IHJ0QmlucyB9O1xuXG5leHBvcnQgeyBjb250cm9sbGVyIH07XG4iLCJpbXBvcnQgeyBiaW5zIH0gZnJvbSAnLi9iaW5zJztcblxudmFyIG1vZGVsID0ge1xuXHRiaW5zOiBiaW5zXG59O1xuXG5leHBvcnQgeyBtb2RlbCB9O1xuIiwiZnVuY3Rpb24gdGltZWxpbmVGaWx0ZXIoY29uZmlnKSB7XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgdmFyaWFibGVzXG5cdCAqL1xuXG5cdHZhciBfYnJ1c2ggPSBkMy5zdmcuYnJ1c2goKTtcblx0dmFyIF9lbmFibGVkID0gZmFsc2U7XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgRnVuY3Rpb25zXG5cdCAqL1xuXG5cdGZ1bmN0aW9uIHNldEJydXNoKHYpIHtcblx0XHRfYnJ1c2ggPSB2O1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0RW5hYmxlZCh2KSB7XG5cdFx0X2VuYWJsZWQgPSB2O1xuXHR9XG5cblx0Lypcblx0ICogR2V0IHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBmaWx0ZXJcblx0ICogUmV0dXJucyB1bmRlZmluZWQgaWYgdGhlIGZpbHRlciBpcyBkaXNhYmxlZCBvciBub3Qgc2V0LCBtaWxsaXNlY29uZCB0aW1lIG90aGVyd2lzZVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0RmlsdGVyKCkge1xuXHRcdHZhciBleHRlbnQ7XG5cdFx0aWYoX2VuYWJsZWQgJiYgIV9icnVzaC5lbXB0eSgpKSB7XG5cdFx0XHRleHRlbnQgPSBfYnJ1c2guZXh0ZW50KCk7XG5cdFx0XHRpZihudWxsICE9IGV4dGVudCkge1xuXHRcdFx0XHRleHRlbnQgPSBbIGV4dGVudFswXS5nZXRUaW1lKCksIGV4dGVudFsxXS5nZXRUaW1lKCkgXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZXh0ZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gY2xlYW5GaWx0ZXIoZmlsdGVyKSB7XG5cdFx0aWYoIUFycmF5LmlzQXJyYXkoZmlsdGVyKSB8fCBmaWx0ZXIubGVuZ3RoICE9IDIgfHwgaXNOYU4oZmlsdGVyWzBdKSB8fCBpc05hTihmaWx0ZXJbMV0pKSB7XG5cdFx0XHRmaWx0ZXIgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZpbHRlcjtcblx0fVxuXG5cdC8qXG5cdCAqIFNldCB0aGUgc3RhdGUgb2YgdGhlIGZpbHRlciwgcmV0dXJuIHRydWUgaWYgZmlsdGVyIGNoYW5nZWRcblx0ICovXG5cdGZ1bmN0aW9uIHNldEZpbHRlcihuZSwgb2UpIHtcblx0XHR2YXIgb2UgPSBjbGVhbkZpbHRlcihvZSk7XG5cdFx0bmUgPSBjbGVhbkZpbHRlcihuZSk7XG5cblx0XHQvLyBGaXJlIHRoZSBldmVudCBpZiB0aGUgZXh0ZW50cyBhcmUgZGlmZmVyZW50XG5cdFx0dmFyIHN1cHByZXNzRXZlbnQgPSBuZSA9PT0gb2UgfHwgKG51bGwgIT0gbmUgJiYgbnVsbCAhPSBvZSAmJiBuZVswXSA9PT0gb2VbMF0gJiYgbmVbMV0gPT09IG9lWzFdKTtcblx0XHR2YXIgY2xlYXJGaWx0ZXIgPSAobnVsbCA9PSBuZSB8fCBuZVswXSA+PSBuZVsxXSk7XG5cblx0XHQvLyBlaXRoZXIgY2xlYXIgdGhlIGZpbHRlciBvciBhc3NlcnQgaXRcblx0XHRpZihjbGVhckZpbHRlcikge1xuXHRcdFx0X2JydXNoLmNsZWFyKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdF9icnVzaC5leHRlbnQoWyBuZXcgRGF0ZShuZVswXSksIG5ldyBEYXRlKG5lWzFdKSBdKTtcblx0XHR9XG5cblx0XHQvLyBmaXJlIHRoZSBldmVudCBpZiBhbnl0aGluZyBjaGFuZ2VkXG5cdFx0cmV0dXJuICEoc3VwcHJlc3NFdmVudCk7XG5cblx0fVxuXG5cdC8qXG5cdCAqIENvbnN0cnVjdG9yL2luaXRpYWxpemF0aW9uIG1ldGhvZFxuXHQgKi9cblx0ZnVuY3Rpb24gX2luc3RhbmNlKGNvbmZpZykge1xuXHRcdGlmIChudWxsICE9IGNvbmZpZykge1xuXHRcdFx0aWYgKG51bGwgIT0gY29uZmlnLmJydXNoKSB7XG5cdFx0XHRcdHNldEJydXNoKGNvbmZpZy5icnVzaCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAobnVsbCAhPSBjb25maWcuZW5hYmxlZCkge1xuXHRcdFx0XHRzZXRFbmFibGVkKGNvbmZpZy5lbmFibGVkKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBQdWJsaWMgQVBJXG5cdCAqL1xuXG5cdC8qXG5cdCAqIEdldC9TZXQgdGhlIGJydXNoIHRvIHVzZVxuXHQgKi9cblx0X2luc3RhbmNlLmJydXNoID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfYnJ1c2g7IH1cblx0XHRzZXRCcnVzaCh2KTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIEdldC9TZXQgdGhlIHZhbHVlcyBhY2Nlc3NvciBmdW5jdGlvblxuXHQgKi9cblx0X2luc3RhbmNlLmVuYWJsZWQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9lbmFibGVkOyB9XG5cdFx0c2V0RW5hYmxlZCh2KTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdF9pbnN0YW5jZS5nZXRGaWx0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZ2V0RmlsdGVyKCk7XG5cdH07XG5cblx0X2luc3RhbmNlLnNldEZpbHRlciA9IGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRyZXR1cm4gc2V0RmlsdGVyKG4sIG8pO1xuXHR9O1xuXG5cdC8vIEluaXRpYWxpemUgdGhlIG1vZGVsXG5cdF9pbnN0YW5jZShjb25maWcpO1xuXG5cdHJldHVybiBfaW5zdGFuY2U7XG59XG5cbmV4cG9ydCB7IHRpbWVsaW5lRmlsdGVyIH07XG4iLCJpbXBvcnQgeyBleHRlbnQgfSBmcm9tICcuLi91dGlsL2V4dGVudCc7XG5pbXBvcnQgeyBtdWx0aUV4dGVudCB9IGZyb20gJy4uL3V0aWwvbXVsdGlfZXh0ZW50JztcbmltcG9ydCB7IHRpbWVsaW5lRmlsdGVyIH0gZnJvbSAnLi4vdXRpbC90aW1lbGluZV9maWx0ZXInO1xuXG5mdW5jdGlvbiBsaW5lKCkge1xuXG5cdC8vIExheW91dCBwcm9wZXJ0aWVzXG5cdHZhciBfaWQgPSAndGltZWxpbmVfbGluZV8nICsgRGF0ZS5ub3coKTtcblx0dmFyIF9tYXJnaW4gPSB7IHRvcDogMTAsIHJpZ2h0OiAxMCwgYm90dG9tOiAyMCwgbGVmdDogNDAgfTtcblx0dmFyIF9oZWlnaHQgPSAxMDAsIF93aWR0aCA9IDYwMDtcblxuXHQvLyBEZWZhdWx0IGFjY2Vzc29ycyBmb3IgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIGRhdGFcblx0dmFyIF92YWx1ZSA9IHtcblx0XHR4OiBmdW5jdGlvbihkKSB7IHJldHVybiBkWzBdOyB9LFxuXHRcdHk6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbMV07IH1cblx0fTtcblxuXHQvLyBBY2Nlc3NvcnMgZm9yIHRoZSBwb3NpdGlvbnMgb2YgdGhlIG1hcmtlcnNcblx0dmFyIF9tYXJrZXJWYWx1ZSA9IHtcblx0XHR4OiBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBkWzBdOyB9LFxuXHRcdGxhYmVsOiBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBkWzFdOyB9XG5cdH07XG5cblx0dmFyIG5vdyA9IERhdGUubm93KCk7XG5cdHZhciBfZXh0ZW50ID0ge1xuXHRcdHg6IGV4dGVudCh7XG5cdFx0XHRkZWZhdWx0VmFsdWU6IFtub3cgLSA2MDAwMCo1LCBub3ddLFxuXHRcdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbMF07IH1cblx0XHR9KSxcblx0XHR5OiBleHRlbnQoe1xuXHRcdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbMV07IH1cblx0XHR9KVxuXHR9O1xuXHR2YXIgX211bHRpRXh0ZW50ID0gbXVsdGlFeHRlbnQoKS52YWx1ZXMoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5kYXRhOyB9KTtcblxuXHQvLyBEZWZhdWx0IHNjYWxlcyBmb3IgeCBhbmQgeSBkaW1lbnNpb25zXG5cdHZhciBfc2NhbGUgPSB7XG5cdFx0eDogZDMudGltZS5zY2FsZSgpLFxuXHRcdHk6IGQzLnNjYWxlLmxpbmVhcigpXG5cdH07XG5cblx0Ly8gRGVmYXVsdCBBeGlzIGRlZmluaXRpb25zXG5cdHZhciBfYXhpcyA9IHtcblx0XHR4OiBkMy5zdmcuYXhpcygpLnNjYWxlKF9zY2FsZS54KS5vcmllbnQoJ2JvdHRvbScpLFxuXHRcdHk6IGQzLnN2Zy5heGlzKCkuc2NhbGUoX3NjYWxlLnkpLm9yaWVudCgnbGVmdCcpLnRpY2tzKDMpXG5cdH07XG5cblx0Ly8gZyBlbGVtZW50c1xuXHR2YXIgX2VsZW1lbnQgPSB7XG5cdFx0c3ZnOiB1bmRlZmluZWQsXG5cdFx0Zzoge1xuXHRcdFx0Y29udGFpbmVyOiB1bmRlZmluZWQsXG5cdFx0XHRwbG90czogdW5kZWZpbmVkLFxuXHRcdFx0eEF4aXM6IHVuZGVmaW5lZCxcblx0XHRcdHlBeGlzOiB1bmRlZmluZWQsXG5cdFx0XHRtYXJrZXJzOiB1bmRlZmluZWQsXG5cdFx0XHRicnVzaDogdW5kZWZpbmVkXG5cdFx0fSxcblx0XHRwbG90Q2xpcFBhdGg6IHVuZGVmaW5lZCxcblx0XHRtYXJrZXJDbGlwUGF0aDogdW5kZWZpbmVkXG5cdH07XG5cblx0Ly8gTGluZSBnZW5lcmF0b3IgZm9yIHRoZSBwbG90XG5cdHZhciBfbGluZSA9IGQzLnN2Zy5saW5lKCkuaW50ZXJwb2xhdGUoJ2xpbmVhcicpO1xuXHRfbGluZS54KGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRyZXR1cm4gX3NjYWxlLngoX3ZhbHVlLngoZCwgaSkpO1xuXHR9KTtcblx0X2xpbmUueShmdW5jdGlvbihkLCBpKSB7XG5cdFx0cmV0dXJuIF9zY2FsZS55KF92YWx1ZS55KGQsIGkpKTtcblx0fSk7XG5cblx0Ly8gQXJlYSBnZW5lcmF0b3IgZm9yIHRoZSBwbG90XG5cdHZhciBfYXJlYSA9IGQzLnN2Zy5hcmVhKCkuaW50ZXJwb2xhdGUoJ2xpbmVhcicpO1xuXHRfYXJlYS54KGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRyZXR1cm4gX3NjYWxlLngoX3ZhbHVlLngoZCwgaSkpO1xuXHR9KTtcblx0X2FyZWEueTEoZnVuY3Rpb24oZCwgaSkge1xuXHRcdHJldHVybiBfc2NhbGUueShfdmFsdWUueShkLCBpKSk7XG5cdH0pO1xuXG5cdC8vIEJydXNoIGZpbHRlclxuXHR2YXIgX2ZpbHRlciA9IHRpbWVsaW5lRmlsdGVyKCk7XG5cblx0dmFyIF9kaXNwYXRjaCA9IGQzLmRpc3BhdGNoKCdmaWx0ZXInLCAnZmlsdGVyc3RhcnQnLCAnZmlsdGVyZW5kJywgJ21hcmtlckNsaWNrJywgJ21hcmtlck1vdXNlb3ZlcicsICdtYXJrZXJNb3VzZW91dCcpXG5cdHZhciBfZGF0YSA9IFtdO1xuXG5cdHZhciBfbWFya2VycyA9IHtcblx0XHR2YWx1ZXM6IFtdXG5cdH07XG5cblx0ZnVuY3Rpb24gYnJ1c2hzdGFydCgpIHtcblx0XHRfZGlzcGF0Y2guZmlsdGVyc3RhcnQoX2ZpbHRlci5nZXRGaWx0ZXIoKSk7XG5cdH1cblx0ZnVuY3Rpb24gYnJ1c2goKSB7XG5cdFx0X2Rpc3BhdGNoLmZpbHRlcihfZmlsdGVyLmdldEZpbHRlcigpKTtcblx0fVxuXHRmdW5jdGlvbiBicnVzaGVuZCgpIHtcblx0XHRfZGlzcGF0Y2guZmlsdGVyZW5kKF9maWx0ZXIuZ2V0RmlsdGVyKCkpO1xuXHR9XG5cblx0Ly8gQ2hhcnQgY3JlYXRlL2luaXQgbWV0aG9kXG5cdGZ1bmN0aW9uIF9pbnN0YW5jZShzZWxlY3Rpb24pIHt9XG5cblx0Lypcblx0ICogSW5pdGlhbGl6ZSB0aGUgY2hhcnQgKHNob3VsZCBvbmx5IGNhbGwgdGhpcyBvbmNlKS4gUGVyZm9ybXMgYWxsIGluaXRpYWwgY2hhcnRcblx0ICogY3JlYXRpb24gYW5kIHNldHVwXG5cdCAqL1xuXHRfaW5zdGFuY2UuaW5pdCA9IGZ1bmN0aW9uKGNvbnRhaW5lcikge1xuXHRcdC8vIENyZWF0ZSBhIGNvbnRhaW5lciBkaXZcblx0XHRfZWxlbWVudC5kaXYgPSBjb250YWluZXIuYXBwZW5kKCdkaXYnKS5hdHRyKCdjbGFzcycsICdzZW50aW8gdGltZWxpbmUnKTtcblxuXHRcdC8vIENyZWF0ZSB0aGUgU1ZHIGVsZW1lbnRcblx0XHRfZWxlbWVudC5zdmcgPSBfZWxlbWVudC5kaXYuYXBwZW5kKCdzdmcnKTtcblxuXHRcdC8vIEFkZCB0aGUgZGVmcyBhbmQgYWRkIHRoZSBjbGlwIHBhdGggZGVmaW5pdGlvblxuXHRcdF9lbGVtZW50LnBsb3RDbGlwUGF0aCA9IF9lbGVtZW50LnN2Zy5hcHBlbmQoJ2RlZnMnKS5hcHBlbmQoJ2NsaXBQYXRoJykuYXR0cignaWQnLCAncGxvdF8nICsgX2lkKS5hcHBlbmQoJ3JlY3QnKTtcblx0XHRfZWxlbWVudC5tYXJrZXJDbGlwUGF0aCA9IF9lbGVtZW50LnN2Zy5hcHBlbmQoJ2RlZnMnKS5hcHBlbmQoJ2NsaXBQYXRoJykuYXR0cignaWQnLCAnbWFya2VyXycgKyBfaWQpLmFwcGVuZCgncmVjdCcpO1xuXG5cdFx0Ly8gQXBwZW5kIGEgY29udGFpbmVyIGZvciBldmVyeXRoaW5nXG5cdFx0X2VsZW1lbnQuZy5jb250YWluZXIgPSBfZWxlbWVudC5zdmcuYXBwZW5kKCdnJyk7XG5cblx0XHQvLyBBcHBlbmQgdGhlIHBhdGggZ3JvdXAgKHdoaWNoIHdpbGwgaGF2ZSB0aGUgY2xpcCBwYXRoIGFuZCB0aGUgbGluZSBwYXRoXG5cdFx0X2VsZW1lbnQuZy5wbG90cyA9IF9lbGVtZW50LmcuY29udGFpbmVyLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3Bsb3RzJykuYXR0cignY2xpcC1wYXRoJywgJ3VybCgjcGxvdF8nICsgX2lkICsgJyknKTtcblxuXHRcdC8vIEFkZCB0aGUgZmlsdGVyIGJydXNoIGVsZW1lbnQgYW5kIHNldCB1cCBicnVzaCBjYWxsYmFja3Ncblx0XHRfZWxlbWVudC5nLmJydXNoID0gX2VsZW1lbnQuZy5jb250YWluZXIuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAneCBicnVzaCcpO1xuXHRcdF9maWx0ZXIuYnJ1c2goKVxuXHRcdFx0Lm9uKCdicnVzaGVuZCcsIGJydXNoZW5kKVxuXHRcdFx0Lm9uKCdicnVzaHN0YXJ0JywgYnJ1c2hzdGFydClcblx0XHRcdC5vbignYnJ1c2gnLCBicnVzaCk7XG5cblx0XHQvLyBBcHBlbmQgYSBncm91cCBmb3IgdGhlIG1hcmtlcnNcblx0XHRfZWxlbWVudC5nLm1hcmtlcnMgPSBfZWxlbWVudC5nLmNvbnRhaW5lci5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdtYXJrZXJzJykuYXR0cignY2xpcC1wYXRoJywgJ3VybCgjbWFya2VyXycgKyBfaWQgKyAnKScpO1xuXG5cdFx0Ly8gQXBwZW5kIGdyb3VwcyBmb3IgdGhlIGF4ZXNcblx0XHRfZWxlbWVudC5nLnhBeGlzID0gX2VsZW1lbnQuZy5jb250YWluZXIuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAneCBheGlzJyk7XG5cdFx0X2VsZW1lbnQuZy55QXhpcyA9IF9lbGVtZW50LmcuY29udGFpbmVyLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3kgYXhpcycpO1xuXG5cdFx0X2luc3RhbmNlLnJlc2l6ZSgpO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBTZXQgdGhlIF9pbnN0YW5jZSBkYXRhXG5cdCAqL1xuXHRfaW5zdGFuY2UuZGF0YSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2RhdGE7IH1cblx0XHRfZGF0YSA9IHY7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIFNldCB0aGUgbWFya2VycyBkYXRhXG5cdCAqL1xuXHRfaW5zdGFuY2UubWFya2VycyA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX21hcmtlcnMudmFsdWVzOyB9XG5cdFx0X21hcmtlcnMudmFsdWVzID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIFVwZGF0ZXMgYWxsIHRoZSBlbGVtZW50cyB0aGF0IGRlcGVuZCBvbiB0aGUgc2l6ZSBvZiB0aGUgdmFyaW91cyBjb21wb25lbnRzXG5cdCAqL1xuXHRfaW5zdGFuY2UucmVzaXplID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG5vdyA9IERhdGUubm93KCk7XG5cblx0XHQvLyBTZXQgdXAgdGhlIHNjYWxlc1xuXHRcdF9zY2FsZS54LnJhbmdlKFswLCBNYXRoLm1heCgwLCBfd2lkdGggLSBfbWFyZ2luLmxlZnQgLSBfbWFyZ2luLnJpZ2h0KV0pO1xuXHRcdF9zY2FsZS55LnJhbmdlKFtNYXRoLm1heCgwLCBfaGVpZ2h0IC0gX21hcmdpbi50b3AgLSBfbWFyZ2luLmJvdHRvbSksIDBdKTtcblxuXHRcdC8vIEFwcGVuZCB0aGUgY2xpcCBwYXRoXG5cdFx0X2VsZW1lbnQucGxvdENsaXBQYXRoXG5cdFx0XHQuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAtJyArIF9tYXJnaW4udG9wICsgJyknKVxuXHRcdFx0LmF0dHIoJ3dpZHRoJywgTWF0aC5tYXgoMCwgX3dpZHRoIC0gX21hcmdpbi5sZWZ0IC0gX21hcmdpbi5yaWdodCkpXG5cdFx0XHQuYXR0cignaGVpZ2h0JywgTWF0aC5tYXgoMCwgX2hlaWdodCAtIF9tYXJnaW4uYm90dG9tKSk7XG5cdFx0X2VsZW1lbnQubWFya2VyQ2xpcFBhdGhcblx0XHRcdC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIC0nICsgX21hcmdpbi50b3AgKyAnKScpXG5cdFx0XHQuYXR0cignd2lkdGgnLCBNYXRoLm1heCgwLCBfd2lkdGggLSBfbWFyZ2luLmxlZnQgLSBfbWFyZ2luLnJpZ2h0KSlcblx0XHRcdC5hdHRyKCdoZWlnaHQnLCBNYXRoLm1heCgwLCBfaGVpZ2h0IC0gX21hcmdpbi5ib3R0b20pKTtcblxuXHRcdC8vIE5vdyB1cGRhdGUgdGhlIHNpemUgb2YgdGhlIHN2ZyBwYW5lXG5cdFx0X2VsZW1lbnQuc3ZnLmF0dHIoJ3dpZHRoJywgX3dpZHRoKS5hdHRyKCdoZWlnaHQnLCBfaGVpZ2h0KTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgcG9zaXRpb25zIG9mIHRoZSBheGVzXG5cdFx0X2VsZW1lbnQuZy54QXhpcy5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsJyArIF9zY2FsZS55LnJhbmdlKClbMF0gKyAnKScpO1xuXHRcdF9lbGVtZW50LmcueUF4aXMuYXR0cignY2xhc3MnLCAneSBheGlzJyk7XG5cblx0XHQvLyB1cGRhdGUgdGhlIG1hcmdpbnMgb24gdGhlIG1haW4gZHJhdyBncm91cFxuXHRcdF9lbGVtZW50LmcuY29udGFpbmVyLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIF9tYXJnaW4ubGVmdCArICcsJyArIF9tYXJnaW4udG9wICsgJyknKTtcblxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogUmVkcmF3IHRoZSBncmFwaGljXG5cdCAqL1xuXHRfaW5zdGFuY2UucmVkcmF3ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gTmVlZCB0byBncmFiIHRoZSBmaWx0ZXIgZXh0ZW50IGJlZm9yZSB3ZSBjaGFuZ2UgYW55dGhpbmdcblx0XHR2YXIgZmlsdGVyRXh0ZW50ID0gX2ZpbHRlci5nZXRGaWx0ZXIoKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgeCBkb21haW4gKHRvIHRoZSBsYXRlc3QgdGltZSB3aW5kb3cpXG5cdFx0X3NjYWxlLnguZG9tYWluKF9tdWx0aUV4dGVudC5leHRlbnQoX2V4dGVudC54KS5nZXRFeHRlbnQoX2RhdGEpKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgeSBkb21haW4gKGJhc2VkIG9uIGNvbmZpZ3VyYXRpb24gYW5kIGRhdGEpXG5cdFx0X3NjYWxlLnkuZG9tYWluKF9tdWx0aUV4dGVudC5leHRlbnQoX2V4dGVudC55KS5nZXRFeHRlbnQoX2RhdGEpKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgcGxvdCBlbGVtZW50c1xuXHRcdHVwZGF0ZUF4ZXMoKTtcblx0XHR1cGRhdGVMaW5lKCk7XG5cdFx0dXBkYXRlTWFya2VycygpO1xuXHRcdHVwZGF0ZUZpbHRlcihmaWx0ZXJFeHRlbnQpO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRmdW5jdGlvbiB1cGRhdGVBeGVzKCkge1xuXHRcdGlmKG51bGwgIT0gX2F4aXMueCkge1xuXHRcdFx0X2VsZW1lbnQuZy54QXhpcy5jYWxsKF9heGlzLngpO1xuXHRcdH1cblx0XHRpZihudWxsICE9IF9heGlzLnkpIHtcblx0XHRcdF9lbGVtZW50LmcueUF4aXMuY2FsbChfYXhpcy55KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVMaW5lKCkge1xuXHRcdC8vIEpvaW5cblx0XHR2YXIgcGxvdEpvaW4gPSBfZWxlbWVudC5nLnBsb3RzXG5cdFx0XHQuc2VsZWN0QWxsKCcucGxvdCcpXG5cdFx0XHQuZGF0YShfZGF0YSwgZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRyZXR1cm4gZC5rZXk7XG5cdFx0XHR9KTtcblxuXHRcdC8vIEVudGVyXG5cdFx0dmFyIHBsb3RFbnRlciA9IHBsb3RKb2luLmVudGVyKCkuYXBwZW5kKCdnJylcblx0XHRcdC5hdHRyKCdjbGFzcycsICdwbG90Jyk7XG5cblx0XHRwbG90RW50ZXIuYXBwZW5kKCdnJykuYXBwZW5kKCdwYXRoJykuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7IHJldHVybiAoKGQuY3NzQ2xhc3MpPyBkLmNzc0NsYXNzIDogJycpICsgJyBsaW5lJzsgfSk7XG5cdFx0cGxvdEVudGVyLmFwcGVuZCgnZycpLmFwcGVuZCgncGF0aCcpLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gKChkLmNzc0NsYXNzKT8gZC5jc3NDbGFzcyA6ICcnKSArICcgYXJlYSc7IH0pO1xuXG5cdFx0dmFyIGxpbmVVcGRhdGUgPSBwbG90Sm9pbi5zZWxlY3QoJy5saW5lJyk7XG5cdFx0dmFyIGFyZWFVcGRhdGUgPSBwbG90Sm9pbi5zZWxlY3QoJy5hcmVhJyk7XG5cblx0XHQvLyBVcGRhdGVcblx0XHRsaW5lVXBkYXRlLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZGF0YTsgfSkuYXR0cignZCcsIF9saW5lKTtcblx0XHRhcmVhVXBkYXRlLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZGF0YTsgfSkuYXR0cignZCcsIF9hcmVhLnkwKF9zY2FsZS55LnJhbmdlKClbMF0pKTtcblxuXHRcdC8vIEV4aXRcblx0XHR2YXIgcGxvdEV4aXQgPSBwbG90Sm9pbi5leGl0KCk7XG5cdFx0cGxvdEV4aXQucmVtb3ZlKCk7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZU1hcmtlcnMoKSB7XG5cdFx0Ly8gSm9pblxuXHRcdHZhciBtYXJrZXJKb2luID0gX2VsZW1lbnQuZy5tYXJrZXJzXG5cdFx0XHQuc2VsZWN0QWxsKCcubWFya2VyJylcblx0XHRcdC5kYXRhKF9tYXJrZXJzLnZhbHVlcywgZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRyZXR1cm4gX21hcmtlclZhbHVlLngoZCk7XG5cdFx0XHR9KTtcblxuXHRcdC8vIEVudGVyXG5cdFx0dmFyIG1hcmtlckVudGVyID0gbWFya2VySm9pbi5lbnRlcigpLmFwcGVuZCgnZycpXG5cdFx0XHQuYXR0cignY2xhc3MnLCAnbWFya2VyJylcblx0XHRcdC5vbignbW91c2VvdmVyJywgX2Rpc3BhdGNoLm1hcmtlck1vdXNlb3Zlcilcblx0XHRcdC5vbignbW91c2VvdXQnLCBfZGlzcGF0Y2gubWFya2VyTW91c2VvdXQpXG5cdFx0XHQub24oJ2NsaWNrJywgX2Rpc3BhdGNoLm1hcmtlckNsaWNrKTtcblxuXHRcdHZhciBsaW5lRW50ZXIgPSBtYXJrZXJFbnRlci5hcHBlbmQoJ2xpbmUnKTtcblx0XHR2YXIgdGV4dEVudGVyID0gbWFya2VyRW50ZXIuYXBwZW5kKCd0ZXh0Jyk7XG5cblx0XHR2YXIgbGluZVVwZGF0ZSA9IG1hcmtlckpvaW4uc2VsZWN0KCdsaW5lJyk7XG5cdFx0dmFyIHRleHRVcGRhdGUgPSBtYXJrZXJKb2luLnNlbGVjdCgndGV4dCcpO1xuXG5cdFx0bGluZUVudGVyXG5cdFx0XHQuYXR0cigneTEnLCBmdW5jdGlvbihkKSB7IHJldHVybiBfc2NhbGUueS5yYW5nZSgpWzFdOyB9KVxuXHRcdFx0LmF0dHIoJ3kyJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gX3NjYWxlLnkucmFuZ2UoKVswXTsgfSk7XG5cblx0XHR0ZXh0RW50ZXJcblx0XHRcdC5hdHRyKCdkeScsICcwZW0nKVxuXHRcdFx0LmF0dHIoJ3knLCAtMylcblx0XHRcdC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuXHRcdFx0LnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gX21hcmtlclZhbHVlLmxhYmVsKGQpOyB9KTtcblxuXHRcdC8vIFVwZGF0ZVxuXHRcdGxpbmVVcGRhdGVcblx0XHRcdC5hdHRyKCd4MScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF9zY2FsZS54KF9tYXJrZXJWYWx1ZS54KGQpKTsgfSlcblx0XHRcdC5hdHRyKCd4MicsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF9zY2FsZS54KF9tYXJrZXJWYWx1ZS54KGQpKTsgfSk7XG5cblx0XHR0ZXh0VXBkYXRlXG5cdFx0XHQuYXR0cigneCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF9zY2FsZS54KF9tYXJrZXJWYWx1ZS54KGQpKTsgfSk7XG5cblx0XHQvLyBFeGl0XG5cdFx0dmFyIG1hcmtlckV4aXQgPSBtYXJrZXJKb2luLmV4aXQoKS5yZW1vdmUoKTtcblxuXHR9XG5cblxuXHQvKlxuXHQgKiBVcGRhdGUgdGhlIHN0YXRlIG9mIHRoZSBleGlzdGluZyBmaWx0ZXIgKGlmIGFueSkgb24gdGhlIHBsb3QuXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGFjY2VwdHMgdGhlIGV4dGVudCBvZiB0aGUgYnJ1c2ggYmVmb3JlIGFueSBwbG90IGNoYW5nZXMgd2VyZSBhcHBsaWVkXG5cdCAqIGFuZCB1cGRhdGVzIHRoZSBicnVzaCB0byBiZSByZWRyYXduIG9uIHRoZSBwbG90IGFmdGVyIHRoZSBwbG90IGNoYW5nZXMgYXJlIGFwcGxpZWQuXG5cdCAqIFRoZXJlIGlzIGFsc28gbG9naWMgdG8gY2xpcCB0aGUgYnJ1c2ggaWYgdGhlIGV4dGVudCBoYXMgbW92ZWQgc3VjaCB0aGF0IHRoZSBicnVzaFxuXHQgKiBoYXMgbW92ZWQgcGFydGlhbGx5IG91dCBvZiB0aGUgcGxvdCBib3VuZGFyaWVzLCBhcyB3ZWxsIGFzIHRvIGNsZWFyIHRoZSBicnVzaCBpZiBpdFxuXHQgKiBoYXMgbW92ZWQgY29tcGxldGVseSBvdXRzaWRlIG9mIHRoZSBib3VuZGFyaWVzIG9mIHRoZSBwbG90LlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlRmlsdGVyKGV4dGVudCkge1xuXHRcdC8vIFJlYXNzZXJ0IHRoZSB4IHNjYWxlIG9mIHRoZSBicnVzaCAoaW4gY2FzZSB0aGUgc2NhbGUgaGFzIGNoYW5nZWQpXG5cdFx0X2ZpbHRlci5icnVzaCgpLngoX3NjYWxlLngpO1xuXG5cdFx0Ly8gRGVyaXZlIHRoZSBvdmVyYWxsIHBsb3QgZXh0ZW50IGZyb20gdGhlIGNvbGxlY3Rpb24gb2Ygc2VyaWVzXG5cdFx0dmFyIHBsb3RFeHRlbnQgPSBfbXVsdGlFeHRlbnQuZXh0ZW50KF9leHRlbnQueCkuZ2V0RXh0ZW50KF9kYXRhKTtcblxuXHRcdC8vIElmIHRoZXJlIHdhcyBubyBwcmV2aW91cyBleHRlbnQsIHRoZW4gdGhlcmUgaXMgbm8gYnJ1c2ggdG8gdXBkYXRlXG5cdFx0aWYobnVsbCAhPSBleHRlbnQpIHtcblx0XHRcdC8vIENsaXAgZXh0ZW50IGJ5IHRoZSBmdWxsIGV4dGVudCBvZiB0aGUgcGxvdCAodGhpcyBpcyBpbiBjYXNlIHdlJ3ZlIHNsaXBwZWQgb2ZmIHRoZSB2aXNpYmxlIHBsb3QpXG5cdFx0XHR2YXIgbkV4dGVudCA9IFsgTWF0aC5tYXgocGxvdEV4dGVudFswXSwgZXh0ZW50WzBdKSwgTWF0aC5taW4ocGxvdEV4dGVudFsxXSwgZXh0ZW50WzFdKSBdO1xuXHRcdFx0c2V0RmlsdGVyKG5FeHRlbnQsIGV4dGVudCk7XG5cdFx0fVxuXG5cdFx0X2VsZW1lbnQuZy5icnVzaFxuXHRcdFx0LmNhbGwoX2ZpbHRlci5icnVzaCgpKVxuXHRcdFx0LnNlbGVjdEFsbCgncmVjdCcpXG5cdFx0XHQuYXR0cigneScsIC02KVxuXHRcdFx0XHQuYXR0cignaGVpZ2h0JywgX2hlaWdodCAtIF9tYXJnaW4udG9wIC0gX21hcmdpbi5ib3R0b20gKyA3KTtcblxuXHRcdF9lbGVtZW50LmcuYnJ1c2hcblx0XHRcdC5zdHlsZSgnZGlzcGxheScsIChfZmlsdGVyLmVuYWJsZWQoKSk/ICd1bnNldCcgOiAnbm9uZScpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0RmlsdGVyKG4sIG8pIHtcblx0XHRpZihfZmlsdGVyLnNldEZpbHRlcihuLCBvKSkge1xuXHRcdFx0X2ZpbHRlci5icnVzaCgpLmV2ZW50KF9lbGVtZW50LmcuYnJ1c2gpO1xuXHRcdH1cblx0fVxuXG5cdC8vIEJhc2ljIEdldHRlcnMvU2V0dGVyc1xuXHRfaW5zdGFuY2Uud2lkdGggPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF93aWR0aDsgfVxuXHRcdF93aWR0aCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmhlaWdodCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2hlaWdodDsgfVxuXHRcdF9oZWlnaHQgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5tYXJnaW4gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9tYXJnaW47IH1cblx0XHRfbWFyZ2luID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UuaW50ZXJwb2xhdGlvbiA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2xpbmUuaW50ZXJwb2xhdGUoKTsgfVxuXHRcdF9saW5lLmludGVycG9sYXRlKHYpO1xuXHRcdF9hcmVhLmludGVycG9sYXRlKHYpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS54QXhpcyA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2F4aXMueDsgfVxuXHRcdF9heGlzLnggPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS55QXhpcyA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2F4aXMueTsgfVxuXHRcdF9heGlzLnkgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS54U2NhbGUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9zY2FsZS54OyB9XG5cdFx0X3NjYWxlLnggPSB2O1xuXHRcdGlmKG51bGwgIT0gX2F4aXMueCkge1xuXHRcdFx0X2F4aXMueC5zY2FsZSh2KTtcblx0XHR9XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnlTY2FsZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3NjYWxlLnk7IH1cblx0XHRfc2NhbGUueSA9IHY7XG5cdFx0aWYobnVsbCAhPSBfYXhpcy55KSB7XG5cdFx0XHRfYXhpcy55LnNjYWxlKHYpO1xuXHRcdH1cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UueFZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfdmFsdWUueDsgfVxuXHRcdF92YWx1ZS54ID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UueVZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfdmFsdWUueTsgfVxuXHRcdF92YWx1ZS55ID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UueUV4dGVudCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2V4dGVudC55OyB9XG5cdFx0X2V4dGVudC55ID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UueEV4dGVudCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2V4dGVudC54OyB9XG5cdFx0X2V4dGVudC54ID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UubWFya2VyWFZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfbWFya2VyVmFsdWUueDsgfVxuXHRcdF9tYXJrZXJWYWx1ZS54ID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UubWFya2VyTGFiZWxWYWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX21hcmtlclZhbHVlLmxhYmVsOyB9XG5cdFx0X21hcmtlclZhbHVlLmxhYmVsID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UuZmlsdGVyID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZmlsdGVyLmVuYWJsZWQ7IH1cblx0XHRfZmlsdGVyLmVuYWJsZWQodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmRpc3BhdGNoID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZGlzcGF0Y2g7IH1cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2Uuc2V0RmlsdGVyID0gZnVuY3Rpb24odikge1xuXHRcdHJldHVybiBzZXRGaWx0ZXIodiwgX2ZpbHRlci5nZXRGaWx0ZXIoKSk7XG5cdH07XG5cdF9pbnN0YW5jZS5nZXRGaWx0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2ZpbHRlci5nZXRGaWx0ZXIoKTtcblx0fTtcblxuXHRyZXR1cm4gX2luc3RhbmNlO1xufVxuXG5leHBvcnQgeyBsaW5lIH07XG4iLCJpbXBvcnQgeyBsaW5lIH0gZnJvbSAnLi4vdGltZWxpbmUvbGluZSc7XG5cbmZ1bmN0aW9uIHRpbWVsaW5lKCkge1xuXG5cdC8vIERlZmF1bHQgZGF0YSBkZWxheSwgdGhpcyBpcyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG5vdyBhbmQgdGhlIGxhdGVzdCB0aWNrIHNob3duIG9uIHRoZSB0aW1lbGluZVxuXHR2YXIgX2RlbGF5ID0gMDtcblxuXHQvLyBJbnRlcnZhbCBvZiB0aGUgdGltZWxpbmUsIHRoaXMgaXMgdGhlIGFtb3VudCBvZiB0aW1lIGJlaW5nIGRpc3BsYXllZCBieSB0aGUgdGltZWxpbmVcblx0dmFyIF9pbnRlcnZhbCA9IDYwMDAwO1xuXG5cdC8vIElzIHRoZSB0aW1lbGluZSBydW5uaW5nP1xuXHR2YXIgX3J1bm5pbmcgPSBmYWxzZTtcblx0dmFyIF90aW1lb3V0ID0gbnVsbDtcblxuXHQvLyBXaGF0IGlzIHRoZSByZWZyZXNoIHJhdGU/XG5cdHZhciBfZnBzID0gMzI7XG5cblx0dmFyIF9pbnN0YW5jZSA9IGxpbmUoKTtcblx0X2luc3RhbmNlLnlFeHRlbnQoKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xuXHRcdHZhciB4ID0gX2luc3RhbmNlLnhWYWx1ZSgpKGQpO1xuXHRcdHZhciB4RXh0ZW50ID0gX2luc3RhbmNlLnhFeHRlbnQoKS5nZXRFeHRlbnQoKTtcblx0XHRyZXR1cm4gKHggPCB4RXh0ZW50WzFdICYmIHggPiB4RXh0ZW50WzBdKTtcblx0fSk7XG5cblx0Lypcblx0ICogVGhpcyBpcyB0aGUgbWFpbiB1cGRhdGUgbG9vcCBmdW5jdGlvbi4gSXQgaXMgY2FsbGVkIGV2ZXJ5IHRpbWUgdGhlXG5cdCAqIF9pbnN0YW5jZSBpcyB1cGRhdGluZyB0byBwcm9jZWVkIHRocm91Z2ggdGltZS5cblx0ICovXG5cdGZ1bmN0aW9uIHRpY2soKSB7XG5cdFx0Ly8gSWYgbm90IHJ1bm5pbmcsIGxldCB0aGUgbG9vcCBkaWVcblx0XHRpZighX3J1bm5pbmcpIHJldHVybjtcblxuXHRcdF9pbnN0YW5jZS5yZWRyYXcoKTtcblxuXHRcdC8vIFNjaGVkdWxlIHRoZSBuZXh0IHVwZGF0ZVxuXHRcdF90aW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQodGljaywgKF9mcHMgPiAwKT8gMTAwMC9fZnBzIDogMCk7XG5cdH1cblxuXHQvKlxuXHQgKiBSZWRyYXcgdGhlIGdyYXBoaWNcblx0ICovXG5cdHZhciBwYXJlbnRSZWRyYXcgPSBfaW5zdGFuY2UucmVkcmF3O1xuXHRfaW5zdGFuY2UucmVkcmF3ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gVXBkYXRlIHRoZSB4IGRvbWFpbiAodG8gdGhlIGxhdGVzdCB0aW1lIHdpbmRvdylcblx0XHR2YXIgbm93ID0gbmV3IERhdGUoKTtcblx0XHRfaW5zdGFuY2UueEV4dGVudCgpLm92ZXJyaWRlVmFsdWUoW25vdyAtIF9kZWxheSAtIF9pbnRlcnZhbCwgbm93IC0gX2RlbGF5XSk7XG5cblx0XHRwYXJlbnRSZWRyYXcoKTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdF9pbnN0YW5jZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmKF9ydW5uaW5nKXsgcmV0dXJuOyB9XG5cdFx0X3J1bm5pbmcgPSB0cnVlO1xuXG5cdFx0dGljaygpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLnN0b3AgPSBmdW5jdGlvbigpIHtcblx0XHRfcnVubmluZyA9IGZhbHNlO1xuXG5cdFx0aWYoX3RpbWVvdXQgIT0gbnVsbCkge1xuXHRcdFx0d2luZG93LmNsZWFyVGltZW91dChfdGltZW91dCk7XG5cdFx0fVxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcblx0XHRfaW5zdGFuY2Uuc3RvcCgpO1xuXHRcdF9pbnN0YW5jZS5zdGFydCgpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmludGVydmFsID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfaW50ZXJ2YWw7IH1cblx0XHRfaW50ZXJ2YWwgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmRlbGF5ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZGVsYXk7IH1cblx0XHRfZGVsYXkgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmZwcyA9IGZ1bmN0aW9uKHYpe1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZnBzOyB9XG5cdFx0X2ZwcyA9IHY7XG5cdFx0aWYoX3J1bm5pbmcpIHtcblx0XHRcdF9pbnN0YW5jZS5yZXN0YXJ0KCk7XG5cdFx0fVxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0cmV0dXJuIF9pbnN0YW5jZTtcbn1cblxuZXhwb3J0IHsgdGltZWxpbmUgfTtcbiIsImltcG9ydCB7IHRpbWVsaW5lIH0gZnJvbSAnLi90aW1lbGluZSc7XG5cbnZhciByZWFsdGltZSA9IHtcblx0dGltZWxpbmU6IHRpbWVsaW5lXG59O1xuXG5leHBvcnQgeyByZWFsdGltZSB9O1xuIiwiaW1wb3J0IHsgbGluZSB9IGZyb20gJy4vbGluZSc7XG5cbnZhciB0aW1lbGluZSA9IHtcblx0bGluZTogbGluZVxufTtcblxuZXhwb3J0IHsgdGltZWxpbmUgfTtcbiIsImltcG9ydCB7IGV4dGVudCB9IGZyb20gJy4vZXh0ZW50J1xuaW1wb3J0IHsgbXVsdGlFeHRlbnQgfSBmcm9tICcuL211bHRpX2V4dGVudCc7XG5pbXBvcnQgeyB0aW1lbGluZUZpbHRlciB9IGZyb20gJy4vdGltZWxpbmVfZmlsdGVyJztcblxuZXhwb3J0IHZhciB1dGlsID0ge1xuXHRleHRlbnQ6IGV4dGVudCxcblx0bXVsdGlFeHRlbnQ6IG11bHRpRXh0ZW50LFxuXHR0aW1lbGluZUZpbHRlcjogdGltZWxpbmVGaWx0ZXJcbn07XG4iXSwibmFtZXMiOlsiZXh0ZW50IiwidGltZWxpbmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQSxTQUFTLEtBQUssR0FBRzs7O0NBR2hCLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQztDQUNqQixJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUM7Q0FDbEIsSUFBSSxPQUFPLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7OztDQUd2RCxJQUFJLE9BQU8sQ0FBQztDQUNaLElBQUksaUJBQWlCLEdBQUcsR0FBRyxDQUFDOzs7Q0FHNUIsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDOzs7Q0FHcEIsSUFBSSxPQUFPLEdBQUc7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLFFBQVEsRUFBRSxFQUFFO0VBQ1osVUFBVSxFQUFFLENBQUM7RUFDYixXQUFXLEVBQUUsQ0FBQztFQUNkLFFBQVEsRUFBRSxRQUFRO0VBQ2xCLE1BQU0sRUFBRSxVQUFVO0VBQ2xCLENBQUM7OztDQUdGLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLFVB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QUUsQ0FBQztJQUMxRCxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7RUFFNUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0VBQ2xCOztDQUVELFNBQVMsZUFBZSxHQUFHO0VBQzFCLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQzs7O0VBR3RELElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUU7O0dBRWxDLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO0dBQ3JDLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDO0dBQ3BDLElBQUksV0FBVyxHQUFHLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO0dBQ3ZGLElBQUksWUFBWSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7O0dBRS9ELElBQUksT0FBTyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7R0FDNUIsSUFBSSxPQUFPLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQzs7R0FFN0IsT0FBTyxZQUFZLEdBQUcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQztHQUM1RSxNQUFNOztHQUVOO0VBQ0Q7O0NBRUQsU0FBUyxZQUFZLEdBQUc7Ozs7RUFJdkIsSUFBSSxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxT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LENBQUMsQ0FBQztHQUNoQzs7O0VBR0QsTUFBTSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFO0dBQ3BFLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7R0FDbEIsVUFBVSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7R0FDaEM7OztFQUdELEdBQUcsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7R0FDdEIsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztHQUM1Qzs7O0VBR0QsSUFBSSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtHQUMxRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDckM7OztFQUdELE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFO0dBQzlELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDeEU7RUFDRCxJQUFJLEdBQUcsQ0FBQyxXQUFXLEVBQUU7R0FDcEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7R0FDMUQ7RUFDRDs7Q0FFRCxTQUFTLE9BQU8sQ0FBQyxTQUFTLEVBQUU7RUFDM0IsSUFBSSxTQUFTLEdBQUcsVUFBVSxDQUFDOztFQUUzQixTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsT0FBTyxFQUFFO0dBQ25DLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7R0FDdEMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO0lBQzlCLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEMsSUFBSSxZQUFZLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNDLFVBQVUsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQztJQUNwRDtHQUNELENBQUMsQ0FBQztFQUNILElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRTtHQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztHQUN2RDtFQUNEOztDQUVELFNBQVMsU0FBUyxHQUFHO0VBQ3BCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0VBQ2pCLFVBQVUsR0FBRyxDQUFDLENBQUM7RUFDZjs7Ozs7O0NBTUQsU0FBUyxLQUFLLENBQUMsU0FBUyxFQUFFO0VBQ3pCLEdBQUcsSUFBSSxJQUFJLFNBQVMsSUFBSSxJQUFJLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxJQUFJLElBQUksU0FBUyxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRTtHQUNuRyxNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7R0FDcEU7RUFDRCxPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDdEMsT0FBTyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3hDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7RUFFcEMsR0FBRyxJQUFJLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFO0VBQzNFLEdBQUcsSUFBSSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtFQUMvRCxHQUFHLElBQUksSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7RUFDckUsR0FBRyxJQUFJLElBQUksU0FBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0VBQ3hFLEdBQUcsSUFBSSxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtFQUNyRSxHQUFHLElBQUksSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7RUFDckUsR0FBRyxJQUFJLElBQUksU0FB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