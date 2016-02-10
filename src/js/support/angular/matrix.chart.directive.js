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
