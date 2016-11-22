describe('Timeline Filter', function() {
	'use strict';

	before(function() {
	});

	// Basic Usage of Filter
	describe('Creation', function() {

		context('when complete', function() {
			it('should not throw an error when there is no configured brush', function() {
				(function() {
					sentio.util.timelineFilter();
				}).should.not.throw();
			});

			it('should not throw an error when configuring', function() {
				(function() {
					sentio.util.timelineFilter({
						enabled: true
					});
				}).should.not.throw();
			});

			it('should default to disabled if nothing provided', function() {
				var filter = sentio.util.timelineFilter();
				should(filter.enabled()).be.false();
			});
		});

	});

	describe('Usage', function() {
		context('when configured correctly', function() {
			var brush = {
				state: undefined,
				clear: function() {
					brush.state = undefined;
					return brush;
				},
				empty: function() {
					return brush.state === undefined;
				},
				extent: function(extent) {
					if(!arguments.length) { return brush.state; }
					brush.state = extent;
					return brush;
				}
			};

			var filter = sentio.util.timelineFilter({
				enabled: true,
				brush: brush
			});

			it('should return no filter state when uninitialized', function() {
				should.not.exist(filter.getFilter());
			});

			it('should accept a new filter and apply it correctly', function() {
				var changed = filter.setFilter([0, 1000], filter.getFilter());
				should(changed).be.true();

				var state = filter.getFilter();
				should.exist(state);
				should(state).have.length(2);
				should(state).deepEqual([0, 1000]);
			});

			it('should clear the filter when attempting to set it to an invalid value', function() {
				var changed = filter.setFilter([NaN, 100], filter.getFilter());
				should(changed).be.true();

				var state = filter.getFilter();
				should.not.exist(state);
			});
		});

	});
});
