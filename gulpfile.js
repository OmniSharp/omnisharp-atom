var gulp = require('gulp');
var through = require('through2');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var del = require('del');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var win32 = process.platform === "win32";
var spawn = require('child_process').spawn;
var babel = require("gulp-babel");
var tslint = require("gulp-tslint");
var sourcemaps = require("gulp-sourcemaps");
var gulpPath = path.join(__dirname, 'node_modules/.bin/gulp' + (win32 && '.cmd' || ''));
var typescript = require('typescript');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json', { sourceMap: false, typescript: typescript });

var metadata = {
    lib: ['lib/**/*.ts', '!lib/**/*.d.ts'],
    spec: ['spec/**/*.ts', '!spec/**/*.d.ts'],
};

// Simply take TS code and strip anything not javascript
// Does not do any compile time checking.
function tsTranspile() {
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        var res = ts.transpile(file.contents.toString(), {
            module: ts.ModuleKind.ES6,
            target: ts.ScriptTarget.ES6
        }, file.path);

        file.contents = new Buffer(res);
        file.path = gutil.replaceExtension(file.path, '.js');
        gutil.log(gutil.colors.cyan('Writing ') + gutil.colors.green(_.trim(file.path.replace(__dirname, ''), path.sep)));

        this.push(file);

        cb();
    });
}

gulp.task('typescript', ['clean'], function() {
    return tsProject.src()
        .pipe(tslint())
        .pipe(tslint.report('prose'))
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject))
        .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('.'));
});

gulp.task('clean', ['clean:lib', 'clean:spec']);

gulp.task('clean:lib', function(done) {
    del(metadata.lib.map(function(z) {
        return gutil.replaceExtension(z, '.js');
    })).then(function(paths) {
        _.each(paths, function(path) {
            gutil.log(gutil.colors.red('Deleted ') + gutil.colors.magenta(path.replace(__dirname, '').substring(1)));
        });
        done();
    });
});

gulp.task('clean:spec', function(done) {
    del(metadata.spec.map(function(z) {
        return gutil.replaceExtension(z, '.js');
    })).then(function(paths) {
        _.each(paths, function(path) {
            gutil.log(gutil.colors.red('Deleted ') + gutil.colors.magenta(path.replace(__dirname, '').substring(1)));
        });
        done();
    });
});

gulp.task('watch', function() {
    // Watch is not installed by default if you want to use it
    //  you need to install manually but don't save it as it causes CI issues.
    var watch = require('gulp-watch');
    // Auto restart watch when gulpfile is changed.
    var p = spawn(gulpPath, ['file-watch'], {
        stdio: 'inherit'
    });
    return watch('gulpfile.js', function() {
        p.kill();
        p = spawn(gulpPath, ['file-watch'], {
            stdio: 'inherit'
        });
    });
});

gulp.task('file-watch', function() {
    // Watch is not installed by default if you want to use it
    //  you need to install manually but don't save it as it causes CI issues.
    var watch = require('gulp-watch');
    var plumber = require('gulp-plumber');
    var newer = require('gulp-newer');

    var lib = tsTranspiler(gulp.src(metadata.lib)
        .pipe(watch(metadata.lib))
        .pipe(plumber())
        .pipe(newer('./lib')), './lib')

    var spec = tsTranspiler(gulp.src(metadata.spec)
        .pipe(watch(metadata.spec))
        .pipe(plumber())
        .pipe(newer('./spec')), './spec');

    return merge(lib, spec);
});

gulp.task('npm-postinstall', ['typescript']);
gulp.task('npm-prepublish', ['typescript']);

// The default task (called when you run `gulp` from CLI)
gulp.task('default', ['typescript']);
