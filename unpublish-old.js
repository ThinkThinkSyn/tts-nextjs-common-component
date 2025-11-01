#!/usr/bin/env node

import { execSync } from "child_process"

function runCommand(command) {
  try {
    const result = execSync(command, { encoding: "utf8", stdio: "pipe" })
    return result.trim()
  } catch (error) {
    console.error(`Error: ${error.message}`)
    return null
  }
}

function getLatestVersion() {
  const result = runCommand("npm view @thinkthinksyn/nextjs-component version")
  return result
}

function getAllVersions() {
  const result = runCommand(
    "npm view @thinkthinksyn/nextjs-component versions --json"
  )
  return result ? JSON.parse(result) : []
}

function main() {
  console.log("🗑️  Unpublishing old versions...")

  const latestVersion = getLatestVersion()
  const allVersions = getAllVersions()

  if (!latestVersion || !allVersions.length) {
    console.log("❌ Could not fetch package versions")
    return
  }

  console.log(`📦 Latest version: ${latestVersion}`)
  console.log(`📋 All versions: ${allVersions.join(", ")}`)

  const oldVersions = allVersions.filter((v) => v !== latestVersion)

  if (oldVersions.length === 0) {
    console.log("ℹ️  No old versions to unpublish")
    return
  }

  oldVersions.forEach((version) => {
    console.log(`🗑️  Unpublishing ${version}...`)
    const result = runCommand(
      `npm unpublish @thinkthinksyn/nextjs-component@${version}`
    )
    if (result !== null) {
      console.log(`✅ Unpublished ${version}`)
    } else {
      console.log(`⚠️  Failed to unpublish ${version}`)
    }
  })

  console.log("🎉 Cleanup completed!")
}

main()
