const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: './src/index.js',
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                },
                resolve: {
                    fullySpecified: false,
                }
            }
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'public/index.html'
        })
    ],
    resolve: {
        extensions: ['', '.js']
    },
    stats: {
        errorDetails: true
    }
}