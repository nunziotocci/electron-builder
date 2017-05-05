import BluebirdPromise from "bluebird-lst"
import { DIR_TARGET, Platform } from "electron-builder"
import { outputFile } from "fs-extra-p"
import * as path from "path"
import { assertThat } from "./helpers/fileAssert"
import { app, modifyPackageJson } from "./helpers/packTester"

test.ifDevOrLinuxCi("ignore build resources", app({
  targets: Platform.LINUX.createTarget(DIR_TARGET),
  config: {
    asar: false
  }
}, {
  projectDirCreated: projectDir => {
    return outputFile(path.join(projectDir, "one/build/foo.txt"), "data")
  },
  packed: context => {
    return assertThat(path.join(context.getResources(Platform.LINUX), "app", "one", "build", "foo.txt")).isFile()
  },
}))

test.ifDevOrLinuxCi("ignore known ignored files", app({
  targets: Platform.LINUX.createTarget(DIR_TARGET),
  config: {
    asar: false
  }
}, {
  projectDirCreated: projectDir => BluebirdPromise.all([
    outputFile(path.join(projectDir, ".svn", "foo"), "data"),
    outputFile(path.join(projectDir, ".git", "foo"), "data"),
    outputFile(path.join(projectDir, "foo", "bar", "f.o"), "data"),
    outputFile(path.join(projectDir, "node_modules", ".bin", "f.txt"), "data"),
    outputFile(path.join(projectDir, "node_modules", ".bin2", "f.txt"), "data"),
  ]),
  packed: context => BluebirdPromise.all([
    assertThat(path.join(context.getResources(Platform.LINUX), "app", ".svn")).doesNotExist(),
    assertThat(path.join(context.getResources(Platform.LINUX), "app", ".git")).doesNotExist(),
    assertThat(path.join(context.getResources(Platform.LINUX), "app", "foo", "bar", "f.o")).doesNotExist(),
    assertThat(path.join(context.getResources(Platform.LINUX), "app", "node_modules", ".bin")).doesNotExist(),
    assertThat(path.join(context.getResources(Platform.LINUX), "app", "node_modules", ".bin")).doesNotExist(),
    assertThat(path.join(context.getResources(Platform.LINUX), "app", "node_modules", ".bin2")).isDirectory()
  ]),
}))

// skip on macOS because we want test only / and \
test.ifNotCiMac("ignore node_modules dev dep", app({
  targets: Platform.LINUX.createTarget(DIR_TARGET),
  config: <any>{
    asar: false,
    // ignore: (file: string) => {
    //   return file === "/ignoreMe"
    // }
  },
}, {
  projectDirCreated: projectDir => {
    return BluebirdPromise.all([
      modifyPackageJson(projectDir, data => {
        data.devDependencies = Object.assign({
          "electron-osx-sign": "*",
        }, data.devDependencies)
      }),
      outputFile(path.join(projectDir, "node_modules", "electron-osx-sign", "package.json"), "{}"),
      // outputFile(path.join(projectDir, "ignoreMe"), ""),
    ])
  },
  packed: context => {
    return BluebirdPromise.all([
      assertThat(path.join(context.getResources(Platform.LINUX), "app", "node_modules", "electron-osx-sign")).doesNotExist(),
      assertThat(path.join(context.getResources(Platform.LINUX), "app", "ignoreMe")).doesNotExist(),
    ])
  },
}))