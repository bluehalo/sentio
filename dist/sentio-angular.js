angular.module('sentio', []);
angular.module('sentio.realtime', []);
angular.module('sentio').directive('sentioDonutChart', [ '$document', '$window', '$timeout', '$log',
	function($document, $window, $timeout, $log) {
		'use strict';

		return {
			restrict : 'A',
			scope : {
				model: '=sentioModel',
				duration: '=sentioDuration',
				color: '=sentioColor',
				api: '=sentioApi',
				resizeWidth: '@sentioResizeWidth',
				resizeHeight: '@sentioResizeHeight',
				configureFn: '&sentioConfigureFn'
			},
			replace : false,
			link : function(scope, element, attrs, controller) {

				var chartElement = d3.select(element[0]);
				var chart = sentio.chart.donut();

				// Extract the width of the chart
				var width = element[0].style.width;
				if(null != width && '' !== width) {
					width = parseFloat(width.substring(0, width.length-2));
					if(null != width && !isNaN(width)) {
						chart.width(width);
						// set height to match width in this case to keep the donut round
						chart.height(width);
					}
				}


				chart.init(chartElement);

				scope.$watchCollection('model', function(n, o){
					if(null == o && null == n){ return; }

					chart.data(n);
					redraw();
				});


				scope.$watch('configureFn', function(n, o){
					if(null != scope.configureFn){
						scope.configureFn({ chart: chart });
					}
				});

				scope.$watch('duration', function(n, o){
					if(null == o && null == n){ return; }

					chart.duration(n);
				});

				scope.$watch('colorScale', function(n, o){
					if(null == o && null == n){ return; }

					chart.duration(n);
				}, true);

				scope.$watch('api', function(n, o) {
					if(null != scope.api) {
						scope.api.redraw = chart.redraw;
						scope.api.resize = doResize;
					}
				});

				// Manage resizing the chart
				var resizeWidth = (null != attrs.sentioResizeWidth);
				var resizeHeight = (null != attrs.sentioResizeHeight);
				var resizeTimer;
				var redrawTimer;
				var window = angular.element($window);

				// Do the redraw only once when the $digest cycle has completed
				var redraw = function() {
					if (null != redrawTimer) {
						$timeout.cancel(redrawTimer);
					}
					redrawTimer = $timeout(function () {
						chart.redraw();
					}, 0);
				};

				var doResize = function() {

					// Get the raw body element
					var body = $document[0].body;

					// Cache the old overflow style
					var overflow = body.style.overflow;
					body.style.overflow = 'hidden';

					// Get the raw parent
					var rawElement = element[0];
					// Derive width of the parent (there are several ways to do this depending on the parent)
					var parentWidth = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;

					// Calculate the new width based on the parent and the resize size
					var width = (resizeWidth)? parentWidth - attrs.sentioResizeWidth : undefined;

					// Set height to match width to keep donut round
					var height = width;

					// Reapply the old overflow setting
					body.style.overflow = overflow;

					// Get the old widths and heights
					var oldHeight = chart.height();
					var oldWidth = chart.width();

					if (height !== oldHeight || width !== oldWidth) {
						$log.debug('resize donut.chart width: ' + width);
						$log.debug('resize donut.chart height: ' + height);

						// Apply the new height
						if(resizeHeight){ chart.height(height);}
						// Apply the new width
						if(resizeWidth){ chart.width(width); }
						chart.resize();
						redraw();
					} else {
						$log.debug('resize donut.chart width unchanged: ' + width);
						$log.debug('resize donut.chart height unchanged: ' + height);
					}
				};
				var delayResize = function(){
					if(undefined !== resizeTimer){
						$timeout.cancel(resizeTimer);
					}
					resizeTimer = $timeout(doResize, 0);
				};

				if(resizeWidth){
					window.on('resize', delayResize);
					delayResize();
				}
				scope.$on('$destroy', function () {
					window.off('resize', delayResize);
				});
			}
		};
	}]);

angular.module('sentio').directive('sentioMatrixChart', [ '$document', '$window', '$timeout', '$log',
	function($document, $window, $timeout, $log) {
		'use strict';

		return {
			restrict : 'A',
			scope : {
				model: '=sentioModel',
				configureFn: '&sentioConfigureFn'
			},
			replace : false,
			link : function(scope, element, attrs, controller) {

				var chartElement = d3.select(element[0]);
				var chart = sentio.chart.matrix();

				chart.init(chartElement);

				scope.$watch('configureFn', function(n, o){
					if(null != scope.configureFn){
						scope.configureFn({ chart: chart });
					}
				});

				scope.$watchCollection('model', function(n, o){
					if(null == o && null == n){ return; }

					chart.data(n);
					redraw();
				});

				// Redraw (we don't support resize on the matrix)
				var redrawTimer;

				// Do the redraw only once when the $digest cycle has completed
				var redraw = function() {
					if (null != redrawTimer) {
						$timeout.cancel(redrawTimer);
					}
					redrawTimer = $timeout(function () {
						chart.redraw();
					}, 0);
				};

				scope.$on('$destroy', function () {
					if(null != redrawTimer) {
						$timeout.cancel(redrawTimer);
					}
				});
			}
		};
	}]);

