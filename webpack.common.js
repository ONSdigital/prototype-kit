import * as path from 'path';
import glob from 'glob';
import { NoEmitOnErrorsPlugin, NamedModulesPlugin } from 'webpack';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import FixStyleOnlyEntriesPlugin from 'webpack-fix-style-only-entries';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import globImporter from 'node-sass-glob-importer';

import postcssPlugins from './postcss.config';

const OUT_DIR = 'build';

export default function(mode) {
  const devMode = mode === 'development';

  return {
    context: `${__dirname}/src`,

    mode,
    
    entry: {
      'scripts/custom-scripts': ['./scripts/custom-scripts.js'],
      'custom-styles': ['./styles/custom-styles.scss'],
      html: glob.sync('./pages/**/*.md', { cwd: 'src' })
    },

    output: {
      path: path.join(process.cwd(), OUT_DIR),
      filename: '[name].js',
      chunkFilename: '[name].js'
    },

    resolve: {
      extensions: ['.js', '.scss', '.md'],
      modules: ['./node_modules'],
      alias: {
        helpers: path.resolve(__dirname, './src/helpers')
      }
    },

    resolveLoader: {
      modules: ['./node_modules']
    },

    module: {
      rules: [
        // Templates
        {
          test: /\.md$/,
          loaders: [
            {
              loader: 'file-loader',
              options: {
                name: '[path][name].html',
                context: 'src/pages'
              }
            },
            {
              loader: path.resolve('./lib/nunjucks-html-loader.js'),
              options: {
                searchPaths: [
                  `${__dirname}/src`,
                  `${__dirname}/node_modules/@ons/design-system`
                ],
                layoutPath: 'views/layouts',
                defaultLayout: 'page-templates/_template.njk',	
                context: {
                  devMode
                }
              }
            },
          ]
        },
        // Styles
        {
          test: /\.scss$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[path][name].css'
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                indent: 'postcss',
                plugins: postcssPlugins
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: false,
                precision: 8,
                includePaths: [path.join(process.cwd(), 'src')],
                importer: globImporter()
              }
            }
          ]
        },
        // Script
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      targets: {
                        browsers: ['last 3 versions']
                      }
                    }
                  ]
                ],
                plugins: ['@babel/plugin-syntax-dynamic-import', '@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime']
              }
            }
          ]
        }
      ]
    },

    plugins: [
      new NoEmitOnErrorsPlugin(),

      new NamedModulesPlugin(),

      new ProgressBarPlugin(),

      new CircularDependencyPlugin({
        exclude: /(\\|\/)node_modules(\\|\/)/,
        failOnError: false
      }),

      new FixStyleOnlyEntriesPlugin({
        extensions: ['scss', 'md'],
        silent: true
      }),

      new CopyWebpackPlugin(
        [     
          {
            from: '../src/admin/index.html',
            to: '../build/admin/index.html'
          },             
          {
            from: '../src/admin/signup.html',
            to: '../build/admin/signup.html'
          },          
          {
            from: '../src/admin/config.yml',
            to: '../build/admin/config.yml'
          },
          {
            context: '../src/',
            from: {
              glob: 'images',
              dot: true
            }
          },
          {
            context: '../node_modules/@ons/design-system/',
            from: {
              glob: 'css',
              dot: true
            }
          },
          {
            context: '../node_modules/@ons/design-system/',
            from: {
              glob: 'scripts',
              dot: true
            }
          },
          {
            context: '../node_modules/@ons/design-system/',
            from: {
              glob: 'fonts',
              dot: true
            }
          },
          {
            context: '../node_modules/@ons/design-system/',
            from: {
              glob: 'img',
              dot: true
            }
          },
          {
            context: '../node_modules/@ons/design-system/',
            from: {
              glob: 'favicons',
              dot: true
            }
          }
        ]
      )
    ]
  };
};
