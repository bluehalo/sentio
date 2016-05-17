'use strict';

var _ = require('lodash'),
	chalk = require('chalk'),
	del = require('del'),
	fs = require('fs'),
	glob = require('glob'),
	gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	path = require('path'),
	q = require('q'),
	runSequence = require('run-sequence'),

	plugins = gulpLoadPlugins(),
	pkg = require('./package.json'),
	assets = require('./config/assets');


// Banner for the top of generated artifacts
var banner = '/*! ' + pkg.name + ' Version: ' + pkg.version + ' Copyright Asymmetrik, Ltd. 2015 - All Rights Reserved.*/\n';

/*
 * Helpers
 */



// TS Lint
function tsLint(sourceArr) {
	return gulp.src(sourceArr)
		.pipe(plugins.tslint('./config/tslint.conf.json'))
		.pipe(plugins.tslint.report(
			require('tslint-stylish'), {
				emitError: false,
				sort: true,
				bell: true
			}
		));
}

// Sass Lint
function sassLint(sourceArr) {

}

// Install Typings
function installTypings(sourceArr) {
	return gulp.src(sourceArr)
		.pipe(plugins.typings());
}

// Compile Typescript
function compileTypescript(sourceArr, tsConfig) {
	var tsResult = gulp.src(sourceArr, { base: './' })
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.typescript(plugins.typescript.createProject(tsConfig)));

	return tsResult.js
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest(tsConfig.outDir))
		.on('error', plugins.util.log);
}


/*
 * Sentio
 */
gulp.task('build-sentio', ['build-sentio-js', 'build-sentio-css', 'build-sentio-tests']);

// Version
gulp.task('build-version', [], function() {
	return plugins.file('version.md', banner, { src: true })
		.pipe(gulp.dest('dist'));
});

// JS
gulp.task('build-sentio-js', ['build-version'], function() {
	// Generate a list of the sources in a deterministic manner
	var sourceArr = [ './dist/version.js' ];
	assets.src.sentio.js.forEach(function(f) {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	gulp.src(sourceArr)

		// JSHint
		.pipe(plugins.jshint('./config/jshint.conf.json'))
		.pipe(plugins.jshint.reporter('jshint-stylish'))
		.pipe(plugins.jshint.reporter('fail'))

		// Concat (w/sourcemaps)
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.concat(pkg.name + '.js'))
		.pipe(plugins.sourcemaps.write('./'))
		.pipe(gulp.dest('dist'))

		// Uglify (wo/sourcemaps)
		.pipe(plugins.filter([ 'dist/version.js', 'dist/' + pkg.name + '.js' ]))
		.pipe(plugins.uglify({ preserveComments: 'license' }))
		.pipe(plugins.rename(pkg.name + '.min.js'))
		.pipe(gulp.dest('dist'));
});

// SASS
gulp.task('build-sentio-css', ['build-version'], function() {
	// Generate a list of the sources in a deterministic manner
	var sourceArr = [];
	assets.src.sentio.sass.forEach(function(f) {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	return gulp.src(sourceArr)

		// Lint the Sass
		.pipe(plugins.sassLint({
			formatter: 'stylish',
			rules: require('./config/sasslint.conf.js')
		}))
		.pipe(plugins.sassLint.format())
		.pipe(plugins.sassLint.failOnError())

		// Compile and concat the sass (w/sourcemaps)
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.sass())
			.pipe(plugins.concat(pkg.name + '.css'))
			.pipe(plugins.insert.prepend(banner))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))

		// Clean the CSS
		.pipe(plugins.filter([ 'dist/version.js', 'dist/' + pkg.name + '.css' ]))
		.pipe(plugins.cleanCss())
		.pipe(plugins.rename(pkg.name + '.min.css'))
		.pipe(gulp.dest('dist'));
});

// Tests
gulp.task('build-sentio-tests', ['build-version'], function() {
	// Generate a list of the test sources in a deterministic manner
	var sourceArr = [ './dist/version.js' ];
	assets.tests.sentio.js.forEach(function(f) {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	gulp.src(sourceArr)

		// JSHint
		.pipe(plugins.jshint('./config/jshint.conf.json'))
		.pipe(plugins.jshint.reporter('jshint-stylish'))
		.pipe(plugins.jshint.reporter('fail'))

		// Concat
		.pipe(plugins.concat(pkg.name + '-tests.js'))
		.pipe(gulp.dest('dist'));
});


// Build Angular Support
gulp.task('build-ng', ['build-version'], function() {
	var sourceArr = [ './dist/version.js' ];
	assets.src.ng.js.forEach(function(f) {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	return gulp.src(sourceArr)

		// JS Hint
		.pipe(plugins.jshint('./config/jshint.conf.json'))
		.pipe(plugins.jshint.reporter('jshint-stylish'))
		.pipe(plugins.jshint.reporter('fail'))

		// Concatenate
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.concat(pkg.name + '-angular.js'))
		.pipe(plugins.sourcemaps.write('./'))
		.pipe(gulp.dest('dist'))

		// Uglify
		.pipe(plugins.filter([ 'dist/version.js', 'dist/' + pkg.name + '-angular.js' ]))
		.pipe(plugins.uglify({ preserveComments: 'license' }))
		.pipe(plugins.rename(pkg.name + '-angular.min.js'))
		.pipe(gulp.dest('dist'));
});

// Build Angular 2 Support
gulp.task('build-ng2', ['build-version'], function(done) {
});



gulp.task('test', ['build-sentio-js', 'build-sentio-tests'], function() {
	return gulp.src('test/runner.html')
		.pipe(plugins.mochaPhantomjs());
});

gulp.task('build', function(done) {
	runSequence(['build-sentio', 'build-ng', 'build-ng2'], done);
});

gulp.task('default', function(done) {
	runSequence('build', 'test', done);
});