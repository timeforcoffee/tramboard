'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');

gulp.task('default', ['browser-sync'], function () {
});

gulp.task('browser-sync', ['nodemon'], function() {
	browserSync.init(null, {
		proxy: "http://localhost:8000",
		files: ["js/**/*.*", "css/**/*.*", "**/*.html"],
		browser: "google chrome",
		port: 7000,
	});
});

gulp.task('nodemon', function (cb) {
	return nodemon({
		script: 'index.js'
	}).on('start', function () {
		cb();
	});
}); 