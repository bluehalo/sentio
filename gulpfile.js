'use strict';

let
	chalk = require('chalk'),
	del = require('del'),
	fs = require('fs'),
	glob = require('glob'),
	gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	path = require('path'),
	q = require('q'),
	rollup = require('rollup-stream'),
	runSequence = require('run-sequence'),
	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),

	plugins = gulpLoadPlugins(),
	pkg = require('./package.json'),
	assets = require('./config/assets');


// Banner to append to generated files
let bannerString = '/*! ' + pkg.name + '-' + pkg.version + ' - ' + pkg.copyright + '*/'


/**
 * Validation Tasks
 */

gulp.task('validate-js', function() {
	return gulp.src(assets.src.js)
		// ESLint
		.pipe(plugins.eslint('./config/eslint.conf.json'))
		.pipe(plugins.eslint.format())
		.pipe(plugins.eslint.failAfterError());
});



/*
 * Build
 */

function doRollup(config, artifactName) {

	return rollup(config)
		.pipe(source('main.js', './src'))
		.pipe(buffer())
		.pipe(plugins.sourcemaps.init({loadMaps: true}))
		.pipe(plugins.rename(artifactName + '.js'))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))

		// Uglify
		.pipe(plugins.filter('**/' + artifactName + '.js'))
		.pipe(plugins.uglify({ preserveComments: 'license' }))
		.pipe(plugins.rename(artifactName + '.min.js'))
		.pipe(gulp.dest('dist'));
}

gulp.task('build-js-iife', function() {
	return doRollup({
			entry: assets.src.js,
			format: 'iife',
			moduleName: 'sentio',
			sourceMap: true,
			banner: bannerString
		},
		pkg.artifactName
	);
});

gulp.task('build-js-umd', function() {
	return doRollup({
			entry: assets.src.js,
			format: 'umd',
			moduleName: 'sentio',
			sourceMap: true,
			banner: bannerString
		},
		pkg.artifactName + '.umd'
	);
});


gulp.task('build-css', function() {
	// Generate a list of the sources in a deterministic manner
	let sourceArr = [];
	assets.src.sass.forEach(function(f) {
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
			.pipe(plugins.concat(pkg.artifactName + '.css'))
			.pipe(plugins.insert.prepend(bannerString))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))

		// Clean the CSS
		.pipe(plugins.filter('dist/' + pkg.artifactName + '.css'))
		.pipe(plugins.cleanCss())
		.pipe(plugins.rename(pkg.artifactName + '.min.css'))
		.pipe(gulp.dest('dist'));
});

// Tests
gulp.task('build-tests', function() {
	// Generate a list of the test sources in a deterministic manner
	let sourceArr = [ './dist/version.js' ];
	assets.tests.js.forEach(function(f) {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	return gulp.src(sourceArr)

		// ESLint
		.pipe(plugins.eslint('./config/eslint.conf.json'))
		.pipe(plugins.eslint.format())
		.pipe(plugins.eslint.failAfterError())

		// Concat
		.pipe(plugins.concat(pkg.artifactName + '-tests.js'))
		.pipe(gulp.dest('dist'));
});



/**
 * --------------------------
 * Main Tasks
 * --------------------------
 */

gulp.task('build', [ 'build-js', 'build-css' ]);

gulp.task('build-js', (done) => { runSequence('validate-js', [ 'build-tests', 'build-js-iife', 'build-js-umd' ], done); } );

gulp.task('test', [ 'build-js' ], function() {
	return gulp.src('test/runner.html')
		.pipe(plugins.mochaPhantomjs());
});

gulp.task('test-ci', [ 'build-js' ], function() {

});

// Default task builds and tests
gulp.task('default', [ 'build', 'test' ]);
