/*! @asymmetrik/sentio-2.0.8 - Copyright Asymmetrik, Ltd. 2007-2017 - All Rights Reserved.*/
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL2pzL2NoYXJ0L2RvbnV0LmpzIiwiL1VzZXJzL3JlYmxhY2UvZ2l0L0Bhc3ltbWV0cmlrL3NlbnRpby1qcy9zcmMvanMvdXRpbC9leHRlbnQuanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9qcy91dGlsL211bHRpX2V4dGVudC5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL2pzL2NoYXJ0L21hdHJpeC5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL2pzL2NoYXJ0L3ZlcnRpY2FsX2JhcnMuanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9qcy9jaGFydC9pbmRleC5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL2pzL21vZGVsL2JpbnMuanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9qcy9jb250cm9sbGVyL3JlYWx0aW1lX2JpbnMuanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9qcy9jb250cm9sbGVyL2luZGV4LmpzIiwiL1VzZXJzL3JlYmxhY2UvZ2l0L0Bhc3ltbWV0cmlrL3NlbnRpby1qcy9zcmMvanMvbW9kZWwvaW5kZXguanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9qcy91dGlsL3RpbWVsaW5lX2ZpbHRlci5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL2pzL3RpbWVsaW5lL2xpbmUuanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9qcy9yZWFsdGltZS90aW1lbGluZS5qcyIsIi9Vc2Vycy9yZWJsYWNlL2dpdC9AYXN5bW1ldHJpay9zZW50aW8tanMvc3JjL2pzL3JlYWx0aW1lL2luZGV4LmpzIiwiL1VzZXJzL3JlYmxhY2UvZ2l0L0Bhc3ltbWV0cmlrL3NlbnRpby1qcy9zcmMvanMvdGltZWxpbmUvaW5kZXguanMiLCIvVXNlcnMvcmVibGFjZS9naXQvQGFzeW1tZXRyaWsvc2VudGlvLWpzL3NyYy9qcy91dGlsL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGRvbnV0KCkge1xuXG5cdC8vIENoYXJ0IGhlaWdodC93aWR0aFxuXHR2YXIgX3dpZHRoID0gNDAwO1xuXHR2YXIgX2hlaWdodCA9IDQwMDtcblx0dmFyIF9tYXJnaW4gPSB7IHRvcDogMiwgYm90dG9tOiAyLCByaWdodDogMiwgbGVmdDogMiB9O1xuXG5cdC8vIElubmVyIGFuZCBvdXRlciByYWRpdXMgc2V0dGluZ3Ncblx0dmFyIF9yYWRpdXM7XG5cdHZhciBfaW5uZXJSYWRpdXNSYXRpbyA9IDAuNztcblxuXHQvLyBUcmFuc2l0aW9uIGR1cmF0aW9uXG5cdHZhciBfZHVyYXRpb24gPSA1MDA7XG5cblx0Ly8gTGVnZW5kIGNvbmZpZ3VyYXRpb25cblx0dmFyIF9sZWdlbmQgPSB7XG5cdFx0ZW5hYmxlZDogdHJ1ZSxcblx0XHRtYXJrU2l6ZTogMTYsXG5cdFx0bWFya01hcmdpbjogOCxcblx0XHRsYWJlbE9mZnNldDogMixcblx0XHRwb3NpdGlvbjogJ2NlbnRlcicsIC8vIG9ubHkgb3B0aW9uIHJpZ2h0IG5vd1xuXHRcdGxheW91dDogJ3ZlcnRpY2FsJ1xuXHR9O1xuXG5cdC8vIGQzIGRpc3BhdGNoZXIgZm9yIGhhbmRsaW5nIGV2ZW50c1xuXHR2YXIgX2Rpc3BhdGNoID0gZDMuZGlzcGF0Y2goJ21vdXNlb3ZlcicsICdtb3VzZW91dCcsICdjbGljaycpO1xuXG5cdC8vIEZ1bmN0aW9uIGhhbmRsZXJzXG5cdHZhciBfZm4gPSB7XG5cdFx0dXBkYXRlQWN0aXZlRWxlbWVudDogZnVuY3Rpb24oZCkge1xuXHRcdFx0dmFyIGxlZ2VuZEVudHJpZXMgPSBfZWxlbWVudC5nTGVnZW5kLnNlbGVjdEFsbCgnZy5lbnRyeScpO1xuXHRcdFx0dmFyIGFyY3MgPSBfZWxlbWVudC5nQ2hhcnQuc2VsZWN0QWxsKCdwYXRoLmFyYycpO1xuXG5cdFx0XHRpZihudWxsICE9IGQgJiYgbnVsbCAhPSBkLmRhdGEpIHtcblx0XHRcdFx0ZCA9IGQuZGF0YTtcblx0XHRcdH1cblxuXHRcdFx0aWYobnVsbCAhPSBkKSB7XG5cdFx0XHRcdC8vIFNldCB0aGUgaGlnaGxpZ2h0IG9uIHRoZSByb3dcblx0XHRcdFx0dmFyIGtleSA9IF9mbi5rZXkoZCk7XG5cdFx0XHRcdGxlZ2VuZEVudHJpZXMuY2xhc3NlZCgnYWN0aXZlJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdFx0cmV0dXJuIF9mbi5rZXkoZSkgPT0ga2V5O1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0YXJjcy5jbGFzc2VkKCdhY3RpdmUnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0XHRyZXR1cm4gX2ZuLmtleShlLmRhdGEpID09IGtleTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bGVnZW5kRW50cmllcy5jbGFzc2VkKCdhY3RpdmUnLCBmYWxzZSk7XG5cdFx0XHRcdGFyY3MuY2xhc3NlZCgnYWN0aXZlJywgZmFsc2UpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0bW91c2VvdmVyOiBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRfZm4udXBkYXRlQWN0aXZlRWxlbWVudChkKTtcblx0XHRcdF9kaXNwYXRjaC5tb3VzZW92ZXIoZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRtb3VzZW91dDogZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0X2ZuLnVwZGF0ZUFjdGl2ZUVsZW1lbnQoKTtcblx0XHRcdF9kaXNwYXRjaC5tb3VzZW91dChkLCB0aGlzKTtcblx0XHR9LFxuXHRcdGNsaWNrOiBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRfZGlzcGF0Y2guY2xpY2soZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRrZXk6IGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGQua2V5OyB9LFxuXHRcdHZhbHVlOiBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBkLnZhbHVlOyB9LFxuXHRcdGxhYmVsOiBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBkLmtleSArICcgKCcgKyBkLnZhbHVlICsgJyknOyB9XG5cdH07XG5cblxuXHQvLyBFeHRlbnRzXG5cdHZhciBfZXh0ZW50ID0ge1xuXHR9O1xuXG5cdHZhciBfc2NhbGUgPSB7XG5cdFx0Y29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKVxuXHR9O1xuXG5cdHZhciBfbGF5b3V0ID0ge1xuXHRcdGFyYzogZDMuc3ZnLmFyYygpLFxuXHRcdHBpZTogZDMubGF5b3V0LnBpZSgpLnZhbHVlKF9mbi52YWx1ZSkuc29ydChudWxsKVxuXHR9O1xuXG5cdC8vIGVsZW1lbnRzXG5cdHZhciBfZWxlbWVudCA9IHtcblx0XHRkaXY6IHVuZGVmaW5lZCxcblx0XHRzdmc6IHVuZGVmaW5lZCxcblx0XHRnQ2hhcnQ6IHVuZGVmaW5lZCxcblx0XHRsZWdlbmQ6IHVuZGVmaW5lZFxuXHR9O1xuXG5cdHZhciBfZGF0YSA9IFtdO1xuXG5cdC8vIENoYXJ0IGNyZWF0ZS9pbml0IG1ldGhvZFxuXHRmdW5jdGlvbiBfaW5zdGFuY2Uoc2VsZWN0aW9uKXt9XG5cblx0Lypcblx0ICogSW5pdGlhbGl6ZSB0aGUgY2hhcnQgKHNob3VsZCBvbmx5IGNhbGwgdGhpcyBvbmNlKS4gUGVyZm9ybXMgYWxsIGluaXRpYWwgY2hhcnRcblx0ICogY3JlYXRpb24gYW5kIHNldHVwXG5cdCAqL1xuXHRfaW5zdGFuY2UuaW5pdCA9IGZ1bmN0aW9uKGNvbnRhaW5lcil7XG5cdFx0Ly8gQ3JlYXRlIHRoZSBESVYgZWxlbWVudFxuXHRcdF9lbGVtZW50LmRpdiA9IGNvbnRhaW5lci5hcHBlbmQoJ2RpdicpLmF0dHIoJ2NsYXNzJywgJ3NlbnRpbyBkb251dCcpO1xuXG5cdFx0Ly8gQ3JlYXRlIHRoZSBzdmcgZWxlbWVudFxuXHRcdF9lbGVtZW50LnN2ZyA9IF9lbGVtZW50LmRpdi5hcHBlbmQoJ3N2ZycpO1xuXG5cdFx0Ly8gQ3JlYXRlIHRoZSBtYWluIGNoYXJ0IGdyb3VwXG5cdFx0X2VsZW1lbnQuZ0NoYXJ0ID0gX2VsZW1lbnQuc3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cblx0XHQvLyBDcmVhdGUgYSBncm91cCBmb3IgdGhlIGxlZ2VuZFxuXHRcdF9lbGVtZW50LmdMZWdlbmQgPSBfZWxlbWVudC5zdmcuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAnbGVnZW5kJyk7XG5cblx0XHRfaW5zdGFuY2UucmVzaXplKCk7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIFNldCB0aGUgX2luc3RhbmNlIGRhdGFcblx0ICovXG5cdF9pbnN0YW5jZS5kYXRhID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZGF0YTsgfVxuXHRcdF9kYXRhID0gdiB8fCBbXTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIFVwZGF0ZXMgYWxsIHRoZSBlbGVtZW50cyB0aGF0IGRlcGVuZCBvbiB0aGUgc2l6ZSBvZiB0aGUgdmFyaW91cyBjb21wb25lbnRzXG5cdCAqL1xuXHRfaW5zdGFuY2UucmVzaXplID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNoYXJ0V2lkdGggPSBfd2lkdGggLSBfbWFyZ2luLnJpZ2h0IC0gX21hcmdpbi5sZWZ0O1xuXHRcdHZhciBjaGFydEhlaWdodCA9IF9oZWlnaHQgLSBfbWFyZ2luLnRvcCAtIF9tYXJnaW4uYm90dG9tO1xuXHRcdF9yYWRpdXMgPSAoTWF0aC5taW4oY2hhcnRIZWlnaHQsIGNoYXJ0V2lkdGgpKS8yO1xuXG5cdFx0X2VsZW1lbnQuc3ZnXG5cdFx0XHQuYXR0cignd2lkdGgnLCBfd2lkdGgpXG5cdFx0XHQuYXR0cignaGVpZ2h0JywgX2hlaWdodCk7XG5cblx0XHRfZWxlbWVudC5nQ2hhcnRcblx0XHRcdC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyAoX21hcmdpbi5sZWZ0ICsgX3JhZGl1cykgKyAnLCcgKyAoX21hcmdpbi50b3AgKyBfcmFkaXVzKSArICcpJyk7XG5cblx0XHQvLyBUaGUgb3V0ZXIgcmFkaXVzIGlzIGhhbGYgb2YgdGhlIGxlc3NlciBvZiB0aGUgdHdvIChjaGFydFdpZHRoL2NoYXJ0SGVpZ2h0KVxuXHRcdF9sYXlvdXQuYXJjLmlubmVyUmFkaXVzKF9yYWRpdXMgKiBfaW5uZXJSYWRpdXNSYXRpbykub3V0ZXJSYWRpdXMoX3JhZGl1cyk7XG5cblx0XHQvLyBVcGRhdGUgbGVnZW5kIHBvc2l0aW9uaW5nXG5cdFx0X2VsZW1lbnQuZ0xlZ2VuZC5hdHRyKCd0cmFuc2Zvcm0nLCBsZWdlbmRUcmFuc2Zvcm0oKSk7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIFJlZHJhdyB0aGUgZ3JhcGhpY1xuXHQgKi9cblx0X2luc3RhbmNlLnJlZHJhdyA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0cmVkcmF3Q2hhcnQoKTtcblxuXHRcdGlmIChfbGVnZW5kLmVuYWJsZWQpIHtcblx0XHRcdHJlZHJhd0xlZ2VuZCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgZnVuY3Rpb25zXG5cdCAqL1xuXHRmdW5jdGlvbiByZWRyYXdDaGFydCgpIHtcblx0XHQvKlxuXHRcdCAqIEpvaW4gdGhlIGRhdGFcblx0XHQgKi9cblx0XHR2YXIgZyA9IF9lbGVtZW50LmdDaGFydC5zZWxlY3RBbGwoJ3BhdGguYXJjJylcblx0XHRcdC5kYXRhKF9sYXlvdXQucGllKF9kYXRhKSwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gX2ZuLmtleShkLmRhdGEsIGkpOyB9KTtcblxuXHRcdC8qXG5cdFx0ICogVXBkYXRlIE9ubHlcblx0XHQgKi9cblxuXHRcdC8qXG5cdFx0ICogRW50ZXIgT25seVxuXHRcdCAqIENyZWF0ZSB0aGUgcGF0aCwgYWRkIHRoZSBhcmMgY2xhc3MsIHJlZ2lzdGVyIHRoZSBjYWxsYmFja3Ncblx0XHQgKiBHcm93IGZyb20gMCBmb3IgYm90aCBzdGFydCBhbmQgZW5kIGFuZ2xlc1xuXHRcdCAqL1xuXHRcdHZhciBnRW50ZXIgPSBnLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcblx0XHRcdC5hdHRyKCdjbGFzcycsICdhcmMnKVxuXHRcdFx0Lm9uKCdtb3VzZW92ZXInLCBfZm4ubW91c2VvdmVyKVxuXHRcdFx0Lm9uKCdtb3VzZW91dCcsIF9mbi5tb3VzZW91dClcblx0XHRcdC5vbignY2xpY2snLCBfZm4uY2xpY2spXG5cdFx0XHQuZWFjaChmdW5jdGlvbihkKSB7IHRoaXMuX2N1cnJlbnQgPSB7IHN0YXJ0QW5nbGU6IDAsIGVuZEFuZ2xlOiAwIH07IH0pO1xuXG5cdFx0Lypcblx0XHQgKiBFbnRlciArIFVwZGF0ZVxuXHRcdCAqIEFwcGx5IHRoZSB1cGRhdGUgZnJvbSBjdXJyZW50IGFuZ2xlIHRvIG5leHQgYW5nbGVcblx0XHQgKi9cblx0XHRnLnRyYW5zaXRpb24oKS5kdXJhdGlvbihfZHVyYXRpb24pXG5cdFx0XHQuYXR0clR3ZWVuKCdkJywgZnVuY3Rpb24oZCkge1xuXHRcdFx0XHR2YXIgaW50ZXJwb2xhdGUgPSBkMy5pbnRlcnBvbGF0ZSh0aGlzLl9jdXJyZW50LCBkKTtcblx0XHRcdFx0dGhpcy5fY3VycmVudCA9IGludGVycG9sYXRlKDApO1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24odCkge1xuXHRcdFx0XHRcdHJldHVybiBfbGF5b3V0LmFyYyhpbnRlcnBvbGF0ZSh0KSk7XG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblxuXHRcdGcuYXR0cigna2V5JywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gX2ZuLmtleShkLmRhdGEsIGkpOyB9KVxuXHRcdFx0LmF0dHIoJ2ZpbGwnLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBfc2NhbGUuY29sb3IoX2ZuLmtleShkLmRhdGEsIGkpKTsgfSk7XG5cblx0XHRnLmV4aXQoKS5yZW1vdmUoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGxlZ2VuZFRyYW5zZm9ybSgpIHtcblx0XHR2YXIgZW50cnlTcGFuID0gX2xlZ2VuZC5tYXJrU2l6ZSArIF9sZWdlbmQubWFya01hcmdpbjtcblxuXHRcdC8vIE9ubHkgb3B0aW9uIGlzICdjZW50ZXInIGZvciBub3dcblx0XHRpZiAoX2xlZ2VuZC5wb3NpdGlvbiA9PT0gJ2NlbnRlcicpIHtcblx0XHRcdC8vIFRoZSBjZW50ZXIgcG9zaXRpb24gb2YgdGhlIGNoYXJ0XG5cdFx0XHR2YXIgY2VudGVyWCA9IF9tYXJnaW4ubGVmdCArIF9yYWRpdXM7XG5cdFx0XHR2YXIgY2VudGVyWSA9IF9tYXJnaW4udG9wICsgX3JhZGl1cztcblx0XHRcdHZhciBsZWdlbmRXaWR0aCA9IChudWxsID09IF9lbGVtZW50LmdMZWdlbmQuX21heFdpZHRoKT8gMCA6IF9lbGVtZW50LmdMZWdlbmQuX21heFdpZHRoO1xuXHRcdFx0dmFyIGxlZ2VuZEhlaWdodCA9IGVudHJ5U3BhbipfZGF0YS5sZW5ndGggKyBfbGVnZW5kLm1hcmtNYXJnaW47XG5cblx0XHRcdHZhciBvZmZzZXRYID0gbGVnZW5kV2lkdGgvMjtcblx0XHRcdHZhciBvZmZzZXRZID0gbGVnZW5kSGVpZ2h0LzI7XG5cblx0XHRcdHJldHVybiAndHJhbnNsYXRlKCcgKyAoY2VudGVyWCAtIG9mZnNldFgpICsgJywnICsgKGNlbnRlclkgLSBvZmZzZXRZKSArICcpJztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gVE9ET1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHJlZHJhd0xlZ2VuZCgpIHtcblx0XHQvKlxuXHRcdCAqIEpvaW4gdGhlIGRhdGFcblx0XHQgKi9cblx0XHR2YXIgZ0xlZ2VuZEdyb3VwID0gX2VsZW1lbnQuZ0xlZ2VuZC5zZWxlY3RBbGwoJ2cuZW50cnknKVxuXHRcdFx0LmRhdGEoX2RhdGEsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIF9mbi5rZXkoZCwgaSk7IH0pO1xuXG5cdFx0Lypcblx0XHQgKiBFbnRlciBPbmx5XG5cdFx0ICogQ3JlYXRlIGEgZyAoZ0xlZ2VuZEdyb3VwKSB0byBhZGQgdGhlIHJlY3QgJiB0ZXh0IGxhYmVsLFxuXHRcdCAqIHJlZ2lzdGVyIHRoZSBjYWxsYmFja3MsIGFwcGx5IHRoZSB0cmFuc2Zvcm0gdG8gcG9zaXRpb24gZWFjaCBnTGVnZW5kR3JvdXBcblx0XHQgKi9cblx0XHR2YXIgZ0xlZ2VuZEdyb3VwRW50ZXIgPSBnTGVnZW5kR3JvdXAuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuXHRcdFx0LmF0dHIoJ2NsYXNzJywgJ2VudHJ5Jylcblx0XHRcdC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiAndHJhbnNsYXRlKDAsICcgKyAoaSooX2xlZ2VuZC5tYXJrU2l6ZSArIF9sZWdlbmQubWFya01hcmdpbikpICsgJyknOyB9IClcblx0XHRcdC5vbignbW91c2VvdmVyJywgX2ZuLm1vdXNlb3Zlcilcblx0XHRcdC5vbignbW91c2VvdXQnLCBfZm4ubW91c2VvdXQpXG5cdFx0XHQub24oJ2NsaWNrJywgX2ZuLmNsaWNrKTtcblxuXHRcdC8vIEFkZCB0aGUgbGVnZW5kJ3MgcmVjdFxuXHRcdHZhciByZWN0ID0gZ0xlZ2VuZEdyb3VwRW50ZXJcblx0XHRcdC5hcHBlbmQoJ3JlY3QnKVxuXHRcdFx0LmF0dHIoJ3dpZHRoJywgX2xlZ2VuZC5tYXJrU2l6ZSlcblx0XHRcdC5hdHRyKCdoZWlnaHQnLCBfbGVnZW5kLm1hcmtTaXplKTtcblxuXHRcdC8vIEFkZCB0aGUgbGVnZW5kIHRleHRcblx0XHRnTGVnZW5kR3JvdXBFbnRlclxuXHRcdFx0LmFwcGVuZCgndGV4dCcpXG5cdFx0XHQuYXR0cigneCcsIF9sZWdlbmQubWFya1NpemUgKyBfbGVnZW5kLm1hcmtNYXJnaW4pXG5cdFx0XHQuYXR0cigneScsIF9sZWdlbmQubWFya1NpemUgLSBfbGVnZW5kLmxhYmVsT2Zmc2V0KTtcblxuXHRcdC8qXG5cdFx0ICogRW50ZXIgKyBVcGRhdGVcblx0XHQgKi9cblx0XHRnTGVnZW5kR3JvdXAuc2VsZWN0KCd0ZXh0Jylcblx0XHRcdC50ZXh0KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIF9mbi5sYWJlbChkLCBpKTsgfSk7XG5cblx0XHRnTGVnZW5kR3JvdXAuc2VsZWN0KCdyZWN0Jylcblx0XHRcdC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF9zY2FsZS5jb2xvcihfZm4ua2V5KGQpKTsgfSk7XG5cblx0XHQvLyBQb3NpdGlvbiBlYWNoIHJlY3Qgb24gYm90aCBlbnRlciBhbmQgdXBkYXRlIHRvIGZ1bGx5IGFjY291bnQgZm9yIGNoYW5naW5nIHdpZHRocyBhbmQgc2l6ZXNcblx0XHRnTGVnZW5kR3JvdXBcblx0XHRcdC8vIEl0ZXJhdGUgb3ZlciBhbGwgdGhlIGxlZ2VuZCBrZXlzIHRvIGdldCB0aGUgbWF4IHdpZHRoIGFuZCBzdG9yZSBpdCBpbiBnTGVnZW5kR3JvdXAuX21heFdpZHRoXG5cdFx0XHQuZWFjaChmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRcdGlmIChpID09PSAwKSB7XG5cdFx0XHRcdFx0Ly8gUmVzZXRcblx0XHRcdFx0XHRfZWxlbWVudC5nTGVnZW5kLl9tYXhXaWR0aCA9IHRoaXMuZ2V0QkJveCgpLndpZHRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdF9lbGVtZW50LmdMZWdlbmQuX21heFdpZHRoID0gTWF0aC5tYXgodGhpcy5nZXRCQm94KCkud2lkdGgsIF9lbGVtZW50LmdMZWdlbmQuX21heFdpZHRoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHQvLyBSZWFzc2VydCB0aGUgbGVnZW5kIHBvc2l0aW9uXG5cdFx0X2VsZW1lbnQuZ0xlZ2VuZC5hdHRyKCd0cmFuc2Zvcm0nLCBsZWdlbmRUcmFuc2Zvcm0oKSk7XG5cblx0XHRnTGVnZW5kR3JvdXAuZXhpdCgpLnJlbW92ZSgpO1xuXHR9XG5cblx0Ly8gQmFzaWMgR2V0dGVycy9TZXR0ZXJzXG5cdF9pbnN0YW5jZS53aWR0aCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3dpZHRoOyB9XG5cdFx0X3dpZHRoID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UuaGVpZ2h0ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfaGVpZ2h0OyB9XG5cdFx0X2hlaWdodCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuaW5uZXJSYWRpdXNSYXRpbyA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2lubmVyUmFkaXVzUmF0aW87IH1cblx0XHRfaW5uZXJSYWRpdXNSYXRpbyA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuZHVyYXRpb24gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kdXJhdGlvbjsgfVxuXHRcdF9kdXJhdGlvbiA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2Uua2V5ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4ua2V5OyB9XG5cdFx0X2ZuLmtleSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4udmFsdWU7IH1cblx0XHRfZm4udmFsdWUgPSB2O1xuXHRcdF9sYXlvdXQucGllLnZhbHVlKHYpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5sYWJlbCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmxhYmVsOyB9XG5cdFx0X2ZuLmxhYmVsID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UuY29sb3IgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9zY2FsZS5jb2xvcjsgfVxuXHRcdF9zY2FsZS5jb2xvciA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuZGlzcGF0Y2ggPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kaXNwYXRjaDsgfVxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmxlZ2VuZCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2xlZ2VuZDsgfVxuXHRcdF9sZWdlbmQgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0cmV0dXJuIF9pbnN0YW5jZTtcbn1cblxuZXhwb3J0IHsgZG9udXQgfTtcbiIsImZ1bmN0aW9uIGV4dGVudChjb25maWcpIHtcblxuXHQvKipcblx0ICogUHJpdmF0ZSB2YXJpYWJsZXNcblx0ICovXG5cdC8vIENvbmZpZ3VyYXRpb25cblx0dmFyIF9jb25maWcgPSB7XG5cdFx0ZGVmYXVsdFZhbHVlOiBbMCwgMTBdLFxuXHRcdG92ZXJyaWRlVmFsdWU6IHVuZGVmaW5lZFxuXHR9O1xuXG5cdHZhciBfZm4gPSB7XG5cdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG5cdFx0ZmlsdGVyOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBQcml2YXRlIEZ1bmN0aW9uc1xuXHQgKi9cblxuXHRmdW5jdGlvbiBzZXREZWZhdWx0VmFsdWUodikge1xuXHRcdGlmKG51bGwgPT0gdiB8fCAyICE9PSB2Lmxlbmd0aCB8fCBpc05hTih2WzBdKSB8fCBpc05hTih2WzFdKSB8fCB2WzBdID49IHZbMV0pIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignRGVmYXVsdCBleHRlbnQgbXVzdCBiZSBhIHR3byBlbGVtZW50IG9yZGVyZWQgYXJyYXkgb2YgbnVtYmVycycpO1xuXHRcdH1cblx0XHRfY29uZmlnLmRlZmF1bHRWYWx1ZSA9IHY7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRPdmVycmlkZVZhbHVlKHYpIHtcblx0XHRpZihudWxsICE9IHYgJiYgMiAhPT0gdi5sZW5ndGgpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignRXh0ZW50IG92ZXJyaWRlIG11c3QgYmUgYSB0d28gZWxlbWVudCBhcnJheSBvciBudWxsL3VuZGVmaW5lZCcpO1xuXHRcdH1cblx0XHRfY29uZmlnLm92ZXJyaWRlVmFsdWUgPSB2O1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0R2V0VmFsdWUodikge1xuXHRcdGlmKHR5cGVvZiB2ICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIGdldHRlciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblx0XHR9XG5cblx0XHRfZm4uZ2V0VmFsdWUgPSB2O1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0RmlsdGVyKHYpIHtcblx0XHRpZih0eXBlb2YgdiAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdGaWx0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cdFx0fVxuXG5cdFx0X2ZuLmZpbHRlciA9IHY7XG5cdH1cblxuXHQvKlxuXHQgKiBDb25zdHJ1Y3Rvci9pbml0aWFsaXphdGlvbiBtZXRob2Rcblx0ICovXG5cdGZ1bmN0aW9uIF9pbnN0YW5jZShleHRlbnRDb25maWcpIHtcblx0XHRpZihudWxsICE9IGV4dGVudENvbmZpZykge1xuXHRcdFx0aWYobnVsbCAhPSBleHRlbnRDb25maWcuZGVmYXVsdFZhbHVlKSB7IHNldERlZmF1bHRWYWx1ZShleHRlbnRDb25maWcuZGVmYXVsdFZhbHVlKTsgfVxuXHRcdFx0aWYobnVsbCAhPSBleHRlbnRDb25maWcub3ZlcnJpZGVWYWx1ZSkgeyBzZXRPdmVycmlkZVZhbHVlKGV4dGVudENvbmZpZy5vdmVycmlkZVZhbHVlKTsgfVxuXHRcdFx0aWYobnVsbCAhPSBleHRlbnRDb25maWcuZ2V0VmFsdWUpIHsgc2V0R2V0VmFsdWUoZXh0ZW50Q29uZmlnLmdldFZhbHVlKTsgfVxuXHRcdFx0aWYobnVsbCAhPSBleHRlbnRDb25maWcuZmlsdGVyKSB7IHNldEZpbHRlcihleHRlbnRDb25maWcuZmlsdGVyKTsgfVxuXHRcdH1cblx0fVxuXG5cblx0LyoqXG5cdCAqIFB1YmxpYyBBUElcblx0ICovXG5cblx0Lypcblx0ICogR2V0L1NldCB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGV4dGVudFxuXHQgKi9cblx0X2luc3RhbmNlLmRlZmF1bHRWYWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2NvbmZpZy5kZWZhdWx0VmFsdWU7IH1cblx0XHRzZXREZWZhdWx0VmFsdWUodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBHZXQvU2V0IHRoZSBvdmVycmlkZSB2YWx1ZSBmb3IgdGhlIGV4dGVudFxuXHQgKi9cblx0X2luc3RhbmNlLm92ZXJyaWRlVmFsdWUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jb25maWcub3ZlcnJpZGVWYWx1ZTsgfVxuXHRcdHNldE92ZXJyaWRlVmFsdWUodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBHZXQvU2V0IHRoZSB2YWx1ZSBhY2Nlc3NvciBmb3IgdGhlIGV4dGVudFxuXHQgKi9cblx0X2luc3RhbmNlLmdldFZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4uZ2V0VmFsdWU7IH1cblx0XHRzZXRHZXRWYWx1ZSh2KTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIEdldC9TZXQgdGhlIGZpbHRlciBmbiBmb3IgdGhlIGV4dGVudFxuXHQgKi9cblx0X2luc3RhbmNlLmZpbHRlciA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmZpbHRlcjsgfVxuXHRcdHNldEZpbHRlcih2KTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIENhbGN1bGF0ZSB0aGUgZXh0ZW50IGdpdmVuIHNvbWUgZGF0YS5cblx0ICogLSBEZWZhdWx0IHZhbHVlcyBhcmUgdXNlZCBpbiB0aGUgYWJzZW5jZSBvZiBkYXRhXG5cdCAqIC0gT3ZlcnJpZGUgdmFsdWVzIGFyZSB1c2VkIHRvIGNsYW1wIG9yIGV4dGVuZCB0aGUgZXh0ZW50XG5cdCAqL1xuXHRfaW5zdGFuY2UuZ2V0RXh0ZW50ID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciB0b1JldHVybjtcblx0XHR2YXIgb3YgPSBfY29uZmlnLm92ZXJyaWRlVmFsdWU7XG5cblx0XHQvLyBDaGVjayB0byBzZWUgaWYgd2UgbmVlZCB0byBjYWxjdWxhdGUgdGhlIGV4dGVudFxuXHRcdGlmKG51bGwgPT0gb3YgfHwgbnVsbCA9PSBvdlswXSB8fCBudWxsID09IG92WzFdKSB7XG5cdFx0XHQvLyBTaW5jZSB0aGUgb3ZlcnJpZGUgaXNuJ3QgY29tcGxldGUsIHdlIG5lZWQgdG8gY2FsY3VsYXRlIHRoZSBleHRlbnRcblx0XHRcdHRvUmV0dXJuID0gW051bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZXTtcblx0XHRcdHZhciBmb3VuZERhdGEgPSBmYWxzZTtcblxuXHRcdFx0aWYobnVsbCAhPSBkYXRhKSB7XG5cdFx0XHRcdC8vIEl0ZXJhdGUgb3ZlciBlYWNoIGVsZW1lbnQgb2YgdGhlIGRhdGFcblx0XHRcdFx0ZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsIGkpIHtcblx0XHRcdFx0XHQvLyBJZiB0aGUgZWxlbWVudCBwYXNzZXMgdGhlIGZpbHRlciwgdGhlbiB1cGRhdGUgdGhlIGV4dGVudFxuXHRcdFx0XHRcdGlmKF9mbi5maWx0ZXIoZWxlbWVudCwgaSkpIHtcblx0XHRcdFx0XHRcdGZvdW5kRGF0YSA9IHRydWU7XG5cdFx0XHRcdFx0XHR2YXIgdiA9IF9mbi5nZXRWYWx1ZShlbGVtZW50LCBpKTtcblx0XHRcdFx0XHRcdHRvUmV0dXJuWzBdID0gTWF0aC5taW4odG9SZXR1cm5bMF0sIHYpO1xuXHRcdFx0XHRcdFx0dG9SZXR1cm5bMV0gPSBNYXRoLm1heCh0b1JldHVyblsxXSwgdik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgd2UgZGlkbid0IGZpbmQgYW55IGRhdGEsIHVzZSB0aGUgZGVmYXVsdCB2YWx1ZXNcblx0XHRcdGlmKCFmb3VuZERhdGEpIHtcblx0XHRcdFx0dG9SZXR1cm4gPSBfY29uZmlnLmRlZmF1bHRWYWx1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQXBwbHkgdGhlIG92ZXJyaWRlc1xuXHRcdFx0Ly8gLSBTaW5jZSB3ZSdyZSBpbiB0aGlzIGNvbmRpdGlvbmFsLCBvbmx5IG9uZSBvciB6ZXJvIG92ZXJyaWRlcyB3ZXJlIHNwZWNpZmllZFxuXHRcdFx0aWYobnVsbCAhPSBvdikge1xuXHRcdFx0XHRpZihudWxsICE9IG92WzBdKSB7XG5cdFx0XHRcdFx0Ly8gU2V0IHRoZSBsb3dlciBvdmVycmlkZVxuXHRcdFx0XHRcdHRvUmV0dXJuWzBdID0gb3ZbMF07XG5cdFx0XHRcdFx0aWYodG9SZXR1cm5bMF0gPiB0b1JldHVyblsxXSkge1xuXHRcdFx0XHRcdFx0dG9SZXR1cm5bMV0gPSB0b1JldHVyblswXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYobnVsbCAhPSBvdlsxXSkge1xuXHRcdFx0XHRcdHRvUmV0dXJuWzFdID0gb3ZbMV07XG5cdFx0XHRcdFx0aWYodG9SZXR1cm5bMV0gPCB0b1JldHVyblswXSkge1xuXHRcdFx0XHRcdFx0dG9SZXR1cm5bMF0gPSB0b1JldHVyblsxXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gU2luY2UgdGhlIG92ZXJyaWRlIGlzIGZ1bGx5IHNwZWNpZmllZCwgdXNlIGl0XG5cdFx0XHR0b1JldHVybiA9IG92O1xuXHRcdH1cblxuXHRcdHJldHVybiB0b1JldHVybjtcblx0fTtcblxuXG5cdC8vIEluaXRpYWxpemUgdGhlIG1vZGVsXG5cdF9pbnN0YW5jZShjb25maWcpO1xuXG5cdHJldHVybiBfaW5zdGFuY2U7XG59XG5cbmV4cG9ydCB7IGV4dGVudCB9O1xuIiwiaW1wb3J0IHsgZXh0ZW50IH0gZnJvbSAnLi9leHRlbnQnO1xuXG5mdW5jdGlvbiBtdWx0aUV4dGVudChjb25maWcpIHtcblxuXHQvKipcblx0ICogUHJpdmF0ZSB2YXJpYWJsZXNcblx0ICovXG5cblx0dmFyIF9mbiA9IHtcblx0XHR2YWx1ZXM6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9XG5cdH07XG5cblx0dmFyIF9leHRlbnQgPSBleHRlbnQoKTtcblxuXHQvKipcblx0ICogUHJpdmF0ZSBGdW5jdGlvbnNcblx0ICovXG5cblx0ZnVuY3Rpb24gc2V0RXh0ZW50KHYpIHtcblx0XHRfZXh0ZW50ID0gdjtcblx0fVxuXG5cdC8qXG5cdCAqIENvbnN0cnVjdG9yL2luaXRpYWxpemF0aW9uIG1ldGhvZFxuXHQgKi9cblx0ZnVuY3Rpb24gX2luc3RhbmNlKGNvbmZpZykge1xuXHRcdGlmKG51bGwgIT0gY29uZmlnICYmIG51bGwgIT0gY29uZmlnLmV4dGVudCkge1xuXHRcdFx0c2V0RXh0ZW50KGNvbmZpZy5leHRlbnQpO1xuXHRcdH1cblx0fVxuXG5cblx0LyoqXG5cdCAqIFB1YmxpYyBBUElcblx0ICovXG5cblx0Lypcblx0ICogR2V0L1NldCB0aGUgZXh0ZW50IHRvIHVzZVxuXHQgKi9cblx0X2luc3RhbmNlLmV4dGVudCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2V4dGVudDsgfVxuXHRcdHNldEV4dGVudCh2KTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIEdldC9TZXQgdGhlIHZhbHVlcyBhY2Nlc3NvciBmdW5jdGlvblxuXHQgKi9cblx0X2luc3RhbmNlLnZhbHVlcyA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLnZhbHVlczsgfVxuXHRcdF9mbi52YWx1ZXMgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogQ2FsY3VsYXRlIHRoZSBleHRlbnQgZ2l2ZW4gc29tZSBkYXRhLlxuXHQgKiAtIERlZmF1bHQgdmFsdWVzIGFyZSB1c2VkIGluIHRoZSBhYnNlbmNlIG9mIGRhdGFcblx0ICogLSBPdmVycmlkZSB2YWx1ZXMgYXJlIHVzZWQgdG8gY2xhbXAgb3IgZXh0ZW5kIHRoZSBleHRlbnRcblx0ICovXG5cdF9pbnN0YW5jZS5nZXRFeHRlbnQgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIHRvUmV0dXJuO1xuXG5cdFx0ZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciB0RXh0ZW50ID0gX2V4dGVudC5nZXRFeHRlbnQoX2ZuLnZhbHVlcyhlKSk7XG5cdFx0XHRpZihudWxsID09IHRvUmV0dXJuKSB7XG5cdFx0XHRcdHRvUmV0dXJuID0gdEV4dGVudDtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0b1JldHVyblswXSA9IE1hdGgubWluKHRvUmV0dXJuWzBdLCB0RXh0ZW50WzBdKTtcblx0XHRcdFx0dG9SZXR1cm5bMV0gPSBNYXRoLm1heCh0b1JldHVyblsxXSwgdEV4dGVudFsxXSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBJbiBjYXNlIHRoZXJlIHdhcyBubyBkYXRhXG5cdFx0aWYobnVsbCA9PSB0b1JldHVybikge1xuXHRcdFx0dG9SZXR1cm4gPSBfZXh0ZW50LmdldEV4dGVudChbXSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRvUmV0dXJuO1xuXHR9O1xuXG5cdC8vIEluaXRpYWxpemUgdGhlIG1vZGVsXG5cdF9pbnN0YW5jZShjb25maWcpO1xuXG5cdHJldHVybiBfaW5zdGFuY2U7XG59XG5cbmV4cG9ydCB7IG11bHRpRXh0ZW50IH07XG4iLCJpbXBvcnQgeyBleHRlbnQgfSBmcm9tICcuLi91dGlsL2V4dGVudCc7XG5pbXBvcnQgeyBtdWx0aUV4dGVudCB9IGZyb20gJy4uL3V0aWwvbXVsdGlfZXh0ZW50JztcblxuZnVuY3Rpb24gbWF0cml4KCkge1xuXG5cdC8vIENoYXJ0IGRpbWVuc2lvbnNcblx0dmFyIF9jZWxsU2l6ZSA9IDE2O1xuXHR2YXIgX2NlbGxNYXJnaW4gPSAxO1xuXHR2YXIgX21hcmdpbiA9IHsgdG9wOiAyMCwgcmlnaHQ6IDIsIGJvdHRvbTogMiwgbGVmdDogNjQgfTtcblxuXHQvLyBUcmFuc2l0aW9uIGR1cmF0aW9uXG5cdHZhciBfZHVyYXRpb24gPSA1MDA7XG5cblx0Ly8gZDMgZGlzcGF0Y2hlciBmb3IgaGFuZGxpbmcgZXZlbnRzXG5cdHZhciBfZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaCgnY2VsbE1vdXNlb3ZlcicsICdjZWxsTW91c2VvdXQnLCAnY2VsbENsaWNrJywgJ3Jvd01vdXNlb3ZlcicsICdyb3dNb3VzZW91dCcsICdyb3dDbGljaycpO1xuXG5cdC8vIEZ1bmN0aW9uIGhhbmRsZXJzXG5cdHZhciBfZm4gPSB7XG5cdFx0dXBkYXRlQWN0aXZlU2VyaWVzOiBmdW5jdGlvbihkKSB7XG5cdFx0XHR2YXIgc2VyaWVzTGFiZWxzID0gX2VsZW1lbnQuZy5jaGFydC5zZWxlY3RBbGwoJy5yb3cgdGV4dCcpO1xuXG5cdFx0XHRpZihudWxsICE9IGQpIHtcblx0XHRcdFx0Ly8gU2V0IHRoZSBoaWdobGlnaHQgb24gdGhlIHJvd1xuXHRcdFx0XHR2YXIgc2VyaWVzS2V5ID0gX2ZuLnNlcmllc0tleShkKTtcblx0XHRcdFx0c2VyaWVzTGFiZWxzLmNsYXNzZWQoJ2FjdGl2ZScsIGZ1bmN0aW9uKHNlcmllcywgaSl7IHJldHVybiBfZm4uc2VyaWVzS2V5KHNlcmllcykgPT0gc2VyaWVzS2V5OyB9KTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHQvLyBOb3cgdXBkYXRlIHRoZSBzdHlsZVxuXHRcdFx0XHRzZXJpZXNMYWJlbHMuY2xhc3NlZCgnYWN0aXZlJywgZmFsc2UpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cm93TW91c2VvdmVyOiBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRfZm4udXBkYXRlQWN0aXZlU2VyaWVzKGQpO1xuXHRcdFx0X2Rpc3BhdGNoLnJvd01vdXNlb3ZlcihkLCB0aGlzKTtcblx0XHR9LFxuXHRcdHJvd01vdXNlb3V0OiBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRfZm4udXBkYXRlQWN0aXZlU2VyaWVzKCk7XG5cdFx0XHRfZGlzcGF0Y2gucm93TW91c2VvdXQoZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRyb3dDbGljazogZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0X2Rpc3BhdGNoLnJvd0NsaWNrKGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0Y2VsbE1vdXNlb3ZlcjogZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0X2Rpc3BhdGNoLmNlbGxNb3VzZW92ZXIoZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRjZWxsTW91c2VvdXQ6IGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdF9kaXNwYXRjaC5jZWxsTW91c2VvdXQoZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRjZWxsQ2xpY2s6IGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdF9kaXNwYXRjaC5jZWxsQ2xpY2soZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRzZXJpZXNLZXk6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9LFxuXHRcdHNlcmllc0xhYmVsOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLmxhYmVsOyB9LFxuXHRcdHNlcmllc1ZhbHVlczogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0sXG5cdFx0a2V5OiBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSxcblx0XHR2YWx1ZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZTsgfVxuXHR9O1xuXG5cdC8vIEV4dGVudHNcblx0dmFyIF9leHRlbnQgPSB7XG5cdFx0eDogZXh0ZW50KCkuZ2V0VmFsdWUoX2ZuLmtleSksXG5cdFx0dmFsdWU6IGV4dGVudCgpLmdldFZhbHVlKF9mbi52YWx1ZSksXG5cdFx0bXVsdGk6IG11bHRpRXh0ZW50KClcblx0fTtcblxuXHQvLyBTY2FsZXMgZm9yIHgsIHksIGFuZCBjb2xvclxuXHR2YXIgX3NjYWxlID0ge1xuXHRcdHg6IGQzLnNjYWxlLmxpbmVhcigpLFxuXHRcdHk6IGQzLnNjYWxlLm9yZGluYWwoKSxcblx0XHRjb2xvcjogZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWycjZTdlN2U3JywgJyMwMDg1MDAnXSlcblx0fTtcblxuXHR2YXIgX2F4aXMgPSB7XG5cdFx0eDogZDMuc3ZnLmF4aXMoKS5zY2FsZShfc2NhbGUueCkub3JpZW50KCd0b3AnKS5vdXRlclRpY2tTaXplKDApLmlubmVyVGlja1NpemUoMilcblx0fTtcblxuXHR2YXIgX2VsZW1lbnQgPSB7XG5cdFx0ZGl2OiB1bmRlZmluZWQsXG5cdFx0c3ZnOiB1bmRlZmluZWQsXG5cdFx0Zzoge1xuXHRcdFx0Y2hhcnQ6IHVuZGVmaW5lZCxcblx0XHRcdHhBeGlzOiB1bmRlZmluZWRcblx0XHR9XG5cdH07XG5cblx0dmFyIF9kYXRhID0gW107XG5cblx0dmFyIF9pbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHt9O1xuXG5cdF9pbnN0YW5jZS5pbml0ID0gZnVuY3Rpb24oZDNDb250YWluZXIpIHtcblx0XHQvLyBBZGQgdGhlIHN2ZyBlbGVtZW50XG5cdFx0X2VsZW1lbnQuZGl2ID0gZDNDb250YWluZXIuYXBwZW5kKCdkaXYnKS5hdHRyKCdjbGFzcycsICdzZW50aW8gbWF0cml4Jyk7XG5cdFx0X2VsZW1lbnQuc3ZnID0gX2VsZW1lbnQuZGl2LmFwcGVuZCgnc3ZnJyk7XG5cblx0XHQvLyBBZGQgdGhlIGF4aXNcblx0XHRfZWxlbWVudC5nLnhBeGlzID0gX2VsZW1lbnQuc3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3ggYXhpcycpO1xuXG5cdFx0Ly8gQWRkIGEgZ3JvdXAgZm9yIHRoZSBjaGFydCBpdHNlbGZcblx0XHRfZWxlbWVudC5nLmNoYXJ0ID0gX2VsZW1lbnQuc3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cblx0XHRfaW5zdGFuY2UucmVzaXplKCk7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdF9pbnN0YW5jZS5kYXRhID0gZnVuY3Rpb24oZCkge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0XHRyZXR1cm4gX2RhdGE7XG5cdFx0fVxuXHRcdF9kYXRhID0gZCB8fCBbXTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdF9pbnN0YW5jZS5yZXNpemUgPSBmdW5jdGlvbigpIHsgfTtcblxuXHRfaW5zdGFuY2UucmVkcmF3ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gRGV0ZXJtaW5lIHRoZSBudW1iZXIgb2Ygcm93cyB0byByZW5kZXJcblx0XHR2YXIgcm93Q291bnQgPSBfZGF0YS5sZW5ndGg7XG5cblx0XHQvLyBEZXRlcm1pbmUgdGhlIG51bWJlciBvZiBib3hlcyB0byByZW5kZXIgKGFzc3VtZSBjb21wbGV0ZSBkYXRhKVxuXHRcdHZhciBib3hlcyA9IFtdO1xuXHRcdGlmKHJvd0NvdW50ID4gMCkge1xuXHRcdFx0Ym94ZXMgPSBfZm4uc2VyaWVzVmFsdWVzKF9kYXRhWzBdKTtcblx0XHR9XG5cdFx0dmFyIGJveENvdW50ID0gYm94ZXMubGVuZ3RoO1xuXG5cdFx0Ly8gRGltZW5zaW9ucyBvZiB0aGUgdmlzdWFsaXphdGlvblxuXHRcdHZhciBjZWxsU3BhbiA9IF9jZWxsTWFyZ2luICsgX2NlbGxTaXplO1xuXG5cdFx0Ly8gY2FsY3VsYXRlIHRoZSB3aWR0aC9oZWlnaHQgb2YgdGhlIHN2Z1xuXHRcdHZhciB3aWR0aCA9IGJveENvdW50KmNlbGxTcGFuICsgX2NlbGxNYXJnaW4sXG5cdFx0XHRoZWlnaHQgPSByb3dDb3VudCpjZWxsU3BhbiArIF9jZWxsTWFyZ2luO1xuXG5cdFx0Ly8gc2NhbGUgdGhlIHN2ZyB0byB0aGUgcmlnaHQgc2l6ZVxuXHRcdF9lbGVtZW50LnN2Z1xuXHRcdFx0LmF0dHIoJ3dpZHRoJywgd2lkdGggKyBfbWFyZ2luLmxlZnQgKyBfbWFyZ2luLnJpZ2h0KVxuXHRcdFx0LmF0dHIoJ2hlaWdodCcsIGhlaWdodCArIF9tYXJnaW4udG9wICsgX21hcmdpbi5ib3R0b20pO1xuXG5cdFx0Ly8gQ29uZmlndXJlIHRoZSBzY2FsZXNcblx0XHRfc2NhbGUueC5kb21haW4oX2V4dGVudC54LmdldEV4dGVudChib3hlcykpLnJhbmdlKFswLCB3aWR0aCAtIF9jZWxsTWFyZ2luIC0gY2VsbFNwYW5dKTtcblx0XHRfc2NhbGUuY29sb3IuZG9tYWluKF9leHRlbnQubXVsdGkudmFsdWVzKF9mbi5zZXJpZXNWYWx1ZXMpLmV4dGVudChfZXh0ZW50LnZhbHVlKS5nZXRFeHRlbnQoX2RhdGEpKTtcblxuXHRcdC8vIERyYXcgdGhlIHggYXhpc1xuXHRcdF9lbGVtZW50LmcueEF4aXMuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgKF9tYXJnaW4ubGVmdCArIF9jZWxsTWFyZ2luICsgX2NlbGxTaXplLzIpICsgXCIsXCIgKyBfbWFyZ2luLnRvcCArIFwiKVwiKTtcblx0XHRfZWxlbWVudC5nLnhBeGlzLmNhbGwoX2F4aXMueCk7XG5cblx0XHQvKipcblx0XHQgKiBDaGFydCBNYW5pcHVsYXRpb25cblx0XHQgKi9cblxuXHRcdC8qXG5cdFx0ICogUm93IEpvaW5cblx0XHQgKi9cblx0XHR2YXIgcm93ID0gX2VsZW1lbnQuZy5jaGFydC5zZWxlY3RBbGwoJ2cucm93JykuZGF0YShfZGF0YSwgX2ZuLnNlcmllc0tleSk7XG5cblx0XHQvKlxuXHRcdCAqIFJvdyBVcGRhdGUgT25seVxuXHRcdCAqL1xuXG5cdFx0Lypcblx0XHQgKiBSb3cgRW50ZXIgT25seVxuXHRcdCAqIEJ1aWxkIHRoZSByb3cgc3RydWN0dXJlXG5cdFx0ICovXG5cdFx0dmFyIHJvd0VudGVyID0gcm93LmVudGVyKCkuYXBwZW5kKCdnJyk7XG5cdFx0cm93RW50ZXJcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDAuMSlcblx0XHRcdC5hdHRyKCdjbGFzcycsICdyb3cnKVxuXHRcdFx0LmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuICd0cmFuc2xhdGUoJyArIF9tYXJnaW4ubGVmdCArICcsJyArIChfbWFyZ2luLnRvcCArIChjZWxsU3BhbippKSkgKyAnKSc7IH0pXG5cdFx0XHQub24oJ21vdXNlb3ZlcicsIF9mbi5yb3dNb3VzZW92ZXIpXG5cdFx0XHQub24oJ21vdXNlb3V0JywgX2ZuLnJvd01vdXNlb3V0KVxuXHRcdFx0Lm9uKCdjbGljaycsIF9mbi5yb3dDbGljayk7XG5cblx0XHQvLyBBbHNvIG11c3QgYXBwZW5kIHRoZSBsYWJlbCBvZiB0aGUgcm93XG5cdFx0cm93RW50ZXIuYXBwZW5kKCd0ZXh0Jylcblx0XHRcdC5hdHRyKCdjbGFzcycsICdzZXJpZXMgbGFiZWwnKVxuXHRcdFx0LnN0eWxlKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuXHRcdFx0LmF0dHIoJ3gnLCAtNilcblx0XHRcdC5hdHRyKCd5JywgX2NlbGxNYXJnaW4gKyAoX2NlbGxTaXplLzIpKVxuXHRcdFx0LmF0dHIoJ2R5JywgJy4zMmVtJyk7XG5cblx0XHQvLyBBbHNvIG11c3QgYXBwZW5kIGEgbGluZVxuXHRcdHJvd0VudGVyLmFwcGVuZCgnbGluZScpXG5cdFx0XHQuYXR0cignY2xhc3MnLCAnc2VyaWVzIHRpY2snKVxuXHRcdFx0LmF0dHIoJ3gxJywgLTMpXG5cdFx0XHQuYXR0cigneDInLCAwKVxuXHRcdFx0LmF0dHIoJ3kxJywgX2NlbGxNYXJnaW4gKyAoX2NlbGxTaXplLzIpKVxuXHRcdFx0LmF0dHIoJ3kyJywgX2NlbGxNYXJnaW4gKyAoX2NlbGxTaXplLzIpKTtcblxuXHRcdC8qXG5cdFx0ICogUm93IEVudGVyICsgVXBkYXRlXG5cdFx0ICovXG5cdFx0Ly8gVHJhbnNpdGlvbiByb3dzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbnNcblx0XHRyb3cudHJhbnNpdGlvbigpLmR1cmF0aW9uKF9kdXJhdGlvbilcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDEpXG5cdFx0XHQuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCwgaSl7XG5cdFx0XHRcdHJldHVybiAndHJhbnNsYXRlKCcgKyBfbWFyZ2luLmxlZnQgKyAnLCcgKyAoX21hcmdpbi50b3AgKyAoY2VsbFNwYW4qaSkpICsgJyknO1xuXHRcdFx0fSk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIHNlcmllcyBsYWJlbHMgaW4gY2FzZSB0aGV5IGNoYW5nZWRcblx0XHRyb3cuc2VsZWN0KCd0ZXh0LnNlcmllcy5sYWJlbCcpXG5cdFx0XHQudGV4dChfZm4uc2VyaWVzTGFiZWwpO1xuXG5cdFx0Lypcblx0XHQgKiBSb3cgRXhpdFxuXHRcdCAqL1xuXHRcdHJvdy5leGl0KClcblx0XHRcdC50cmFuc2l0aW9uKCkuZHVyYXRpb24oX2R1cmF0aW9uKVxuXHRcdFx0LnN0eWxlKCdvcGFjaXR5JywgMC4xKVxuXHRcdFx0LnJlbW92ZSgpO1xuXG5cblx0XHQvKlxuXHRcdCAqIENlbGwgSm9pbiAtIFdpbGwgYmUgZG9uZSBvbiByb3cgZW50ZXIgKyBleGl0XG5cdFx0ICovXG5cdFx0dmFyIHJvd0NlbGwgPSByb3cuc2VsZWN0QWxsKCdyZWN0LmNlbGwnKS5kYXRhKF9mbi5zZXJpZXNWYWx1ZXMsIF9mbi5rZXkpO1xuXG5cdFx0Lypcblx0XHQgKiBDZWxsIFVwZGF0ZSBPbmx5XG5cdFx0ICovXG5cblx0XHQvKlxuXHRcdCAqIENlbGwgRW50ZXIgT25seVxuXHRcdCAqL1xuXHRcdHJvd0NlbGwuZW50ZXIoKS5hcHBlbmQoJ3JlY3QnKVxuXHRcdFx0LmF0dHIoJ2NsYXNzJywgJ2NlbGwnKVxuXHRcdFx0LnN0eWxlKCdvcGFjaXR5JywgMC4xKVxuXHRcdFx0LnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gX3NjYWxlLmNvbG9yKF9mbi52YWx1ZShkLCBpKSk7IH0pXG5cdFx0XHQuYXR0cigneCcsIGZ1bmN0aW9uKGQsIGkpeyByZXR1cm4gX3NjYWxlLngoX2ZuLmtleShkLCBpKSkgKyBfY2VsbE1hcmdpbjsgfSlcblx0XHRcdC5hdHRyKCd5JywgX2NlbGxNYXJnaW4pXG5cdFx0XHQuYXR0cignaGVpZ2h0JywgX2NlbGxTaXplKVxuXHRcdFx0LmF0dHIoJ3dpZHRoJywgX2NlbGxTaXplKVxuXHRcdFx0Lm9uKCdtb3VzZW92ZXInLCBfZm4uY2VsbE1vdXNlb3Zlcilcblx0XHRcdC5vbignbW91c2VvdXQnLCBfZm4uY2VsbE1vdXNlb3V0KVxuXHRcdFx0Lm9uKCdjbGljaycsIF9mbi5jZWxsQ2xpY2spO1xuXG5cdFx0Lypcblx0XHQgKiBDZWxsIEVudGVyICsgVXBkYXRlXG5cdFx0ICogVXBkYXRlIGZpbGwsIG1vdmUgdG8gcHJvcGVyIHggY29vcmRpbmF0ZVxuXHRcdCAqL1xuXHRcdHJvd0NlbGwudHJhbnNpdGlvbigpLmR1cmF0aW9uKF9kdXJhdGlvbilcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDEpXG5cdFx0XHQuYXR0cigneCcsIGZ1bmN0aW9uKGQsIGkpeyByZXR1cm4gX3NjYWxlLngoX2ZuLmtleShkLCBpKSkgKyBfY2VsbE1hcmdpbjsgfSlcblx0XHRcdC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIF9zY2FsZS5jb2xvcihfZm4udmFsdWUoZCwgaSkpOyB9KTtcblxuXHRcdC8qXG5cdFx0ICogQ2VsbCBSZW1vdmVcblx0XHQgKi9cblx0XHRyb3dDZWxsLmV4aXQoKS50cmFuc2l0aW9uKCkuZHVyYXRpb24oX2R1cmF0aW9uKVxuXHRcdFx0LmF0dHIoJ3dpZHRoJywgMClcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDAuMSlcblx0XHRcdC5yZW1vdmUoKTtcblxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblxuXHRfaW5zdGFuY2UuY2VsbFNpemUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jZWxsU2l6ZTsgfVxuXHRcdF9jZWxsU2l6ZSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmNlbGxNYXJnaW4gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jZWxsTWFyZ2luOyB9XG5cdFx0X2NlbGxNYXJnaW4gPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5tYXJnaW4gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9tYXJnaW47IH1cblx0XHRfbWFyZ2luID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdF9pbnN0YW5jZS5kdXJhdGlvbiA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2R1cmF0aW9uOyB9XG5cdFx0X2R1cmF0aW9uID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdF9pbnN0YW5jZS5zZXJpZXNLZXkgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5zZXJpZXNLZXk7IH1cblx0XHRfZm4uc2VyaWVzS2V5ID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2Uuc2VyaWVzTGFiZWwgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5zZXJpZXNMYWJlbDsgfVxuXHRcdF9mbi5zZXJpZXNMYWJlbCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnNlcmllc1ZhbHVlcyA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLnNlcmllc1ZhbHVlczsgfVxuXHRcdF9mbi5zZXJpZXNWYWx1ZXMgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5rZXkgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5rZXk7IH1cblx0XHRfZXh0ZW50LnguZ2V0VmFsdWUodik7XG5cdFx0X2ZuLmtleSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4udmFsdWU7IH1cblx0XHRfZm4udmFsdWUgPSB2O1xuXHRcdF9leHRlbnQudmFsdWUuZ2V0VmFsdWUodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuY29sb3JTY2FsZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3NjYWxlLmNvbG9yOyB9XG5cdFx0X3NjYWxlLmNvbG9yID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UueFNjYWxlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfc2NhbGUueFNjYWxlOyB9XG5cdFx0X3NjYWxlLnhTY2FsZSA9IHY7XG5cdFx0X2F4aXMueC5zY2FsZSh2KTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UueVNjYWxlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfc2NhbGUueVNjYWxlOyB9XG5cdFx0X3NjYWxlLnlTY2FsZSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UueEV4dGVudCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2V4dGVudC54OyB9XG5cdFx0X2V4dGVudC54ID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UueUV4dGVudCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2V4dGVudC55OyB9XG5cdFx0X2V4dGVudC55ID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UudmFsdWVFeHRlbnQgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9leHRlbnQudmFsdWU7IH1cblx0XHRfZXh0ZW50LnZhbHVlID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdF9pbnN0YW5jZS5kaXNwYXRjaCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2Rpc3BhdGNoOyB9XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRyZXR1cm4gX2luc3RhbmNlO1xufVxuXG5leHBvcnQgeyBtYXRyaXggfTtcbiIsImltcG9ydCB7IGV4dGVudCB9IGZyb20gJy4uL3V0aWwvZXh0ZW50JztcblxuZnVuY3Rpb24gdmVydGljYWxCYXJzKCkge1xuXG5cdC8vIExheW91dCBwcm9wZXJ0aWVzXG5cdHZhciBfbWFyZ2luID0geyB0b3A6IDAsIHJpZ2h0OiAwLCBib3R0b206IDAsIGxlZnQ6IDAgfTtcblx0dmFyIF93aWR0aCA9IDEwMDtcblx0dmFyIF9iYXJIZWlnaHQgPSAyNDtcblx0dmFyIF9iYXJQYWRkaW5nID0gMjtcblx0dmFyIF9kdXJhdGlvbiA9IDUwMDtcblxuXHQvLyBkMyBkaXNwYXRjaGVyIGZvciBoYW5kbGluZyBldmVudHNcblx0dmFyIF9kaXNwYXRjaCA9IGQzLmRpc3BhdGNoKCdtb3VzZW92ZXInLCAnbW91c2VvdXQnLCAnY2xpY2snKTtcblx0dmFyIF9mbiA9IHtcblx0XHRtb3VzZW92ZXI6IGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdF9kaXNwYXRjaC5tb3VzZW92ZXIoZCwgdGhpcyk7XG5cdFx0fSxcblx0XHRtb3VzZW91dDogZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0X2Rpc3BhdGNoLm1vdXNlb3V0KGQsIHRoaXMpO1xuXHRcdH0sXG5cdFx0Y2xpY2s6IGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdF9kaXNwYXRjaC5jbGljayhkLCB0aGlzKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gRGVmYXVsdCBhY2Nlc3NvcnMgZm9yIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBkYXRhXG5cdHZhciBfdmFsdWUgPSB7XG5cdFx0a2V5OiBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSxcblx0XHR2YWx1ZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZTsgfSxcblx0XHRsYWJlbDogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXkgKyAnICgnICsgZC52YWx1ZSArICcpJzsgfVxuXHR9O1xuXG5cdC8vIERlZmF1bHQgc2NhbGVzIGZvciB4IGFuZCB5IGRpbWVuc2lvbnNcblx0dmFyIF9zY2FsZSA9IHtcblx0XHR4OiBkMy5zY2FsZS5saW5lYXIoKSxcblx0XHR5OiBkMy5zY2FsZS5saW5lYXIoKVxuXHR9O1xuXG5cdC8vIEV4dGVudHNcblx0dmFyIF9leHRlbnQgPSB7XG5cdFx0d2lkdGg6IGV4dGVudCh7XG5cdFx0XHRkZWZhdWx0VmFsdWU6IFswLCAxMF0sXG5cdFx0XHRnZXRWYWx1ZTogX3ZhbHVlLnZhbHVlXG5cdFx0fSlcblx0fTtcblxuXHQvLyBlbGVtZW50c1xuXHR2YXIgX2VsZW1lbnQgPSB7XG5cdFx0ZGl2OiB1bmRlZmluZWRcblx0fTtcblxuXHR2YXIgX2RhdGEgPSBbXTtcblxuXHQvLyBDaGFydCBjcmVhdGUvaW5pdCBtZXRob2Rcblx0ZnVuY3Rpb24gX2luc3RhbmNlKHNlbGVjdGlvbil7fVxuXG5cdC8qXG5cdCAqIEluaXRpYWxpemUgdGhlIGNoYXJ0IChzaG91bGQgb25seSBjYWxsIHRoaXMgb25jZSkuIFBlcmZvcm1zIGFsbCBpbml0aWFsIGNoYXJ0XG5cdCAqIGNyZWF0aW9uIGFuZCBzZXR1cFxuXHQgKi9cblx0X2luc3RhbmNlLmluaXQgPSBmdW5jdGlvbihjb250YWluZXIpe1xuXHRcdC8vIENyZWF0ZSB0aGUgRElWIGVsZW1lbnRcblx0XHRfZWxlbWVudC5kaXYgPSBjb250YWluZXIuYXBwZW5kKCdkaXYnKS5hdHRyKCdjbGFzcycsICdzZW50aW8gYmFycy12ZXJ0aWNhbCcpO1xuXHRcdF9pbnN0YW5jZS5yZXNpemUoKTtcblxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogU2V0IHRoZSBfaW5zdGFuY2UgZGF0YVxuXHQgKi9cblx0X2luc3RhbmNlLmRhdGEgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kYXRhOyB9XG5cdFx0X2RhdGEgPSB2IHx8IFtdO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBVcGRhdGVzIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBkZXBlbmQgb24gdGhlIHNpemUgb2YgdGhlIHZhcmlvdXMgY29tcG9uZW50c1xuXHQgKi9cblx0X2luc3RhbmNlLnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIFNldCB1cCB0aGUgeCBzY2FsZSAoeSBpcyBmaXhlZClcblx0XHRfc2NhbGUueC5yYW5nZShbMCwgX3dpZHRoIC0gX21hcmdpbi5yaWdodCAtIF9tYXJnaW4ubGVmdF0pO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBSZWRyYXcgdGhlIGdyYXBoaWNcblx0ICovXG5cdF9pbnN0YW5jZS5yZWRyYXcgPSBmdW5jdGlvbigpIHtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgeCBkb21haW5cblx0XHRfc2NhbGUueC5kb21haW4oX2V4dGVudC53aWR0aC5nZXRFeHRlbnQoX2RhdGEpKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgeSBkb21haW4gKGJhc2VkIG9uIGNvbmZpZ3VyYXRpb24gYW5kIGRhdGEpXG5cdFx0X3NjYWxlLnkuZG9tYWluKFswLCBfZGF0YS5sZW5ndGhdKTtcblx0XHRfc2NhbGUueS5yYW5nZShbMCwgKF9iYXJIZWlnaHQgKyBfYmFyUGFkZGluZykgKiBfZGF0YS5sZW5ndGhdKTtcblxuXHRcdC8vIERhdGEgSm9pblxuXHRcdHZhciBkaXYgPSBfZWxlbWVudC5kaXYuc2VsZWN0QWxsKCdkaXYuYmFyJylcblx0XHRcdC5kYXRhKF9kYXRhLCBfdmFsdWUua2V5KTtcblxuXHRcdC8vIFVwZGF0ZSBPbmx5XG5cblx0XHQvLyBFbnRlclxuXHRcdHZhciBiYXIgPSBkaXYuZW50ZXIoKS5hcHBlbmQoJ2RpdicpXG5cdFx0XHQuYXR0cignY2xhc3MnLCAnYmFyJylcblx0XHRcdC5zdHlsZSgndG9wJywgKF9zY2FsZS55LnJhbmdlKClbMV0gKyBfbWFyZ2luLnRvcCArIF9tYXJnaW4uYm90dG9tIC0gX2JhckhlaWdodCkgKyAncHgnKVxuXHRcdFx0LnN0eWxlKCdoZWlnaHQnLCBfYmFySGVpZ2h0ICsgJ3B4Jylcblx0XHRcdC5vbignbW91c2VvdmVyJywgX2ZuLm1vdXNlb3Zlcilcblx0XHRcdC5vbignbW91c2VvdXQnLCBfZm4ubW91c2VvdXQpXG5cdFx0XHQub24oJ2NsaWNrJywgX2ZuLmNsaWNrKVxuXHRcdFx0LnN0eWxlKCdvcGFjaXR5JywgMC4wMSk7XG5cblx0XHRiYXIuYXBwZW5kKCdkaXYnKVxuXHRcdFx0LmF0dHIoJ2NsYXNzJywgJ2Jhci1sYWJlbCcpO1xuXG5cdFx0Ly8gRW50ZXIgKyBVcGRhdGVcblx0XHRkaXYudHJhbnNpdGlvbigpLmR1cmF0aW9uKF9kdXJhdGlvbilcblx0XHRcdC5zdHlsZSgnb3BhY2l0eScsIDEpXG5cdFx0XHQuc3R5bGUoJ3dpZHRoJywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gX3NjYWxlLngoX3ZhbHVlLnZhbHVlKGQsIGkpKSArICdweCc7IH0pXG5cdFx0XHQuc3R5bGUoJ3RvcCcsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIChfc2NhbGUueShpKSArIF9tYXJnaW4udG9wKSArICdweCc7IH0pXG5cdFx0XHQuc3R5bGUoJ2xlZnQnLCBfbWFyZ2luLmxlZnQgKyAncHgnKTtcblxuXHRcdGRpdi5zZWxlY3QoJ2Rpdi5iYXItbGFiZWwnKVxuXHRcdFx0Lmh0bWwoX3ZhbHVlLmxhYmVsKVxuXHRcdFx0LnN0eWxlKCdtYXgtd2lkdGgnLCAoX3NjYWxlLngucmFuZ2UoKVsxXSAtIDEwKSArICdweCcpO1xuXG5cdFx0Ly8gRXhpdFxuXHRcdGRpdi5leGl0KClcblx0XHRcdC50cmFuc2l0aW9uKCkuZHVyYXRpb24oX2R1cmF0aW9uKVxuXHRcdFx0LnN0eWxlKCdvcGFjaXR5JywgMC4wMSlcblx0XHRcdC5zdHlsZSgndG9wJywgKF9zY2FsZS55LnJhbmdlKClbMV0gKyBfbWFyZ2luLnRvcCArIF9tYXJnaW4uYm90dG9tIC0gX2JhckhlaWdodCkgKyAncHgnIClcblx0XHRcdC5yZW1vdmUoKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgc2l6ZSBvZiB0aGUgcGFyZW50IGRpdlxuXHRcdF9lbGVtZW50LmRpdlxuXHRcdFx0LnN0eWxlKCdoZWlnaHQnLCAoX21hcmdpbi5ib3R0b20gKyBfbWFyZ2luLnRvcCArIF9zY2FsZS55LnJhbmdlKClbMV0pICsgJ3B4Jyk7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cblx0Ly8gQmFzaWMgR2V0dGVycy9TZXR0ZXJzXG5cdF9pbnN0YW5jZS53aWR0aCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3dpZHRoOyB9XG5cdFx0X3dpZHRoID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UuYmFySGVpZ2h0ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfYmFySGVpZ2h0OyB9XG5cdFx0X2JhckhlaWdodCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmJhclBhZGRpbmcgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9iYXJQYWRkaW5nOyB9XG5cdFx0X2JhclBhZGRpbmcgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5tYXJnaW4gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9tYXJnaW47IH1cblx0XHRfbWFyZ2luID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2Uua2V5ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfdmFsdWUua2V5OyB9XG5cdFx0X3ZhbHVlLmtleSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfdmFsdWUudmFsdWU7IH1cblx0XHRfdmFsdWUudmFsdWUgPSB2O1xuXHRcdF9leHRlbnQud2lkdGguZ2V0VmFsdWUodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmxhYmVsID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfdmFsdWUubGFiZWw7IH1cblx0XHRfdmFsdWUubGFiZWwgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS53aWR0aEV4dGVudCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2V4dGVudC53aWR0aDsgfVxuXHRcdF9leHRlbnQud2lkdGggPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5kaXNwYXRjaCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2Rpc3BhdGNoOyB9XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLmR1cmF0aW9uID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZHVyYXRpb247IH1cblx0XHRfZHVyYXRpb24gPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0cmV0dXJuIF9pbnN0YW5jZTtcbn1cblxuZXhwb3J0IHsgdmVydGljYWxCYXJzIH07XG4iLCJpbXBvcnQgeyBkb251dCB9IGZyb20gJy4vZG9udXQnO1xuaW1wb3J0IHsgbWF0cml4IH0gZnJvbSAnLi9tYXRyaXgnO1xuaW1wb3J0IHsgdmVydGljYWxCYXJzIH0gZnJvbSAnLi92ZXJ0aWNhbF9iYXJzJztcblxudmFyIGNoYXJ0ID0ge1xuXHRkb251dDogZG9udXQsXG5cdG1hdHJpeDogbWF0cml4LFxuXHR2ZXJ0aWNhbEJhcnM6IHZlcnRpY2FsQmFyc1xufTtcblxuZXhwb3J0IHsgY2hhcnQgfTtcbiIsImZ1bmN0aW9uIGJpbnMoY29uZmlnKSB7XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgdmFyaWFibGVzXG5cdCAqL1xuXHQvLyBDb25maWd1cmF0aW9uXG5cdHZhciBfY29uZmlnID0ge1xuXHRcdC8vIFRoZSBudW1iZXIgb2YgYmlucyBpbiBvdXIgbW9kZWxcblx0XHRjb3VudDogMSxcblxuXHRcdC8vIFRoZSBzaXplIG9mIGEgYmluIGluIGtleSB2YWx1ZSB1bml0c1xuXHRcdHNpemU6IHVuZGVmaW5lZCxcblxuXHRcdC8vIFRoZSBtaW4gYW5kIG1heCBiaW5zXG5cdFx0bHdtOiB1bmRlZmluZWQsXG5cdFx0aHdtOiB1bmRlZmluZWRcblx0fTtcblxuXHR2YXIgX2ZuID0ge1xuXHRcdC8vIFRoZSBkZWZhdWx0IGZ1bmN0aW9uIGZvciBjcmVhdGluZyB0aGUgc2VlZCB2YWx1ZSBmb3IgYSBiaW5cblx0XHRjcmVhdGVTZWVkOiBmdW5jdGlvbigpIHsgcmV0dXJuIFtdOyB9LFxuXG5cdFx0Ly8gVGhlIGRlZmF1bHQga2V5IGZ1bmN0aW9uXG5cdFx0Z2V0S2V5OiBmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuXG5cdFx0Ly8gVGhlIGRlZmF1bHQgdmFsdWUgZnVuY3Rpb25cblx0XHRnZXRWYWx1ZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcblxuXHRcdC8vIFRoZSBkZWZhdWx0IGZ1bmN0aW9uIGZvciB1cGRhdGluZyBhIGJpbiBnaXZlbiBhIG5ldyB2YWx1ZVxuXHRcdHVwZGF0ZUJpbjogZnVuY3Rpb24oYmluLCBkKSB7IGJpblsxXS5wdXNoKGQpOyB9LFxuXG5cdFx0Ly8gVGhlIGRlZmF1bHQgZnVuY3Rpb24gZm9yIGNvdW50aW5nIHRoZSBjb250ZW50cyBvZiB0aGUgYmlucyAoaW5jbHVkZXMgY29kZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSlcblx0XHRjb3VudEJpbjogZnVuY3Rpb24oYmluKSB7XG5cdFx0XHQvLyBJZiB0aGUgYmluIGNvbnRhaW5zIGEgbnVtYmVyLCBqdXN0IHJldHVybiBpdFxuXHRcdFx0aWYgKHR5cGVvZiBiaW5bMV0gPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdHJldHVybiBiaW5bMV07XG5cdFx0XHR9XG5cdFx0XHQvLyBJZiB0aGUgYmluIGNvbnRhaW5zIGFuIGFycmF5IG9mIGRhdGEsIHJldHVybiB0aGUgbnVtYmVyIG9mIGl0ZW1zXG5cdFx0XHRpZiAoYmluWzFdLmhhc093blByb3BlcnR5KCdsZW5ndGgnKSkge1xuXHRcdFx0XHRyZXR1cm4gYmluWzFdLmxlbmd0aDtcblx0XHRcdH1cblx0XHRcdHJldHVybiAwO1xuXHRcdH0sXG5cblx0XHQvLyBUaGUgZGVmYXVsdCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgYWZ0ZXIgaXRlbXMgYXJlIGFkZGVkIHRvIHRoZSBiaW5zXG5cdFx0YWZ0ZXJBZGQ6IGZ1bmN0aW9uKGJpbnMsIGN1cnJlbnRDb3VudCwgcHJldmlvdXNDb3VudCkge30sXG5cblx0XHQvLyBUaGUgZGVmYXVsdCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGJpbnMgYXJlIHVwZGF0ZWRcblx0XHRhZnRlclVwZGF0ZTogZnVuY3Rpb24oYmlucywgY3VycmVudENvdW50LCBwcmV2aW91c0NvdW50KSB7fVxuXHR9O1xuXG5cdC8vIFRoZSBkYXRhIChhbiBhcnJheSBvZiBvYmplY3QgY29udGFpbmVycylcblx0dmFyIF9kYXRhID0gW107XG5cblx0Ly8gQSBjYWNoZWQgdG90YWwgY291bnQgb2YgYWxsIHRoZSBvYmplY3RzIGluIHRoZSBiaW5zXG5cdHZhciBfZGF0YUNvdW50ID0gMDtcblxuXG5cdC8qKlxuXHQgKiBQcml2YXRlIEZ1bmN0aW9uc1xuXHQgKi9cblxuXHQvLyBHZXQgdGhlIGluZGV4IGdpdmVuIHRoZSB2YWx1ZVxuXHRmdW5jdGlvbiBnZXRJbmRleCh2KSB7XG5cdFx0aWYobnVsbCA9PSBfY29uZmlnLnNpemUgfHwgbnVsbCA9PSBfY29uZmlnLmx3bSkge1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIE1hdGguZmxvb3IoKHYgLSBfY29uZmlnLmx3bSkvX2NvbmZpZy5zaXplKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbGN1bGF0ZUh3bSgpIHtcblx0XHRfY29uZmlnLmh3bSA9IF9jb25maWcubHdtICsgKF9jb25maWcuY291bnQgKiBfY29uZmlnLnNpemUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlU3RhdGUoKSB7XG5cdFx0dmFyIGJpbjtcblx0XHR2YXIgcHJldkNvdW50ID0gX2RhdGFDb3VudDtcblxuXHRcdC8vIGRyb3Agc3R1ZmYgYmVsb3cgdGhlIGx3bVxuXHRcdHdoaWxlKF9kYXRhLmxlbmd0aCA+IDAgJiYgX2RhdGFbMF1bMF0gPCBfY29uZmlnLmx3bSkge1xuXHRcdFx0YmluID0gX2RhdGEuc2hpZnQoKTtcblx0XHRcdF9kYXRhQ291bnQgLT0gX2ZuLmNvdW50QmluKGJpbik7XG5cdFx0fVxuXG5cdFx0Ly8gZHJvcCBzdHVmZiBhYm92ZSB0aGUgaHdtXG5cdFx0d2hpbGUoX2RhdGEubGVuZ3RoID4gMCAmJiBfZGF0YVtfZGF0YS5sZW5ndGggLSAxXVswXSA+PSBfY29uZmlnLmh3bSkge1xuXHRcdFx0YmluID0gX2RhdGEucG9wKCk7XG5cdFx0XHRfZGF0YUNvdW50IC09IF9mbi5jb3VudEJpbihiaW4pO1xuXHRcdH1cblxuXHRcdC8vIGlmIHdlIGVtcHRpZWQgdGhlIGFycmF5LCBhZGQgYW4gZWxlbWVudCBmb3IgdGhlIGx3bVxuXHRcdGlmKF9kYXRhLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0X2RhdGEucHVzaChbX2NvbmZpZy5sd20sIF9mbi5jcmVhdGVTZWVkKCldKTtcblx0XHR9XG5cblx0XHQvLyBmaWxsIGluIGFueSBtaXNzaW5nIHZhbHVlcyBmcm9tIHRoZSBsb3dlc3QgYmluIHRvIHRoZSBsd21cblx0XHRmb3IodmFyIGk9X2RhdGFbMF1bMF0gLSBfY29uZmlnLnNpemU7IGkgPj0gX2NvbmZpZy5sd207IGkgLT0gX2NvbmZpZy5zaXplKSB7XG5cdFx0XHRfZGF0YS51bnNoaWZ0KFtpLCBfZm4uY3JlYXRlU2VlZCgpXSk7XG5cdFx0fVxuXG5cdFx0Ly8gcGFkIGFib3ZlIHRoZSBod21cblx0XHR3aGlsZShfZGF0YVtfZGF0YS5sZW5ndGggLSAxXVswXSA8IF9jb25maWcuaHdtIC0gX2NvbmZpZy5zaXplKSB7XG5cdFx0XHRfZGF0YS5wdXNoKFtfZGF0YVtfZGF0YS5sZW5ndGgtMV1bMF0gKyBfY29uZmlnLnNpemUsIF9mbi5jcmVhdGVTZWVkKCldKTtcblx0XHR9XG5cdFx0aWYgKF9mbi5hZnRlclVwZGF0ZSkge1xuXHRcdFx0X2ZuLmFmdGVyVXBkYXRlLmNhbGwobW9kZWwsIF9kYXRhLCBfZGF0YUNvdW50LCBwcmV2Q291bnQpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFkZERhdGEoZGF0YVRvQWRkKSB7XG5cdFx0dmFyIHByZXZDb3VudCA9IF9kYXRhQ291bnQ7XG5cblx0XHRkYXRhVG9BZGQuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG5cdFx0XHR2YXIgaSA9IGdldEluZGV4KF9mbi5nZXRLZXkoZWxlbWVudCkpO1xuXHRcdFx0aWYoaSA+PSAwICYmIGkgPCBfZGF0YS5sZW5ndGgpIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gX2ZuLmdldFZhbHVlKGVsZW1lbnQpO1xuXHRcdFx0XHR2YXIgcHJldkJpbkNvdW50ID0gX2ZuLmNvdW50QmluKF9kYXRhW2ldKTtcblx0XHRcdFx0X2ZuLnVwZGF0ZUJpbi5jYWxsKG1vZGVsLCBfZGF0YVtpXSwgdmFsdWUpO1xuXHRcdFx0XHRfZGF0YUNvdW50ICs9IF9mbi5jb3VudEJpbihfZGF0YVtpXSkgLSBwcmV2QmluQ291bnQ7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0aWYgKF9mbi5hZnRlckFkZCkge1xuXHRcdFx0X2ZuLmFmdGVyQWRkLmNhbGwobW9kZWwsIF9kYXRhLCBfZGF0YUNvdW50LCBwcmV2Q291bnQpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGNsZWFyRGF0YSgpIHtcblx0XHRfZGF0YS5sZW5ndGggPSAwO1xuXHRcdF9kYXRhQ291bnQgPSAwO1xuXHR9XG5cblxuXHQvKlxuXHQgKiBDb25zdHJ1Y3Rvci9pbml0aWFsaXphdGlvbiBtZXRob2Rcblx0ICovXG5cdGZ1bmN0aW9uIG1vZGVsKGJpbkNvbmZpZykge1xuXHRcdGlmKG51bGwgPT0gYmluQ29uZmlnIHx8IG51bGwgPT0gYmluQ29uZmlnLnNpemUgfHwgbnVsbCA9PSBiaW5Db25maWcuY291bnQgfHwgbnVsbCA9PSBiaW5Db25maWcubHdtKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IHByb3ZpZGUgYW4gaW5pdGlhbCBzaXplLCBjb3VudCwgYW5kIGx3bScpO1xuXHRcdH1cblx0XHRfY29uZmlnLnNpemUgPSBOdW1iZXIoYmluQ29uZmlnLnNpemUpO1xuXHRcdF9jb25maWcuY291bnQgPSBOdW1iZXIoYmluQ29uZmlnLmNvdW50KTtcblx0XHRfY29uZmlnLmx3bSA9IE51bWJlcihiaW5Db25maWcubHdtKTtcblxuXHRcdGlmKG51bGwgIT0gYmluQ29uZmlnLmNyZWF0ZVNlZWQpIHsgX2ZuLmNyZWF0ZVNlZWQgPSBiaW5Db25maWcuY3JlYXRlU2VlZDsgfVxuXHRcdGlmKG51bGwgIT0gYmluQ29uZmlnLmdldEtleSkgeyBfZm4uZ2V0S2V5ID0gYmluQ29uZmlnLmdldEtleTsgfVxuXHRcdGlmKG51bGwgIT0gYmluQ29uZmlnLmdldFZhbHVlKSB7IF9mbi5nZXRWYWx1ZSA9IGJpbkNvbmZpZy5nZXRWYWx1ZTsgfVxuXHRcdGlmKG51bGwgIT0gYmluQ29uZmlnLnVwZGF0ZUJpbikgeyBfZm4udXBkYXRlQmluID0gYmluQ29uZmlnLnVwZGF0ZUJpbjsgfVxuXHRcdGlmKG51bGwgIT0gYmluQ29uZmlnLmNvdW50QmluKSB7IF9mbi5jb3VudEJpbiA9IGJpbkNvbmZpZy5jb3VudEJpbjsgfVxuXHRcdGlmKG51bGwgIT0gYmluQ29uZmlnLmFmdGVyQWRkKSB7IF9mbi5hZnRlckFkZCA9IGJpbkNvbmZpZy5hZnRlckFkZDsgfVxuXHRcdGlmKG51bGwgIT0gYmluQ29uZmlnLmFmdGVyVXBkYXRlKSB7IF9mbi5hZnRlclVwZGF0ZSA9IGJpbkNvbmZpZy5hZnRlclVwZGF0ZTsgfVxuXG5cdFx0Y2FsY3VsYXRlSHdtKCk7XG5cdFx0dXBkYXRlU3RhdGUoKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIFB1YmxpYyBBUElcblx0ICovXG5cblx0LyoqXG5cdCAqIFJlc2V0cyB0aGUgbW9kZWwgd2l0aCB0aGUgbmV3IGRhdGFcblx0ICovXG5cdG1vZGVsLnNldCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRjbGVhckRhdGEoKTtcblx0XHR1cGRhdGVTdGF0ZSgpO1xuXHRcdGFkZERhdGEoZGF0YSk7XG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBDbGVhcnMgdGhlIGRhdGEgY3VycmVudGx5IGluIHRoZSBiaW4gbW9kZWxcblx0ICovXG5cdG1vZGVsLmNsZWFyID0gZnVuY3Rpb24oKSB7XG5cdFx0Y2xlYXJEYXRhKCk7XG5cdFx0dXBkYXRlU3RhdGUoKTtcblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFkZCBhbiBhcnJheSBvZiBkYXRhIG9iamVjdHMgdG8gdGhlIGJpbnNcblx0ICovXG5cdG1vZGVsLmFkZCA9IGZ1bmN0aW9uKGRhdGFUb0FkZCkge1xuXHRcdGFkZERhdGEoZGF0YVRvQWRkKTtcblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIGxvdyB3YXRlciBtYXJrIHZhbHVlXG5cdCAqL1xuXHRtb2RlbC5sd20gPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jb25maWcubHdtOyB9XG5cblx0XHR2YXIgb2xkTHdtID0gX2NvbmZpZy5sd207XG5cdFx0X2NvbmZpZy5sd20gPSBOdW1iZXIodik7XG5cblx0XHRjYWxjdWxhdGVId20oKTtcblxuXHRcdGlmKChvbGRMd20gLSBfY29uZmlnLmx3bSkgJSBfY29uZmlnLnNpemUgIT09IDApIHtcblx0XHRcdC8vIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gd2F0ZXJtYXJrcyBpcyBub3QgYSBtdWx0aXBsZSBvZiB0aGUgYmluIHNpemUsIHNvIHdlIG5lZWQgdG8gcmVzZXRcblx0XHRcdGNsZWFyRGF0YSgpO1xuXHRcdH1cblxuXHRcdHVwZGF0ZVN0YXRlKCk7XG5cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgaGlnaCB3YXRlciBtYXJrXG5cdCAqL1xuXHRtb2RlbC5od20gPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2NvbmZpZy5od207XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIGtleSBmdW5jdGlvbiB1c2VkIHRvIGRldGVybWluZSB0aGUga2V5IHZhbHVlIGZvciBpbmRleGluZyBpbnRvIHRoZSBiaW5zXG5cdCAqL1xuXHRtb2RlbC5nZXRLZXkgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mbi5nZXRLZXk7IH1cblx0XHRfZm4uZ2V0S2V5ID0gdjtcblxuXHRcdGNsZWFyRGF0YSgpO1xuXHRcdHVwZGF0ZVN0YXRlKCk7XG5cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIHZhbHVlIGZ1bmN0aW9uIGZvciBkZXRlcm1pbmluZyB3aGF0IHZhbHVlIGlzIGFkZGVkIHRvIHRoZSBiaW5cblx0ICovXG5cdG1vZGVsLmdldFZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4uZ2V0VmFsdWU7IH1cblx0XHRfZm4uZ2V0VmFsdWUgPSB2O1xuXG5cdFx0Y2xlYXJEYXRhKCk7XG5cdFx0dXBkYXRlU3RhdGUoKTtcblxuXHRcdHJldHVybiBtb2RlbDtcblx0fTtcblxuXHQvKipcblx0ICogR2V0L1NldCB0aGUgVXBkYXRlIGJpbiBmdW5jdGlvbiBmb3IgZGV0ZXJtaW5pbmcgaG93IHRvIHVwZGF0ZSB0aGUgc3RhdGUgb2YgYSBiaW4gd2hlbiBhIG5ldyB2YWx1ZSBpcyBhZGRlZCB0byBpdFxuXHQgKi9cblx0bW9kZWwudXBkYXRlQmluID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4udXBkYXRlQmluOyB9XG5cdFx0X2ZuLnVwZGF0ZUJpbiA9IHY7XG5cblx0XHRjbGVhckRhdGEoKTtcblx0XHR1cGRhdGVTdGF0ZSgpO1xuXG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQvU2V0IHRoZSBzZWVkIGZ1bmN0aW9uIGZvciBwb3B1bGF0aW5nXG5cdCAqL1xuXHRtb2RlbC5jcmVhdGVTZWVkID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZm4uY3JlYXRlU2VlZDsgfVxuXHRcdF9mbi5jcmVhdGVTZWVkID0gdjtcblxuXHRcdGNsZWFyRGF0YSgpO1xuXHRcdHVwZGF0ZVN0YXRlKCk7XG5cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIGNvdW50QmluIGZ1bmN0aW9uIGZvciBwb3B1bGF0aW5nXG5cdCAqL1xuXHRtb2RlbC5jb3VudEJpbiA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmNvdW50QmluOyB9XG5cdFx0X2ZuLmNvdW50QmluID0gdjtcblxuXHRcdGNsZWFyRGF0YSgpO1xuXHRcdHVwZGF0ZVN0YXRlKCk7XG5cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIGFmdGVyQWRkIGNhbGxiYWNrIGZ1bmN0aW9uXG5cdCAqL1xuXHRtb2RlbC5hZnRlckFkZCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmFmdGVyQWRkOyB9XG5cdFx0X2ZuLmFmdGVyQWRkID0gdjtcblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIGFmdGVyVXBkYXRlIGNhbGxiYWNrIGZ1bmN0aW9uXG5cdCAqL1xuXHRtb2RlbC5hZnRlclVwZGF0ZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2ZuLmFmdGVyVXBkYXRlOyB9XG5cdFx0X2ZuLmFmdGVyVXBkYXRlID0gdjtcblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIGJpbiBzaXplIGNvbmZpZ3VyYXRpb25cblx0ICovXG5cdG1vZGVsLnNpemUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jb25maWcuc2l6ZTsgfVxuXG5cdFx0diA9IE51bWJlcih2KTtcblx0XHRpZih2IDwgMSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdCaW4gc2l6ZSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcicpO1xuXHRcdH1cblxuXHRcdC8vIE9ubHkgY2hhbmdlIHN0dWZmIGlmIHRoZSBzaXplIGFjdHVhbGx5IGNoYW5nZXNcblx0XHRpZih2ICE9PSBfY29uZmlnLnNpemUpIHtcblx0XHRcdF9jb25maWcuc2l6ZSA9IHY7XG5cdFx0XHRjYWxjdWxhdGVId20oKTtcblx0XHRcdGNsZWFyRGF0YSgpO1xuXHRcdFx0dXBkYXRlU3RhdGUoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldC9TZXQgdGhlIGJpbiBjb3VudCBjb25maWd1cmF0aW9uXG5cdCAqL1xuXHRtb2RlbC5jb3VudCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2NvbmZpZy5jb3VudDsgfVxuXG5cdFx0diA9IE51bWJlcih2KTtcblx0XHRpZih2IDwgMSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdCaW4gY291bnQgbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXInKTtcblx0XHR9XG5cblx0XHQvLyBPbmx5IGNoYW5nZSBzdHVmZiBpZiB0aGUgY291bnQgYWN0dWFsbHkgY2hhbmdlc1xuXHRcdGlmKHYgIT09IF9jb25maWcuY291bnQpIHtcblx0XHRcdF9jb25maWcuY291bnQgPSBNYXRoLmZsb29yKHYpO1xuXHRcdFx0Y2FsY3VsYXRlSHdtKCk7XG5cdFx0XHR1cGRhdGVTdGF0ZSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBtb2RlbDtcblx0fTtcblxuXHQvKipcblx0ICogQWNjZXNzb3IgZm9yIHRoZSBiaW5zIG9mIGRhdGFcblx0ICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBjb21wbGV0ZSBhcnJheSBvZiBiaW5zXG5cdCAqL1xuXHRtb2RlbC5iaW5zID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9kYXRhO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBY2Nlc3NvciBmb3IgdGhlIGNhY2hlZCBjb3VudCBvZiBhbGwgdGhlIGRhdGEgaW4gdGhlIGJpbnMsIGNhbGN1bGF0ZWQgZm9yIGVhY2ggYmluIGJ5IHRoZSBjb3VudEJpbigpIGZ1bmN0aW9uXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBjb3VudCBvZiBkYXRhIGluIHRoZSBiaW5zXG5cdCAqL1xuXHRtb2RlbC5pdGVtQ291bnQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2RhdGFDb3VudDtcblx0fTtcblxuXHQvKipcblx0ICogQ2xlYXJzIGFsbCB0aGUgZGF0YSBpbiB0aGUgYmluIHdpdGggdGhlIGdpdmVuIGluZGV4XG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBpIFRoZSBpbmRleCBpbnRvIHRoZSBiaW5zIGFycmF5IG9mIHRoZSBiaW4gdG8gY2xlYXJcblx0ICogQHJldHVybnMge251bWJlcn0gVGhlIG51bWJlciBvZiBpdGVtcyBpbiB0aGUgYmluIHRoYXQgd2FzIGNsZWFyZWQsIGFzIHJldHVybmVkIGJ5IGNvdW50QmluKCkgZnVuY3Rpb25cblx0ICovXG5cdG1vZGVsLmNsZWFyQmluID0gZnVuY3Rpb24oaSkge1xuXHRcdGlmIChpID49IDAgJiYgaSA8IF9kYXRhLmxlbmd0aCkge1xuXHRcdFx0dmFyIGNvdW50ID0gX2ZuLmNvdW50QmluKF9kYXRhW2ldKTtcblx0XHRcdF9kYXRhQ291bnQgLT0gY291bnQ7XG5cdFx0XHRfZGF0YVtpXVsxXSA9IF9mbi5jcmVhdGVTZWVkKCk7XG5cdFx0XHRyZXR1cm4gY291bnQ7XG5cdFx0fVxuXHRcdHJldHVybiAwO1xuXHR9O1xuXG5cdC8vIEluaXRpYWxpemUgdGhlIG1vZGVsXG5cdG1vZGVsKGNvbmZpZyk7XG5cblx0cmV0dXJuIG1vZGVsO1xufVxuXG5leHBvcnQgeyBiaW5zIH07XG4iLCJpbXBvcnQgeyBiaW5zIH0gZnJvbSAnLi4vbW9kZWwvYmlucyc7XG5cbi8qXG4gKiBDb250cm9sbGVyIHdyYXBwZXIgZm9yIHRoZSBiaW4gbW9kZWwuIEFzc3VtZXMgYmluU2l6ZSBpcyBpbiBtaWxsaXNlY29uZHMuXG4gKiBFdmVyeSB0aW1lIGJpblNpemUgZWxhcHNlcywgdXBkYXRlcyB0aGUgbHdtIHRvIGtlZXAgdGhlIGJpbnMgc2hpZnRpbmcuXG4gKi9cbmZ1bmN0aW9uIHJ0Qmlucyhjb25maWcpIHtcblxuXHQvKipcblx0ICogUHJpdmF0ZSB2YXJpYWJsZXNcblx0ICovXG5cdHZhciBfY29uZmlnID0ge1xuXHRcdGRlbGF5OiAwLFxuXHRcdGJpblNpemU6IDAsXG5cdFx0YmluQ291bnQ6IDBcblx0fTtcblxuXHQvLyBUaGUgYmluc1xuXHR2YXIgX21vZGVsO1xuXHR2YXIgX3J1bm5pbmc7XG5cblx0LyoqXG5cdCAqIFByaXZhdGUgRnVuY3Rpb25zXG5cdCAqL1xuXG5cdGZ1bmN0aW9uIF9jYWxjdWxhdGVMd20oKSB7XG5cdFx0Ly8gQXNzdW1lIHRoZSBod20gaXMgbm93IHBsdXMgdHdvIGJpblNpemVcblx0XHR2YXIgaHdtID0gRGF0ZS5ub3coKSArIDIqX21vZGVsLnNpemUoKTtcblxuXHRcdC8vIFRydW5jIHRoZSBod20gZG93biB0byBhIHJvdW5kIHZhbHVlIGJhc2VkIG9uIHRoZSBiaW5TaXplXG5cdFx0aHdtID0gTWF0aC5mbG9vcihod20vX21vZGVsLnNpemUoKSkgKiBfbW9kZWwuc2l6ZSgpO1xuXG5cdFx0Ly8gRGVyaXZlIHRoZSBsd20gZnJvbSB0aGUgaHdtXG5cdFx0dmFyIGx3bSA9IGh3bSAtIF9tb2RlbC5zaXplKCkgKiBfbW9kZWwuY291bnQoKTtcblxuXHRcdHJldHVybiBsd207XG5cdH1cblxuXHRmdW5jdGlvbiBfdXBkYXRlKCkge1xuXHRcdGlmKF9ydW5uaW5nID09PSB0cnVlKSB7XG5cdFx0XHQvLyBuZWVkIHRvIHVwZGF0ZSB0aGUgbHdtXG5cdFx0XHRfbW9kZWwubHdtKF9jYWxjdWxhdGVMd20oKSk7XG5cdFx0XHR3aW5kb3cuc2V0VGltZW91dChfdXBkYXRlLCBfbW9kZWwuc2l6ZSgpKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBfc3RhcnQoKSB7XG5cdFx0aWYoIV9ydW5uaW5nKSB7XG5cdFx0XHQvLyBTdGFydCB0aGUgdXBkYXRlIGxvb3Bcblx0XHRcdF9ydW5uaW5nID0gdHJ1ZTtcblx0XHRcdF91cGRhdGUoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBfc3RvcCgpIHtcblx0XHQvLyBTZXR0aW5nIHJ1bm5pbmcgdG8gZmFsc2Ugd2lsbCBzdG9wIHRoZSB1cGRhdGUgbG9vcFxuXHRcdF9ydW5uaW5nID0gZmFsc2U7XG5cdH1cblxuXHQvLyBjcmVhdGUvaW5pdCBtZXRob2Rcblx0ZnVuY3Rpb24gY29udHJvbGxlcihydENvbmZpZykge1xuXHRcdGlmKG51bGwgPT0gcnRDb25maWcgfHwgbnVsbCA9PSBydENvbmZpZy5iaW5Db3VudCB8fCBudWxsID09IHJ0Q29uZmlnLmJpblNpemUpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignWW91IG11c3QgcHJvdmlkZSBhbiBpbml0aWFsIGJpblNpemUgYW5kIGJpbkNvdW50Jyk7XG5cdFx0fVxuXG5cdFx0X2NvbmZpZy5iaW5TaXplID0gTnVtYmVyKHJ0Q29uZmlnLmJpblNpemUpO1xuXHRcdF9jb25maWcuYmluQ291bnQgPSBOdW1iZXIocnRDb25maWcuYmluQ291bnQpO1xuXG5cdFx0aWYobnVsbCAhPSBydENvbmZpZy5kZWxheSkge1xuXHRcdFx0X2NvbmZpZy5kZWxheSA9IE51bWJlcihydENvbmZpZy5kZWxheSk7XG5cdFx0fVxuXG5cdFx0X21vZGVsID0gYmlucyh7XG5cdFx0XHRzaXplOiBfY29uZmlnLmJpblNpemUsXG5cdFx0XHRjb3VudDogX2NvbmZpZy5iaW5Db3VudCArIDIsXG5cdFx0XHRsd206IDBcblx0XHR9KTtcblx0XHRfbW9kZWwubHdtKF9jYWxjdWxhdGVMd20oKSk7XG5cblx0XHRfc3RhcnQoKTtcblx0fVxuXG5cblxuXHQvKipcblx0ICogUHVibGljIEFQSVxuXHQgKi9cblxuXHQvKlxuXHQgKiBHZXQgdGhlIG1vZGVsIGJpbnNcblx0ICovXG5cdGNvbnRyb2xsZXIubW9kZWwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX21vZGVsO1xuXHR9O1xuXG5cdGNvbnRyb2xsZXIuYmlucyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfbW9kZWwuYmlucygpO1xuXHR9O1xuXG5cdGNvbnRyb2xsZXIuc3RhcnQgPSBmdW5jdGlvbigpIHtcblx0XHRfc3RhcnQoKTtcblx0XHRyZXR1cm4gY29udHJvbGxlcjtcblx0fTtcblxuXHRjb250cm9sbGVyLnN0b3AgPSBmdW5jdGlvbigpIHtcblx0XHRfc3RvcCgpO1xuXHRcdHJldHVybiBjb250cm9sbGVyO1xuXHR9O1xuXG5cdGNvbnRyb2xsZXIucnVubmluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfcnVubmluZztcblx0fTtcblxuXHRjb250cm9sbGVyLmFkZCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRfbW9kZWwuYWRkKHYpO1xuXHRcdHJldHVybiBjb250cm9sbGVyO1xuXHR9O1xuXG5cdGNvbnRyb2xsZXIuY2xlYXIgPSBmdW5jdGlvbigpIHtcblx0XHRfbW9kZWwuY2xlYXIoKTtcblx0XHRyZXR1cm4gY29udHJvbGxlcjtcblx0fTtcblxuXHRjb250cm9sbGVyLmJpblNpemUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9jb25maWcuYmluU2l6ZTsgfVxuXG5cdFx0diA9IE51bWJlcih2KTtcblx0XHRpZih2IDwgMSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdCaW4gc2l6ZSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcicpO1xuXHRcdH1cblxuXHRcdF9jb25maWcuYmluU2l6ZSA9IHY7XG5cdFx0X21vZGVsLnNpemUodik7XG5cdFx0X21vZGVsLmx3bShfY2FsY3VsYXRlTHdtKCkpO1xuXG5cdFx0cmV0dXJuIGNvbnRyb2xsZXI7XG5cdH07XG5cblx0Y29udHJvbGxlci5iaW5Db3VudCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2NvbmZpZy5iaW5Db3VudDsgfVxuXG5cdFx0diA9IE51bWJlcih2KTtcblx0XHRpZih2IDwgMSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdCaW4gY291bnQgbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXInKTtcblx0XHR9XG5cblx0XHRfY29uZmlnLmJpbkNvdW50ID0gdjtcblx0XHRfbW9kZWwuY291bnQodiArIDIpO1xuXHRcdF9tb2RlbC5sd20oX2NhbGN1bGF0ZUx3bSgpKTtcblxuXHRcdHJldHVybiBjb250cm9sbGVyO1xuXHR9O1xuXG5cdC8vIEluaXRpYWxpemUgdGhlIGxheW91dFxuXHRjb250cm9sbGVyKGNvbmZpZyk7XG5cblx0cmV0dXJuIGNvbnRyb2xsZXI7XG59XG5cbmV4cG9ydCB7IHJ0QmlucyB9O1xuIiwiaW1wb3J0IHsgcnRCaW5zIH0gZnJvbSAnLi9yZWFsdGltZV9iaW5zJztcblxudmFyIGNvbnRyb2xsZXIgPSB7IHJ0QmluczogcnRCaW5zIH07XG5cbmV4cG9ydCB7IGNvbnRyb2xsZXIgfTtcbiIsImltcG9ydCB7IGJpbnMgfSBmcm9tICcuL2JpbnMnO1xuXG52YXIgbW9kZWwgPSB7XG5cdGJpbnM6IGJpbnNcbn07XG5cbmV4cG9ydCB7IG1vZGVsIH07XG4iLCJmdW5jdGlvbiB0aW1lbGluZUZpbHRlcihjb25maWcpIHtcblxuXHQvKipcblx0ICogUHJpdmF0ZSB2YXJpYWJsZXNcblx0ICovXG5cblx0dmFyIF9icnVzaCA9IGQzLnN2Zy5icnVzaCgpO1xuXHR2YXIgX2VuYWJsZWQgPSBmYWxzZTtcblxuXHQvKipcblx0ICogUHJpdmF0ZSBGdW5jdGlvbnNcblx0ICovXG5cblx0ZnVuY3Rpb24gc2V0QnJ1c2godikge1xuXHRcdF9icnVzaCA9IHY7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRFbmFibGVkKHYpIHtcblx0XHRfZW5hYmxlZCA9IHY7XG5cdH1cblxuXHQvKlxuXHQgKiBHZXQgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGZpbHRlclxuXHQgKiBSZXR1cm5zIHVuZGVmaW5lZCBpZiB0aGUgZmlsdGVyIGlzIGRpc2FibGVkIG9yIG5vdCBzZXQsIG1pbGxpc2Vjb25kIHRpbWUgb3RoZXJ3aXNlXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRGaWx0ZXIoKSB7XG5cdFx0dmFyIGV4dGVudDtcblx0XHRpZihfZW5hYmxlZCAmJiAhX2JydXNoLmVtcHR5KCkpIHtcblx0XHRcdGV4dGVudCA9IF9icnVzaC5leHRlbnQoKTtcblx0XHRcdGlmKG51bGwgIT0gZXh0ZW50KSB7XG5cdFx0XHRcdGV4dGVudCA9IFsgZXh0ZW50WzBdLmdldFRpbWUoKSwgZXh0ZW50WzFdLmdldFRpbWUoKSBdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBleHRlbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBjbGVhbkZpbHRlcihmaWx0ZXIpIHtcblx0XHRpZighQXJyYXkuaXNBcnJheShmaWx0ZXIpIHx8IGZpbHRlci5sZW5ndGggIT0gMiB8fCBpc05hTihmaWx0ZXJbMF0pIHx8IGlzTmFOKGZpbHRlclsxXSkpIHtcblx0XHRcdGZpbHRlciA9IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmlsdGVyO1xuXHR9XG5cblx0Lypcblx0ICogU2V0IHRoZSBzdGF0ZSBvZiB0aGUgZmlsdGVyLCByZXR1cm4gdHJ1ZSBpZiBmaWx0ZXIgY2hhbmdlZFxuXHQgKi9cblx0ZnVuY3Rpb24gc2V0RmlsdGVyKG5lLCBvZSkge1xuXHRcdHZhciBvZSA9IGNsZWFuRmlsdGVyKG9lKTtcblx0XHRuZSA9IGNsZWFuRmlsdGVyKG5lKTtcblxuXHRcdC8vIEZpcmUgdGhlIGV2ZW50IGlmIHRoZSBleHRlbnRzIGFyZSBkaWZmZXJlbnRcblx0XHR2YXIgc3VwcHJlc3NFdmVudCA9IG5lID09PSBvZSB8fCAobnVsbCAhPSBuZSAmJiBudWxsICE9IG9lICYmIG5lWzBdID09PSBvZVswXSAmJiBuZVsxXSA9PT0gb2VbMV0pO1xuXHRcdHZhciBjbGVhckZpbHRlciA9IChudWxsID09IG5lIHx8IG5lWzBdID49IG5lWzFdKTtcblxuXHRcdC8vIGVpdGhlciBjbGVhciB0aGUgZmlsdGVyIG9yIGFzc2VydCBpdFxuXHRcdGlmKGNsZWFyRmlsdGVyKSB7XG5cdFx0XHRfYnJ1c2guY2xlYXIoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0X2JydXNoLmV4dGVudChbIG5ldyBEYXRlKG5lWzBdKSwgbmV3IERhdGUobmVbMV0pIF0pO1xuXHRcdH1cblxuXHRcdC8vIGZpcmUgdGhlIGV2ZW50IGlmIGFueXRoaW5nIGNoYW5nZWRcblx0XHRyZXR1cm4gIShzdXBwcmVzc0V2ZW50KTtcblxuXHR9XG5cblx0Lypcblx0ICogQ29uc3RydWN0b3IvaW5pdGlhbGl6YXRpb24gbWV0aG9kXG5cdCAqL1xuXHRmdW5jdGlvbiBfaW5zdGFuY2UoY29uZmlnKSB7XG5cdFx0aWYgKG51bGwgIT0gY29uZmlnKSB7XG5cdFx0XHRpZiAobnVsbCAhPSBjb25maWcuYnJ1c2gpIHtcblx0XHRcdFx0c2V0QnJ1c2goY29uZmlnLmJydXNoKTtcblx0XHRcdH1cblx0XHRcdGlmIChudWxsICE9IGNvbmZpZy5lbmFibGVkKSB7XG5cdFx0XHRcdHNldEVuYWJsZWQoY29uZmlnLmVuYWJsZWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cblx0LyoqXG5cdCAqIFB1YmxpYyBBUElcblx0ICovXG5cblx0Lypcblx0ICogR2V0L1NldCB0aGUgYnJ1c2ggdG8gdXNlXG5cdCAqL1xuXHRfaW5zdGFuY2UuYnJ1c2ggPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9icnVzaDsgfVxuXHRcdHNldEJydXNoKHYpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogR2V0L1NldCB0aGUgdmFsdWVzIGFjY2Vzc29yIGZ1bmN0aW9uXG5cdCAqL1xuXHRfaW5zdGFuY2UuZW5hYmxlZCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2VuYWJsZWQ7IH1cblx0XHRzZXRFbmFibGVkKHYpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLmdldEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBnZXRGaWx0ZXIoKTtcblx0fTtcblxuXHRfaW5zdGFuY2Uuc2V0RmlsdGVyID0gZnVuY3Rpb24obiwgbykge1xuXHRcdHJldHVybiBzZXRGaWx0ZXIobiwgbyk7XG5cdH07XG5cblx0Ly8gSW5pdGlhbGl6ZSB0aGUgbW9kZWxcblx0X2luc3RhbmNlKGNvbmZpZyk7XG5cblx0cmV0dXJuIF9pbnN0YW5jZTtcbn1cblxuZXhwb3J0IHsgdGltZWxpbmVGaWx0ZXIgfTtcbiIsImltcG9ydCB7IGV4dGVudCB9IGZyb20gJy4uL3V0aWwvZXh0ZW50JztcbmltcG9ydCB7IG11bHRpRXh0ZW50IH0gZnJvbSAnLi4vdXRpbC9tdWx0aV9leHRlbnQnO1xuaW1wb3J0IHsgdGltZWxpbmVGaWx0ZXIgfSBmcm9tICcuLi91dGlsL3RpbWVsaW5lX2ZpbHRlcic7XG5cbmZ1bmN0aW9uIGxpbmUoKSB7XG5cblx0Ly8gTGF5b3V0IHByb3BlcnRpZXNcblx0dmFyIF9pZCA9ICd0aW1lbGluZV9saW5lXycgKyBEYXRlLm5vdygpO1xuXHR2YXIgX21hcmdpbiA9IHsgdG9wOiAxMCwgcmlnaHQ6IDEwLCBib3R0b206IDIwLCBsZWZ0OiA0MCB9O1xuXHR2YXIgX2hlaWdodCA9IDEwMCwgX3dpZHRoID0gNjAwO1xuXG5cdC8vIERlZmF1bHQgYWNjZXNzb3JzIGZvciB0aGUgZGltZW5zaW9ucyBvZiB0aGUgZGF0YVxuXHR2YXIgX3ZhbHVlID0ge1xuXHRcdHg6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbMF07IH0sXG5cdFx0eTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZFsxXTsgfVxuXHR9O1xuXG5cdC8vIEFjY2Vzc29ycyBmb3IgdGhlIHBvc2l0aW9ucyBvZiB0aGUgbWFya2Vyc1xuXHR2YXIgX21hcmtlclZhbHVlID0ge1xuXHRcdHg6IGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGRbMF07IH0sXG5cdFx0bGFiZWw6IGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGRbMV07IH1cblx0fTtcblxuXHR2YXIgbm93ID0gRGF0ZS5ub3coKTtcblx0dmFyIF9leHRlbnQgPSB7XG5cdFx0eDogZXh0ZW50KHtcblx0XHRcdGRlZmF1bHRWYWx1ZTogW25vdyAtIDYwMDAwKjUsIG5vd10sXG5cdFx0XHRnZXRWYWx1ZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZFswXTsgfVxuXHRcdH0pLFxuXHRcdHk6IGV4dGVudCh7XG5cdFx0XHRnZXRWYWx1ZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZFsxXTsgfVxuXHRcdH0pXG5cdH07XG5cdHZhciBfbXVsdGlFeHRlbnQgPSBtdWx0aUV4dGVudCgpLnZhbHVlcyhmdW5jdGlvbihkKSB7IHJldHVybiBkLmRhdGE7IH0pO1xuXG5cdC8vIERlZmF1bHQgc2NhbGVzIGZvciB4IGFuZCB5IGRpbWVuc2lvbnNcblx0dmFyIF9zY2FsZSA9IHtcblx0XHR4OiBkMy50aW1lLnNjYWxlKCksXG5cdFx0eTogZDMuc2NhbGUubGluZWFyKClcblx0fTtcblxuXHQvLyBEZWZhdWx0IEF4aXMgZGVmaW5pdGlvbnNcblx0dmFyIF9heGlzID0ge1xuXHRcdHg6IGQzLnN2Zy5heGlzKCkuc2NhbGUoX3NjYWxlLngpLm9yaWVudCgnYm90dG9tJyksXG5cdFx0eTogZDMuc3ZnLmF4aXMoKS5zY2FsZShfc2NhbGUueSkub3JpZW50KCdsZWZ0JykudGlja3MoMylcblx0fTtcblxuXHQvLyBnIGVsZW1lbnRzXG5cdHZhciBfZWxlbWVudCA9IHtcblx0XHRzdmc6IHVuZGVmaW5lZCxcblx0XHRnOiB7XG5cdFx0XHRjb250YWluZXI6IHVuZGVmaW5lZCxcblx0XHRcdHBsb3RzOiB1bmRlZmluZWQsXG5cdFx0XHR4QXhpczogdW5kZWZpbmVkLFxuXHRcdFx0eUF4aXM6IHVuZGVmaW5lZCxcblx0XHRcdG1hcmtlcnM6IHVuZGVmaW5lZCxcblx0XHRcdGJydXNoOiB1bmRlZmluZWRcblx0XHR9LFxuXHRcdHBsb3RDbGlwUGF0aDogdW5kZWZpbmVkLFxuXHRcdG1hcmtlckNsaXBQYXRoOiB1bmRlZmluZWRcblx0fTtcblxuXHQvLyBMaW5lIGdlbmVyYXRvciBmb3IgdGhlIHBsb3Rcblx0dmFyIF9saW5lID0gZDMuc3ZnLmxpbmUoKS5pbnRlcnBvbGF0ZSgnbGluZWFyJyk7XG5cdF9saW5lLngoZnVuY3Rpb24oZCwgaSkge1xuXHRcdHJldHVybiBfc2NhbGUueChfdmFsdWUueChkLCBpKSk7XG5cdH0pO1xuXHRfbGluZS55KGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRyZXR1cm4gX3NjYWxlLnkoX3ZhbHVlLnkoZCwgaSkpO1xuXHR9KTtcblxuXHQvLyBBcmVhIGdlbmVyYXRvciBmb3IgdGhlIHBsb3Rcblx0dmFyIF9hcmVhID0gZDMuc3ZnLmFyZWEoKS5pbnRlcnBvbGF0ZSgnbGluZWFyJyk7XG5cdF9hcmVhLngoZnVuY3Rpb24oZCwgaSkge1xuXHRcdHJldHVybiBfc2NhbGUueChfdmFsdWUueChkLCBpKSk7XG5cdH0pO1xuXHRfYXJlYS55MShmdW5jdGlvbihkLCBpKSB7XG5cdFx0cmV0dXJuIF9zY2FsZS55KF92YWx1ZS55KGQsIGkpKTtcblx0fSk7XG5cblx0Ly8gQnJ1c2ggZmlsdGVyXG5cdHZhciBfZmlsdGVyID0gdGltZWxpbmVGaWx0ZXIoKTtcblxuXHR2YXIgX2Rpc3BhdGNoID0gZDMuZGlzcGF0Y2goJ2ZpbHRlcicsICdmaWx0ZXJzdGFydCcsICdmaWx0ZXJlbmQnLCAnbWFya2VyQ2xpY2snLCAnbWFya2VyTW91c2VvdmVyJywgJ21hcmtlck1vdXNlb3V0Jylcblx0dmFyIF9kYXRhID0gW107XG5cblx0dmFyIF9tYXJrZXJzID0ge1xuXHRcdHZhbHVlczogW11cblx0fTtcblxuXHRmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xuXHRcdF9kaXNwYXRjaC5maWx0ZXJzdGFydChfZmlsdGVyLmdldEZpbHRlcigpKTtcblx0fVxuXHRmdW5jdGlvbiBicnVzaCgpIHtcblx0XHRfZGlzcGF0Y2guZmlsdGVyKF9maWx0ZXIuZ2V0RmlsdGVyKCkpO1xuXHR9XG5cdGZ1bmN0aW9uIGJydXNoZW5kKCkge1xuXHRcdF9kaXNwYXRjaC5maWx0ZXJlbmQoX2ZpbHRlci5nZXRGaWx0ZXIoKSk7XG5cdH1cblxuXHQvLyBDaGFydCBjcmVhdGUvaW5pdCBtZXRob2Rcblx0ZnVuY3Rpb24gX2luc3RhbmNlKHNlbGVjdGlvbikge31cblxuXHQvKlxuXHQgKiBJbml0aWFsaXplIHRoZSBjaGFydCAoc2hvdWxkIG9ubHkgY2FsbCB0aGlzIG9uY2UpLiBQZXJmb3JtcyBhbGwgaW5pdGlhbCBjaGFydFxuXHQgKiBjcmVhdGlvbiBhbmQgc2V0dXBcblx0ICovXG5cdF9pbnN0YW5jZS5pbml0ID0gZnVuY3Rpb24oY29udGFpbmVyKSB7XG5cdFx0Ly8gQ3JlYXRlIGEgY29udGFpbmVyIGRpdlxuXHRcdF9lbGVtZW50LmRpdiA9IGNvbnRhaW5lci5hcHBlbmQoJ2RpdicpLmF0dHIoJ2NsYXNzJywgJ3NlbnRpbyB0aW1lbGluZScpO1xuXG5cdFx0Ly8gQ3JlYXRlIHRoZSBTVkcgZWxlbWVudFxuXHRcdF9lbGVtZW50LnN2ZyA9IF9lbGVtZW50LmRpdi5hcHBlbmQoJ3N2ZycpO1xuXG5cdFx0Ly8gQWRkIHRoZSBkZWZzIGFuZCBhZGQgdGhlIGNsaXAgcGF0aCBkZWZpbml0aW9uXG5cdFx0X2VsZW1lbnQucGxvdENsaXBQYXRoID0gX2VsZW1lbnQuc3ZnLmFwcGVuZCgnZGVmcycpLmFwcGVuZCgnY2xpcFBhdGgnKS5hdHRyKCdpZCcsICdwbG90XycgKyBfaWQpLmFwcGVuZCgncmVjdCcpO1xuXHRcdF9lbGVtZW50Lm1hcmtlckNsaXBQYXRoID0gX2VsZW1lbnQuc3ZnLmFwcGVuZCgnZGVmcycpLmFwcGVuZCgnY2xpcFBhdGgnKS5hdHRyKCdpZCcsICdtYXJrZXJfJyArIF9pZCkuYXBwZW5kKCdyZWN0Jyk7XG5cblx0XHQvLyBBcHBlbmQgYSBjb250YWluZXIgZm9yIGV2ZXJ5dGhpbmdcblx0XHRfZWxlbWVudC5nLmNvbnRhaW5lciA9IF9lbGVtZW50LnN2Zy5hcHBlbmQoJ2cnKTtcblxuXHRcdC8vIEFwcGVuZCB0aGUgcGF0aCBncm91cCAod2hpY2ggd2lsbCBoYXZlIHRoZSBjbGlwIHBhdGggYW5kIHRoZSBsaW5lIHBhdGhcblx0XHRfZWxlbWVudC5nLnBsb3RzID0gX2VsZW1lbnQuZy5jb250YWluZXIuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAncGxvdHMnKS5hdHRyKCdjbGlwLXBhdGgnLCAndXJsKCNwbG90XycgKyBfaWQgKyAnKScpO1xuXG5cdFx0Ly8gQWRkIHRoZSBmaWx0ZXIgYnJ1c2ggZWxlbWVudCBhbmQgc2V0IHVwIGJydXNoIGNhbGxiYWNrc1xuXHRcdF9lbGVtZW50LmcuYnJ1c2ggPSBfZWxlbWVudC5nLmNvbnRhaW5lci5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICd4IGJydXNoJyk7XG5cdFx0X2ZpbHRlci5icnVzaCgpXG5cdFx0XHQub24oJ2JydXNoZW5kJywgYnJ1c2hlbmQpXG5cdFx0XHQub24oJ2JydXNoc3RhcnQnLCBicnVzaHN0YXJ0KVxuXHRcdFx0Lm9uKCdicnVzaCcsIGJydXNoKTtcblxuXHRcdC8vIEFwcGVuZCBhIGdyb3VwIGZvciB0aGUgbWFya2Vyc1xuXHRcdF9lbGVtZW50LmcubWFya2VycyA9IF9lbGVtZW50LmcuY29udGFpbmVyLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ21hcmtlcnMnKS5hdHRyKCdjbGlwLXBhdGgnLCAndXJsKCNtYXJrZXJfJyArIF9pZCArICcpJyk7XG5cblx0XHQvLyBBcHBlbmQgZ3JvdXBzIGZvciB0aGUgYXhlc1xuXHRcdF9lbGVtZW50LmcueEF4aXMgPSBfZWxlbWVudC5nLmNvbnRhaW5lci5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICd4IGF4aXMnKTtcblx0XHRfZWxlbWVudC5nLnlBeGlzID0gX2VsZW1lbnQuZy5jb250YWluZXIuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAneSBheGlzJyk7XG5cblx0XHRfaW5zdGFuY2UucmVzaXplKCk7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdC8qXG5cdCAqIFNldCB0aGUgX2luc3RhbmNlIGRhdGFcblx0ICovXG5cdF9pbnN0YW5jZS5kYXRhID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZGF0YTsgfVxuXHRcdF9kYXRhID0gdjtcblxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogU2V0IHRoZSBtYXJrZXJzIGRhdGFcblx0ICovXG5cdF9pbnN0YW5jZS5tYXJrZXJzID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfbWFya2Vycy52YWx1ZXM7IH1cblx0XHRfbWFya2Vycy52YWx1ZXMgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0Lypcblx0ICogVXBkYXRlcyBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgZGVwZW5kIG9uIHRoZSBzaXplIG9mIHRoZSB2YXJpb3VzIGNvbXBvbmVudHNcblx0ICovXG5cdF9pbnN0YW5jZS5yZXNpemUgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbm93ID0gRGF0ZS5ub3coKTtcblxuXHRcdC8vIFNldCB1cCB0aGUgc2NhbGVzXG5cdFx0X3NjYWxlLngucmFuZ2UoWzAsIE1hdGgubWF4KDAsIF93aWR0aCAtIF9tYXJnaW4ubGVmdCAtIF9tYXJnaW4ucmlnaHQpXSk7XG5cdFx0X3NjYWxlLnkucmFuZ2UoW01hdGgubWF4KDAsIF9oZWlnaHQgLSBfbWFyZ2luLnRvcCAtIF9tYXJnaW4uYm90dG9tKSwgMF0pO1xuXG5cdFx0Ly8gQXBwZW5kIHRoZSBjbGlwIHBhdGhcblx0XHRfZWxlbWVudC5wbG90Q2xpcFBhdGhcblx0XHRcdC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIC0nICsgX21hcmdpbi50b3AgKyAnKScpXG5cdFx0XHQuYXR0cignd2lkdGgnLCBNYXRoLm1heCgwLCBfd2lkdGggLSBfbWFyZ2luLmxlZnQgLSBfbWFyZ2luLnJpZ2h0KSlcblx0XHRcdC5hdHRyKCdoZWlnaHQnLCBNYXRoLm1heCgwLCBfaGVpZ2h0IC0gX21hcmdpbi5ib3R0b20pKTtcblx0XHRfZWxlbWVudC5tYXJrZXJDbGlwUGF0aFxuXHRcdFx0LmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgLScgKyBfbWFyZ2luLnRvcCArICcpJylcblx0XHRcdC5hdHRyKCd3aWR0aCcsIE1hdGgubWF4KDAsIF93aWR0aCAtIF9tYXJnaW4ubGVmdCAtIF9tYXJnaW4ucmlnaHQpKVxuXHRcdFx0LmF0dHIoJ2hlaWdodCcsIE1hdGgubWF4KDAsIF9oZWlnaHQgLSBfbWFyZ2luLmJvdHRvbSkpO1xuXG5cdFx0Ly8gTm93IHVwZGF0ZSB0aGUgc2l6ZSBvZiB0aGUgc3ZnIHBhbmVcblx0XHRfZWxlbWVudC5zdmcuYXR0cignd2lkdGgnLCBfd2lkdGgpLmF0dHIoJ2hlaWdodCcsIF9oZWlnaHQpO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBwb3NpdGlvbnMgb2YgdGhlIGF4ZXNcblx0XHRfZWxlbWVudC5nLnhBeGlzLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwnICsgX3NjYWxlLnkucmFuZ2UoKVswXSArICcpJyk7XG5cdFx0X2VsZW1lbnQuZy55QXhpcy5hdHRyKCdjbGFzcycsICd5IGF4aXMnKTtcblxuXHRcdC8vIHVwZGF0ZSB0aGUgbWFyZ2lucyBvbiB0aGUgbWFpbiBkcmF3IGdyb3VwXG5cdFx0X2VsZW1lbnQuZy5jb250YWluZXIuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgX21hcmdpbi5sZWZ0ICsgJywnICsgX21hcmdpbi50b3AgKyAnKScpO1xuXG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHQvKlxuXHQgKiBSZWRyYXcgdGhlIGdyYXBoaWNcblx0ICovXG5cdF9pbnN0YW5jZS5yZWRyYXcgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBOZWVkIHRvIGdyYWIgdGhlIGZpbHRlciBleHRlbnQgYmVmb3JlIHdlIGNoYW5nZSBhbnl0aGluZ1xuXHRcdHZhciBmaWx0ZXJFeHRlbnQgPSBfZmlsdGVyLmdldEZpbHRlcigpO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSB4IGRvbWFpbiAodG8gdGhlIGxhdGVzdCB0aW1lIHdpbmRvdylcblx0XHRfc2NhbGUueC5kb21haW4oX211bHRpRXh0ZW50LmV4dGVudChfZXh0ZW50LngpLmdldEV4dGVudChfZGF0YSkpO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSB5IGRvbWFpbiAoYmFzZWQgb24gY29uZmlndXJhdGlvbiBhbmQgZGF0YSlcblx0XHRfc2NhbGUueS5kb21haW4oX211bHRpRXh0ZW50LmV4dGVudChfZXh0ZW50LnkpLmdldEV4dGVudChfZGF0YSkpO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBwbG90IGVsZW1lbnRzXG5cdFx0dXBkYXRlQXhlcygpO1xuXHRcdHVwZGF0ZUxpbmUoKTtcblx0XHR1cGRhdGVNYXJrZXJzKCk7XG5cdFx0dXBkYXRlRmlsdGVyKGZpbHRlckV4dGVudCk7XG5cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIHVwZGF0ZUF4ZXMoKSB7XG5cdFx0aWYobnVsbCAhPSBfYXhpcy54KSB7XG5cdFx0XHRfZWxlbWVudC5nLnhBeGlzLmNhbGwoX2F4aXMueCk7XG5cdFx0fVxuXHRcdGlmKG51bGwgIT0gX2F4aXMueSkge1xuXHRcdFx0X2VsZW1lbnQuZy55QXhpcy5jYWxsKF9heGlzLnkpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZUxpbmUoKSB7XG5cdFx0Ly8gSm9pblxuXHRcdHZhciBwbG90Sm9pbiA9IF9lbGVtZW50LmcucGxvdHNcblx0XHRcdC5zZWxlY3RBbGwoJy5wbG90Jylcblx0XHRcdC5kYXRhKF9kYXRhLCBmdW5jdGlvbihkKSB7XG5cdFx0XHRcdHJldHVybiBkLmtleTtcblx0XHRcdH0pO1xuXG5cdFx0Ly8gRW50ZXJcblx0XHR2YXIgcGxvdEVudGVyID0gcGxvdEpvaW4uZW50ZXIoKS5hcHBlbmQoJ2cnKVxuXHRcdFx0LmF0dHIoJ2NsYXNzJywgJ3Bsb3QnKTtcblxuXHRcdHBsb3RFbnRlci5hcHBlbmQoJ2cnKS5hcHBlbmQoJ3BhdGgnKS5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICgoZC5jc3NDbGFzcyk/IGQuY3NzQ2xhc3MgOiAnJykgKyAnIGxpbmUnOyB9KTtcblx0XHRwbG90RW50ZXIuYXBwZW5kKCdnJykuYXBwZW5kKCdwYXRoJykuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7IHJldHVybiAoKGQuY3NzQ2xhc3MpPyBkLmNzc0NsYXNzIDogJycpICsgJyBhcmVhJzsgfSk7XG5cblx0XHR2YXIgbGluZVVwZGF0ZSA9IHBsb3RKb2luLnNlbGVjdCgnLmxpbmUnKTtcblx0XHR2YXIgYXJlYVVwZGF0ZSA9IHBsb3RKb2luLnNlbGVjdCgnLmFyZWEnKTtcblxuXHRcdC8vIFVwZGF0ZVxuXHRcdGxpbmVVcGRhdGUuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5kYXRhOyB9KS5hdHRyKCdkJywgX2xpbmUpO1xuXHRcdGFyZWFVcGRhdGUuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5kYXRhOyB9KS5hdHRyKCdkJywgX2FyZWEueTAoX3NjYWxlLnkucmFuZ2UoKVswXSkpO1xuXG5cdFx0Ly8gRXhpdFxuXHRcdHZhciBwbG90RXhpdCA9IHBsb3RKb2luLmV4aXQoKTtcblx0XHRwbG90RXhpdC5yZW1vdmUoKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlTWFya2VycygpIHtcblx0XHQvLyBKb2luXG5cdFx0dmFyIG1hcmtlckpvaW4gPSBfZWxlbWVudC5nLm1hcmtlcnNcblx0XHRcdC5zZWxlY3RBbGwoJy5tYXJrZXInKVxuXHRcdFx0LmRhdGEoX21hcmtlcnMudmFsdWVzLCBmdW5jdGlvbihkKSB7XG5cdFx0XHRcdHJldHVybiBfbWFya2VyVmFsdWUueChkKTtcblx0XHRcdH0pO1xuXG5cdFx0Ly8gRW50ZXJcblx0XHR2YXIgbWFya2VyRW50ZXIgPSBtYXJrZXJKb2luLmVudGVyKCkuYXBwZW5kKCdnJylcblx0XHRcdC5hdHRyKCdjbGFzcycsICdtYXJrZXInKVxuXHRcdFx0Lm9uKCdtb3VzZW92ZXInLCBfZGlzcGF0Y2gubWFya2VyTW91c2VvdmVyKVxuXHRcdFx0Lm9uKCdtb3VzZW91dCcsIF9kaXNwYXRjaC5tYXJrZXJNb3VzZW91dClcblx0XHRcdC5vbignY2xpY2snLCBfZGlzcGF0Y2gubWFya2VyQ2xpY2spO1xuXG5cdFx0dmFyIGxpbmVFbnRlciA9IG1hcmtlckVudGVyLmFwcGVuZCgnbGluZScpO1xuXHRcdHZhciB0ZXh0RW50ZXIgPSBtYXJrZXJFbnRlci5hcHBlbmQoJ3RleHQnKTtcblxuXHRcdHZhciBsaW5lVXBkYXRlID0gbWFya2VySm9pbi5zZWxlY3QoJ2xpbmUnKTtcblx0XHR2YXIgdGV4dFVwZGF0ZSA9IG1hcmtlckpvaW4uc2VsZWN0KCd0ZXh0Jyk7XG5cblx0XHRsaW5lRW50ZXJcblx0XHRcdC5hdHRyKCd5MScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF9zY2FsZS55LnJhbmdlKClbMV07IH0pXG5cdFx0XHQuYXR0cigneTInLCBmdW5jdGlvbihkKSB7IHJldHVybiBfc2NhbGUueS5yYW5nZSgpWzBdOyB9KTtcblxuXHRcdHRleHRFbnRlclxuXHRcdFx0LmF0dHIoJ2R5JywgJzBlbScpXG5cdFx0XHQuYXR0cigneScsIC0zKVxuXHRcdFx0LmF0dHIoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpXG5cdFx0XHQudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBfbWFya2VyVmFsdWUubGFiZWwoZCk7IH0pO1xuXG5cdFx0Ly8gVXBkYXRlXG5cdFx0bGluZVVwZGF0ZVxuXHRcdFx0LmF0dHIoJ3gxJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gX3NjYWxlLngoX21hcmtlclZhbHVlLngoZCkpOyB9KVxuXHRcdFx0LmF0dHIoJ3gyJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gX3NjYWxlLngoX21hcmtlclZhbHVlLngoZCkpOyB9KTtcblxuXHRcdHRleHRVcGRhdGVcblx0XHRcdC5hdHRyKCd4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gX3NjYWxlLngoX21hcmtlclZhbHVlLngoZCkpOyB9KTtcblxuXHRcdC8vIEV4aXRcblx0XHR2YXIgbWFya2VyRXhpdCA9IG1hcmtlckpvaW4uZXhpdCgpLnJlbW92ZSgpO1xuXG5cdH1cblxuXG5cdC8qXG5cdCAqIFVwZGF0ZSB0aGUgc3RhdGUgb2YgdGhlIGV4aXN0aW5nIGZpbHRlciAoaWYgYW55KSBvbiB0aGUgcGxvdC5cblx0ICpcblx0ICogVGhpcyBtZXRob2QgYWNjZXB0cyB0aGUgZXh0ZW50IG9mIHRoZSBicnVzaCBiZWZvcmUgYW55IHBsb3QgY2hhbmdlcyB3ZXJlIGFwcGxpZWRcblx0ICogYW5kIHVwZGF0ZXMgdGhlIGJydXNoIHRvIGJlIHJlZHJhd24gb24gdGhlIHBsb3QgYWZ0ZXIgdGhlIHBsb3QgY2hhbmdlcyBhcmUgYXBwbGllZC5cblx0ICogVGhlcmUgaXMgYWxzbyBsb2dpYyB0byBjbGlwIHRoZSBicnVzaCBpZiB0aGUgZXh0ZW50IGhhcyBtb3ZlZCBzdWNoIHRoYXQgdGhlIGJydXNoXG5cdCAqIGhhcyBtb3ZlZCBwYXJ0aWFsbHkgb3V0IG9mIHRoZSBwbG90IGJvdW5kYXJpZXMsIGFzIHdlbGwgYXMgdG8gY2xlYXIgdGhlIGJydXNoIGlmIGl0XG5cdCAqIGhhcyBtb3ZlZCBjb21wbGV0ZWx5IG91dHNpZGUgb2YgdGhlIGJvdW5kYXJpZXMgb2YgdGhlIHBsb3QuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVGaWx0ZXIoZXh0ZW50KSB7XG5cdFx0Ly8gUmVhc3NlcnQgdGhlIHggc2NhbGUgb2YgdGhlIGJydXNoIChpbiBjYXNlIHRoZSBzY2FsZSBoYXMgY2hhbmdlZClcblx0XHRfZmlsdGVyLmJydXNoKCkueChfc2NhbGUueCk7XG5cblx0XHQvLyBEZXJpdmUgdGhlIG92ZXJhbGwgcGxvdCBleHRlbnQgZnJvbSB0aGUgY29sbGVjdGlvbiBvZiBzZXJpZXNcblx0XHR2YXIgcGxvdEV4dGVudCA9IF9tdWx0aUV4dGVudC5leHRlbnQoX2V4dGVudC54KS5nZXRFeHRlbnQoX2RhdGEpO1xuXG5cdFx0Ly8gSWYgdGhlcmUgd2FzIG5vIHByZXZpb3VzIGV4dGVudCwgdGhlbiB0aGVyZSBpcyBubyBicnVzaCB0byB1cGRhdGVcblx0XHRpZihudWxsICE9IGV4dGVudCkge1xuXHRcdFx0Ly8gQ2xpcCBleHRlbnQgYnkgdGhlIGZ1bGwgZXh0ZW50IG9mIHRoZSBwbG90ICh0aGlzIGlzIGluIGNhc2Ugd2UndmUgc2xpcHBlZCBvZmYgdGhlIHZpc2libGUgcGxvdClcblx0XHRcdHZhciBuRXh0ZW50ID0gWyBNYXRoLm1heChwbG90RXh0ZW50WzBdLCBleHRlbnRbMF0pLCBNYXRoLm1pbihwbG90RXh0ZW50WzFdLCBleHRlbnRbMV0pIF07XG5cdFx0XHRzZXRGaWx0ZXIobkV4dGVudCwgZXh0ZW50KTtcblx0XHR9XG5cblx0XHRfZWxlbWVudC5nLmJydXNoXG5cdFx0XHQuY2FsbChfZmlsdGVyLmJydXNoKCkpXG5cdFx0XHQuc2VsZWN0QWxsKCdyZWN0Jylcblx0XHRcdC5hdHRyKCd5JywgLTYpXG5cdFx0XHRcdC5hdHRyKCdoZWlnaHQnLCBfaGVpZ2h0IC0gX21hcmdpbi50b3AgLSBfbWFyZ2luLmJvdHRvbSArIDcpO1xuXG5cdFx0X2VsZW1lbnQuZy5icnVzaFxuXHRcdFx0LnN0eWxlKCdkaXNwbGF5JywgKF9maWx0ZXIuZW5hYmxlZCgpKT8gJ3Vuc2V0JyA6ICdub25lJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRGaWx0ZXIobiwgbykge1xuXHRcdGlmKF9maWx0ZXIuc2V0RmlsdGVyKG4sIG8pKSB7XG5cdFx0XHRfZmlsdGVyLmJydXNoKCkuZXZlbnQoX2VsZW1lbnQuZy5icnVzaCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gQmFzaWMgR2V0dGVycy9TZXR0ZXJzXG5cdF9pbnN0YW5jZS53aWR0aCA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3dpZHRoOyB9XG5cdFx0X3dpZHRoID0gdjtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UuaGVpZ2h0ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfaGVpZ2h0OyB9XG5cdFx0X2hlaWdodCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLm1hcmdpbiA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX21hcmdpbjsgfVxuXHRcdF9tYXJnaW4gPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5pbnRlcnBvbGF0aW9uID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfbGluZS5pbnRlcnBvbGF0ZSgpOyB9XG5cdFx0X2xpbmUuaW50ZXJwb2xhdGUodik7XG5cdFx0X2FyZWEuaW50ZXJwb2xhdGUodik7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnhBeGlzID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfYXhpcy54OyB9XG5cdFx0X2F4aXMueCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnlBeGlzID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfYXhpcy55OyB9XG5cdFx0X2F4aXMueSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblx0X2luc3RhbmNlLnhTY2FsZSA9IGZ1bmN0aW9uKHYpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3NjYWxlLng7IH1cblx0XHRfc2NhbGUueCA9IHY7XG5cdFx0aWYobnVsbCAhPSBfYXhpcy54KSB7XG5cdFx0XHRfYXhpcy54LnNjYWxlKHYpO1xuXHRcdH1cblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UueVNjYWxlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfc2NhbGUueTsgfVxuXHRcdF9zY2FsZS55ID0gdjtcblx0XHRpZihudWxsICE9IF9heGlzLnkpIHtcblx0XHRcdF9heGlzLnkuc2NhbGUodik7XG5cdFx0fVxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS54VmFsdWUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF92YWx1ZS54OyB9XG5cdFx0X3ZhbHVlLnggPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS55VmFsdWUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF92YWx1ZS55OyB9XG5cdFx0X3ZhbHVlLnkgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS55RXh0ZW50ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZXh0ZW50Lnk7IH1cblx0XHRfZXh0ZW50LnkgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS54RXh0ZW50ID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZXh0ZW50Lng7IH1cblx0XHRfZXh0ZW50LnggPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5tYXJrZXJYVmFsdWUgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9tYXJrZXJWYWx1ZS54OyB9XG5cdFx0X21hcmtlclZhbHVlLnggPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5tYXJrZXJMYWJlbFZhbHVlID0gZnVuY3Rpb24odikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfbWFya2VyVmFsdWUubGFiZWw7IH1cblx0XHRfbWFya2VyVmFsdWUubGFiZWwgPSB2O1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5maWx0ZXIgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9maWx0ZXIuZW5hYmxlZDsgfVxuXHRcdF9maWx0ZXIuZW5hYmxlZCh2KTtcblx0XHRyZXR1cm4gX2luc3RhbmNlO1xuXHR9O1xuXHRfaW5zdGFuY2UuZGlzcGF0Y2ggPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kaXNwYXRjaDsgfVxuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cdF9pbnN0YW5jZS5zZXRGaWx0ZXIgPSBmdW5jdGlvbih2KSB7XG5cdFx0cmV0dXJuIHNldEZpbHRlcih2LCBfZmlsdGVyLmdldEZpbHRlcigpKTtcblx0fTtcblx0X2luc3RhbmNlLmdldEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfZmlsdGVyLmdldEZpbHRlcigpO1xuXHR9O1xuXG5cdHJldHVybiBfaW5zdGFuY2U7XG59XG5cbmV4cG9ydCB7IGxpbmUgfTtcbiIsImltcG9ydCB7IGxpbmUgfSBmcm9tICcuLi90aW1lbGluZS9saW5lJztcblxuZnVuY3Rpb24gdGltZWxpbmUoKSB7XG5cblx0Ly8gRGVmYXVsdCBkYXRhIGRlbGF5LCB0aGlzIGlzIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gbm93IGFuZCB0aGUgbGF0ZXN0IHRpY2sgc2hvd24gb24gdGhlIHRpbWVsaW5lXG5cdHZhciBfZGVsYXkgPSAwO1xuXG5cdC8vIEludGVydmFsIG9mIHRoZSB0aW1lbGluZSwgdGhpcyBpcyB0aGUgYW1vdW50IG9mIHRpbWUgYmVpbmcgZGlzcGxheWVkIGJ5IHRoZSB0aW1lbGluZVxuXHR2YXIgX2ludGVydmFsID0gNjAwMDA7XG5cblx0Ly8gSXMgdGhlIHRpbWVsaW5lIHJ1bm5pbmc/XG5cdHZhciBfcnVubmluZyA9IGZhbHNlO1xuXHR2YXIgX3RpbWVvdXQgPSBudWxsO1xuXG5cdC8vIFdoYXQgaXMgdGhlIHJlZnJlc2ggcmF0ZT9cblx0dmFyIF9mcHMgPSAzMjtcblxuXHR2YXIgX2luc3RhbmNlID0gbGluZSgpO1xuXHRfaW5zdGFuY2UueUV4dGVudCgpLmZpbHRlcihmdW5jdGlvbihkKSB7XG5cdFx0dmFyIHggPSBfaW5zdGFuY2UueFZhbHVlKCkoZCk7XG5cdFx0dmFyIHhFeHRlbnQgPSBfaW5zdGFuY2UueEV4dGVudCgpLmdldEV4dGVudCgpO1xuXHRcdHJldHVybiAoeCA8IHhFeHRlbnRbMV0gJiYgeCA+IHhFeHRlbnRbMF0pO1xuXHR9KTtcblxuXHQvKlxuXHQgKiBUaGlzIGlzIHRoZSBtYWluIHVwZGF0ZSBsb29wIGZ1bmN0aW9uLiBJdCBpcyBjYWxsZWQgZXZlcnkgdGltZSB0aGVcblx0ICogX2luc3RhbmNlIGlzIHVwZGF0aW5nIHRvIHByb2NlZWQgdGhyb3VnaCB0aW1lLlxuXHQgKi9cblx0ZnVuY3Rpb24gdGljaygpIHtcblx0XHQvLyBJZiBub3QgcnVubmluZywgbGV0IHRoZSBsb29wIGRpZVxuXHRcdGlmKCFfcnVubmluZykgcmV0dXJuO1xuXG5cdFx0X2luc3RhbmNlLnJlZHJhdygpO1xuXG5cdFx0Ly8gU2NoZWR1bGUgdGhlIG5leHQgdXBkYXRlXG5cdFx0X3RpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dCh0aWNrLCAoX2ZwcyA+IDApPyAxMDAwL19mcHMgOiAwKTtcblx0fVxuXG5cdC8qXG5cdCAqIFJlZHJhdyB0aGUgZ3JhcGhpY1xuXHQgKi9cblx0dmFyIHBhcmVudFJlZHJhdyA9IF9pbnN0YW5jZS5yZWRyYXc7XG5cdF9pbnN0YW5jZS5yZWRyYXcgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBVcGRhdGUgdGhlIHggZG9tYWluICh0byB0aGUgbGF0ZXN0IHRpbWUgd2luZG93KVxuXHRcdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuXHRcdF9pbnN0YW5jZS54RXh0ZW50KCkub3ZlcnJpZGVWYWx1ZShbbm93IC0gX2RlbGF5IC0gX2ludGVydmFsLCBub3cgLSBfZGVsYXldKTtcblxuXHRcdHBhcmVudFJlZHJhdygpO1xuXHRcdHJldHVybiBfaW5zdGFuY2U7XG5cdH07XG5cblx0X2luc3RhbmNlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYoX3J1bm5pbmcpeyByZXR1cm47IH1cblx0XHRfcnVubmluZyA9IHRydWU7XG5cblx0XHR0aWNrKCk7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2Uuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdF9ydW5uaW5nID0gZmFsc2U7XG5cblx0XHRpZihfdGltZW91dCAhPSBudWxsKSB7XG5cdFx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KF90aW1lb3V0KTtcblx0XHR9XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuXHRcdF9pbnN0YW5jZS5zdG9wKCk7XG5cdFx0X2luc3RhbmNlLnN0YXJ0KCk7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuaW50ZXJ2YWwgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9pbnRlcnZhbDsgfVxuXHRcdF9pbnRlcnZhbCA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuZGVsYXkgPSBmdW5jdGlvbih2KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kZWxheTsgfVxuXHRcdF9kZWxheSA9IHY7XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRfaW5zdGFuY2UuZnBzID0gZnVuY3Rpb24odil7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9mcHM7IH1cblx0XHRfZnBzID0gdjtcblx0XHRpZihfcnVubmluZykge1xuXHRcdFx0X2luc3RhbmNlLnJlc3RhcnQoKTtcblx0XHR9XG5cdFx0cmV0dXJuIF9pbnN0YW5jZTtcblx0fTtcblxuXHRyZXR1cm4gX2luc3RhbmNlO1xufVxuXG5leHBvcnQgeyB0aW1lbGluZSB9O1xuIiwiaW1wb3J0IHsgdGltZWxpbmUgfSBmcm9tICcuL3RpbWVsaW5lJztcblxudmFyIHJlYWx0aW1lID0ge1xuXHR0aW1lbGluZTogdGltZWxpbmVcbn07XG5cbmV4cG9ydCB7IHJlYWx0aW1lIH07XG4iLCJpbXBvcnQgeyBsaW5lIH0gZnJvbSAnLi9saW5lJztcblxudmFyIHRpbWVsaW5lID0ge1xuXHRsaW5lOiBsaW5lXG59O1xuXG5leHBvcnQgeyB0aW1lbGluZSB9O1xuIiwiaW1wb3J0IHsgZXh0ZW50IH0gZnJvbSAnLi9leHRlbnQnXG5pbXBvcnQgeyBtdWx0aUV4dGVudCB9IGZyb20gJy4vbXVsdGlfZXh0ZW50JztcbmltcG9ydCB7IHRpbWVsaW5lRmlsdGVyIH0gZnJvbSAnLi90aW1lbGluZV9maWx0ZXInO1xuXG5leHBvcnQgdmFyIHV0aWwgPSB7XG5cdGV4dGVudDogZXh0ZW50LFxuXHRtdWx0aUV4dGVudDogbXVsdGlFeHRlbnQsXG5cdHRpbWVsaW5lRmlsdGVyOiB0aW1lbGluZUZpbHRlclxufTtcbiJdLCJuYW1lcyI6WyJleHRlbnQiLCJ0aW1lbGluZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBLFNBQVMsS0FBSyxHQUFHOzs7Q0FHaEIsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDO0NBQ2pCLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQztDQUNsQixJQUFJLE9BQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQzs7O0NBR3ZELElBQUksT0FBTyxDQUFDO0NBQ1osSUFBSSxpQkFBaUIsR0FBRyxHQUFHLENBQUM7OztDQUc1QixJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUM7OztDQUdwQixJQUFJLE9BQU8sR0FBRztFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsUUFBUSxFQUFFLEVBQUU7RUFDWixVQUFVLEVBQUUsQ0FBQztFQUNiLFdBQVcsRUFBRSxDQUFDO0VBQ2QsUUFBUSxFQUFFLFFBQVE7RUFDbEIsTUFBTSxFQUFFLFVBQVU7RUFDbEIsQ0FBQzs7O0NBR0YsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDOzs7Q0FHOUQsSUFBSSxHQUFHLEdBQUc7RUFDVCxtQkFBbUIsRUFBRSxTQUFTLENBQUMsRUFBRTtHQUNoQyxJQUFJLGFBQWEsR0FBRyxRQUFRLENBQUMsT0FB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QyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7R0FDcEUsR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztHQUNsQixVQUFVLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNoQzs7O0VBR0QsR0FBRyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtHQUN0QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO0dBQzVDOzs7RUFHRCxJQUFJLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFO0dBQzFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztHQUNyQzs7O0VBR0QsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUU7R0FDOUQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztHQUN4RTtFQUNELElBQUksR0FBRyxDQUFDLFdBQVcsRUFBRTtHQUNwQixHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztHQUMxRDtFQUNEOztDQUVELFNBQVMsT0FBTyxDQUFDLFNBQVMsRUFBRTtFQUMzQixJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUM7O0VBRTNCLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxPQUFPLEVBQUU7R0FDbkMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztHQUN0QyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7SUFDOUIsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsQyxJQUFJLFlBQVksR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0MsVUFBVSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDO0lBQ3BEO0dBQ0QsQ0FBQyxDQUFDO0VBQ0gsSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFO0dBQ2pCLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQ3ZEO0VBQ0Q7O0NBRUQsU0FBUyxTQUFTLEdBQUc7RUFDcEIsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7RUFDakIsVUFBVSxHQUFHLENBQUMsQ0FBQztFQUNmOzs7Ozs7Q0FNRCxTQUFTLEtBQUssQ0FBQyxTQUFTLEVBQUU7RUFDekIsR0FBRyxJQUFJLElBQUksU0FBUyxJQUFJLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxTQUFTLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFO0dBQ25HLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztHQUNwRTtFQUNELE9BQU8sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUN0QyxPQUFPLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDeEMsT0FBTyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztFQUVwQyxHQUFHLElBQUksSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsR0FBRyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7RUFDM0UsR0FBRyxJQUFJLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0VBQy9ELEdBQUcsSUFBSSxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtFQUNyRSxHQUFHLElBQUksSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLEVBQUUsR0FBRyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUU7RUFDeEUsR0FBRyxJQUFJLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0VBQ3JFLEdBQUcsSUFBSSxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtFQUNyRSxHQUFHLElBQUksSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUU7O0VBRTlFLFlBQVksRUFBRSxDQUFDO0VBQ2YsV0FBVyxFQUFFLENBQUM7RUFD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LENBQUMsQ0FBQzs7O0VBR0osSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDMUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQzs7RUFFeEIsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUN0SCxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztFQUV0SCxJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQzFDLElBQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7OztFQUcxQyxVQUFVLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDbEUsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxD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