import { build } from "esbuild"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const external = [
  "react",
  "react-dom",
  "next",
  "sse.js",
  "zustand",
  "immer",
  "idb-keyval",
]

const excludeFiles: string[] = []

const srcDir = path.resolve(__dirname, "src")

/* PLUGINS */
import type { Plugin } from "esbuild"

const excludeFilesPlugin: Plugin = {
  name: "exclude-files",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (excludeFiles.some((file) => args.path.includes(file))) {
        return { path: "", external: true }
      }
    })
  },
}

const pathTransformPlugin: Plugin = {
  name: "path-transform",
  setup(build) {
    build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
      if (args.path.includes("node_modules")) {
        return
      }
      //console.log(path.relative(srcDir, args.path), "replacing paths:")
      const contents = await fs.promises.readFile(args.path, "utf8")
      const transformed = contents.replace(
        /(from ['"]|import\(['"])@\/([^'"]+)(['"'])/g,
        (match, prefix, importPath, suffix) => {
          const targetPath = path.resolve(srcDir, importPath)
          const relativePath = path.relative(
            path.dirname(args.path),
            targetPath
          )
          const result = `${prefix}${relativePath.replace(/\\/g, "/")}${suffix}`
          //console.log(`${prefix}@/${importPath}${suffix}`, " -> ", result)
          return `${prefix}${relativePath.replace(/\\/g, "/")}${suffix}`
        }
      )
      return { contents: transformed, loader: "tsx" }
    })
  },
}

async function buildLib() {
  // ESM build
  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.js",
    format: "esm",
    platform: "browser",
    target: "es2018",
    external,
    sourcemap: true,
    jsx: "preserve",
    tsconfig: "tsconfig.json",
    // treeShaking: true,
    minify: true,
    loader: {
      ".tsx": "tsx",
    },
    plugins: [excludeFilesPlugin],
  })

  // CJS build
  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.cjs",
    format: "cjs",
    platform: "node",
    target: "es2018",
    external,
    sourcemap: true,
    jsx: "preserve",
    tsconfig: "tsconfig.json",
    // treeShaking: true,
    minify: true,
    loader: {
      ".tsx": "tsx",
    },
    plugins: [excludeFilesPlugin],
  })

  console.log("Build completed!")
}

buildLib().catch(console.error)
