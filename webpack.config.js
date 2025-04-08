const path = require("path");

module.exports = {
  entry: "./src/webview-assets/sidebar-webview/main.ts",
  output: {
    path: path.resolve(__dirname, "./src/webview-assets/sidebar-webview/dist"),
    filename: "main.bundle.js",
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: "ts-loader", exclude: /node_modules/ },
      { test: /\.(svelte|svelte\.js)$/, use: "svelte-loader" },
      {
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    extensions: [".mjs", ".ts", ".js", ".svelte"],
    mainFields: ["browser", "module", "main", "svelte"],
    conditionNames: ["svelte", "browser", "module", "main"],
  },
  mode: "development",
  devtool: "source-map",
};
