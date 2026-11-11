const fs = require("fs");
const path = require("path");

const albumDir = path.join(__dirname, "..", "img", "album");
const files = fs
  .readdirSync(albumDir)
  .filter((name) => /\.(png|jpe?g|webp|gif|avif)$/i.test(name))
  .sort((a, b) => a.localeCompare(b, "pt-BR"));

fs.writeFileSync(path.join(albumDir, "manifest.json"), JSON.stringify(files, null, 2) + "\n");
console.log(`${files.length} imagens em img/album/manifest.json`);
