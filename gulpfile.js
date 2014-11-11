var gulp = require('gulp'),
	p = require('./package.json'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	plugins = gulpLoadPlugins();

var banner = '/*! ' + p.name + ' Version: ' + p.version + ' */\n';

gulp.task('default', ['build']);

gulp.task('watch', function(){
	gulp.watch(['src/**/*', '!/src/lib/**/*'], ['build']);
});

gulp.task('build', ['js', 'css'] );

gulp.task('js', function(){
	return gulp.src([
			'src/js/sentio.js',
			'src/js/realtime/realtime.js',
			'src/js/realtime/**/*.js',
			'src/js/directives/realtime.js',
			'src/js/directives/**/*.js',
			'src/js/**/*.js'
		])

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


gulp.task('css', function(){
	return gulp.src('src/css/**/*.css')

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