import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { promisify } from 'util'
import { AccountEvent, EventType } from '../../shared/types.js'
import { readJsonFile, writeJsonFile, fileExists, DATA_DIR } from '../data/index.js'

const gunzip = promisify(zlib.gunzip)

interface EventStoreData {
  events: AccountEvent[]
  lastVersion: number
}

interface ArchiveIndexEntry {
  id: string
  createdAt: string
  fromVersion: number
  toVersion: number
  eventCount: number
  snapshotId: string
  compressedSize: number
  originalSize: number
}

const EVENTS_FILE = 'events.json'
const ARCHIVE_INDEX_FILE = 'archive_index.json'

export class EventStore {
  private static instance: EventStore
  private data: EventStoreData

  private constructor() {
    this.data = this.load()
  }

  static getInstance(): EventStore {
    if (!EventStore.instance) {
      EventStore.instance = new EventStore()
    }
    return EventStore.instance
  }

  private load(): EventStoreData {
    if (!fileExists(EVENTS_FILE)) {
      return { events: [], lastVersion: 0 }
    }
    const data = readJsonFile<EventStoreData>(EVENTS_FILE)
    if (!data.events) {
      return { events: [], lastVersion: 0 }
    }
    return data
  }

  private save(): void {
    writeJsonFile(EVENTS_FILE, this.data)
  }

  append(
    type: EventType,
    amount: number,
    businessNo: string,
    operator: string,
    description?: string,
    relatedEventId?: string,
    metadata?: Record<string, any>
  ): AccountEvent {
    const version = this.data.lastVersion + 1
    const event: AccountEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version,
      type,
      amount,
      occurredAt: new Date().toISOString(),
      businessNo,
      operator,
      description,
      relatedEventId,
      metadata
    }

    this.data.events.push(event)
    this.data.lastVersion = version
    this.save()

    return event
  }

  private async loadArchiveIndex(): Promise<ArchiveIndexEntry[]> {
    try {
      const data = await readJsonFile(ARCHIVE_INDEX_FILE)
      if (!data || !Array.isArray(data.archives)) return []
      return data.archives
    } catch (e) {
      return []
    }
  }

  private async restoreArchiveDirectly(archiveId: string): Promise<AccountEvent[]> {
    const filePath = path.join(DATA_DIR, `${archiveId}.json.gz`)
    if (!await fileExists(`${archiveId}.json.gz`)) return []
    
    try {
      const compressed = fs.readFileSync(filePath)
      const decompressed = await gunzip(compressed)
      const json = JSON.parse(decompressed.toString('utf-8'))
      if (!json || !Array.isArray(json.events)) return []
      return json.events
    } catch (e) {
      console.error(`Failed to restore archive ${archiveId}:`, e)
      return []
    }
  }

  async getAllEventsIncludingArchived(): Promise<AccountEvent[]> {
    const allEvents = [...this.data.events]
    const archives = await this.loadArchiveIndex()
    
    for (const archive of archives) {
      try {
        const archivedEvents = await this.restoreArchiveDirectly(archive.id)
        allEvents.push(...archivedEvents)
      } catch (e) {
        console.error(`Failed to load archive ${archive.id}:`, e)
      }
    }
    
    return allEvents.sort((a, b) => a.version - b.version)
  }

  getEvents(fromVersion: number = 1, toVersion?: number): AccountEvent[] {
    const events = this.data.events.filter(e => e.version >= fromVersion)
    if (toVersion !== undefined) {
      return events.filter(e => e.version <= toVersion)
    }
    return events
  }

  private needsArchivedEvents(fromVersion: number): boolean {
    if (this.data.events.length === 0) {
      return true
    }
    const activeMinVersion = Math.min(...this.data.events.map(e => e.version))
    return fromVersion < activeMinVersion
  }

  async getEventsAsync(fromVersion: number = 1, toVersion?: number): Promise<AccountEvent[]> {
    if (!this.needsArchivedEvents(fromVersion)) {
      return this.getEvents(fromVersion, toVersion)
    }
    
    const allEvents = await this.getAllEventsIncludingArchived()
    const filtered = allEvents.filter(e => e.version >= fromVersion)
    if (toVersion !== undefined) {
      return filtered.filter(e => e.version <= toVersion)
    }
    return filtered
  }

  getEventsBefore(timestamp: string, fromVersion: number = 1): AccountEvent[] {
    return this.data.events.filter(
      e => e.version >= fromVersion && e.occurredAt <= timestamp
    )
  }

  async getEventsBeforeAsync(timestamp: string, fromVersion: number = 1): Promise<AccountEvent[]> {
    if (!this.needsArchivedEvents(fromVersion)) {
      return this.getEventsBefore(timestamp, fromVersion)
    }
    
    const allEvents = await this.getAllEventsIncludingArchived()
    return allEvents.filter(
      e => e.version >= fromVersion && e.occurredAt <= timestamp
    )
  }

  getEventById(id: string): AccountEvent | undefined {
    return this.data.events.find(e => e.id === id)
  }

  getEventsByType(type: EventType): AccountEvent[] {
    return this.data.events.filter(e => e.type === type)
  }

  getLastVersion(): number {
    return this.data.lastVersion
  }

  getEventCount(): number {
    return this.data.events.length
  }

  getEventsByDateRange(startDate: string, endDate: string): AccountEvent[] {
    return this.data.events.filter(
      e => e.occurredAt >= startDate && e.occurredAt <= endDate
    )
  }

  getEventsPaginated(
    page: number,
    pageSize: number,
    type?: EventType,
    startDate?: string,
    endDate?: string
  ): { items: AccountEvent[]; total: number } {
    let filtered = [...this.data.events]

    if (type) {
      filtered = filtered.filter(e => e.type === type)
    }
    if (startDate) {
      filtered = filtered.filter(e => e.occurredAt >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(e => e.occurredAt <= endDate)
    }

    const sorted = filtered.sort((a, b) => 
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )

    const start = (page - 1) * pageSize
    const items = sorted.slice(start, start + pageSize)

    return { items, total: sorted.length }
  }

  replaceEvents(events: AccountEvent[]): void {
    this.data.events = events
    this.data.lastVersion = events.length > 0 
      ? Math.max(...events.map(e => e.version)) 
      : 0
    this.save()
  }

  getAllEvents(): AccountEvent[] {
    return [...this.data.events]
  }
}