angular.module('sentio.realtime').directive('sentioRtTimeline', [ '$document', '$window', '$timeout', '$log', 
function($document, $window, $timeout, $log) {
	'use strict';

	return {
		restrict : 'A',
		scope : {
			model: '=sentioModel',
			markers: '=sentioMarkers',
			markerHover: '=sentioMarkerHover',
			interval: '=sentioInterval',
			delay: '=sentioDelay',
			yExtent: '=sentioYExtent',
			fps: '=sentioFps',
			api: '=sentioApi',
			resizeWidth: '@sentioResizeWidth',
			resizeHeight: '@sentioResizeHeight',
			configure: '&sentioConfigureFn'
		},
		replace : false,
		link : function(scope, element, attrs, controller) {
			var timelineElement = d3.select(element[0]);
			var timeline = sentio.realtime.timeline();

			// Extract the height and width of the chart
			var width = element[0].style.width;
			if(null != width && '' !== width) { 
				width = parseFloat(width.substring(0, width.length-2));
				if(null != width && !isNaN(width)) { timeline.width(width); }
			}
			var height = element[0].style.height;
			if(null != height && '' !== height) {
				height = parseFloat(height.substring(0, height.length-2));
				if(null != height && !isNaN(height)) { timeline.height(height); }
			}

			timeline.init(timelineElement).data([]).start();

			// setup the marker callback method if one was provided
			if(null != scope.markerHover) {
				timeline.markerHover( scope.markerHover );
			}

			scope.$watch('configure', function(n, o){
				if(null != scope.configure){
					scope.configure({ timeline: timeline });
					timeline.redraw();
				}
			});

			// Only want to watch when the collection object changes
			scope.$watch('model', function(n, o){
				if(null == o && null == n){ return; }

				timeline.data(n).redraw();
			});

			// Only want to watch when the collection object changes
			scope.$watch('markers', function(n, o){
				if(null == o && null == n){ return; }

				timeline.markers(n).redraw();
			});

			scope.$watch('interval', function(n, o){
				if(null == o && null == n){ return; }

				timeline.interval(n).redraw();
			});

			scope.$watch('delay', function(n, o){
				if(null == o && null == n){ return; }

				timeline.delay(n).redraw();
			});

			scope.$watchCollection('yExtent', function(n, o){
				if(null == o && null == n){ return; }

				timeline.yExtent().overrideValue(n);
				timeline.redraw();
			});

			scope.$watch('fps', function(n, o){
				if(null == o && null == n){ return; }

				timeline.fps(n).redraw();
			});

			scope.$watch('api', function(n, o) {
				if(null != scope.api) {
					scope.api.start = timeline.start;
					scope.api.stop = timeline.stop;
					scope.api.restart = timeline.restart;
					scope.api.redraw = timeline.redraw;
					scope.api.resize = doResize;
				}
			});

			// Manage resizing the chart
			var resizeWidth = (null != attrs.sentioResizeWidth);
			var resizeHeight = (null != attrs.sentioResizeHeight);
			var resizeTimer;
			var window = angular.element($window);

			var doResize = function() {

				// Get the raw body element
				var body = $document[0].body;

				// Cache the old overflow style
				var overflow = body.style.overflow;
				body.style.overflow = 'hidden';

				// Get the raw parent
				var rawElement = element[0];
				// Derive height/width of the parent (there are several ways to do this depending on the parent)
				var parentWidth = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;
				var parentHeight = rawElement.attributes.height | rawElement.style.height | rawElement.clientHeight;

				// Calculate the new width/height based on the parent and the resize size
				var width = (resizeWidth)? parentWidth - attrs.sentioResizeWidth : undefined;
				var height = (resizeHeight)? parentHeight - attrs.sentioResizeHeight : undefined;

				// Reapply the old overflow setting
				body.style.overflow = overflow;

				$log.debug('resize rt.timeline height: ' + height + ' width: ' + width);

				// Apply the new width and height
				if(resizeWidth){ timeline.width(width); }
				if(resizeHeight){ timeline.height(height); }

				timeline.resize().redraw();
			};
			var delayResize = function(){
				if(undefined !== resizeTimer){
					$timeout.cancel(resizeTimer);
				}
				resizeTimer = $timeout(doResize, 200);
			};

			if(resizeWidth || resizeHeight){
				window.on('resize', delayResize);
				delayResize();
			}
			scope.$on('$destroy', function () {
				window.off('resize', delayResize);
			});
			scope.$on('$destroy', function() {
				timeline.stop();
			});
		}
	};
}]);

