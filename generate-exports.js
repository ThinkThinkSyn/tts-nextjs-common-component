#!/usr/bin/env node

import {
  readdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  appendFileSync,
  statSync,
} from "fs"
import { join, basename, dirname } from "path"
import { fileURLToPath } from "url"

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "src")

// Files and folders to ignore
const ignore = ["utils/i18n"]

function getAllDirectories(dirPath) {
  const items = readdirSync(dirPath, { withFileTypes: true })
  const dirs = []

  for (const item of items) {
    if (item.isDirectory() && !ignore.includes(item.name)) {
      const fullPath = join(dirPath, item.name)
      dirs.push(fullPath)
      dirs.push(...getAllDirectories(fullPath))
    }
  }

  return dirs
}

const allDirs = getAllDirectories(srcDir)

function generateIndexFile(dirPath) {
  const items = readdirSync(dirPath, { withFileTypes: true })

  const files = items
    .filter(
      (item) =>
        item.isFile() &&
        (item.name.endsWith(".ts") || item.name.endsWith(".tsx")) &&
        item.name !== "index.ts" &&
        !ignore.includes(item.name)
    )
    .map((item) => item.name.replace(/\.(ts|tsx)$/, ""))

  const subDirs = items
    .filter((item) => item.isDirectory() && !ignore.includes(item.name))
    .map((item) => item.name)

  const allExports = [...files, ...subDirs]

  if (allExports.length === 0) return

  const indexPath = join(dirPath, "index.ts")
  const existingContent = existsSync(indexPath)
    ? readFileSync(indexPath, "utf8")
    : ""
  const existingLines = existingContent.split("\n").map((line) => line.trim())

  const newExports = allExports
    .map((item) => `export * from './${item}'`)
    .filter((exportLine) => !existingLines.includes(exportLine))

  if (newExports.length > 0) {
    const content = newExports.join("\n") + "\n"
    if (existingContent) {
      appendFileSync(indexPath, content)
    } else {
      writeFileSync(indexPath, content)
    }
    console.log(`Updated index.ts for ${basename(dirPath)}`)
  }
}

// Generate main index.ts
function generateMainIndex() {
  const items = readdirSync(srcDir, { withFileTypes: true })
  const topLevelDirs = items
    .filter((item) => item.isDirectory() && !ignore.includes(item.name))
    .map((item) => item.name)

  const mainIndexPath = join(srcDir, "index.ts")
  const existingContent = existsSync(mainIndexPath)
    ? readFileSync(mainIndexPath, "utf8")
    : ""
  const existingLines = existingContent.split("\n").map((line) => line.trim())

  const newExports = topLevelDirs
    .map((dir) => `export * from './${dir}'`)
    .filter((exportLine) => !existingLines.includes(exportLine))

  if (newExports.length > 0) {
    const content = newExports.join("\n") + "\n"
    if (existingContent) {
      appendFileSync(mainIndexPath, content)
    } else {
      const header = "// Auto-generated exports\n"
      writeFileSync(mainIndexPath, header + content)
    }
    console.log("Updated main index.ts")
  }
}

allDirs.forEach((dirPath) => {
  generateIndexFile(dirPath)
})

generateMainIndex()
console.log("Export generation complete!")
