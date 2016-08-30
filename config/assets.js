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
			js: 'src/sentio/js/index.js',
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
			ts: [
				'src/ng2/ts/**/*.ts'
			]
		}
	}
};
