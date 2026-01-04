const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      login: './src/admin/login.tsx',
      admin: './src/admin/admin.tsx'
    },
    output: {
      path: path.resolve(__dirname, 'public'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: '/'
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: {
            cacheDirectory: false
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.less$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true
                },
                sourceMap: false
              }
            }
          ]
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource'
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      symlinks: false
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/admin/login.html',
        filename: 'admin/login.html',
        chunks: ['login']
      }),
      new HtmlWebpackPlugin({
        template: './src/admin/admin.html',
        filename: 'index.html',
        chunks: ['admin']
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public')
      },
      compress: true,
      port: 3001,
      proxy: {
        '/api': 'http://localhost:3000'
      }
    },
    // 暂时禁用缓存，避免首次构建时的缓存问题
    // cache: {
    //   type: 'filesystem',
    //   buildDependencies: {
    //     config: [__filename]
    //   }
    // },
    optimization: {
      minimize: isProduction,
      splitChunks: false  // 暂时禁用代码分割，加快构建
    },
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      entrypoints: false
    }
  };
};