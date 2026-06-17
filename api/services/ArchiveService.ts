import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { promisify } from 'util'
import { AccountEvent, AccountSnapshot } from '../../shared/types.js'
import { EventStore } from '../store/EventStore.js'
import { SnapshotStore } from '../store/SnapshotStore.js'
import { DATA_DIR, listFiles, readJsonFile, writeJsonFile } from '../data/index.js'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

export interface ArchiveInfo {
  id: string
  createdAt: string
  fromVersion: number
  toVersion: number
  eventCount: number
  snapshotId: string
  compressedSize: number
  originalSize: number
}

export class ArchiveService {
  private static instance: ArchiveService
  private eventStore: EventStore
  private snapshotStore: SnapshotStore

  private constructor() {
    this.eventStore = EventStore.getInstance()
    this.snapshotStore = SnapshotStore.getInstance()
  }

  static getInstance(): ArchiveService {
    if (!ArchiveService.instance) {
      ArchiveService.instance = new ArchiveService()
    }
    return ArchiveService.instance
  }

  async archiveEventsBeforeSnapshot(snapshot: AccountSnapshot): Promise<ArchiveInfo> {
    const events = this.eventStore.getEvents(1, snapshot.lastEventVersion)
    
    if (events.length === 0) {
      throw new Error('没有可归档的事件')
    }

    const archiveId = `archive_${Date.now()}_${snapshot.id}`
    const archiveData = {
      snapshotId: snapshot.id,
      fromVersion: 1,
      toVersion: snapshot.lastEventVersion,
      eventCount: events.length,
      events,
      archivedAt: new Date().toISOString()
    }

    const jsonData = JSON.stringify(archiveData)
    const originalSize = Buffer.byteLength(jsonData)
    
    const compressed = await gzip(jsonData)
    const compressedSize = compressed.length

    const archiveFileName = `${archiveId}.json.gz`
    const archiveFilePath = path.join(DATA_DIR, archiveFileName)
    fs.writeFileSync(archiveFilePath, compressed)

    const remainingEvents = this.eventStore.getAllEvents().filter(
      e => e.version > snapshot.lastEventVersion
    )
    this.eventStore.replaceEvents(remainingEvents)

    const indexEntry: ArchiveInfo = {
      id: archiveId,
      createdAt: new Date().toISOString(),
      fromVersion: 1,
      toVersion: snapshot.lastEventVersion,
      eventCount: events.length,
      snapshotId: snapshot.id,
      compressedSize,
      originalSize
    }

    this.updateArchiveIndex(indexEntry)

    return indexEntry
  }

  async createArchive(): Promise<ArchiveInfo | null> {
    const latestSnapshot = this.snapshotStore.getLatest()
    if (!latestSnapshot) {
      return null
    }

    const existingArchives = this.getArchiveIndex()
    const alreadyArchived = existingArchives.some(
      a => a.snapshotId === latestSnapshot.id
    )

    if (alreadyArchived) {
      return null
    }

    return this.archiveEventsBeforeSnapshot(latestSnapshot)
  }

  async restoreArchive(archiveId: string): Promise<AccountEvent[]> {
    const archiveFileName = `${archiveId}.json.gz`
    const archiveFilePath = path.join(DATA_DIR, archiveFileName)

    if (!fs.existsSync(archiveFilePath)) {
      throw new Error('归档文件不存在')
    }

    const compressedData = fs.readFileSync(archiveFilePath)
    const decompressed = await gunzip(compressedData)
    const archiveData = JSON.parse(decompressed.toString('utf-8'))

    return archiveData.events
  }

  getArchiveIndex(): ArchiveInfo[] {
    try {
      const data = readJsonFile<{ archives: ArchiveInfo[] }>('archive_index.json')
      return data.archives || []
    } catch {
      return []
    }
  }

  private updateArchiveIndex(entry: ArchiveInfo): void {
    const archives = this.getArchiveIndex()
    archives.push(entry)
    writeJsonFile('archive_index.json', { archives })
  }

  listArchives(): ArchiveInfo[] {
    return this.getArchiveIndex().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  getArchiveById(id: string): ArchiveInfo | undefined {
    return this.getArchiveIndex().find(a => a.id === id)
  }

  async queryArchivedEvents(
    archiveId: string,
    type?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AccountEvent[]> {
    const events = await this.restoreArchive(archiveId)
    
    let filtered = events
    if (type) {
      filtered = filtered.filter(e => e.type === type)
    }
    if (startDate) {
      filtered = filtered.filter(e => e.occurredAt >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(e => e.occurredAt <= endDate)
    }

    return filtered
  }

  cleanupOldArchives(keepCount: number = 5): ArchiveInfo[] {
    const archives = this.getArchiveIndex()
    if (archives.length <= keepCount) {
      return []
    }

    const sorted = archives.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    const toDelete = sorted.slice(keepCount)
    const remaining = sorted.slice(0, keepCount)

    for (const archive of toDelete) {
      const fileName = `${archive.id}.json.gz`
      const filePath = path.join(DATA_DIR, fileName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    writeJsonFile('archive_index.json', { archives: remaining })

    return toDelete
  }

  getStorageStats(): {
    totalArchives: number
    totalOriginalSize: number
    totalCompressedSize: number
    compressionRatio: number
    archivedEventCount: number
  } {
    const archives = this.getArchiveIndex()
    
    const totalOriginalSize = archives.reduce((sum, a) => sum + a.originalSize, 0)
    const totalCompressedSize = archives.reduce((sum, a) => sum + a.compressedSize, 0)
    const archivedEventCount = archives.reduce((sum, a) => sum + a.eventCount, 0)

    return {
      totalArchives: archives.length,
      totalOriginalSize,
      totalCompressedSize,
      compressionRatio: totalOriginalSize > 0 
        ? (totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100 
        : 0,
      archivedEventCount
    }
  }
}
