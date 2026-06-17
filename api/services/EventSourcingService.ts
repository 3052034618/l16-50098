import { AccountEvent, AccountState, EventType, BalanceResponse, AccountSnapshot } from '../../shared/types.js'
import { EventStore } from '../store/EventStore.js'
import { SnapshotStore } from '../store/SnapshotStore.js'

export class EventSourcingService {
  private static instance: EventSourcingService
  private eventStore: EventStore
  private snapshotStore: SnapshotStore

  private constructor() {
    this.eventStore = EventStore.getInstance()
    this.snapshotStore = SnapshotStore.getInstance()
  }

  static getInstance(): EventSourcingService {
    if (!EventSourcingService.instance) {
      EventSourcingService.instance = new EventSourcingService()
    }
    return EventSourcingService.instance
  }

  getInitialState(): AccountState {
    return {
      totalBalance: 0,
      availableBalance: 0,
      frozenBalance: 0,
      isFrozen: false,
      lastEventVersion: 0
    }
  }

  applyEvent(state: AccountState, event: AccountEvent): AccountState {
    const newState = { ...state, lastEventVersion: event.version }

    switch (event.type) {
      case EventType.RECHARGE:
        newState.totalBalance += event.amount
        newState.availableBalance += event.amount
        break

      case EventType.CONSUME:
        newState.totalBalance -= event.amount
        newState.availableBalance -= event.amount
        break

      case EventType.REFUND:
        newState.totalBalance += event.amount
        newState.availableBalance += event.amount
        break

      case EventType.FREEZE:
        newState.frozenBalance += event.amount
        newState.availableBalance -= event.amount
        newState.isFrozen = newState.frozenBalance > 0
        break

      case EventType.UNFREEZE:
        newState.frozenBalance -= event.amount
        newState.availableBalance += event.amount
        newState.isFrozen = newState.frozenBalance > 0
        break

      case EventType.COMPENSATE:
        if (event.metadata?.compensateType) {
          const compensateType = event.metadata.compensateType as EventType
          if (compensateType === EventType.RECHARGE || compensateType === EventType.REFUND) {
            newState.totalBalance -= event.amount
            newState.availableBalance -= event.amount
          } else if (compensateType === EventType.CONSUME) {
            newState.totalBalance += event.amount
            newState.availableBalance += event.amount
          }
        }
        break
    }

    return newState
  }

  replayEvents(events: AccountEvent[], initialState?: AccountState): AccountState {
    let state = initialState || this.getInitialState()
    for (const event of events) {
      state = this.applyEvent(state, event)
    }
    return state
  }

  async calculateBalance(timestamp?: string): Promise<BalanceResponse> {
    const latestSnapshot = timestamp 
      ? this.snapshotStore.getNearestBefore(timestamp)
      : this.snapshotStore.getLatest()

    let initialState: AccountState
    let fromVersion: number
    let calculatedFrom: 'snapshot' | 'beginning'

    if (latestSnapshot) {
      initialState = {
        totalBalance: latestSnapshot.totalBalance,
        availableBalance: latestSnapshot.availableBalance,
        frozenBalance: latestSnapshot.frozenBalance,
        isFrozen: latestSnapshot.isFrozen,
        lastEventVersion: latestSnapshot.lastEventVersion
      }
      fromVersion = latestSnapshot.lastEventVersion + 1
      calculatedFrom = 'snapshot'
    } else {
      initialState = this.getInitialState()
      fromVersion = 1
      calculatedFrom = 'beginning'
    }

    const events = timestamp
      ? await this.eventStore.getEventsBeforeAsync(timestamp, fromVersion)
      : await this.eventStore.getEventsAsync(fromVersion)

    const finalState = this.replayEvents(events, initialState)

    return {
      totalBalance: finalState.totalBalance,
      availableBalance: finalState.availableBalance,
      frozenBalance: finalState.frozenBalance,
      isFrozen: finalState.isFrozen,
      timestamp: timestamp || new Date().toISOString(),
      calculatedFrom,
      eventReplayed: events.length
    }
  }

  async getAccountState(): Promise<AccountState> {
    const balance = await this.calculateBalance()
    return {
      totalBalance: balance.totalBalance,
      availableBalance: balance.availableBalance,
      frozenBalance: balance.frozenBalance,
      isFrozen: balance.isFrozen,
      lastEventVersion: this.eventStore.getLastVersion()
    }
  }

  async canConsume(amount: number): Promise<boolean> {
    const state = await this.getAccountState()
    return !state.isFrozen && state.availableBalance >= amount
  }

  async canFreeze(amount: number): Promise<boolean> {
    const state = await this.getAccountState()
    return state.availableBalance >= amount
  }

  async canUnfreeze(amount: number): Promise<boolean> {
    const state = await this.getAccountState()
    return state.frozenBalance >= amount
  }

  async createSnapshot(): Promise<AccountSnapshot> {
    const state = await this.getAccountState()
    const archivedCount = await this.getArchivedEventCount()
    const snapshot: AccountSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      totalBalance: state.totalBalance,
      availableBalance: state.availableBalance,
      frozenBalance: state.frozenBalance,
      isFrozen: state.isFrozen,
      lastEventVersion: state.lastEventVersion,
      eventCount: this.eventStore.getEventCount() + archivedCount
    }

    this.snapshotStore.save(snapshot)
    return snapshot
  }

  private async getArchivedEventCount(): Promise<number> {
    try {
      const module = await import('./ArchiveService.js')
      const archiveService = module.ArchiveService.getInstance()
      const stats = archiveService.getStorageStats()
      return stats?.archivedEventCount || 0
    } catch {
      return 0
    }
  }

  async shouldCreateSnapshot(threshold: number = 100): Promise<boolean> {
    const latestSnapshot = this.snapshotStore.getLatest()
    const archivedCount = await this.getArchivedEventCount()
    const currentEventCount = this.eventStore.getEventCount() + archivedCount
    
    if (!latestSnapshot) {
      return currentEventCount >= threshold
    }
    
    return (currentEventCount - latestSnapshot.eventCount) >= threshold
  }
}
