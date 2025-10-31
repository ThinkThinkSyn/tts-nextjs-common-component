import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

async function buildTypes() {
  try {
    await execAsync("tsc --project tsconfig.build.json")
    // Bundle all types into single index.d.ts
    const fs = await import("fs/promises")
    const path = await import("path")

    const typesContent = await fs.readFile("src/types.ts", "utf8")

    // Extract interface definitions
    const typeExports =
      typesContent.match(/export interface \w+[\s\S]*?^}/gm) || []
    const compactTypes = typeExports.join("\n\n")

    const bundledTypes = `${compactTypes}

export declare const FloatingChatWidget: React.ComponentType<FloatingChatProps>;
`

    await fs.writeFile("dist/index.d.ts", bundledTypes)
    console.log("Compact type definitions generated!")
  } catch (error) {
    console.error("Type generation failed:", error)
    process.exit(1)
  }
}

buildTypes()
