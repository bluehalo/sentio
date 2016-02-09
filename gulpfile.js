'use strict';

var glob = require('glob'),
	runSequence = require('run-sequence'),
	gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	plugins = gulpLoadPlugins(),
	p = require('./package.json');

var banner = '/*! ' + p.name + ' Version: ' + p.version + ' */\n';

var src = {
	js: [
		'src/js/sentio/sentio.js',

		'src/js/sentio/util/util.js',
		'src/js/sentio/util/**/*.js',

		'src/js/sentio/model/model.js',
		'src/js/sentio/model/**/*.js',

		'src/js/sentio/controller/controller.js',
		'src/js/sentio/controller/**/*.js',

		'src/js/sentio/chart/chart.js',
		'src/js/sentio/chart/**/*.js',

		'src/js/sentio/timeline/timeline.js',
		'src/js/sentio/timeline/**/*.js',

		'src/js/sentio/realtime/realtime.js',
		'src/js/sentio/realtime/**/*.js',

		'src/js/sentio/**/*.js'
	],
	angular: [
		'src/js/support/angular/sentio.js',
		'src/js/support/angular/realtime.js',
		'src/js/support/angular/**/*.js'
	],
	css: 'src/css/**/*.css',
	tests: [
		'test/**/*.js',
	]
};

gulp.task('default', ['build']);

gulp.task('watch', ['build'], function() {
	gulp.watch(['test/**/*', 'src/**/*', '!/src/lib/**/*'], ['build']);
});

gulp.task('build', function(done) {
	runSequence(['js', 'js-angular', 'css', 'js-test'], 'test', done);
});

gulp.task('js', function() {
	var jsFiles = [];
	src.js.forEach(function(f) {
		jsFiles = jsFiles.concat(glob.sync(f).sort());
	});

	return gulp.src(jsFiles)

		// JS Hint
		.pipe(plugins.jshint('.jshintrc'))
		.pipe(plugins.jshint.reporter('jshint-stylish'))

		// Concatenate
		.pipe(plugins.concat(p.name + '.js'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())

		// Uglify
		.pipe(plugins.uglify())
		.pipe(plugins.rename(p.name + '.min.js'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())
		.on('error', plugins.util.log);
});

gulp.task('js-angular', function(){
	var jsFiles = [];
	src.angular.forEach(function(f) {
		jsFiles = jsFiles.concat(glob.sync(f).sort());
	});

	return gulp.src(jsFiles)

		// JS Hint
		.pipe(plugins.jshint('.jshintrc'))
		.pipe(plugins.jshint.reporter('jshint-stylish'))

		// Concatenate
		.pipe(plugins.concat(p.name + '-angular.js'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())

		// Uglify
		.pipe(plugins.uglify({
			mangle: false
		}))
		.pipe(plugins.rename(p.name + '-angular.min.js'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())
		.on('error', plugins.util.log);
});

gulp.task('js-test', function(){
	var jsFiles = [];
	src.tests.forEach(function(f) {
		jsFiles = jsFiles.concat(glob.sync(f).sort());
	});

	return gulp.src(jsFiles)

		// JS Hint
		.pipe(plugins.jshint('.jshintrc'))
		.pipe(plugins.jshint.reporter('jshint-stylish'))

		// Concatenate
		.pipe(plugins.concat(p.name + '-tests.js'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())
		.on('error', plugins.util.log);
});

gulp.task('css', function(){
	return gulp.src(src.css)

		// CSS
		.pipe(plugins.csslint('.csslintrc'))
		.pipe(plugins.csslint.reporter('text'))

		// Concatenate
		.pipe(plugins.sort())
		.pipe(plugins.concat(p.name + '.css'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())

		// Uglify
		.pipe(plugins.cssnano())
		.pipe(plugins.rename(p.name + '.min.css'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())
		.on('error', plugins.util.log);
});

gulp.task('test', function () {
	return gulp.src('test/runner.html')
		.pipe(plugins.mochaPhantomjs());
});