var gulp = require('gulp'),
  bower = require('bower'),
  browserSync = require('browser-sync'),
  assemble = require('gulp-assemble'),
  del = require('del'),
  minifyHtml = require('gulp-minify-html'),
  runSequence = require('run-sequence'),
  gutil = require('gulp-util'),
  sass = require('gulp-ruby-sass'),
  autoprefixer = require('gulp-autoprefixer');


var isProduction = gutil.env.type === 'production';

var option = {
  assemble: {
    partials: 'src/partials/*.hbs',
    layoutdir: 'src/layouts/',
    layout: 'default.hbs'
  }
};


gulp.task('rm', function (cb) {
  del(['./_gh_pages', './tmp'], cb);
});

gulp.task('setup', function () {
  bower.commands.install().on('end', function () {
    gulp.src([
      './bower_components/angular/angular.js',
      './bower_components/angular/angular.min.js',
      './bower_components/angular/angular.min.js.map'
    ])
    .pipe(gulp.dest('./_gh_pages/js/lib'));

    gulp.src([
      './bower_components/normalize-css/normalize.css'
    ])
    .pipe(gulp.dest('./_gh_pages/css/lib'));
  });
});

gulp.task('browser-sync', function () {
  browserSync({
    server: {
      baseDir: './_gh_pages',
      open: false,
      browser: ['google chrome', 'firefox']
    }
  });
});

gulp.task('assemble', function () {
  return gulp.src('src/pages/*.hbs')
    .pipe(assemble(option.assemble))
    .pipe(gulp.dest('tmp'));
});

gulp.task('sass', function () {
  return gulp.src('./src/scss/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./tmp/css'));
});

gulp.task('cssbuild', ['sass'], function () {
  return gulp.src('tmp/css/**/*.css')
    .pipe(autoprefixer())
    .pipe(gulp.dest('./_gh_pages/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
})

gulp.task('htmlbuild', ['assemble'], function () {
  return gulp.src('tmp/**/*.html')
    .pipe(isProduction ? minifyHtml() : gutil.noop())
    .pipe(gulp.dest('./_gh_pages'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('copy', function () {
  return gulp.src('./src/js/*.js')
    .pipe(gulp.dest('./_gh_pages/js/'))
    .pipe(browserSync.reload({
      stream: true
    }));
});



gulp.task('reload', function () {
  browserSync.reload();
});

gulp.task('compile', function (cb) {
  runSequence(
    'rm',
    'setup',
    'htmlbuild',
    'cssbuild',
    'copy',
    cb
  );
});



gulp.task('watch', function () {
  gulp.watch(['./src/**/*.hbs'], ['htmlbuild']);
  gulp.watch(['./src/js/*.js'], ['copy']);
  gulp.watch(['./src/scss/**/*.scss'], ['cssbuild']);
});

gulp.task('serve', ['compile', 'browser-sync', 'watch']);
gulp.task('deploy', ['compile']);

