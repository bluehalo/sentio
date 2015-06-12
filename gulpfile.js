var runSequence = require('run-sequence'),
	gulp = require('gulp'),
	p = require('./package.json'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	plugins = gulpLoadPlugins();

var banner = '/*! ' + p.name + ' Version: ' + p.version + ' */\n';

var src = {
	js: [
		'src/js/sentio/sentio.js',
		'src/js/sentio/data/data.js',
		'src/js/sentio/data/**/*.js',
		'src/js/sentio/realtime/realtime.js',
		'src/js/sentio/realtime/**/*.js',
		'src/js/sentio/timeline/timeline.js',
		'src/js/sentio/timeline/**/*.js',
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

gulp.task('watch', function(){
	gulp.watch(['test/**/*', 'src/**/*', '!/src/lib/**/*'], ['build']);
});

gulp.task('build', function() {
	runSequence(['js', 'js-angular', 'css', 'js-test'], 'test');
});

gulp.task('js', function(){
	return gulp.src(src.js)

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
	return gulp.src(src.angular)

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
	return gulp.src(src.tests)

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
		.pipe(plugins.csslint.reporter('jshint-stylish'))

		// Concatenate
		.pipe(plugins.concat(p.name + '.css'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())

		// Uglify
		.pipe(plugins.minifyCss())
		.pipe(plugins.rename(p.name + '.min.css'))
		.pipe(plugins.insert.prepend(banner))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.filesize())
		.on('error', plugins.util.log);
});

gulp.task('test', function () {
	return gulp.src('test/runner.html')
		.pipe(plugins.mochaPhantomjs({ reporter: 'spec' }));
});