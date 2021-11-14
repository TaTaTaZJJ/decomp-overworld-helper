import * as fs from "fs";
import * as path from "path";

export function getFileString(relativePath: string, workspaceRootPath: string) {
  const onDiskPath = path.join(workspaceRootPath, relativePath);
  if (!pathExists(onDiskPath)) {
    throw Error(`"${onDiskPath}" is not accessible.`);
  }
  return fs.readFileSync(onDiskPath).toString();
}

export function writeFileString(str: string, relativePath: string, workspaceRootPath: string) {
  const onDiskPath = path.join(workspaceRootPath, relativePath);
  if (!pathExists(onDiskPath)) {
    throw Error(`"${onDiskPath}" is not accessible.`);
  }
  return fs.writeFileSync(onDiskPath, str);
}

function pathExists(p: string): boolean {
  try {
    fs.accessSync(p);
  } catch (err) {
    return false;
  }
  return true;
}
