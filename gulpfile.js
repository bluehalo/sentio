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


// banner info
var bannerString = '/*! ' + pkg.name + '-' + pkg.version + ' - ' + pkg.copyright + '*/'

/*
 * Helpers
 */


// Install Typings
function installTypings(sourceArr) {
	return gulp.src(sourceArr)
		.pipe(plugins.typings());
}


/*
 * Sentio
 */
gulp.task('build-sentio', ['build-sentio-js', 'build-sentio-css', 'build-sentio-tests']);

// JS
gulp.task('build-sentio-js', function() {

	gulp.src(assets.src.sentio.js)

		// ESLint
		.pipe(plugins.eslint('./config/eslint.conf.json'))
		.pipe(plugins.eslint.format())
		.pipe(plugins.eslint.failAfterError())

		// Package using Rollup
		.pipe(plugins.rollup({
			format: 'iife',
			moduleName: 'sentio',
			sourceMap: true,
			banner: bannerString
		}))
		.pipe(plugins.rename(pkg.name + '.js'))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))

		// Uglify
		.pipe(plugins.filter('**/' + pkg.name + '.js'))
		.pipe(plugins.uglify({ preserveComments: 'license' }))
		.pipe(plugins.rename(pkg.name + '.min.js'))
		.pipe(gulp.dest('dist'));

});

// SASS
gulp.task('build-sentio-css', function() {
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
			.pipe(plugins.insert.prepend(bannerString))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))

		// Clean the CSS
		.pipe(plugins.filter('dist/' + pkg.name + '.css'))
		.pipe(plugins.cleanCss())
		.pipe(plugins.rename(pkg.name + '.min.css'))
		.pipe(gulp.dest('dist'));
});

// Tests
gulp.task('build-sentio-tests', function() {
	// Generate a list of the test sources in a deterministic manner
	var sourceArr = [ './dist/version.js' ];
	assets.tests.sentio.js.forEach(function(f) {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	return gulp.src(sourceArr)

		// ESLint
		.pipe(plugins.eslint('./config/eslint.conf.json'))
		.pipe(plugins.eslint.format())
		.pipe(plugins.eslint.failAfterError())

		// Concat
		.pipe(plugins.concat(pkg.name + '-tests.js'))
		.pipe(gulp.dest('dist'));
});


// Build Angular Support
gulp.task('build-ng', function() {
	var sourceArr = [ './dist/version.js' ];
	assets.src.ng.js.forEach(function(f) {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	return gulp.src(sourceArr)

		// ESLint
		.pipe(plugins.eslint('./config/eslint.conf.json'))
		.pipe(plugins.eslint.format())
		.pipe(plugins.eslint.failAfterError())

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
var tsProject = plugins.typescript.createProject({
	outDir: 'dist/tsc',
	target: 'es6',
	module: 'es6',
	moduleResolution: 'node',
	emitDecoratorMetadata: true,
	experimentalDecorators: true,
	removeComments: true,
	noImplicitAny: false
});

gulp.task('build-ng2', function(done) {
	return gulp.src(assets.src.ng2.ts, { base: './app' })

		// Lint the Typescript
		.pipe(plugins.tslint('config/tslint.conf.json'))
		.pipe(plugins.tslint.report(
			require('tslint-stylish'), {
				emitError: true,
				sort: true
			}
		))

		// Compile the Typescript
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.typescript(tsProject)).js
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest('public/app'))
		.on('error', plugins.util.log);

});


gulp.task('test', ['build-sentio-js', 'build-sentio-tests'], function() {
	return gulp.src('test/runner.html')
		.pipe(plugins.mochaPhantomjs());
});

gulp.task('build', ['build-sentio', 'build-ng', 'build-ng2']);
gulp.task('default', ['build', 'test']);