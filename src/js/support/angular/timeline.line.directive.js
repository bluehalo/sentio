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
				if(null != width && !Number.isNaN(width)) { timeline.width(width); }
			}
			var height = element[0].style.height;
			if(null != height && '' !== height) {
				height = parseFloat(height.substring(0, height.length-2));
				if(null != height && !Number.isNaN(height)) { timeline.height(height); }
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
						lastFilterState = filterState
					});
				});
			});
			scope.$watch('filterState', function(n, o) {
				// If a filter was passed in and it is not the one we just set, do some updates
				if (null != n && n !== lastFilterState) {

					// If we're in the original format with 3 parameters, use the second two only
					if (n.length >= 3) {
						// The first element indicates if we're disabled
						if (n[0]) {
							return;
						}
						n = n.slice(1, 3);
					}
					timeline.updateFilter(n);
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

				timeline.xExtent(n).overrideValue(n);
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
