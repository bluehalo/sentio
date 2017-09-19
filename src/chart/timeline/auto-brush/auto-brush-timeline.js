import { default as timeline } from '../timeline';

import { dispatch as d3_dispatch } from 'd3-dispatch';


export default function autoBrushTimeline() {

	var _id = 'autobrush_timeline_' + Date.now();

	/**
	 * Auto brush configuration
	 */
	var _now = Date.now();

	var _config = {
		edgeTrigger: 0.01,
		zoomInTrigger: 0.05,
		zoomOutTrigger: 0.8,
		zoomTarget: 0.2
	};

	var _maxZoom = 24 * 60 * 60 * 1000;
	var _maxExtent = [ _now - (10 * 365 * 24 * 60 * 60 * 1000), _now ];
	var _initialBrush = [ _now - (180 * 24 * 60 * 60 * 1000), _now ];

	var _brush;
	var _dispatch = d3_dispatch('extentChange', 'brushChange');


	/**
	 * Set up the timeline instance
	 */

	var _instance = timeline();

	var _timeline = {
		element: {},
		brush: _instance.brush,
		dispatch: _instance.dispatch,
		init: _instance.init,
		resize: _instance.resize,
		redraw: _instance.redraw,
		setBrush: _instance.setBrush,
		xAxis: _instance.xAxis
	};

	// Set up default look and feel
	_instance.margin({ top: 2, right: 10, bottom: 2, left: 10  });
	_instance.xAxis().ticks(6);
	_instance.yAxis(null);


	// Initialization of the timline and auto brush
	_instance.init = function(container) {

		// Initialize the timeline
		_timeline.init(container);

		// Turn on brushing and register for brush events
		_timeline.brush(true);
		_timeline.dispatch().on('brushend.internal', updateBrush);

		// Grab and persist some important elements
		_timeline.element.div = container.select('div.sentio.timeline');

		// Set the initial brush
		if (null == _brush) {
			_brush = _initialBrush;
			_instance.setBrush(_brush);
		}

		// Add a clip path for the axis
		_timeline.element.axisClipPath = container.select('svg defs').append('clipPath')
			.attr('id', 'axis_' + _id).append('rect');

		// Attach the clip path to the axis
		_timeline.element.div.select('g.x.axis').attr('clip-path', 'url(#axis_' + _id + ')');

		_instance.resize();

		return _instance;
	};


	// Redraw the auto brush
	_instance.redraw = function() {

		// Let the timeline redraw like normal
		_timeline.redraw();

		/*
		 * Update the X Axis
		 */

		// Set the x Axis ticks to be full height
		_instance.xAxis()
			.tickSize(-_instance.height() + _instance.margin().top + _instance.margin().bottom);

		// Update text position to be on the chart
		_timeline.element.div.selectAll('g.x.axis g.tick text')
			.attr('y', '3')
			.attr('dy', '-0.71em')
			.attr('dx', '0.35em')
			.attr('text-anchor', 'start')
			.attr('pointer-events', 'none');

		// Call it to redraw
		if (null != _instance.xAxis()) {
			_timeline.element.div.select('g.x.axis').call(_instance.xAxis());
		}

		return _instance;
	};

	// Resize
	_instance.resize = function() {

		_timeline.resize();

		// Need to be defensive here since parent init calls resize
		if (null != _timeline.element.axisClipPath) {

			var margin = _instance.margin();
			var width = _instance.width();
			var height = _instance.height();

			// Update the size of the xAxis clip path
			_timeline.element.axisClipPath
				.attr('transform', 'translate(0, -' + (height + margin.top) + ')')
				.attr('width', Math.max(0, width - margin.left - margin.right))
				.attr('height', Math.max(0, height + margin.bottom + margin.top));

		}
	};

	function cropBrush(brush) {

		var newBrush = brush;

		// Crop the brush to max extent
		if (null != newBrush) {

			// Make a new copy
			newBrush = brush.slice();

			// Crop the brush using the max extent
			newBrush[0] = Math.max(newBrush[0], _maxExtent[0]);
			newBrush[1] = Math.min(newBrush[1], _maxExtent[1]);

		}

		return newBrush;
	}

	/**
	 * Handle a change to the brush (whether from the timeline or manual)
	 * - Crop the brush if necessary based on maxExtent
	 * - Ensure the brush is valid.
	 * - Update the brush and recalculate the extent.
	 *
	 * @param newBrush
	 */
	function updateBrush(newBrush) {

		newBrush = cropBrush(newBrush);

		// Ensure the brush is valid
		if (null != newBrush && (newBrush[1] - newBrush[0]) > _maxZoom) {

			// Update the brush
			_brush = newBrush;
			_timeline.setBrush(newBrush);

			// Update the extent as necessary
			updateExtent();

			// Fire the brush change event
			_dispatch.call('brushChange', this, newBrush);

		}
		else {

			// Don't allow them to apply an invalid brush
			_timeline.setBrush(_brush);
		}

		_instance.redraw();

	}

	/**
	 * Update the extent
	 */
	function updateExtent() {

		var brushChange = checkBrush(_brush);

		if (brushChange.pan || brushChange.zoom) {

			// Update the Extent and fire the event
			var newExtent = calculateXExtent(_brush, brushChange);
			_instance.xExtent().overrideValue(newExtent);
			_dispatch.call('extentChange', this, newExtent);

		}

	}

	/**
	 * Check to see if the extent needs to change
	 * - Checks boundaries and zoom level
	 * - Returns a status to indicate how the extent needs to change
	 *
	 * @param brush
	 * @returns { pan: boolean, zoom: boolean }
	 */
	function checkBrush(brush) {

		var toReturn = { pan: false, zoom: false };

		if (null != brush) {

			var xScale = _instance.xScale();

			/**
			 *
			 * |  |\\\\\|      |
			 * a  b     c      d
			 *
			 * a - lower boundary of the chart
			 * b - lower boundary of the brush
			 * c - upper boundary of the brush
			 * d - upper boundary of the chart
			 *
			 */
			var a = xScale.domain()[0];
			var b = brush[0];
			var c = brush[1];
			var d = xScale.domain()[1];

			var widthE = d - a;
			var widthB = c - b;
			var ratio = widthB / widthE;

			// Detect edge collisions
			var lowerCollision = ((b - a) / widthE <= _config.edgeTrigger && b > _maxExtent[0]);
			var upperCollision = ((d - c) / widthE <= _config.edgeTrigger && c < _maxExtent[1]);

			// Should we resize and/or recenter?
			toReturn.zoom = (ratio >= _config.zoomOutTrigger || ratio <= _config.zoomInTrigger);
			toReturn.pan = (lowerCollision || upperCollision);

		}

		return toReturn;
	}

	/**
	 * Given the brush, determine the new xExtent that should be applied
	 * @param brush The brush for which to determine the extent
	 * @param transform What kind of transform we should apply (whether zoom or pan)
	 * @returns {[*,*]}
	 */
	function calculateXExtent(brush, transform) {

		var a = _instance.xScale().domain()[0];
		var b = brush[0];
		var c = brush[1];
		var d = _instance.xScale().domain()[1];

		// Start with the width we currently have as the target width
		var newWidthE = d - a;

		// If we're zooming, change the target width
		if (transform.zoom) {

			// Calculate the new width of the extent (and make sure it isn't smaller than the max zoom)
			newWidthE = Math.max((c - b) / _config.zoomTarget, _maxZoom);

		}


		// Determine the current center of the brush
		var centerB = b + (c - b) / 2;

		// Calculate the new lower bound as half the new width from the center
		var newA = Math.max(centerB - (newWidthE) / 2, _maxExtent[0]);

		// Track how much of the width we successfully applied to the new lower bound
		newWidthE -= centerB - newA;

		// Determine the new upper bound as as much of the width as we can apply above the center
		var newD = Math.min(centerB + newWidthE, _maxExtent[1]);

		// Track how much of the width we applied to the upper bound
		newWidthE -= newD - centerB;

		// If newWidthE is greater than zero, it means that clipping kept us from applying
		// all of the width, so we should try to apply the rest to the lower bound
		newA = Math.max(newA - newWidthE, _maxExtent[0]);

		return [ newA, newD ];

	}


	// Basic Getters/Setters
	_instance.edgeTrigger = function(v) {
		if (!arguments.length) { return _config.edgeTrigger; }
		_config.edgeTrigger = v;
		return _instance;
	};
	_instance.zoomInTrigger = function(v) {
		if (!arguments.length) { return _config.zoomInTrigger; }
		_config.zoomInTrigger = v;
		return _instance;
	};
	_instance.zoomOutTrigger = function(v) {
		if (!arguments.length) { return _config.zoomOutTrigger; }
		_config.zoomOutTrigger = v;
		return _instance;
	};
	_instance.zoomTarget = function(v) {
		if (!arguments.length) { return _config.zoomTarget; }
		_config.zoomTarget = v;
		return _instance;
	};

	_instance.maxExtent = function(v) {
		if (!arguments.length) { return _maxExtent; }
		_maxExtent = v;

		return _instance;
	};
	_instance.maxZoom = function(v) {
		if (!arguments.length) { return _maxZoom; }
		_maxZoom = v;

		return _instance;
	};

	_instance.setBrush = function(v) {
		updateBrush(v);
		return _instance;
	};

	_instance.dispatch = function() {
		return _dispatch;
	};

	_instance.rawDispatch = function() {
		return _timeline.dispatch;
	};

	// Cannot disable the brush
	_instance.brush = function() {
		return true;
	};

	return _instance;
}
