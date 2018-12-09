module.exports = (config) => {
	config.set({
		frameworks: [ 'mocha', 'should' ],
		files: [
			'../node_modules/d3/build/d3.js',
			'dist/sentio.js',
			'test/**/*.js'
		],
		reporters: [ 'progress' ],
		port: 9876,  // karma web server port
		colors: true,
		logLevel: config.LOG_INFO,
		browsers: [ 'ChromeHeadless' ],
		autoWatch: false,
		singleRun: false, // Karma captures browsers, runs the tests and exits
		concurrency: Infinity
	})
}
