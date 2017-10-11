import { axisBottom as d3_axisBottom, axisLeft as d3_axisLeft } from 'd3-axis';
import { brushX as d3_brushX } from 'd3-brush';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { scaleTime as d3_scaleTime, scaleLinear as d3_scaleLinear } from 'd3-scale';
import { line as d3_line, area as d3_area } from 'd3-shape';
import { voronoi as d3_voronoi } from 'd3-voronoi';

import { default as extent } from '../../model/extent';
import { default as multiExtent } from '../../model/multi-extent';
import { default as timelineBrush } from '../../controller/timeline-brush';


/**
 *
 *  data: []
 *  series: [ {label, x, y} ]
 *
 */
export default function timeline() {

	var _id = 'timeline_line_' + Date.now();

	/**
	 * Style stuff
	 */

	// Margin between the main plot group and the svg border
	var _margin = { top: 10, right: 10, bottom: 20, left: 40 };

	// Height and width of the SVG element
	var _height = 100, _width = 600;

	// Render the grid?
	var _displayOptions = {
		xGrid: false,
		yGrid: false,
		pointEvents: false // value, values, series, custom (falsey is off)
	};


	/**
	 * Configuration of accessors to data
	 */

	// Various configuration functions
	var _fn = {
		valueX: function(d) { return d[0]; },

		markerValueX: function(d) { return d[0]; },
		markerLabel: function(d) { return d[1]; },

		pointRadius: function() { return 2; }
	};


	/**
	 * Extents, Axes, and Scales
	 */

	// Extent configuration for x and y dimensions of plot
	var now = Date.now();
	var _extent = {
		x: extent({
			defaultValue: [ now - 60000 * 5, now ],
			getValue: function(d, i) { return _fn.valueX(d, i); }
		}),
		y: extent()
	};
	var _multiExtent = multiExtent();


	// Default scales for x and y dimensions
	var _scale = {
		x: d3_scaleTime(),
		y: d3_scaleLinear()
	};

	// Default Axis definitions
	var _axis = {
		x: d3_axisBottom().scale(_scale.x),
		y: d3_axisLeft().ticks(3).scale(_scale.y),

		xGrid: d3_axisBottom().tickFormat('').tickSizeOuter(0).scale(_scale.x),
		yGrid: d3_axisLeft().tickFormat('').tickSizeOuter(0).ticks(3).scale(_scale.y)
	};


	/**
	 * Generators
	 */

	var _line = d3_line()
		.x(function(d, i) { return _scale.x(_fn.valueX(d, i)); });

	var _area = d3_area()
		.x(function(d, i) { return _scale.x(_fn.valueX(d, i)); });

	// Voronoi that we'll use for hovers
	var _voronoi = d3_voronoi()
		.x(function(d, i) {
			return _scale.x(d.x, i);
		})
		.y(function(d, i) {
			return _scale.y(d.y, i);
		});


	/**
	 * Brush and Events
	 */

	// Brush Management
	var _brush = timelineBrush({ brush: d3_brushX(), scale: _scale.x });
	_brush.dispatch()
		.on('end', function() { _dispatch.call('brushEnd', this, getBrush()); })
		.on('start', function() { _dispatch.call('brushStart', this, getBrush()); })
		.on('brush', function() { _dispatch.call('brush', this, getBrush()); });

	// The dispatch object and all events
	var _dispatch = d3_dispatch(
		'brush', 'brushStart', 'brushEnd',
		'markerClick', 'markerMouseover', 'markerMouseout',
		'pointMouseover', 'pointMouseout', 'pointClick');


	/**
	 * Keep track of commonly access DOM elements
	 */

	// Storage for commonly used DOM elements
	var _element = {
		svg: undefined,

		g: {
			container: undefined,
			plots: undefined,
			points: undefined,
			voronoi: undefined,

			xAxis: undefined,
			yAxis: undefined,
			xAxisGrid: undefined,
			yAxisGrid: undefined,

			markers: undefined,
			brush: undefined
		},

		plotClipPath: undefined,
		markerClipPath: undefined
	};


	/**
	 * Data and Series and Markers
	 */

	// The main data array
	var _data = [];

	// The definition of the series to draw
	var _series = [];

	// Markers data
	var _markers = [];

	/**
	 * Explodes the data into an array with one point per unique point
	 * in the data (according to the series).
	 *
	 * I.e.,
	 *
	 * data: [{ x: 0, y1: 1, y2: 2}]
	 * series: [
	 *     { key: 's1', getValue: function(d) { return d.y1; } },
	 *     { key: 's2', getValue: function(d) { return d.y2; } }
	 * ]
	 *
	 * ==>
	 *
	 * [
	 *     { x: 0, y: 1, series: { key: 's1', ... }, data: { x: 0, y1: 1, y2: 2 },
	 *     { x: 0, y: 2, series: { key: 's2', ... }, data: { x: 0, y1: 1, y2: 2 },
	 * ]
	 *
	 * @param series
	 * @param data
	 */
	function getVoronoiData(series, data, getXValue) {
		var toReturn = [];

		// Loop over each series
		series.forEach(function(s, i) {

			// Convert the data to x/y series
			toReturn = toReturn.concat(data.map(function(d, ii) {
				return {
					x: getXValue(d, ii),
					y: s.getValue(d, ii),
					series: s,
					data: d
				};
			}));

		});

		return toReturn;
	}

	function highlightValues(hovered) {
		if (null != hovered) {

			var join = _element.g.points.selectAll('circle')
				.data(_series.map(function(d) {
					return {
						x: _fn.valueX(hovered.data),
						y: d.getValue(hovered.data),
						category: d.category
					};
				}));
			var enter = join.enter().append('circle');
			var update = join.selectAll('circle');

			enter.merge(update)
				.attr('class', function(d, i) { return d.category; })
				.attr('cx', function(d, i) { return _scale.x(d.x); })
				.attr('cy', function(d, i) { return _scale.y(d.y); })
				.attr('r', 3);
		}
		else {
			_element.g.points.selectAll('circle').remove();
		}
	}

	function highlightValue(hovered) {}
	function highlightSeries(hovered) {}


	function onPointMouseover(d, i) {

		var pointAction = _displayOptions.pointEvents;
		if('value' === pointAction) {
			highlightValue(d.data);
		}
		else if('values' === pointAction) {
			highlightValues(d.data);
		}
		else if('series' === pointAction) {
			highlightSeries(d.data);
		}

		_dispatch.call('pointMouseover', this, d.data, i);
	}

	function onPointMouseout(d, i) {

		var pointAction = _displayOptions.pointEvents;
		if('value' === pointAction) {
			highlightValue();
		}
		else if('values' === pointAction) {
			highlightValues();
		}
		else if('series' === pointAction) {
			highlightSeries();
		}

		_dispatch.call('pointMouseout', this, d.data, i);
	}

	function onPointClick(d, i) {
		_dispatch.call('pointClick', this, d.data, i);
	}

	/**
	 * Get the current brush state in terms of the x data domain, in ms epoch time
	 */
	function getBrush() {

		// Try to get the node from the brush group selection
		var node = (null != _element.g.brush)? _element.g.brush.node() : null;

		// Get the current brush selection
		return _brush.getSelection(node);

	}


	/**
	 * Set the current brush state in terms of the x data domain
	 * @param v The new value of the brush
	 *
	 */
	function setBrush(v) {
		_brush.setSelection(_element.g.brush, v);
	}


	/**
	 * Update the state of the brush (as part of redrawing everything)
	 *
	 * The purpose of this function is to update the state of the brush to reflect changes
	 * to the rest of the chart as part of a normal update/redraw cycle. When the x extent
	 * changes, the brush needs to move to stay correctly aligned with the x axis. Normally,
	 * we are only updating the drawn position of the brush, so the brushSelection doesn't
	 * actually change. However, if the change results in the brush extending partially or
	 * wholly outside of the x extent, we might have to clip or clear the brush, which will
	 * result in brush change events being propagated.
	 *
	 * @param previousExtent The previous state of the brush extent. Must be provided to
	 *        accurately determine the extent of the brush in terms of the x data domain
	 */
	function updateBrush(previousExtent) {

		// If there was no previous extent, then there is no brush to update
		if (null != previousExtent) {

			// Derive the overall plot extent from the collection of series
			var plotExtent = _extent.x.getExtent(_data);

			if(null != plotExtent && Array.isArray(plotExtent) && plotExtent.length == 2) {

				// Clip extent by the full extent of the plot (this is in case we've slipped off the visible plot)
				var newExtent = [ Math.max(plotExtent[0], previousExtent[0]), Math.min(plotExtent[1], previousExtent[1]) ];
				setBrush(newExtent);

			}
			else {
				// There is no plot/data so just clear the brush
				setBrush(undefined);
			}
		}

		_element.g.brush
			.style('display', (_brush.enabled())? 'unset' : 'none')
			.call(_brush.brush());
	}


	function updateAxes() {
		if (null != _axis.x) {
			_element.g.xAxis.call(_axis.x);
		}
		if (null != _axis.xGrid && _displayOptions.xGrid) {
			_element.g.xAxisGrid.call(_axis.xGrid);
		}
		if (null != _axis.y) {
			_element.g.yAxis.call(_axis.y);
		}
		if (null != _axis.yGrid && _displayOptions.yGrid) {
			_element.g.yAxisGrid.call(_axis.yGrid);
		}
	}


	function updateLine() {

		// Join
		var plotJoin = _element.g.plots
			.selectAll('.plot')
			.data(_series, function(d) { return d.key; });

		// Enter
		var plotEnter = plotJoin.enter().append('g').attr('class', 'plot');

		var lineEnter = plotEnter.append('g').append('path')
			.attr('class', function(d) { return ((d.category)? d.category : '') + ' line'; });
		var areaEnter = plotEnter.append('g').append('path')
			.attr('class', function(d) { return ((d.category)? d.category : '') + ' area'; });

		var lineUpdate = plotJoin.select('.line');
		var areaUpdate = plotJoin.select('.area');

		// Enter + Update
		lineEnter.merge(lineUpdate)
			.attr('d', function(series) {
				return _line.y(function (d, i) { return _scale.y(series.getValue(d, i)); })(_data);
			});

		areaEnter.merge(areaUpdate)
			.attr('d', function(series) {
				return _area
					.y0(_scale.y.range()[0])
					.y1(function (d, i) { return _scale.y(series.getValue(d, i)); })(_data);
			});


		// Remove the previous voronoi
		_element.g.voronoi.selectAll('path').remove();

		if (_displayOptions.pointEvents) {

			// check range against width
			var extent = _scale.x.domain();
			var voronoiData = getVoronoiData(_series, _data, _fn.valueX)
				.filter(function(d) {
					// Filter out points that are outside of the extent
					return (extent[0] <= d.x && d.x <= extent[1]);
				});

			// Filter out paths that are null
			voronoiData  = _voronoi.polygons(voronoiData)
				.filter(function (d) { return (null != d); });

			// Draw the circle markers
			_element.g.voronoi.selectAll('path').data(voronoiData).enter().append('path')
				.attr('d', function (d) { return (null != d) ? 'M' + d.join('L') + 'Z' : null; })
				.on('mouseover', onPointMouseover)
				.on('mouseout', onPointMouseout)
				.on('click', onPointClick);

		}

		// Exit
		var plotExit = plotJoin.exit();
		plotExit.remove();

	}


	function updateMarkers() {

		// Join
		var markerJoin = _element.g.markers
			.selectAll('.marker')
			.data(_markers, _fn.markerValueX);

		// Enter
		var markerEnter = markerJoin.enter().append('g')
			.attr('class', 'marker')
			.on('mouseover', function(d, i) { _dispatch.call('markerMouseover', this, d, i); })
			.on('mouseout', function(d, i) { _dispatch.call('markerMouseout', this, d, i); })
			.on('click', function(d, i) { _dispatch.call('markerClick', this, d, i); });

		var lineEnter = markerEnter.append('line');
		var textEnter = markerEnter.append('text');

		lineEnter
			.attr('y1', function(d) { return _scale.y.range()[1]; })
			.attr('y2', function(d) { return _scale.y.range()[0]; });

		textEnter
			.attr('dy', '0em')
			.attr('y', -3)
			.attr('text-anchor', 'middle')
			.text(_fn.markerValueLabel);

		// Enter + Update
		var lineUpdate = markerJoin.select('line');
		var textUpdate = markerJoin.select('text');

		lineEnter.merge(lineUpdate)
			.attr('x1', function(d, i) { return _scale.x(_fn.markerValueX(d, i)); })
			.attr('x2', function(d, i) { return _scale.x(_fn.markerValueX(d)); });

		textEnter.merge(textUpdate)
			.attr('x', function(d, i) { return _scale.x(_fn.markerValueX(d)); });

		// Exit
		markerJoin.exit().remove();

	}


	// Chart create/init method
	function _instance() {}


	/**
	 * Initialize the chart (only called once). Performs all initial chart creation/setup
	 *
	 * @param container The container element to which to apply the chart
	 * @returns {_instance} Instance of the chart
	 */
	_instance.init = function(container) {

		// Create a container div
		_element.div = container.append('div').attr('class', 'sentio timeline');

		// Create the SVG element
		_element.svg = _element.div.append('svg');

		// Add the defs and add the clip path definition
		var defs = _element.svg.append('defs');
		_element.plotClipPath = defs.append('clipPath').attr('id', 'plot_' + _id).append('rect');
		_element.markerClipPath = defs.append('clipPath').attr('id', 'marker_' + _id).append('rect');

		// Append a container for everything
		_element.g.container = _element.svg.append('g');

		// Append the grid
		_element.g.grid = _element.g.container.append('g').attr('class', 'grid');
		_element.g.xAxisGrid = _element.g.grid.append('g').attr('class', 'x');
		_element.g.yAxisGrid = _element.g.grid.append('g').attr('class', 'y');

		// Append the path group (which will have the clip path and the line path
		_element.g.plots = _element.g.container.append('g').attr('class', 'plots');
		_element.g.plots.attr('clip-path', 'url(#plot_' + _id + ')');

		// Append groups for the axes
		_element.g.axes = _element.g.container.append('g').attr('class', 'axis');
		_element.g.xAxis = _element.g.axes.append('g').attr('class', 'x');
		_element.g.yAxis = _element.g.axes.append('g').attr('class', 'y');

		// Append a group for the voronoi and the points
		_element.g.points = _element.g.container.append('g').attr('class', 'points');
		_element.g.points.attr('clip-path', 'url(#marker_' + _id + ')');
		_element.g.voronoi = _element.g.container.append('g').attr('class', 'voronoi');


		// Append a group for the markers
		_element.g.markers = _element.g.container.append('g').attr('class', 'markers');
		_element.g.markers.attr('clip-path', 'url(#marker_' + _id + ')');

		// Add the brush element
		_element.g.brush = _element.g.container.append('g').attr('class', 'x brush');
		_element.g.brush.attr('clip-path', 'url(#marker_' + _id + ')');


		_instance.resize();

		return _instance;
	};

	/*
	 * Set the data to drive the chart
	 */
	_instance.data = function(v) {
		if (!arguments.length) { return _data; }
		_data = (null != v)? v : [];

		return _instance;
	};

	/*
	 * Define the series to show on the chart
	 */
	_instance.series = function(v) {
		if (!arguments.length) { return _series; }
		_series = (null != v)? v : [];

		return _instance;
	};

	/*
	 * Set the markers data
	 */
	_instance.markers = function(v) {
		if (!arguments.length) { return _markers; }
		_markers = (null != v)? v : [];
		return _instance;
	};

	/*
	 * Updates all the elements that depend on the size of the various components
	 */
	_instance.resize = function() {

		// Need to grab the brush extent before we change anything
		var brushSelection = getBrush();


		// Resize the SVG Pane
		_element.svg.attr('width', _width).attr('height', _height);

		// Update the margins on the main draw group
		_element.g.container.attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');


		// Resize Scales
		_scale.x.range([ 0, Math.max(0, _width - _margin.left - _margin.right) ]);
		_scale.y.range([ Math.max(0, _height - _margin.top - _margin.bottom), 0 ]);


		/**
		 * Resize clip paths
		 */

		// Plot clip path is only the plot pane
		_element.plotClipPath
			.attr('transform', 'translate(0, -1)')
			.attr('width', Math.max(0, _scale.x.range()[1]) + 2)
			.attr('height', Math.max(0, _scale.y.range()[0]) + 2);

		// Marker clip path includes top margin by default
		_element.markerClipPath
			.attr('transform', 'translate(0, -' + _margin.top + ')')
			.attr('width', Math.max(0, _width - _margin.left - _margin.right))
			.attr('height', Math.max(0, _height - _margin.bottom));

		// Resize the clip extent of the plot
		_voronoi.extent([
			[ 0, 0 ],
			[ _width - _margin.left - _margin.right, _height - _margin.top - _margin.bottom ]
		]);


		/**
		 * Update axis and grids
		 */

		// Reset axis and grid positions
		_element.g.xAxis.attr('transform', 'translate(0,' + _scale.y.range()[0] + ')');
		_element.g.xAxisGrid.attr('transform', 'translate(0,' + _scale.y.range()[0] + ')');


		// Resize the x grid ticks
		if (_displayOptions.xGrid) {
			_axis.xGrid.tickSizeInner(-(_height - _margin.top - _margin.bottom));
		}
		else {
			_axis.xGrid.tickSizeInner(0);
		}

		// Resize the y grid ticks
		if (_displayOptions.yGrid) {
			_axis.yGrid.tickSizeInner(-(_width - _margin.left - _margin.right));
		}
		else {
			_axis.yGrid.tickSizeInner(0);
		}


		/**
		 * Update the brush
		 */

		// Resize and position the brush g element
		_element.g.brush.selectAll('rect')
			.attr('y', -1).attr('x', 0)
			.attr('width', _scale.x.range()[1])
			.attr('height', _scale.y.range()[0] + 2);

		// Resize the brush
		_brush.brush()
			.extent([ [ 0, 0 ], [ _scale.x.range()[1], _scale.y.range()[0] + 2 ] ]);

		updateBrush(brushSelection);


		return _instance;
	};


	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {

		// Need to grab the brush extent before we change anything
		var brushSelection = getBrush();

		// Update the x domain (to the latest time window)
		_scale.x.domain(_extent.x.getExtent(_data));

		// Update the y domain (based on configuration and data)
		_scale.y.domain(_multiExtent.extent(_extent.y).series(_series).getExtent(_data));

		// Update the plot elements
		updateAxes();
		updateLine();
		updateMarkers();
		updateBrush(brushSelection);

		return _instance;
	};


	// Basic Getters/Setters
	_instance.width = function(v) {
		if (!arguments.length) { return _width; }
		_width = v;
		return _instance;
	};
	_instance.height = function(v) {
		if (!arguments.length) { return _height; }
		_height = v;
		return _instance;
	};
	_instance.margin = function(v) {
		if (!arguments.length) { return _margin; }
		_margin = v;
		return _instance;
	};
	_instance.showXGrid = function(v) {
		if (!arguments.length) { return _displayOptions.xGrid; }
		_displayOptions.xGrid = v;
		return _instance;
	};
	_instance.showYGrid = function(v) {
		if (!arguments.length) { return _displayOptions.yGrid; }
		_displayOptions.yGrid = v;
		return _instance;
	};
	_instance.showGrid = function(v) {
		_displayOptions.xGrid = _displayOptions.yGrid = v;
		return _instance;
	};
	_instance.pointEvents = function(v) {
		if (!arguments.length) { return _displayOptions.pointEvents; }
		_displayOptions.pointEvents = v;
		return _instance;
	};

	_instance.curve = function(v) {
		if (!arguments.length) { return _line.curve(); }
		_line.curve(v);
		_area.curve(v);
		return _instance;
	};

	_instance.xAxis = function(v) {
		if (!arguments.length) { return _axis.x; }
		_axis.x = v;
		return _instance;
	};
	_instance.xGridAxis = function(v) {
		if (!arguments.length) { return _axis.xGrid; }
		_axis.xGrid = v;
		return _instance;
	};
	_instance.yAxis = function(v) {
		if (!arguments.length) { return _axis.y; }
		_axis.y = v;
		return _instance;
	};
	_instance.yGridAxis = function(v) {
		if (!arguments.length) { return _axis.yGrid; }
		_axis.yGrid = v;
		return _instance;
	};
	_instance.xScale = function(v) {
		if (!arguments.length) { return _scale.x; }
		_scale.x = v;
		if (null != _axis.x) {
			_axis.x.scale(v);
		}
		if (null != _axis.xGrid) {
			_axis.xGrid.scale(v);
		}
		if (null != _brush) {
			_brush.scale(v);
		}
		return _instance;
	};
	_instance.yScale = function(v) {
		if (!arguments.length) { return _scale.y; }
		_scale.y = v;
		if (null != _axis.y) {
			_axis.y.scale(v);
		}
		if (null != _axis.yGrid) {
			_axis.yGrid.scale(v);
		}
		return _instance;
	};
	_instance.xValue = function(v) {
		if (!arguments.length) { return _fn.valueX; }
		_fn.valueX = v;
		return _instance;
	};
	_instance.yExtent = function(v) {
		if (!arguments.length) { return _extent.y; }
		_extent.y = v;
		return _instance;
	};
	_instance.xExtent = function(v) {
		if (!arguments.length) { return _extent.x; }
		_extent.x = v;
		return _instance;
	};

	_instance.markerXValue = function(v) {
		if (!arguments.length) { return _fn.markerValueX; }
		_fn.markerValueX = v;
		return _instance;
	};
	_instance.markerLabel = function(v) {
		if (!arguments.length) { return _fn.markerValueLabel; }
		_fn.markerValueLabel = v;
		return _instance;
	};

	_instance.dispatch = function(v) {
		if (!arguments.length) { return _dispatch; }
		return _instance;
	};

	_instance.brush = function(v) {
		if (!arguments.length) { return _brush.enabled(); }
		_brush.enabled(v);
		return _instance;
	};
	_instance.setBrush = function(v) {
		setBrush(v);
		return _instance;
	};
	_instance.getBrush = function() {
		return getBrush();
	};

	return _instance;
}
