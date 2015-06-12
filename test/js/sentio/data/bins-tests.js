describe('Bin Layout', function() {
	'use strict';

	before(function() {
	});

	// Basic Usage of layout
	describe('Creation', function() {

		context('when complete', function() {
			it('should not throw an error', function() {
				(function() {
					sentio.data.bins({
						count: 10,
						size: 1,
						lwm: 0
					});
				}).should.not.throw();
			});

			it('should have the right initial structure', function() {
				var layout = sentio.data.bins({
					count: 3,
					size: 2,
					lwm: 1
				});

				var bins = layout.bins();

				bins.length.should.equal(3);

				bins[0][0].should.equal(1);
				bins[0][1].length.should.equal(0);
				bins[1][0].should.equal(3);
				bins[1][1].length.should.equal(0);
				bins[2][0].should.equal(5);
				bins[2][1].length.should.equal(0);
			});

		});

		context('when incomplete', function() {
			it('should throw an error', function() {
				(function() {
					sentio.data.bins({
						size: 1,
						lwm: 0
					});
				}).should.throw();
			});
		});

	});

	describe('Adding Data', function() {
		context('when adding data within bounds', function() {
			var layout = sentio.data.bins({
				count: 5,
				size: 10,
				lwm: 30
			});

			it('should all get added', function() {
				layout.add([30, 31, 40, 50, 55, 70, 35]);
				var bins = layout.bins();

				bins.length.should.equal(5);

				bins[0][0].should.equal(30);
				bins[0][1].length.should.equal(3);
				bins[1][0].should.equal(40);
				bins[1][1].length.should.equal(1);
				bins[2][0].should.equal(50);
				bins[2][1].length.should.equal(2);
				bins[3][0].should.equal(60);
				bins[3][1].length.should.equal(0);
				bins[4][0].should.equal(70);
				bins[4][1].length.should.equal(1);

			});
		});

		context('when adding data out of bounds', function() {
			it('should not get added', function() {
				var layout = sentio.data.bins({
					count: 5,
					size: 10,
					lwm: 30
				});

				layout.add([29, 0, -1, 100, 51, 55, 10]);
				var bins = layout.bins();

				bins.length.should.equal(5);

				bins[0][0].should.equal(30);
				bins[0][1].length.should.equal(0);
				bins[1][0].should.equal(40);
				bins[1][1].length.should.equal(0);
				bins[2][0].should.equal(50);
				bins[2][1].length.should.equal(2);
				bins[3][0].should.equal(60);
				bins[3][1].length.should.equal(0);
				bins[4][0].should.equal(70);
				bins[4][1].length.should.equal(0);

			});
		});

	});

	describe('Modifying LWM', function() {
		context('when increasing the lwm', function() {
			var layout = sentio.data.bins({
				count: 5,
				size: 10,
				lwm: 0
			});

			layout.add([0, 1, 2, 10, 15, 16, 17, 24, 35, 59, 60]);
			layout.lwm(20);
			var bins = layout.bins();

			it('should maintain the right number of bins', function() {
				bins.length.should.equal(5);
			});

			it('should drop out of bounds data', function() {
				bins[0][0].should.equal(20);
				bins[0][1].length.should.equal(1);
				bins[1][0].should.equal(30);
				bins[1][1].length.should.equal(1);
				bins[2][0].should.equal(40);
				bins[2][1].length.should.equal(0);
			});

			it('should allocate new bins initialized as empty', function() {
				bins[3][0].should.equal(50);
				bins[3][1].length.should.equal(0);
				bins[4][0].should.equal(60);
				bins[4][1].length.should.equal(0);
			});
		});

		context('when decreasing the lwm', function() {
			var layout = sentio.data.bins({
				count: 5,
				size: 10,
				lwm: 0
			});

			layout.add([0, 1, 2, 10, 15, 16, 17, 24, 35, 59, 60]);
			layout.lwm(-20);
			var bins = layout.bins();

			it('should maintain the right number of bins', function() {
				bins.length.should.equal(5);
			});

			it('should drop out of bounds data and allocate new bins initialized as empty', function() {
				bins[0][0].should.equal(-20);
				bins[0][1].length.should.equal(0);
				bins[1][0].should.equal(-10);
				bins[1][1].length.should.equal(0);
				bins[2][0].should.equal(0);
				bins[2][1].length.should.equal(3);
				bins[3][0].should.equal(10);
				bins[3][1].length.should.equal(4);
				bins[4][0].should.equal(20);
				bins[4][1].length.should.equal(1);
			});

		});

		context('when not changing the lwm', function() {
			var layout = sentio.data.bins({
				count: 5,
				size: 10,
				lwm: 0
			});

			layout.add([0, 1, 2, 10, 15, 16, 17, 24, 35, 59, 60]);
			layout.lwm(0);
			var bins = layout.bins();

			it('should maintain the right number of bins', function() {
				bins.length.should.equal(5);
			});

			it('should not change anything', function() {
				bins[0][0].should.equal(0);
				bins[0][1].length.should.equal(3);
				bins[1][0].should.equal(10);
				bins[1][1].length.should.equal(4);
				bins[2][0].should.equal(20);
				bins[2][1].length.should.equal(1);
				bins[3][0].should.equal(30);
				bins[3][1].length.should.equal(1);
				bins[4][0].should.equal(40);
				bins[4][1].length.should.equal(0);
			});
		});

		context('when setting the lwm such that a reset is necessary', function() {
			var layout = sentio.data.bins({
				count: 5,
				size: 10,
				lwm: 0
			});

			layout.add([0, 1, 2, 10, 15, 16, 17, 24, 35, 59, 60, 75]);
			layout.lwm(15);
			var bins = layout.bins();

			it('should maintain the right number of bins', function() {
				bins.length.should.equal(5);
			});

			it('should establish the right data in the bins', function() {
				bins[0][0].should.equal(15);
				bins[0][1].length.should.equal(4);
				bins[1][0].should.equal(25);
				bins[1][1].length.should.equal(0);
				bins[2][0].should.equal(35);
				bins[2][1].length.should.equal(1);
				bins[3][0].should.equal(45);
				bins[3][1].length.should.equal(0);
				bins[4][0].should.equal(55);
				bins[4][1].length.should.equal(0);
			});
		});
	});
});