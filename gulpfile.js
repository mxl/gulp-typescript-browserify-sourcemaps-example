'use strict';

var path = require('path'),
    gulp = require('gulp'),
    del = require('del'),
    typescript = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    inject = require('gulp-inject'),
    babel = require('gulp-babel'),
    argv = require('yargs').argv;

var devEnvironment = 'dev',
    prodEnvironment = 'prod',
    environment = argv.env || prodEnvironment,
    isDevelopment = environment === devEnvironment;

var projectPath = __dirname,
    srcDir = 'src',
    srcPath = path.join(projectPath, srcDir),
    buildDir = path.join('build', environment),
    buildPath = path.join(projectPath, buildDir),
    distDir = 'dist',
    distRelativePath = path.join(buildDir, distDir),
    distPath = path.join(buildPath, distDir);

var tsSrcPath = path.join(srcPath, 'typescript'),
    tsGlob = path.join(tsSrcPath, '**', '*.ts'),
    tsBuildPath = path.join(buildPath, 'tsc');

var indexHtmlName = 'index.html',
    indexJsName = 'index.js';

var distIndexJsPath = path.join(distPath, 'index.js'),
    distIndexHtmlPath = path.join(distPath, indexHtmlName);

var tsProject = typescript.createProject('tsconfig.json');

console.log('Environment: ' + environment);

function getTsStream(src, dest) {
}

gulp.task('clean', function () {
    return del([buildPath]);
});

gulp.task('tsc', ['clean'], function () {
    var stream = gulp.src([tsGlob]);
    if (isDevelopment) {
        stream = stream
            .pipe(sourcemaps.init());
    }
    stream = stream
        .pipe(typescript(tsProject))
        .pipe(babel({
            presets: ['es2015']
        }));
    if (isDevelopment) {
        stream = stream.pipe(sourcemaps.write('', {sourceRoot: tsSrcPath}));
    }
    return stream.pipe(gulp.dest(tsBuildPath));
});

gulp.task('bundle', ['tsc'], function () {
    var b = browserify({
        entries: path.join(tsBuildPath, indexJsName),
        debug: isDevelopment
    });

    var stream = b.bundle()
        .pipe(source(indexJsName))
        .pipe(buffer());
    if (!isDevelopment) {
        stream = stream.pipe(uglify());
    }
    return stream
        .on('error', gutil.log)
        .pipe(gulp.dest(distPath));
});

gulp.task('build', ['bundle'], function() {
    return gulp.src(path.join(srcPath, indexHtmlName))
        .pipe(inject(gulp.src([distIndexJsPath], {read: false}), {ignorePath: distRelativePath, addRootSlash: true}))
        .pipe(gulp.dest(distPath));
});
