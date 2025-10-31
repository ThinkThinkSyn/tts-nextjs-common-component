import { build } from "esbuild"

const external = [
  "react",
  "react-dom",
  "next",
  "@radix-ui/*",
  "framer-motion",
  "lucide-react",
  "@tabler/icons-react",
  "react-markdown",
  "react-shiki",
  "react-textarea-autosize",
  "remark-gfm",
  "remark-math",
  "sonner",
  "sse.js",
  "zustand",
  "immer",
  "bson",
  "idb-keyval",
]

const excludeFiles = []

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
    treeShaking: true,
    minify: true,
    loader: {
      ".tsx": "tsx",
    },
    plugins: [
      {
        name: "exclude-files",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (excludeFiles.some((file) => args.path.includes(file))) {
              return { path: "", external: true }
            }
          })
        },
      },
    ],
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
    treeShaking: true,
    minify: true,
    loader: {
      ".tsx": "tsx",
    },
    plugins: [
      {
        name: "exclude-files",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (excludeFiles.some((file) => args.path.includes(file))) {
              return { path: "", external: true }
            }
          })
        },
      },
    ],
  })

  console.log("Build completed!")
}

buildLib().catch(console.error)
