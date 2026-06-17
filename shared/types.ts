export enum EventType {
  RECHARGE = 'recharge',
  CONSUME = 'consume',
  REFUND = 'refund',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze',
  COMPENSATE = 'compensate'
}

export interface AccountEvent {
  id: string
  version: number
  type: EventType
  amount: number
  occurredAt: string
  businessNo: string
  operator: string
  description?: string
  relatedEventId?: string
  metadata?: Record<string, any>
}

export interface AccountSnapshot {
  id: string
  timestamp: string
  totalBalance: number
  availableBalance: number
  frozenBalance: number
  isFrozen: boolean
  lastEventVersion: number
  eventCount: number
}

export interface AccountState {
  totalBalance: number
  availableBalance: number
  frozenBalance: number
  isFrozen: boolean
  lastEventVersion: number
}

export interface OperationRequest {
  amount: number
  businessNo: string
  operator: string
  description?: string
  relatedEventId?: string
}

export interface BalanceResponse {
  totalBalance: number
  availableBalance: number
  frozenBalance: number
  isFrozen: boolean
  timestamp: string
  calculatedFrom: 'snapshot' | 'beginning'
  eventReplayed: number
}

export interface EventListResponse {
  items: AccountEvent[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const EventTypeLabels: Record<EventType, string> = {
  [EventType.RECHARGE]: '充值',
  [EventType.CONSUME]: '消费',
  [EventType.REFUND]: '退款',
  [EventType.FREEZE]: '冻结',
  [EventType.UNFREEZE]: '解冻',
  [EventType.COMPENSATE]: '补偿'
}

export const EventTypeColors: Record<EventType, string> = {
  [EventType.RECHARGE]: 'text-emerald-600 bg-emerald-50',
  [EventType.CONSUME]: 'text-red-600 bg-red-50',
  [EventType.REFUND]: 'text-blue-600 bg-blue-50',
  [EventType.FREEZE]: 'text-amber-600 bg-amber-50',
  [EventType.UNFREEZE]: 'text-cyan-600 bg-cyan-50',
  [EventType.COMPENSATE]: 'text-purple-600 bg-purple-50'
}
