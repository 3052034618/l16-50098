import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const DATA_DIR = path.join(__dirname, '../../data')

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readJsonFile<T>(filePath: string): T {
  ensureDataDir()
  const fullPath = path.join(DATA_DIR, filePath)
  if (!fs.existsSync(fullPath)) {
    return {} as T
  }
  const content = fs.readFileSync(fullPath, 'utf-8')
  return JSON.parse(content) as T
}

export function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir()
  const fullPath = path.join(DATA_DIR, filePath)
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8')
}

export function fileExists(filePath: string): boolean {
  const fullPath = path.join(DATA_DIR, filePath)
  return fs.existsSync(fullPath)
}

export function deleteFile(filePath: string): void {
  const fullPath = path.join(DATA_DIR, filePath)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}

export function listFiles(pattern: RegExp): string[] {
  ensureDataDir()
  const files = fs.readdirSync(DATA_DIR)
  return files.filter(f => pattern.test(f))
}
