import { create } from 'zustand'
import {
  AccountEvent,
  AccountSnapshot,
  BalanceResponse,
  EventType,
  OperationRequest,
  EventListResponse
} from '../../shared/types'
import { api } from '../lib/api'

interface AccountState {
  balance: BalanceResponse | null
  events: AccountEvent[]
  snapshots: AccountSnapshot[]
  totalEvents: number
  loading: boolean
  error: string | null
  successMessage: string | null
  
  fetchBalance: () => Promise<void>
  fetchBalanceAt: (timestamp: string) => Promise<BalanceResponse | null>
  fetchEvents: (params?: {
    page?: number
    pageSize?: number
    type?: EventType
    startDate?: string
    endDate?: string
  }) => Promise<void>
  fetchSnapshots: () => Promise<void>
  
  recharge: (data: OperationRequest) => Promise<boolean>
  consume: (data: OperationRequest) => Promise<boolean>
  refund: (data: OperationRequest) => Promise<boolean>
  freeze: (data: OperationRequest) => Promise<boolean>
  unfreeze: (data: OperationRequest) => Promise<boolean>
  compensate: (request: OperationRequest, compensateType: EventType) => Promise<boolean>
  
  createSnapshot: () => Promise<boolean>
  createArchive: () => Promise<boolean>
  
  clearMessages: () => void
}

export const useAccountStore = create<AccountState>((set, get) => ({
  balance: null,
  events: [],
  snapshots: [],
  totalEvents: 0,
  loading: false,
  error: null,
  successMessage: null,

  fetchBalance: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getBalance()
      if (response.success && response.data) {
        set({ balance: response.data, loading: false })
      } else {
        set({ error: response.error || '获取余额失败', loading: false })
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
    }
  },

  fetchBalanceAt: async (timestamp: string) => {
    set({ loading: true, error: null })
    try {
      const response = await api.getBalanceAt(timestamp)
      set({ loading: false })
      if (response.success && response.data) {
        return response.data
      } else {
        set({ error: response.error || '查询失败' })
        return null
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return null
    }
  },

  fetchEvents: async (params) => {
    set({ loading: true, error: null })
    try {
      const response = await api.getEvents(params)
      if (response.success && response.data) {
        set({ 
          events: response.data.items, 
          totalEvents: response.data.total,
          loading: false 
        })
      } else {
        set({ error: response.error || '获取事件列表失败', loading: false })
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
    }
  },

  fetchSnapshots: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getSnapshots()
      if (response.success && response.data) {
        set({ snapshots: response.data.items, loading: false })
      } else {
        set({ error: response.error || '获取快照列表失败', loading: false })
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
    }
  },

  recharge: async (data) => {
    set({ loading: true, error: null, successMessage: null })
    try {
      const response = await api.recharge(data)
      if (response.success) {
        set({ successMessage: response.message || '充值成功', loading: false })
        get().fetchBalance()
        get().fetchEvents()
        return true
      } else {
        set({ error: response.error || '充值失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return false
    }
  },

  consume: async (data) => {
    set({ loading: true, error: null, successMessage: null })
    try {
      const response = await api.consume(data)
      if (response.success) {
        set({ successMessage: response.message || '消费成功', loading: false })
        get().fetchBalance()
        get().fetchEvents()
        return true
      } else {
        set({ error: response.error || '消费失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return false
    }
  },

  refund: async (data) => {
    set({ loading: true, error: null, successMessage: null })
    try {
      const response = await api.refund(data)
      if (response.success) {
        set({ successMessage: response.message || '退款成功', loading: false })
        get().fetchBalance()
        get().fetchEvents()
        return true
      } else {
        set({ error: response.error || '退款失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return false
    }
  },

  freeze: async (data) => {
    set({ loading: true, error: null, successMessage: null })
    try {
      const response = await api.freeze(data)
      if (response.success) {
        set({ successMessage: response.message || '冻结成功', loading: false })
        get().fetchBalance()
        get().fetchEvents()
        return true
      } else {
        set({ error: response.error || '冻结失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return false
    }
  },

  unfreeze: async (data) => {
    set({ loading: true, error: null, successMessage: null })
    try {
      const response = await api.unfreeze(data)
      if (response.success) {
        set({ successMessage: response.message || '解冻成功', loading: false })
        get().fetchBalance()
        get().fetchEvents()
        return true
      } else {
        set({ error: response.error || '解冻失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return false
    }
  },

  compensate: async (request, compensateType) => {
    set({ loading: true, error: null, successMessage: null })
    try {
      const response = await api.compensate(request, compensateType)
      if (response.success) {
        set({ successMessage: response.message || '补偿成功', loading: false })
        get().fetchBalance()
        get().fetchEvents()
        return true
      } else {
        set({ error: response.error || '补偿失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return false
    }
  },

  createSnapshot: async () => {
    set({ loading: true, error: null, successMessage: null })
    try {
      const response = await api.createSnapshot()
      if (response.success) {
        set({ successMessage: response.message || '快照创建成功', loading: false })
        get().fetchSnapshots()
        return true
      } else {
        set({ error: response.error || '创建快照失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return false
    }
  },

  createArchive: async () => {
    set({ loading: true, error: null, successMessage: null })
    try {
      const response = await api.createArchive()
      if (response.success) {
        set({ successMessage: response.message || '归档成功', loading: false })
        get().fetchSnapshots()
        get().fetchEvents()
        return true
      } else {
        set({ error: response.error || '归档失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '网络错误', loading: false })
      return false
    }
  },

  clearMessages: () => {
    set({ error: null, successMessage: null })
  }
}))
