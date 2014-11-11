angular.module('sentio.realtime').directive('rtTimeline', function() {
	'use strict';

	return {
		restrict : 'A',
		scope : {
			model: '=',
			interval: '=',
			delay: '=',
			yExtent: '='
		},
		replace : false,
		link : function(scope, element, attrs, controller) {
			var timelineElement = d3.select(element[0]);
			var timeline = sentio.realtime.timeline();
			timeline.init(timelineElement);

			scope.$watch('model', function(n, o){
				timeline.data(n).redraw();
				timeline.start();
			});

			scope.$watch('interval', function(n, o){
				timeline.interval(n).redraw();
			});

			scope.$watch('delay', function(n, o){
				timeline.delay(n).redraw();
			});

			scope.$watch('yExtent', function(n, o){
				timeline.yExtent(n).redraw();
			});

		}
	};
});
