sentio.chart.donut = sentio_chart_donut;

function sentio_chart_donut() {
	'use strict';

	// Layout properties
	var _id = 'donut_' + Date.now();

	// Chart height/width
	var _width = 460;
	var _height = 300;

	// Radius
	var _innerRadius = 70;
	var _outerRadius = 100;

	// Transition duration
	var _duration = 200;

	// Legend stuff
	var _showLegend = true;
	var _legendRectSize = 18;
	var _legendSpacing = 4;
	var _arcStrokeColor = "#111";
	var _enableLegendToggles = true;
	var _highlightLegend = true;
	var _highlightColor = "";
	var _highlightOpacity = 0.5;
	var _highlightStrokeColor = "#111";
	var _highlightExpansion = 5;
	var _centerLegend = true;

	var _showTooltip = true;
	var _followMouseOnTooltip = false;

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

	// Extents
	var _extent = {
	};

	var _scale = {
		
	};

	// elements
	var _element = {
		div: undefined,
		svg: undefined,
		gChart: undefined,
		legend: undefined,
		tooltip: undefined
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
		_element.div = container.append('div').attr('class', 'donut');

		// Create the svg element
		_element.svg = _element.div.append('svg');

		// Create the main chart group
		_element.gChart = _element.svg.append('g');

		// set up the tooltip container
		_element.tooltip = _element.div
			.append('div')
			.attr('class', 'tooltip');

		_element.tooltip.append('div')
			.attr('class', 'label');
		_element.tooltip.append('div')
			.attr('class', 'count');
		_element.tooltip.append('div')
			.attr('class', 'percent');

		_instance.resize();

		return _instance;
	};

	/*
	 * Set the _instance data
	 */
	_instance.data = function(v) {
		if(!arguments.length) { return _data; }
		_data = v || [];
		_data.forEach(function(d) {
			d.enabled = true;
		});
		return _instance;
	};

	/*
	 * Updates all the elements that depend on the size of the various components
	 */
	_instance.resize = function() {
		_element.svg
			.attr('width', _width)
			.attr('height', _height);

		_element.gChart
			.attr('transform', 'translate(' + (_width / 2) + ',' + (_height / 2) + ')');

		return _instance;
	};

	/*
	 * Redraw the graphic
	 */
	_instance.redraw = function() {
		var color = d3.scale.category10();

		// Create the donut
		var arc = d3.svg.arc()
			.innerRadius(_innerRadius)
			.outerRadius(_outerRadius);

		var pie = d3.layout.pie()
			.value(function(d) { return d.value; })
			.sort(null);

		var g = _element.gChart.selectAll(".arc")
			.data(pie(_data));

			g.transition(_duration)
			.attrTween('d', function(d) {
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					return arc(interpolate(t));
				};
			});

		var gEnter = g.enter();
		gEnter.append("path")
			.attr("class", "arc")
			.each(function(d) { this._current = d; });
			g.transition()
			.duration(_duration)
			.attrTween('d', function(d) {
				if (this.tweened) return;
				this.tweened = true;
				// When this is the first draw, need a transition that
				// ramps up like a gauge
					var start = {
						startAngle: 0,
						endAngle: 0
					};
					var i = d3.interpolate(start, d);
					return function(d1) { return arc(i(d1)); };
			});

		g.attr("class", "arc")
			.attr("d", arc)
			.attr('key', function(d) {
				return d.data.key;
			})
			.attr('fill', function(d, i) {
				return color(d.data.key);
			})
			.style('stroke', _arcStrokeColor);

		var components = {
			color: color,
			pie: pie,
			g: g,
			arc: arc
		};

		if (_showTooltip || _highlightLegend) {
			redrawTooltip(components);
		}

		if (_showLegend) {
			redrawLegend(components);
		}
		return _instance;
	};

	/**
	 * Private functions
	 */
	function redrawTooltip(components) {
		var color = components.color;
		var g = components.g;
		var arc = components.arc;

		// Mouse over a donut arc, show tooltip
		g.on('mouseover', function(d) {
			if (_showTooltip) {

				// Tooltip contents...
				var total = d3.sum(_data.map(function (d) {
					return (d.enabled) ? d.value : 0;
				}));

				var percent = Math.round(100 * d.data.value / total);
				_element.tooltip.select('.label').html(d.data.key);
				_element.tooltip.select('.count').html(d.data.value);
				_element.tooltip.select('.percent').html(percent + '%');
				_element.tooltip.style('display', 'block');
			}

			if (_highlightLegend) {
				// Reverse highlight the legend when hovering over a donut arc
				var legendContainer = _centerLegend ? _element.gChart : _element.legend;

				// Get the rect in the legend that corresponds to this donut arc
				var rect = legendContainer.select('rect[key="' + d.data.key +'"]');

				// save off the original color
				d.origColor = rect.style('fill');

				// Do the highlighting
				rect
					.transition(_duration)
					.style("fill-opacity", _highlightOpacity);
				if (undefined !== _highlightColor && _highlightColor !== "") {
					rect.style('fill', _highlightColor);
				}
				var thisSelect = d3.select(this)
					.transition(_duration);
				if (undefined !== _highlightColor && _highlightColor !== "") {
					thisSelect.style('fill', _highlightColor);
				}
				thisSelect
					.style("fill-opacity", _highlightOpacity)
					.style('stroke', _highlightStrokeColor);

				if (_highlightExpansion > 0) {
					var arcExpanded = d3.svg.arc()
						.innerRadius(_innerRadius - _highlightExpansion)
						.outerRadius(_outerRadius + _highlightExpansion);
					thisSelect.transition(_duration)
						.attr("d", arcExpanded);
				}
			}
		});

		if (_showTooltip || _highlightLegend) {
			var legendContainer = _centerLegend ? _element.gChart : _element.legend;

			// Put things back how they were
			g.on('mouseout', function (d) {
				if (_showTooltip) {
					_element.tooltip.style('display', 'none');
				}
				if (_highlightLegend) {
					var rect = legendContainer.select('rect[key="' + d.data.key +'"]').filter(function(r) { return null != r; });
					rect
						.transition(_duration)
						.style('fill', color)
						.style("fill-opacity", 1);
					var thisSelect = d3.select(this)
						.transition(_duration)
						.style('fill', function(d) { return d.origColor; })
						.style("fill-opacity", 1)
						.style('stroke', _arcStrokeColor);

					if (_highlightExpansion > 0) {
						thisSelect.transition(_duration)
							.attr("d", arc);
					}
				}
			});
		}

		// This option makes the tooltip follow the mouse or stay fixed in place
		if (_followMouseOnTooltip) {
			g.on('mousemove', function(d) {
				_element.tooltip.style('top', (d3.event.pageY + 10) + 'px')
					.style('left', (d3.event.pageX + 10) + 'px');
			});
		}
	}

	function redrawLegend(components) {
		var color = components.color;
		var pie = components.pie;
		var g = components.g;
		var arc = components.arc;

		// set up the legend container
		if (!_centerLegend) {
			_element.div.select('.legend-container')
				.remove();
			_element.legend = _element.div
				.append('div')
				.attr('class', 'legend-container')
				.append('svg');
		}

		var legendContainer = _centerLegend ? _element.gChart : _element.legend;

		// Reset previous legend
		legendContainer.selectAll('.legend')
			.remove();

		var height, offset, horz, vert;
		var legend = legendContainer.selectAll('.legend')
			.data(color.domain())
			.enter()
			.append('g')
			.attr('class', 'legend')
			.attr('transform', function (d, i) {
				// In centerLegend mode, the legend will be formatted to go in the middle of the donut
				if (_centerLegend) {
					height = _legendRectSize + _legendSpacing;
					offset = height * color.domain().length / 2;
					horz = -2 * _legendRectSize;
					vert = i * height - offset;
					return 'translate(' + horz + ',' + vert + ')';
				} else {
					// Otherwise format it such that a css styled div can hold the legend contents
					height = _legendRectSize + _legendSpacing;
					horz = _legendRectSize/2;
					vert = i * height + _legendSpacing;
					return 'translate(' + horz + ',' + vert + ')';
				}

			});

		var rect = legend.append('rect')
			.attr('key', function(d) {
				return d;
			})
			.attr('width', _legendRectSize)
			.attr('height', _legendRectSize)
			.style('fill', color)
			.style('stroke', 'black')
			.style('stroke-width', 1);

		// If the legend should be able to toggle data on and off, set that up
		if (_enableLegendToggles) {
			rect.attr("class", "toggle");
			rect.on('click', function (label) {
				var rect = d3.select(this);
				var enabled = true;
				var totalEnabled = d3.sum(_data.map(function (d) {
					return (d.enabled) ? 1 : 0;
				}));

				if (rect.attr('class') === 'disabled') {
					rect.attr('class', 'toggle');
				} else {
					if (totalEnabled < 2) return;
					rect.attr('class', 'disabled');
					enabled = false;
				}

				pie.value(function (d) {
					if (d.key === label) d.enabled = enabled;
					return (d.enabled) ? d.value : 0;
				});

				g = g.data(pie(_data));

				g.transition()
					.duration(_duration)
					.attrTween('d', function (d) {
						var interpolate = d3.interpolate(this._current, d);
						this._current = interpolate(0);
						return function (t) {
							return arc(interpolate(t));
						};
					});
			});
		}

		// If highlight legend is enabled, highlight the rect and donut arc on mouse over
		if (_highlightLegend) {
			rect.on('mouseover', function(d) {

				// Perform highlight on the arc path
				var path = _element.gChart.select('path[key="' + d +'"]')
					.transition(_duration);
				if (undefined !== _highlightColor && _highlightColor !== "") {
					path.style('fill', _highlightColor);
				}
				path.style('stroke', _highlightStrokeColor)
					.style('fill-opacity', _highlightOpacity);

				// Perform highlight on the rect being hovered over (this)
				var thisRect = d3.select(this)
					.transition(_duration)
					.style("fill-opacity", _highlightOpacity);
				if (undefined !== _highlightColor && _highlightColor !== "") {
					thisRect.style("fill", _highlightColor);
				}
				if (_highlightExpansion > 0) {
					var arcExpanded = d3.svg.arc()
						.innerRadius(_innerRadius - _highlightExpansion)
						.outerRadius(_outerRadius + _highlightExpansion);
					path.transition(_duration)
						.attr("d", arcExpanded);
				}
			});

			// Put things back
			rect.on('mouseout', function(d) {

				// Unhighlight the arc path
				var path = _element.gChart.select('path[key="' + d +'"]');


				// Unhighlight the rect (this)
				d3.select(this)
					.transition(_duration)
					.style("fill-opacity", 1)
					.style("fill", color);

				path
					.style("stroke", _arcStrokeColor)
					.style('fill-opacity', 1);

				if (_highlightExpansion > 0) {
					path.transition(_duration)
						.attr("d", arc);
				}
			});
		}

		legend.append('text')
			.attr('x', _legendRectSize + _legendSpacing)
			.attr('y', _legendRectSize - _legendSpacing)
			.text(function (d) {
				return d;
			});
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

	_instance.innerRadius = function(v) {
		if(!arguments.length) { return _innerRadius; }
		_innerRadius = v;
		return _instance;
	};
	_instance.outerRadius = function(v) {
		if(!arguments.length) { return _outerRadius; }
		_outerRadius = v;
		return _instance;
	};

	_instance.duration = function(v) {
		if(!arguments.length) { return _duration; }
		_duration = v;
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

	_instance.dispatch = function(v) {
		if(!arguments.length) { return _dispatch; }
		return _instance;
	};

	_instance.legendSpacing = function(v) {
		if(!arguments.length) { return _legendSpacing; }
		_legendSpacing = v;
		return _instance;
	};
	_instance.legendRectSize = function(v) {
		if(!arguments.length) { return _legendRectSize; }
		_legendRectSize = v;
		return _instance;
	};
	_instance.showTooltip = function(v) {
		if(!arguments.length) { return _showTooltip; }
		_showTooltip = v;
		return _instance;
	};
	_instance.showLegend = function(v) {
		if(!arguments.length) { return _showLegend; }
		_showLegend = v;
		return _instance;
	};
	_instance.legendToggles = function(v) {
		if(!arguments.length) { return _enableLegendToggles; }
		_enableLegendToggles = v;
		return _instance;
	};
	_instance.highlightLegend = function(v) {
		if(!arguments.length) { return _highlightLegend; }
		_highlightLegend = v;
		return _instance;
	};
	_instance.highlightColor = function(v) {
		if(!arguments.length) { return _highlightColor; }
		_highlightColor = v;
		return _instance;
	};
	_instance.highlightStrokeColor = function(v) {
		if(!arguments.length) { return _highlightStrokeColor; }
		_highlightStrokeColor = v;
		return _instance;
	};
	_instance.highlightExpansion = function(v) {
		if(!arguments.length) { return _highlightExpansion; }
		_highlightExpansion = v;
		return _instance;
	};
	_instance.centerLegend = function(v) {
		if(!arguments.length) { return _centerLegend; }
		_centerLegend = v;
		return _instance;
	};
	return _instance;
}