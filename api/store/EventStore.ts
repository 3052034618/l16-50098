import { AccountEvent, EventType } from '../../shared/types.js'
import { readJsonFile, writeJsonFile, fileExists } from '../data/index.js'

interface EventStoreData {
  events: AccountEvent[]
  lastVersion: number
}

const EVENTS_FILE = 'events.json'

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

  getEvents(fromVersion: number = 1, toVersion?: number): AccountEvent[] {
    const events = this.data.events.filter(e => e.version >= fromVersion)
    if (toVersion !== undefined) {
      return events.filter(e => e.version <= toVersion)
    }
    return events
  }

  getEventsBefore(timestamp: string, fromVersion: number = 1): AccountEvent[] {
    return this.data.events.filter(
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
