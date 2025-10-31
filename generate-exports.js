#!/usr/bin/env node

import { readdirSync, writeFileSync, existsSync } from "fs"
import { join, basename, dirname } from "path"
import { fileURLToPath } from "url"

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "src")

// Scan directories in srcDir
const dirs = readdirSync(srcDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)

function generateIndexFile(dirPath) {
  const files = readdirSync(dirPath)
    .filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".tsx")) && file !== "index.ts"
    )
    .map((file) => file.replace(/\.(ts|tsx)$/, ""))

  if (files.length === 0) return

  const exports = files.map((file) => `export * from './${file}'`).join("\n")

  writeFileSync(join(dirPath, "index.ts"), exports + "\n")
  console.log(`Generated index.ts for ${basename(dirPath)}`)
}

// Generate main index.ts
function generateMainIndex() {
  const mainExports = dirs.map((dir) => `export * from './${dir}'`).join("\n")
  const content = `// Auto-generated exports\n${mainExports}\n`

  writeFileSync(join(srcDir, "index.ts"), content)
  console.log("Generated main index.ts")
}

dirs.forEach((dir) => {
  const dirPath = join(srcDir, dir)
  if (existsSync(dirPath)) {
    generateIndexFile(dirPath)
  }
})

generateMainIndex()
console.log("Export generation complete!")
