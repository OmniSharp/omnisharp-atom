var gulp = require('gulp');
var ts = require('typescript');
var through = require('through2');
var gutil = require('gulp-util');
var watch = require('gulp-watch');
var plumber = require('gulp-plumber');
var newer = require('gulp-newer');
var merge = require('merge-stream');
var del = require('del');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var win32 = process.platform === "win32";
var spawn = require('child_process').spawn;
var gulpPath = path.join(__dirname, 'node_modules/.bin/gulp' + (win32 && '.cmd' || ''));


// Simply take TS code and strip anything not javascript
// Does not do any compile time checking.
function tsTranspile() {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        var res = ts.transpile(file.contents.toString(), { module: ts.ModuleKind.CommonJS });

        file.contents = new Buffer(res);
        file.path = gutil.replaceExtension(file.path, '.js');
        gutil.log(gutil.colors.cyan('Writing ') + gutil.colors.green(_.trim(file.path.replace(__dirname, ''), path.sep)));

        this.push(file);

        cb();
    });
}

function tsTranspiler(source, dest) {
    return source
        .pipe(tsTranspile())
        .pipe(gulp.dest(dest));
}

var metadata = {
    lib: ['lib/**/*.ts', '!lib/**/*.d.ts'],
    spec: ['spec/**/*.ts'],
}

// Copies the roslyn binaries, if and only if the user is a windows user and has not done any funky symlink work (if you're developing)
gulp.task('copy-omnisharp-server-roslyn-binaries', function() {
    if (win32 && fs.existsSync('./node_modules/omnisharp-node-client/node_modules/omnisharp-server-roslyn-binaries/')) {

        var localServer = fs.existsSync('./node_modules/omnisharp-server-roslyn-binaries/');
        if (localServer) {
            var localSymlink = fs.lstatSync('./node_modules/omnisharp-server-roslyn-binaries/').isSymbolicLink();
        }

        // See if we've already copied the server (if so lets remove it incase it's been updated!)
        if (localServer && fs.existsSync('./node_modules/omnisharp-node-client/node_modules/omnisharp-server-roslyn-binaries/')) {
            // If the server is a symlink don't remove... someone could be developing
            if (!localSymlink) {
                gutil.log("Removing " + gutil.colors.yellow("/node_modules/omnisharp-server-roslyn-binaries/"));
                del.sync(['./node_modules/omnisharp-server-roslyn-binaries/']);
            }
        }

        // See we didn't find the server, or the existing one was not a symlink.
        if (!localServer || !localSymlink) {
            gutil.log("Copying " + gutil.colors.green("/node_modules/omnisharp-node-client/node_modules/omnisharp-server-roslyn-binaries/ -> /node_modules/omnisharp-server-roslyn-binaries/"));
            return gulp.src('./node_modules/omnisharp-node-client/node_modules/omnisharp-server-roslyn-binaries/**/*')
                .pipe(gulp.dest('./node_modules/omnisharp-server-roslyn-binaries/'));
        }
    }
});

gulp.task('typescript', ['clean'], function() {
    var lib = tsTranspiler(gulp.src(metadata.lib), './lib');
    var spec = tsTranspiler(gulp.src(metadata.spec), './spec');

    return merge(lib, spec);
});

gulp.task('clean', ['clean:lib', 'clean:spec']);

gulp.task('clean:lib', function(done) {
    del(metadata.lib.map(function(z) { return gutil.replaceExtension(z, '.js'); }), function(err, paths) {
        _.each(paths, function(path) {
            gutil.log(gutil.colors.red('Deleted ') + gutil.colors.magenta(path.replace(__dirname, '').substring(1)));
        });
        done();
    });
});

gulp.task('clean:spec', function(done) {
    del(metadata.spec.map(function(z) { return gutil.replaceExtension(z, '.js'); }), function(err, paths) {
        _.each(paths, function(path) {
            gutil.log(gutil.colors.red('Deleted ') + gutil.colors.magenta(path.replace(__dirname, '').substring(1)));
        });
        done();
    });
});

gulp.task('watch', function() {
    // Auto restart watch when gulpfile is changed.
    var p = spawn(gulpPath, ['file-watch'], {stdio: 'inherit'});
    return watch('gulpfile.js', function() {
        p.kill();
        p = spawn(gulpPath, ['file-watch'], {stdio: 'inherit'});
    });
});

gulp.task('file-watch', function() {
    var lib = tsTranspiler(gulp.src(metadata.lib)
        .pipe(watch(metadata.lib))
        .pipe(plumber())
        .pipe(newer(dest)), './lib')

    var spec = tsTranspiler(gulp.src(metadata.spec)
        .pipe(watch(metadata.spec))
        .pipe(plumber())
        .pipe(newer(dest)), './spec');

    return merge(lib, spec);
});

gulp.task('npm-postinstall', ['typescript', 'copy-omnisharp-server-roslyn-binaries']);

gulp.task('npm-prepublish', ['typescript']);

// The default task (called when you run `gulp` from CLI)
gulp.task('default', ['typescript']);
