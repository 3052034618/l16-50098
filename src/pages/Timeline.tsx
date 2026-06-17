import React, { useEffect, useState } from 'react'
import {
  History,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { EventType, AccountEvent, EventTypeLabels } from '../../shared/types'
import { useAccountStore } from '../store/useAccountStore'
import { EventCard } from '../components/EventCard'
import { EventDetailModal } from '../components/EventDetailModal'

export const Timeline: React.FC = () => {
  const { events, totalEvents, fetchEvents } = useAccountStore()
  const [selectedEvent, setSelectedEvent] = useState<AccountEvent | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [filterType, setFilterType] = useState<EventType | 'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loading = useAccountStore(state => state.loading)
  const error = useAccountStore(state => state.error)
  const clearMessages = useAccountStore(state => state.clearMessages)

  useEffect(() => {
    loadEvents()
  }, [currentPage, filterType, startDate, endDate])

  const loadEvents = () => {
    fetchEvents({
      page: currentPage,
      pageSize,
      type: filterType === 'all' ? undefined : filterType,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    })
  }

  const handleEventClick = (event: AccountEvent) => {
    setSelectedEvent(event)
    setDetailModalOpen(true)
  }

  const totalPages = Math.ceil(totalEvents / pageSize)

  const filterOptions: { value: EventType | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: EventType.RECHARGE, label: '充值' },
    { value: EventType.CONSUME, label: '消费' },
    { value: EventType.REFUND, label: '退款' },
    { value: EventType.FREEZE, label: '冻结' },
    { value: EventType.UNFREEZE, label: '解冻' },
    { value: EventType.COMPENSATE, label: '补偿' }
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearMessages} className="text-red-400 hover:text-red-600">
            关闭
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <History className="w-7 h-7 text-blue-600" />
            事务时间线
          </h1>
          <button
            onClick={loadEvents}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">事件类型:</span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilterType(option.value)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterType === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">时间范围:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="开始日期"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="结束日期"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setCurrentPage(1)
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                清除
              </button>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          共 <span className="font-semibold text-gray-900">{totalEvents}</span> 条记录
        </div>

        {loading && events.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="relative">
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => handleEventClick(event)}
                isFirst={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>暂无符合条件的事件记录</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <EventDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedEvent(null)
        }}
        event={selectedEvent}
      />
    </div>
  )
}
