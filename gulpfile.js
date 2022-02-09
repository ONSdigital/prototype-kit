import babelify from 'babelify';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import glob from 'glob';
import gulpIf from 'gulp-if';
import gulpPostCss from 'gulp-postcss';
import gulpDartSass from 'gulp-dart-sass';
import gulpSourcemaps from 'gulp-sourcemaps';
import gulpSvg from 'gulp-svgo';
import gulpTerser from 'gulp-terser';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import merge from 'merge-stream';

import babelEsmConfig from './babel.conf.esm.js';
import nunjucksRendererPipe from './lib/rendering/nunjucks-renderer-pipe.js';
import postCssPlugins from './postcss.config.js';
import svgConfig from './svgo-config.js';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

const terserOptions = {
  compress: {
    drop_console: true
  }
};

const sassOptions = {
  includePaths: ['./node_modules/normalize.css', './node_modules/prismjs/themes']
};

const scripts = glob.sync('./src/prototypes/**/index.js').map(entryPoint => ({
  entryPoint: entryPoint,
  outputFile: entryPoint.replace(/.*src\//, ''),
  config: babelEsmConfig
}));

gulp.task('clean', () => {
  return Promise.resolve();
});

function createBuildScriptTask({ entryPoint, outputFile, config }) {
  const taskName = `build-script:${outputFile}`;
  gulp.task(taskName, () => {
    return browserify(entryPoint, { debug: isDevelopment })
      .transform('babelify', { ...config, sourceMaps: isDevelopment })
      .bundle()
      .pipe(source(outputFile))
      .pipe(buffer())
      .pipe(gulpIf(isDevelopment, gulpSourcemaps.init({ loadMaps: true })))
      .pipe(gulpIf(isProduction, gulpTerser(terserOptions)))
      .pipe(gulpIf(isDevelopment, gulpSourcemaps.write('./')))
      .pipe(gulp.dest('./build'))
      .pipe(browserSync.stream());
  });
  return taskName;
}

gulp.task('build-script', gulp.series(...scripts.map(createBuildScriptTask)));

gulp.task('build-styles', () => {
  return gulp
    .src(['./src/**/*.scss', '!**/_*/**'])
    .pipe(gulpIf(isDevelopment, gulpSourcemaps.init()))
    .pipe(gulpDartSass(sassOptions).on('error', gulpDartSass.logError))
    .pipe(gulpIf(isProduction, gulpPostCss(postCssPlugins())))
    .pipe(gulpIf(isDevelopment, gulpSourcemaps.write('./')))
    .pipe(gulp.dest('./build'))
    .pipe(browserSync.stream());
});

gulp.task('build-svg', () => {
  return gulp
    .src('./src/**/*.svg')
    .pipe(gulpSvg(svgConfig))
    .pipe(gulp.dest('./build'))
    .pipe(browserSync.stream());
});

gulp.task('build-pages', () => {
  return gulp
    .src(['./src/**/*.njk', '!**/_*/**'])
    .pipe(nunjucksRendererPipe)
    .pipe(gulp.dest('./build'));
});

gulp.task('copy-design-system-files', () => {
  return merge([
    gulp.src('./node_modules/@ons/design-system/[0-9]*/**/*').pipe(gulp.dest('./build')),
    gulp.src('./node_modules/@ons/design-system/css/**/*').pipe(gulp.dest('./build/css')),
    gulp.src('./node_modules/@ons/design-system/favicons/**/*').pipe(gulp.dest('./build/favicons')),
    gulp.src('./node_modules/@ons/design-system/fonts/**/*').pipe(gulp.dest('./build/fonts')),
    gulp.src('./node_modules/@ons/design-system/img/**/*').pipe(gulp.dest('./build/img')),
    gulp.src('./node_modules/@ons/design-system/scripts/**/*').pipe(gulp.dest('./build/scripts'))
  ]);
});

gulp.task('copy-js-files', () => {
  return gulp.src('./src/js/*.js').pipe(gulp.dest('./build/js'));
});

gulp.task('watch-and-build', async () => {
  browserSync.init({
    proxy: 'localhost:3010'
  });

  gulp.watch('./src/**/*.njk').on('change', browserSync.reload);
  gulp.watch('./src/**/*.scss', gulp.series('build-styles'));
  gulp.watch('./src/**/*.js', gulp.series('build-script'));
  gulp.watch('./src/svg/**/*.svg', gulp.series('build-svg'));
});

gulp.task('start-dev-server', async () => {
  await import('./lib/dev-server.js');
});

gulp.task('build-assets', gulp.series('copy-design-system-files', 'build-script', 'build-styles', 'build-svg'));

gulp.task('start', gulp.series('build-assets', 'watch-and-build', 'start-dev-server'));
gulp.task('watch', gulp.series('watch-and-build', 'start-dev-server'));
gulp.task('build', gulp.series('build-assets', 'build-pages'));
