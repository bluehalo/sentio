'use strict';

module.exports = {
	// Build specific files
	build: {
		js: [ 'gulpfile.js', 'config/assets.js' ]
	},

	// Test specific source files
	tests: {
		sentio: {
			js: [ 'test/sentio/js/**/*.js' ]
		},
		ng: {},
		ng2: {}
	},

	lib : {},

	src: {
		sentio: {
			js: [
				'src/sentio/js/sentio.js',

				'src/sentio/js/util/util.js',
				'src/sentio/js/util/**/*.js',

				'src/sentio/js/model/model.js',
				'src/sentio/js/model/**/*.js',

				'src/sentio/js/controller/controller.js',
				'src/sentio/js/controller/**/*.js',

				'src/sentio/js/chart/chart.js',
				'src/sentio/js/chart/**/*.js',

				'src/sentio/js/timeline/timeline.js',
				'src/sentio/js/timeline/**/*.js',

				'src/sentio/js/realtime/realtime.js',
				'src/sentio/js/realtime/**/*.js',

				'src/sentio/js/**/*.js'
			],
			sass: [
				'src/sentio/sass/**/*.scss'
			]
		},
		ng: {
			js: [
				'src/ng/js/sentio.js',
				'src/ng/js/realtime.js',
				'src/ng/js/**/*.js'
			]
		},
		ng2: {
			ts: []
		}
	}
};