angular.module('sentio').directive('sentioTimeline', [ '$document', '$window', '$timeout', '$log', 
function($document, $window, $timeout, $log) {
	'use strict';

	return {
		restrict : 'A',
		scope : {
			model: '=sentioModel',
			markers: '=sentioMarkers',
			yExtent: '=sentioYExtent',
			xExtent: '=sentioXExtent',
			duration: '=sentioDuration',
			api: '=sentioApi',
			resizeWidth: '@sentioResizeWidth',
			resizeHeight: '@sentioResizeHeight',
			configureFn: '&sentioConfigureFn',
			filterFn: '&sentioFilterFn',
			filterState: '=sentioFilterState'
		},
		replace : false,
		link : function(scope, element, attrs, controller) {

			var timelineElement = d3.select(element[0]);
			var timeline = sentio.timeline.line();

			// Extract the height and width of the chart
			var width = element[0].style.width;
			if(null != width && '' !== width) { 
				width = parseFloat(width.substring(0, width.length-2));
				if(null != width && !isNaN(width)) { timeline.width(width); }
			}
			var height = element[0].style.height;
			if(null != height && '' !== height) {
				height = parseFloat(height.substring(0, height.length-2));
				if(null != height && !isNaN(height)) { timeline.height(height); }
			}

			// Check to see if filtering is enabled
			if (null != attrs.sentioFilterFn || attrs.sentioFilterState) {
				timeline.filter(true);
			}

			// Store the filter state outside the scope as well as inside, to compare
			var lastFilterState = null;

			scope.$watch('filterFn', function(n, o){
				timeline.filter().on('filterend', function(filterState){
					$timeout(function(){
						// Call the function callback
						scope.filterFn({ filterState: filterState });

						// Set the two-way-bound scope parameter
						scope.filterState = filterState;

						// Store the filter state locally so we can suppress updates on our own changes
						lastFilterState = filterState;
					});
				});
			});
			scope.$watch('filterState', function(n, o) {
				// If a filter was passed in and it is not the one we just set, do some updates
				if (null != n && n !== lastFilterState) {

					// If we're in the original format with 3 parameters, use the second two only
					// TODO: We should go ahead and get rid of the 3 parameter style
					if (n.length > 2) {
						// The first element indicates if we're disabled
						if (n[0]) {
							return;
						}
						n = n.slice(1, 3);
					}
					timeline.setFilter(n);
				}
			});

			timeline.init(timelineElement);

			scope.$watch('configureFn', function(n, o){
				if(null != scope.configureFn){
					scope.configureFn({ timeline: timeline });
				}
			});

			scope.$watchCollection('model', function(n, o){
				if(null == o && null == n){ return; }

				timeline.data(n);
				redraw();
			});

			scope.$watchCollection('markers', function(n, o){
				if(null == o && null == n){ return; }

				timeline.markers(n);
				redraw();
			});

			scope.$watchCollection('yExtent', function(n, o){
				if(null == o && null == n){ return; }

				timeline.yExtent().overrideValue(n);
				redraw();
			});

			scope.$watchCollection('xExtent', function(n, o){
				if(null == o && null == n){ return; }

				timeline.xExtent().overrideValue(n);
				redraw();
			});

			scope.$watch('duration', function(n, o){
				if(null == o && null == n){ return; }

				timeline.duration(n);
			}, true);

			scope.$watch('api', function(n, o) {
				if(null != scope.api) {
					scope.api.start = timeline.start;
					scope.api.stop = timeline.stop;
					scope.api.restart = timeline.restart;
					scope.api.redraw = timeline.redraw;
					scope.api.resize = doResize;
				}
			});

			// Manage resizing the chart
			var resizeWidth = (null != attrs.sentioResizeWidth);
			var resizeHeight = (null != attrs.sentioResizeHeight);
			var resizeTimer;
			var redrawTimer;
			var window = angular.element($window);

			// Do the redraw only once when the $digest cycle has completed
			var redraw = function() {
				if (null != redrawTimer) {
					$timeout.cancel(redrawTimer);
				}
				redrawTimer = $timeout(function () {
					timeline.redraw();
				}, 0);
			};

			var doResize = function() {

				// Get the raw body element
				var body = $document[0].body;

				// Cache the old overflow style
				var overflow = body.style.overflow;
				body.style.overflow = 'hidden';

				// Get the raw parent
				var rawElement = element[0];
				// Derive height/width of the parent (there are several ways to do this depending on the parent)
				var parentWidth = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;
				var parentHeight = rawElement.attributes.height | rawElement.style.height | rawElement.clientHeight;

				// Calculate the new width/height based on the parent and the resize size
				var width = (resizeWidth)? parentWidth - attrs.sentioResizeWidth : undefined;
				var height = (resizeHeight)? parentHeight - attrs.sentioResizeHeight : undefined;

				// Reapply the old overflow setting
				body.style.overflow = overflow;

				$log.debug('resize rt.timeline height: ' + height + ' width: ' + width);

				// Apply the new width and height
				if(resizeWidth){ timeline.width(width); }
				if(resizeHeight){ timeline.height(height); }

				timeline.resize();
				redraw();
			};
			var delayResize = function(){
				if(undefined !== resizeTimer){
					$timeout.cancel(resizeTimer);
				}
				resizeTimer = $timeout(doResize, 200);
			};

			if(resizeWidth || resizeHeight){
				window.on('resize', delayResize);
				delayResize();
			}
			scope.$on('$destroy', function () {
				window.off('resize', delayResize);
			});
		}
	};
}]);

