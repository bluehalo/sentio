describe('Responsive Units Controller', function() {
	'use strict';

	before(function() {
	});

	// Basic Usage of controller
	describe('Creation', function() {

		context('when complete', function() {

			it('should not throw an error with no config', function() {
				(function() {
					sentio.controllerResponsiveUnits({});
				}).should.not.throw();
			});

			it('should not throw an error with a config', function() {
				(function() {
					sentio.controllerResponsiveUnits({
						minTrigger: 1,
						maxTrigger: 1000
					});
				}).should.not.throw();
			});

			it('should have the right initial structure', function() {
				var controller = sentio.controllerResponsiveUnits({
					minTrigger: 1,
					maxTrigger: 1000
				});

				// The rtTimeline adds two buffer bins to the top of the model
				should(controller.minTrigger()).equal(1);
				should(controller.maxTrigger()).equal(1000);
			});

		});

	});

	describe('Usage', function() {

		var seconds = 1000;
		var minutes = 60 * seconds;
		var hours = 60 * minutes;
		var days = 24 * hours;
		var months = 30 * days;
		var years = 365 * days;

		context('getUnit growing ranges', function() {

			var controller = sentio.controllerResponsiveUnits({
				minTrigger: 20,
				maxTrigger: 600
			});

			it('should return second for all ranges < 600 sec', function() {
				should(controller.getUnit([ 0, 10 * seconds ]).key).equal('second');
				should(controller.getUnit([ 0, 20 * seconds ]).key).equal('second');
				should(controller.getUnit([ 0, 21 * seconds ]).key).equal('second');
				should(controller.getUnit([ 0, 599 * seconds ]).key).equal('second');
			});

			it('should return minute for all ranges - [ 600 sec, 600 min )', function() {
				should(controller.getUnit([ 0, 600 * seconds ]).key).equal('minute');
				should(controller.getUnit([ 0, 21 * minutes ]).key).equal('minute');
				should(controller.getUnit([ 0, 599 * minutes ]).key).equal('minute');
			});

			it('should return hour for all ranges - [ 600 min, 600 hr )', function() {
				should(controller.getUnit([ 0, 600 * minutes ]).key).equal('hour');
				should(controller.getUnit([ 0, 21 * hours ]).key).equal('hour');
				should(controller.getUnit([ 0, 599 * hours ]).key).equal('hour');
			});

			it('should return day for all ranges - [ 600 hr, 600 day )', function() {
				should(controller.getUnit([ 0, 600 * hours ]).key).equal('day');
				should(controller.getUnit([ 0, 21 * days ]).key).equal('day');
				should(controller.getUnit([ 0, 599 * days ]).key).equal('day');
			});

			it('should return month for all ranges - [ 600 day, 600 month )', function() {
				should(controller.getUnit([ 0, 600 * days ]).key).equal('month');
				should(controller.getUnit([ 0, 21 * months ]).key).equal('month');
				should(controller.getUnit([ 0, 599 * months ]).key).equal('month');
			});

			it('should return year for all ranges >= 600 months', function() {
				should(controller.getUnit([ 0, 600 * months ]).key).equal('year');
				should(controller.getUnit([ 0, 21 * years ]).key).equal('year');
				should(controller.getUnit([ 0, 800 * years ]).key).equal('year');
			});
		});

	});

});
