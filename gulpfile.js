var gulp = require('gulp');
var fs = require('fs');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var inject = require('gulp-inject');
var autoprefixer = require('gulp-autoprefixer');
var del = require('del');
var config = JSON.parse(fs.readFileSync('./config.json'));
var templateInput = config.paths.templates.src;
var templateOutput = config.paths.templates.dest;
var scssInput = config.paths.stylesheets.scss;
var cssOutput = config.paths.stylesheets.css;
var jsInput = config.paths.javascript.src;
var jsOutput = config.paths.javascript.dest;
var imgInput = config.paths.images.src;
var imgOutput = config.paths.images.dest;

var sassOptionsDev = {
  errLogToConsole: true,
  outputStyle: 'expanded'
};

var sassOptionsPub = {
  errLogToConsole: true,
  outputStyle: 'compressed'
};

// config. driven minification of js & css
gulp.task('compile', () => {
  if ((config.publish).includes('full')) {
    // get the SASS files
    return gulp.src(scssInput)
    // run sass on files, generating any errors
    .pipe(sass(sassOptionsPub).on('error', sass.logError))    
    // include 'autoprefixer' to add any vendor prefixes required
    .pipe(autoprefixer())
    // concatenate all the files into one
    .pipe(concat('main.css'))
    // write the resulting CSS in the output folder
    .pipe(gulp.dest(cssOutput));
  } else {
    return gulp.src(scssInput)
    .pipe(sass(sassOptionsDev).on('error', sass.logError))
    .pipe(autoprefixer())
    // might want to concatenate dependent on SASS file structure 
    //.pipe(concat('main.css'))
    .pipe(gulp.dest(cssOutput));
  }
});

// 'inject-paths-css' task waits for 'templates' and 'compile' tasks to complete 
gulp.task('inject-paths-css', ['templates', 'compile'], function () {
  var target = gulp.src(templateOutput + '/index.html'); 
  var sources = gulp.src(cssOutput + '/**/*.css', {read: false});
 
  return target
    .pipe(inject(sources, {
      addRootSlash: false,
      // replace 'build' path
      transform : function ( filePath, file, i, length ) {
        var newPath = filePath.replace( 'build/', '' );
        //console.log('inject style = '+ newPath);
        return '<link rel="stylesheet" href="' + newPath + '"/>';
      }
    }))
    .pipe(gulp.dest('build'));
});

// 'inject-paths-js' task waits for 'templates', 'compile' and 'inject-paths-css' tasks to complete 
gulp.task('inject-paths-js', ['templates', 'compile', 'inject-paths-css'], function () {
  var target = gulp.src(templateOutput + '/index.html'); 
  var sources = gulp.src(jsOutput +'/**/*.js', {read: false});
 
  return target
    .pipe(inject(sources, {
      addRootSlash: false,
      // replace 'build' path
      transform : function ( filePath, file, i, length ) {
        var newPath = filePath.replace( 'build/', '' );
        //console.log('inject style = '+ newPath);
        return '<script src="' + newPath + '"></script>';
      }
    }))
    .pipe(gulp.dest('build'));
});

// copy template files to build folder
gulp.task('templates', () => {
	return gulp.src(templateInput)
        .pipe(gulp.dest(templateOutput));
});

// copy image files to build folder
gulp.task('images', () => {
  return gulp.src(imgInput)
    .pipe(gulp.dest(imgOutput))
});

// copy Javascript files to build folder - this would be far more extensive including linting, etc.
gulp.task('js', () => {
  return gulp.src(jsInput)
    .pipe(gulp.dest(jsOutput))
});

// clean up by deleting the 'build' directory
gulp.task('clean', () => {
  return del.sync('build');
});

// run gulp build
gulp.task('build', ['templates', 'images', 'js', 'compile', 'inject-paths-css', 'inject-paths-js']);

// run gulp watch
gulp.task('watch', function() {
  return gulp
    // watch input folder for change & and run 'compile' task if so
    .watch(scssInput, ['compile'])
    // log a message in the console if change occurs
    .on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});


// Watch all files For changes
//gulp.task('watch', () => {
//    gulp.watch('src/**/*.*', ['build']);
//});
