#! /usr/bin/env node

import { exec } from "electron-builder-util"
import { log } from "electron-builder-util/out/log"
import { printErrorAndExit } from "electron-builder-util/out/promise"
import yargs from "yargs"
import { getElectronVersion, loadConfig } from "../util/readPackageJson"
import { getGypEnv } from "../yarn"

const args: any = yargs
  .option("platform", {
    choices: ["linux", "darwin", "win32"],
    default: process.platform,
  })
  .option("arch", {
    choices: ["ia32", "x64", "armv7l"],
    default: process.arch,
  }).argv

async function main() {
  const projectDir = process.cwd()
  const config = await loadConfig(projectDir)
  log(`Execute node-gyp rebuild for ${args.platform}:${args.arch}`)
  // this script must be used only for electron
  await exec(process.platform === "win32" ? "node-gyp.cmd" : "node-gyp", ["rebuild"], {
    env: getGypEnv({version: await getElectronVersion(config, projectDir), useCustomDist: true}, args.platform, args.arch, true),
  })
}

main()
  .catch(printErrorAndExit)