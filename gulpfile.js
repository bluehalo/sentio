'use strict';

let
	glob = require('glob'),
	gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	path = require('path'),
	rollup = require('rollup'),
	runSequence = require('run-sequence'),

	plugins = gulpLoadPlugins(),
	pkg = require('./package.json');


// Banner to append to generated files
let bannerString = `/*! ${pkg.name} - ${pkg.version} - ${pkg.copyright} */`;

// Consolidating asset locations
let assets = {
	// Build related items
	build: {
		js: 'gulpfile.js'
	},

	// Test files
	test: {
		js: 'test/**/*.js'
	},

	// Source files and directories
	src: {
		entry: 'src/index.js',
		js: 'src/**/*.js',
		sass: [
			'src/**/*.scss'
		]
	},

	// Distribution related items
	dist: {
		dir: 'dist'
	}
};


/**
 * Validation Tasks
 */

gulp.task('validate-js', () => {

	return gulp.src([ assets.src.js, assets.test.js, assets.build.js ])

		// ESLint
		.pipe(plugins.eslint())
		.pipe(plugins.eslint.format())
		.pipe(plugins.eslint.failAfterError());

});


/**
 * Build
 */

gulp.task('build-js', [ 'rollup-js' ], () => {

	// Uglify
	return gulp.src(path.join(assets.dist.dir, `${pkg.artifactName}.js`))
		.pipe(plugins.uglify({ output: { comments: 'license' } }))
		.on('error', (err) => { plugins.util.log(plugins.util.colors.red('[Uglify]'), err.toString()); })
		.pipe(plugins.rename(`${pkg.artifactName}.min.js`))
		.pipe(gulp.dest(assets.dist.dir));

});

gulp.task('rollup-js', () => {

	return rollup.rollup({
		input: assets.src.entry,
		external: [
			'd3-axis',
			'd3-brush',
			'd3-dispatch',
			'd3-interpolate',
			'd3-line',
			'd3-scale',
			'd3-selection',
			'd3-shape'
		]
		})
		.then((bundle) => {
			return bundle.write({
				file: path.join(assets.dist.dir, `${pkg.artifactName}.js`),
				format: 'umd',
				name: pkg.moduleName,

				globals: {
					'd3': 'd3',
					'd3-axis': 'd3',
					'd3-brush': 'd3',
					'd3-dispatch': 'd3',
					'd3-interpolate': 'd3',
					'd3-line': 'd3',
					'd3-scale': 'd3',
					'd3-selection': 'd3',
					'd3-shape': 'd3'
				},

				banner: bannerString,
				sourcemap: true
			});
		});

});

gulp.task('build-css', () => {

	// Generate a list of the sources in a deterministic manner
	let sourceArr = [];
	assets.src.sass.forEach((f) => {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	return gulp.src(sourceArr)

		// Lint the Sass
		.pipe(plugins.sassLint({
			formatter: 'stylish',
			rules: require('./sasslint.conf.js')
		}))
		.pipe(plugins.sassLint.format())
		.pipe(plugins.sassLint.failOnError())

		// Compile and concat the sass (w/sourcemaps)
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.sass())
			.pipe(plugins.concat(`${pkg.artifactName}.css`))
			.pipe(plugins.insert.prepend(bannerString))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest(assets.dist.dir))

		// Clean the CSS
		.pipe(plugins.filter(path.join(assets.dist.dir, `${pkg.artifactName}.css`)))
		.pipe(plugins.cleanCss())
		.pipe(plugins.rename(`${pkg.artifactName}.min.css`))
		.pipe(gulp.dest(assets.dist.dir));

});

// Tests
gulp.task('build-tests', () => {

	// Generate a list of the test sources in a deterministic manner
	let sourceArr = glob.sync(assets.test.js);

	return gulp.src(sourceArr)

		// Concat
		.pipe(plugins.concat(`${pkg.artifactName}-tests.js`))
		.pipe(gulp.dest(assets.dist.dir));

});


// Run Tests
gulp.task('run-tests', () => {
	return gulp.src('test/runner.html')
		.pipe(plugins.mochaPhantomjs());
});


/**
 * --------------------------
 * Main Tasks
 * --------------------------
 */

gulp.task('build', (done) => { runSequence('validate-js', [ 'build-css', 'build-tests', 'build-js' ], done); } );
gulp.task('test', (done) => { runSequence('build', 'run-tests', done); } );

// Default task builds and tests
gulp.task('default', [ 'test' ]);
