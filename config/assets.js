'use strict';

module.exports = {
	// Build specific files
	build: {
		js: [ 'gulpfile.js', 'config/assets.js' ]
	},

	// Test specific source files
	tests: {
		js: [ 'test/sentio/js/**/*.js' ]
	},

	lib : {},

	src: {
		js: './index.js',
		sass: [
			'src/sentio/sass/**/*.scss'
		]
	}
};
