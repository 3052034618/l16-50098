import { AccountSnapshot } from '../../shared/types.js'
import { readJsonFile, writeJsonFile, fileExists } from '../data/index.js'

interface SnapshotStoreData {
  snapshots: AccountSnapshot[]
}

const SNAPSHOTS_FILE = 'snapshots.json'

export class SnapshotStore {
  private static instance: SnapshotStore
  private data: SnapshotStoreData

  private constructor() {
    this.data = this.load()
  }

  static getInstance(): SnapshotStore {
    if (!SnapshotStore.instance) {
      SnapshotStore.instance = new SnapshotStore()
    }
    return SnapshotStore.instance
  }

  private load(): SnapshotStoreData {
    if (!fileExists(SNAPSHOTS_FILE)) {
      return { snapshots: [] }
    }
    const data = readJsonFile<SnapshotStoreData>(SNAPSHOTS_FILE)
    if (!data.snapshots) {
      return { snapshots: [] }
    }
    return data
  }

  private saveToFile(): void {
    writeJsonFile(SNAPSHOTS_FILE, this.data)
  }

  save(snapshot: AccountSnapshot): void {
    this.data.snapshots.push(snapshot)
    this.data.snapshots.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    this.saveToFile()
  }

  getLatest(): AccountSnapshot | undefined {
    if (this.data.snapshots.length === 0) {
      return undefined
    }
    return this.data.snapshots[0]
  }

  getNearestBefore(timestamp: string): AccountSnapshot | undefined {
    const targetTime = new Date(timestamp).getTime()
    return this.data.snapshots.find(
      s => new Date(s.timestamp).getTime() <= targetTime
    )
  }

  getAll(): AccountSnapshot[] {
    return [...this.data.snapshots]
  }

  getPaginated(page: number, pageSize: number): { items: AccountSnapshot[]; total: number } {
    const sorted = [...this.data.snapshots].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const start = (page - 1) * pageSize
    const items = sorted.slice(start, start + pageSize)
    return { items, total: sorted.length }
  }

  getById(id: string): AccountSnapshot | undefined {
    return this.data.snapshots.find(s => s.id === id)
  }
}
