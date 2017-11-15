describe('Multi Extent', function() {
	'use strict';

	before(function() {
	});

	// Basic Usage of extent
	describe('Creation', function() {

		context('when complete', function() {
			it('should not throw an error when there is no configured extent', function() {
				(function() {
					sentio.modelMultiExtent();
				}).should.not.throw();
			});

			it('should not throw an error when configuring', function() {
				(function() {
					sentio.modelMultiExtent({
						extent: sentio.modelExtent(),
						series: []
					});
				}).should.not.throw();
			});

		});

	});

	describe('Usage', function() {
		context('when configured correctly', function() {

			var extentController = sentio.modelMultiExtent({
				extent: sentio.modelExtent({
					defaultValue: [ 0, 1 ]
				})
			});

			it('should return the default value if passed empty data', function() {
				var extent = extentController.getExtent([]);
				extent.length.should.equal(2);
				extent[0].should.equal(0);
				extent[1].should.equal(1);
			});

			it('should return the default value if passed data with no series', function() {
				var extent = extentController.getExtent([ { s1: 1 }, { s1: 2 } ]);
				extent.length.should.equal(2);
				extent[0].should.equal(0);
				extent[1].should.equal(1);
			});

			it('should return the extent if passed actual data', function() {
				extentController.series([
					{ key: 's1', getValue: function(d) { return d.s1; } },
					{ key: 's2', getValue: function(d) { return d.s2; } },
					{ key: 's3', getValue: function(d) { return d.s3; } }
				]);

				var extent = extentController.getExtent([ { s1: 0, s2: -5, s3: 4 }, { s1: 1, s2: 11, s3: 17 } ]);
				extent.length.should.equal(2);
				extent[0].should.equal(-5);
				extent[1].should.equal(17);

				extent = extentController.getExtent([]);
				extent.length.should.equal(2);
				extent[0].should.equal(0);
				extent[1].should.equal(1);
			});
		});

	});
});
