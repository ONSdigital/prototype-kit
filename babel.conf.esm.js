import babelPluginSyntaxDynamicImport from '@babel/plugin-syntax-dynamic-import';
import babelPluginProposalClassProperties from '@babel/plugin-proposal-class-properties';
import babelPluginTransformRuntime from '@babel/plugin-transform-runtime';
import babelPresetEnv from '@babel/preset-env';

export default {
  babelrc: false,
  plugins: [babelPluginSyntaxDynamicImport, babelPluginProposalClassProperties, babelPluginTransformRuntime],
  global: true,
  ignore: [/node_modules\/(?!(chai-as-promised|fetch-mock)\/).*/],
  sourceType: 'module',
  presets: [
    [
      babelPresetEnv,
      {
        modules: 'commonjs',
        targets: {
          browsers: ['last 2 Chrome versions', 'Safari >= 12', 'iOS >= 10.3', 'last 2 Firefox versions', 'last 2 Edge versions']
        }
      }
    ]
  ]
};
