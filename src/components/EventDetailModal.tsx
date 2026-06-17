import React from 'react'
import { X, Copy, CheckCircle } from 'lucide-react'
import { AccountEvent, EventTypeLabels, EventTypeColors } from '../../shared/types'
import { formatMoney, formatDate } from '../lib/format'
import { useState } from 'react'

interface EventDetailModalProps {
  isOpen: boolean
  onClose: () => void
  event: AccountEvent | null
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!isOpen || !event) return null

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const colorClass = EventTypeColors[event.type]

  const infoItems = [
    { label: '事件ID', value: event.id, copyable: true, field: 'id' },
    { label: '事件版本', value: `v${event.version}`, copyable: false },
    { label: '事件类型', value: EventTypeLabels[event.type], copyable: false },
    { label: '金额', value: formatMoney(event.amount), copyable: false },
    { label: '发生时间', value: formatDate(event.occurredAt), copyable: true, field: 'occurredAt' },
    { label: '业务单据号', value: event.businessNo, copyable: true, field: 'businessNo' },
    { label: '操作人', value: event.operator, copyable: false },
  ]

  if (event.relatedEventId) {
    infoItems.push({ label: '关联事件ID', value: event.relatedEventId, copyable: true, field: 'relatedEventId' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass.split(' ')[1]}`}>
              <span className={colorClass.split(' ')[0]}>
                <span className="font-bold text-lg">
                  {EventTypeLabels[event.type].charAt(0)}
                </span>
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                事件详情
              </h3>
              <p className="text-sm text-gray-500">
                {EventTypeLabels[event.type]} · v{event.version}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {infoItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-500 text-sm">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-mono text-sm">
                    {item.value}
                  </span>
                  {item.copyable && (
                    <button
                      onClick={() => copyToClipboard(item.value, item.field!)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="复制"
                    >
                      {copiedField === item.field ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {event.description && (
              <div className="mt-6">
                <span className="text-gray-500 text-sm block mb-2">备注</span>
                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 text-sm">
                  {event.description}
                </div>
              </div>
            )}

            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-6">
                <span className="text-gray-500 text-sm block mb-2">元数据</span>
                <div className="bg-gray-50 rounded-xl p-4">
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
