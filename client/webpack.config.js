const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const path = require("path");

module.exports = (env) => {
    const dev = env.dev;
    return {
        mode: "development",
        devtool: "eval-source-map",
        entry: {
            main: dev ? "./src/devIndex.ts" : "./src/index.ts",
        },
        output: {
            path: path.resolve(__dirname, "./static"),
            filename: "bundle.js",
        },
        resolve: {
            plugins: [new TsconfigPathsPlugin()],
            extensions: [".ts", ".tsx", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: [{ loader: "ts-loader", options: { onlyCompileBundledFiles: true } }],
                },
                {
                    test: /\.html|\.frag|\.vert$/,
                    use: "raw-loader",
                },
            ],
        },
        devServer: {
            static: "./static",
            port: 3000,
        },
    };
};
