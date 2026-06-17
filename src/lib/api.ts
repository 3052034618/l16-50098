import {
  AccountEvent,
  AccountSnapshot,
  ApiResponse,
  BalanceResponse,
  EventListResponse,
  EventType,
  OperationRequest
} from '../../shared/types'

const API_BASE = '/api'

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  return response.json()
}

export const api = {
  getBalance: () => request<BalanceResponse>('/account/balance'),
  
  getBalanceAt: (timestamp: string) => 
    request<BalanceResponse>(`/account/balance/${encodeURIComponent(timestamp)}`),
  
  recharge: (data: OperationRequest) => 
    request<AccountEvent>('/account/recharge', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  consume: (data: OperationRequest) => 
    request<AccountEvent>('/account/consume', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  refund: (data: OperationRequest) => 
    request<AccountEvent>('/account/refund', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  freeze: (data: OperationRequest) => 
    request<AccountEvent>('/account/freeze', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  unfreeze: (data: OperationRequest) => 
    request<AccountEvent>('/account/unfreeze', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  compensate: (opRequest: OperationRequest, compensateType: EventType) => 
    request<AccountEvent>('/account/compensate', {
      method: 'POST',
      body: JSON.stringify({ request: opRequest, compensateType })
    }),

  getEvents: (params?: {
    page?: number
    pageSize?: number
    type?: EventType
    startDate?: string
    endDate?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    if (params?.type) searchParams.set('type', params.type)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    
    return request<EventListResponse>(`/events?${searchParams.toString()}`)
  },

  getEvent: (id: string) => request<AccountEvent>(`/events/${id}`),
  
  getEventsStats: () => request<{
    totalEvents: number
    lastVersion: number
    storageStats: {
      totalArchives: number
      totalOriginalSize: number
      totalCompressedSize: number
      compressionRatio: number
      archivedEventCount: number
    }
  }>('/events/stats'),

  getSnapshots: (params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    
    return request<{
      items: AccountSnapshot[]
      total: number
      page: number
      pageSize: number
    }>(`/snapshots?${searchParams.toString()}`)
  },

  getLatestSnapshot: () => request<AccountSnapshot>('/snapshots/latest'),
  
  getSnapshot: (id: string) => request<AccountSnapshot>(`/snapshots/${id}`),
  
  getNearestSnapshot: (timestamp: string) => 
    request<AccountSnapshot>(`/snapshots/nearest/${encodeURIComponent(timestamp)}`),
  
  createSnapshot: () => 
    request<AccountSnapshot>('/snapshots', { method: 'POST' }),
  
  createArchive: () => 
    request<{
      id: string
      createdAt: string
      fromVersion: number
      toVersion: number
      eventCount: number
      snapshotId: string
      compressedSize: number
      originalSize: number
    }>('/snapshots/archive', { method: 'POST' }),
  
  getArchives: () => 
    request<Array<{
      id: string
      createdAt: string
      fromVersion: number
      toVersion: number
      eventCount: number
      snapshotId: string
      compressedSize: number
      originalSize: number
    }>>('/snapshots/archive/list'),
  
  getArchiveStats: () => 
    request<{
      totalArchives: number
      totalOriginalSize: number
      totalCompressedSize: number
      compressionRatio: number
      archivedEventCount: number
    }>('/snapshots/archive/stats')
}
