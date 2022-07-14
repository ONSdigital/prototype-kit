import browserSync from 'browser-sync';
import browserify from 'browserify';
import glob from 'glob';
import gulpIf from 'gulp-if';
import gulpPostCss from 'gulp-postcss';
import gulpDartSass from 'gulp-dart-sass';
import gulpSourcemaps from 'gulp-sourcemaps';
import gulpSvg from 'gulp-svgo';
import merge from 'merge-stream';
import path from 'path';
import * as rollup from 'rollup';
import { nodeResolve as rollupNodeResolve } from '@rollup/plugin-node-resolve';
import rollupCommonJS from 'rollup-plugin-commonjs';

import nunjucksRendererPipe from './lib/rendering/nunjucks-renderer-pipe.js';
import postCssPlugins from './postcss.config.js';
import svgConfig from './svgo-config.js';

function setupGulpTasks(gulp) {
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
    outputFile: entryPoint.replace(/.*src\//, '')
  }));

  gulp.task('prototype-kit:clean', () => {
    return Promise.resolve();
  });

  function createBuildScriptTask({ entryPoint, outputFile }) {
    const taskName = `prototype-kit:build-script:${outputFile}`;
    gulp.task(taskName, async () => {
      const bundle = await rollup.rollup({
        input: entryPoint,
        plugins: [
          rollupNodeResolve(),
          rollupCommonJS({
            include: /node_modules/
          })
        ]
      });

      await bundle.write({
        file: `./build/${outputFile}`,
        format: 'cjs',
        name: path.basename(outputFile),
        sourcemap: true
      });
    });
    return taskName;
  }

  gulp.task('prototype-kit:build-script', gulp.series(...scripts.map(createBuildScriptTask)));

  gulp.task('prototype-kit:build-styles', () => {
    return gulp
      .src(['./src/**/*.scss', '!**/_*/**'])
      .pipe(gulpIf(isDevelopment, gulpSourcemaps.init()))
      .pipe(gulpDartSass(sassOptions).on('error', gulpDartSass.logError))
      .pipe(gulpIf(isProduction, gulpPostCss(postCssPlugins())))
      .pipe(gulpIf(isDevelopment, gulpSourcemaps.write('./')))
      .pipe(gulp.dest('./build'))
      .pipe(browserSync.stream());
  });

  gulp.task('prototype-kit:build-svg', () => {
    return gulp
      .src('./src/**/*.svg')
      .pipe(gulpSvg(svgConfig))
      .pipe(gulp.dest('./build'))
      .pipe(browserSync.stream());
  });

  gulp.task('prototype-kit:build-pages', () => {
    return gulp
      .src(['./src/**/*.njk', '!**/_*/**'])
      .pipe(nunjucksRendererPipe)
      .pipe(gulp.dest('./build'));
  });

  gulp.task('prototype-kit:copy-design-system-files', () => {
    return merge([
      gulp.src('./node_modules/@ons/design-system/[0-9]*/**/*').pipe(gulp.dest('./build')),
      gulp.src('./node_modules/@ons/design-system/css/**/*').pipe(gulp.dest('./build/css')),
      gulp.src('./node_modules/@ons/design-system/favicons/**/*').pipe(gulp.dest('./build/favicons')),
      gulp.src('./node_modules/@ons/design-system/fonts/**/*').pipe(gulp.dest('./build/fonts')),
      gulp.src('./node_modules/@ons/design-system/img/**/*').pipe(gulp.dest('./build/img')),
      gulp.src('./node_modules/@ons/design-system/scripts/**/*').pipe(gulp.dest('./build/scripts'))
    ]);
  });

  gulp.task('prototype-kit:copy-js-files', () => {
    return gulp.src('./src/js/*.js').pipe(gulp.dest('./build/js'));
  });

  gulp.task('prototype-kit:watch-and-build', async () => {
    browserSync.init({
      proxy: 'localhost:3010'
    });

    gulp.watch('./src/**/*.njk').on('change', browserSync.reload);
    gulp.watch('./src/**/*.scss', gulp.series('prototype-kit:build-styles'));
    gulp.watch('./src/**/*.js', gulp.series('prototype-kit:build-script'));
    gulp.watch('./src/svg/**/*.svg', gulp.series('prototype-kit:build-svg'));
  });

  gulp.task('prototype-kit:start-dev-server', async () => {
    await import('./lib/dev-server.js');
  });

  gulp.task(
    'prototype-kit:build-assets',
    gulp.series(
      'prototype-kit:copy-design-system-files',
      'prototype-kit:build-script',
      'prototype-kit:build-styles',
      'prototype-kit:build-svg'
    )
  );

  gulp.task(
    'prototype-kit:start',
    gulp.series('prototype-kit:build-assets', 'prototype-kit:watch-and-build', 'prototype-kit:start-dev-server')
  );
  gulp.task('prototype-kit:watch', gulp.series('prototype-kit:watch-and-build', 'prototype-kit:start-dev-server'));
  gulp.task('prototype-kit:build', gulp.series('prototype-kit:build-assets', 'prototype-kit:build-pages'));
}

export default setupGulpTasks;
