angular.module('sentio.realtime').directive('rtTimeline', function() {
	'use strict';

	return {
		restrict : 'A',
		scope : {
			model: '=',
			interval: '=',
			delay: '=',
			yExtent: '=',
			duration: '='
		},
		replace : false,
		link : function(scope, element, attrs, controller) {
			var timelineElement = d3.select(element[0]);
			var timeline = sentio.realtime.timeline();
			timeline.init(timelineElement);

			scope.$watchCollection('model', function(n, o){
				if(null == o && null == n){ return; }

				timeline.data(n).redraw();
				timeline.start();
			});

			scope.$watch('interval', function(n, o){
				if(null == o && null == n){ return; }

				timeline.interval(n).redraw();
			});

			scope.$watch('delay', function(n, o){
				if(null == o && null == n){ return; }

				timeline.delay(n).redraw();
			});

			scope.$watch('yExtent', function(n, o){
				if(null == o && null == n){ return; }

				timeline.yExtent(n).redraw();
			});

			scope.$watch('duration', function(n, o){
				if(null == o && null == n){ return; }

				timeline.duration(n);
			});

		}
	};
});
