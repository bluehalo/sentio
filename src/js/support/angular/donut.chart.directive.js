angular.module('sentio').directive('sentioDonutChart', [ '$document', '$window', '$timeout', '$log',
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
