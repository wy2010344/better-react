import { PluginOption } from 'vite'
import path from 'path';
import fs from 'fs'

type Option = {
  folder: string
}
export function createPlugin(option: Option): PluginOption {
  const basePath = path.join(process.cwd(), option.folder)
  function watcher(absolutePath: string) {
    const subPath = path.relative(basePath, absolutePath)
    if (!subPath.startsWith('..') && subPath.endsWith(".ts")) {
      reBuild(basePath)
    }
  }
  return {
    name: "watch-and-run",
    buildStart() {
      reBuild(basePath)
    },
    configureServer(server) {
      for (const kind of kindWithPath) {
        server.watcher.on(kind, watcher)
      }
    }
  }
}


export function getFilesUnder(rootFolder: string) {
  const files: string[] = []

  function traverseDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        traverseDirectory(fullPath)
      } else {
        const relativePath = path.relative(rootFolder, fullPath)
        files.push(relativePath)
      }
    }
  }

  traverseDirectory(rootFolder)
  return files
}


function reBuild(basePath: string) {
  const files = getFilesUnder(basePath)
  console.log("allFiles", files)
}

export const kindWithPath = ['add', 'addDir', 'change', 'unlink', 'unlinkDir'] as const
export type KindWithPath = (typeof kindWithPath)[number]
export type LogType = 'trigger' | 'streamData' | 'streamError' | 'end'
export const kindWithoutPath = ['all', 'error', 'raw', 'ready'] as const
export type KindWithoutPath = (typeof kindWithoutPath)[number]
export type WatchKind = KindWithPath | KindWithoutPath
