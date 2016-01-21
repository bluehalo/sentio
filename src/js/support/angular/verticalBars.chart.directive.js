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
