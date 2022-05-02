const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");
const port = 3002

module.exports = merge(common, {
    mode: "development",
    output: {
        filename: "[name].js"
    },
    devServer: {
        server: 'https',
        hot: true,
        port,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    }
})