const path = require('path')
const { CleanWebpackPlugin } = require("clean-webpack-plugin")

const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");

module.exports = merge(common, {
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: '[name]'
    },
    plugins: [
        new CleanWebpackPlugin()
    ],
    mode: 'production'
})