const pkgjson = require("./package.json");
const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const {
  BundleAnalyzerPlugin
} = require('webpack-bundle-analyzer');
const autoprefixer = require('autoprefixer');
const ManifestPlugin = require('webpack-manifest-plugin');
const WebpackOnBuildPlugin = require('on-build-webpack');
const fs = require('fs');
const shell = require('shelljs');
const exec = require('child_process').exec;


module.exports = (env = {}) => {

  const _TARGET = "web";
  const __ANALYZE__ = env.analyze;
  const __DEV__ = env.development;
  const __PROD__ = env.production || __ANALYZE__;


  if (__PROD__ === __DEV__) {
    throw new Error("Production or development configuration must be selected");
  }

  let _ENV = null;
  if (__PROD__) {
    _ENV = 'production';
  }

  if (__DEV__) {
    _ENV = 'development';
  }

  /****************************************************************************/
  let entry = {};
  entry['lib'] = ["deepmerge", "moment"];
  entry = {
    ...entry
  };


  const safeVer = pkgjson.version.replace(/\./g, '_').replace(/-/g, '_');
  let library = pkgjson.mountpoint + "LibraryDLL_" + safeVer;
  let filename = "[name].js";
  let devtool = 'cheap-module-source-map';
  if (__PROD__) {
    library = "lib_[id]_[hash]_" + safeVer;
    filename = 'res_[id]_[hash]_' + safeVer + '.js';
    devtool = false;
  }

  /****************************************************************************/
  let plugins = [
    new ManifestPlugin(/*{
      basePath: "/" + pkgjson.mountpoint + "/"
    }*/),
    new webpack.DllPlugin({
      name: library,
      path: path.join(__dirname, "/dist/[name].json")
    }),
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify(_ENV),
        "BUILD_TARGET": JSON.stringify(_TARGET)
      }
    })
  ];

  if (__PROD__) {
    plugins.push(new UglifyJSPlugin());
  }

  if (__DEV__) {
    plugins.push(new webpack.NamedModulesPlugin());
    plugins.push(new webpack.NoEmitOnErrorsPlugin());
  }


  if (__ANALYZE__) {
    plugins.push(new BundleAnalyzerPlugin());
  }

  /****************************************************************************/
  let rules = [];
  let externals = {};

  return {
    context: path.resolve(__dirname, '.'),
    target: _TARGET,
    entry,
    output: {
      library,
      filename,
      libraryTarget: 'umd',
      path: path.resolve(__dirname, './dist')
    },
    module: {
      rules
    },
    plugins,
    resolve: {
      modules: [
        path.resolve(__dirname),
        'node_modules'
      ],
      extensions: ['.js', '.jsx']
    },
    devtool
  };
}
