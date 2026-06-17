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
        if (newState.availableBalance === 0) {
          newState.isFrozen = true
        }
        break

      case EventType.UNFREEZE:
        newState.frozenBalance -= event.amount
        newState.availableBalance += event.amount
        if (newState.frozenBalance === 0 && newState.isFrozen) {
          newState.isFrozen = false
        }
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

  calculateBalance(timestamp?: string): BalanceResponse {
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
      ? this.eventStore.getEventsBefore(timestamp, fromVersion)
      : this.eventStore.getEvents(fromVersion)

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

  getAccountState(): AccountState {
    const balance = this.calculateBalance()
    return {
      totalBalance: balance.totalBalance,
      availableBalance: balance.availableBalance,
      frozenBalance: balance.frozenBalance,
      isFrozen: balance.isFrozen,
      lastEventVersion: this.eventStore.getLastVersion()
    }
  }

  canConsume(amount: number): boolean {
    const state = this.getAccountState()
    return !state.isFrozen && state.availableBalance >= amount
  }

  canFreeze(amount: number): boolean {
    const state = this.getAccountState()
    return state.availableBalance >= amount
  }

  canUnfreeze(amount: number): boolean {
    const state = this.getAccountState()
    return state.frozenBalance >= amount
  }

  createSnapshot(): AccountSnapshot {
    const state = this.getAccountState()
    const snapshot: AccountSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      totalBalance: state.totalBalance,
      availableBalance: state.availableBalance,
      frozenBalance: state.frozenBalance,
      isFrozen: state.isFrozen,
      lastEventVersion: state.lastEventVersion,
      eventCount: this.eventStore.getEventCount()
    }

    this.snapshotStore.save(snapshot)
    return snapshot
  }

  shouldCreateSnapshot(threshold: number = 100): boolean {
    const latestSnapshot = this.snapshotStore.getLatest()
    const currentEventCount = this.eventStore.getEventCount()
    
    if (!latestSnapshot) {
      return currentEventCount >= threshold
    }
    
    return (currentEventCount - latestSnapshot.eventCount) >= threshold
  }
}
