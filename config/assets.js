'use strict';

module.exports = {
	// Build related items
	build: {
		js: [ 'gulpfile.js', 'config/assets.js' ]
	},

	// Test files
	tests: {
		js: [ 'test/sentio/js/**/*.js' ]
	},

	// Source files and directories
	src: {
		js: './index.js',
		sass: [
			'src/sentio/sass/**/*.scss'
		]
	},

	// Distribution related items
	dist: {
		dir: 'dist'
	}
};
