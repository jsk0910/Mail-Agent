const path = require("node:path");

const runtimeDirectory = `${process.platform}-${process.arch}`;

module.exports = {
  appId: "dev.mailagent.desktop",
  productName: "Mail Agent",
  protocols: [{ name: "Mail Agent OAuth", schemes: ["mailagent"] }],
  directories: {
    output: "release"
  },
  files: ["dist/**/*", "package.json"],
  extraResources: [
    {
      from: "resources/models",
      to: "models",
      filter: ["qwen3-4b-q4_k_m-*.gguf"]
    },
    {
      from: path.join("resources/bin", runtimeDirectory),
      to: "bin"
    }
  ],
  asar: true,
  win: {
    target: ["zip"],
    artifactName: "Mail-Agent-${version}-Windows-${arch}.${ext}"
  },
  mac: {
    target: ["dmg", "zip"],
    category: "public.app-category.productivity",
    hardenedRuntime: true,
    gatekeeperAssess: false,
    artifactName: "Mail-Agent-${version}-macOS-${arch}.${ext}"
  }
};