angular.module('sentio').directive('sentioVerticalBarChart', [ '$document', '$window', '$timeout', '$log', 
function($document, $window, $timeout, $log) {
	'use strict';

	return {
		restrict : 'A',
		scope : {
			model: '=sentioModel',
			widthExtent: '=sentioWidthExtent',
			duration: '=sentioDuration',
			api: '=sentioApi',
			resizeWidth: '@sentioResizeWidth',
			configureFn: '&sentioConfigureFn'
		},
		replace : false,
		link : function(scope, element, attrs, controller) {

			var chartElement = d3.select(element[0]);
			var chart = sentio.chart.verticalBars();

			// Extract the width of the chart
			var width = element[0].style.width;
			if(null != width && '' !== width) { 
				width = parseFloat(width.substring(0, width.length-2));
				if(null != width && !isNaN(width)) { chart.width(width); }
			}

			chart.init(chartElement);

			scope.$watch('configureFn', function(n, o){
				if(null != scope.configureFn){
					scope.configureFn({ chart: chart });
				}
			});

			scope.$watchCollection('model', function(n, o){
				if(null == o && null == n){ return; }

				chart.data(n);
				redraw();
			});

			scope.$watchCollection('widthExtent', function(n, o){
				if(null == o && null == n){ return; }

				chart.widthExtent().overrideValue(n);
				redraw();
			});

			scope.$watch('duration', function(n, o){
				if(null == o && null == n){ return; }

				chart.duration(n);
			}, true);

			scope.$watch('api', function(n, o) {
				if(null != scope.api) {
					scope.api.value = chart.value;
					scope.api.label = chart.label;
					scope.api.key = chart.key;
					scope.api.dispatch = chart.dispatch;
					scope.api.redraw = chart.redraw;
					scope.api.resize = doResize;
				}
			});

			// Manage resizing the chart
			var resizeWidth = (null != attrs.sentioResizeWidth);
			var resizeTimer;
			var redrawTimer;
			var window = angular.element($window);

			// Do the redraw only once when the $digest cycle has completed
			var redraw = function() {
				if (null != redrawTimer) {
					$timeout.cancel(redrawTimer);
				}
				redrawTimer = $timeout(function () {
					chart.redraw();
				}, 0);
			};

			var doResize = function() {

				// Get the raw body element
				var body = $document[0].body;

				// Cache the old overflow style
				var overflow = body.style.overflow;
				body.style.overflow = 'hidden';

				// Get the raw parent
				var rawElement = element[0];
				// Derive width of the parent (there are several ways to do this depending on the parent)
				var parentWidth = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;

				// Calculate the new width based on the parent and the resize size
				var width = (resizeWidth)? parentWidth - attrs.sentioResizeWidth : undefined;

				// Reapply the old overflow setting
				body.style.overflow = overflow;

				$log.debug('resize verticalBars.chart width: ' + width);

				// Apply the new width
				if(resizeWidth){ chart.width(width); }

				chart.resize();
				redraw();
			};
			var delayResize = function(){
				if(undefined !== resizeTimer){
					$timeout.cancel(resizeTimer);
				}
				resizeTimer = $timeout(doResize, 200);
			};

			if(resizeWidth){
				window.on('resize', delayResize);
				delayResize();
			}
			scope.$on('$destroy', function () {
				window.off('resize', delayResize);
			});
		}
	};
}]);

//# sourceMappingURL=sentio-angular.js.map
