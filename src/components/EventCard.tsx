import React from 'react'
import { TrendingUp, TrendingDown, RefreshCw, Snowflake, Sun, ShieldAlert, ChevronRight } from 'lucide-react'
import { AccountEvent, EventType, EventTypeLabels, EventTypeColors } from '../../shared/types'
import { formatMoney, formatDate } from '../lib/format'

interface EventCardProps {
  event: AccountEvent
  onClick?: () => void
  isFirst?: boolean
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick, isFirst = false }) => {
  const getIcon = () => {
    switch (event.type) {
      case EventType.RECHARGE:
        return <TrendingUp className="w-5 h-5" />
      case EventType.CONSUME:
        return <TrendingDown className="w-5 h-5" />
      case EventType.REFUND:
        return <RefreshCw className="w-5 h-5" />
      case EventType.FREEZE:
        return <Snowflake className="w-5 h-5" />
      case EventType.UNFREEZE:
        return <Sun className="w-5 h-5" />
      case EventType.COMPENSATE:
        return <ShieldAlert className="w-5 h-5" />
    }
  }

  const getAmountPrefix = () => {
    switch (event.type) {
      case EventType.RECHARGE:
      case EventType.REFUND:
      case EventType.UNFREEZE:
        return '+'
      case EventType.CONSUME:
      case EventType.FREEZE:
      case EventType.COMPENSATE:
        return '-'
      default:
        return ''
    }
  }

  const colorClass = EventTypeColors[event.type]
  const amountColorClass = event.type === EventType.RECHARGE || event.type === EventType.REFUND || event.type === EventType.UNFREEZE
    ? 'text-emerald-600'
    : event.type === EventType.CONSUME
    ? 'text-red-600'
    : event.type === EventType.FREEZE
    ? 'text-amber-600'
    : event.type === EventType.COMPENSATE
    ? 'text-purple-600'
    : 'text-cyan-600'

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />
      
      <div className={`absolute left-0 top-2 w-4 h-4 rounded-full -translate-x-1/2 z-10 flex items-center justify-center ${colorClass.split(' ')[1]} border-2 border-white shadow-md ${isFirst ? 'ring-4 ring-blue-100 animate-pulse' : ''}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${colorClass.split(' ')[0]}`} />
      </div>

      <div 
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ml-2 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group ${isFirst ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${colorClass.split(' ')[1]} flex-shrink-0`}>
              <span className={colorClass.split(' ')[0]}>
                {getIcon()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">
                  {EventTypeLabels[event.type]}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  v{event.version}
                </span>
                {event.relatedEventId && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600">
                    关联事件
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {formatDate(event.occurredAt)}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <span className="text-gray-400">单据号:</span>
                  <span className="font-mono text-xs">{event.businessNo}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <span className="text-gray-400">操作人:</span>
                  <span>{event.operator}</span>
                </div>
              </div>
              {event.description && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  {event.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-lg font-bold ${amountColorClass}`}>
              {getAmountPrefix()}{formatMoney(event.amount)}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  )
}
