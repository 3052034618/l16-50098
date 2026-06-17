import React, { useState, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { EventType, EventTypeLabels } from '../../shared/types'
import { useAccountStore } from '../store/useAccountStore'
import { generateBusinessNo } from '../lib/format'

interface OperationModalProps {
  isOpen: boolean
  onClose: () => void
  operationType: EventType.RECHARGE | EventType.CONSUME | EventType.REFUND | EventType.FREEZE | EventType.UNFREEZE
}

export const OperationModal: React.FC<OperationModalProps> = ({
  isOpen,
  onClose,
  operationType
}) => {
  const { events } = useAccountStore()
  const [formData, setFormData] = useState({
    amount: '',
    businessNo: generateBusinessNo(),
    operator: 'admin',
    description: '',
    relatedEventId: ''
  })

  const recharge = useAccountStore(state => state.recharge)
  const consume = useAccountStore(state => state.consume)
  const refund = useAccountStore(state => state.refund)
  const freeze = useAccountStore(state => state.freeze)
  const unfreeze = useAccountStore(state => state.unfreeze)
  const loading = useAccountStore(state => state.loading)
  const error = useAccountStore(state => state.error)
  const successMessage = useAccountStore(state => state.successMessage)
  const clearMessages = useAccountStore(state => state.clearMessages)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: '',
        businessNo: generateBusinessNo(),
        operator: 'admin',
        description: '',
        relatedEventId: ''
      })
      clearMessages()
    }
  }, [isOpen, clearMessages])

  useEffect(() => {
    if (successMessage && !loading) {
      const timer = setTimeout(() => {
        onClose()
        clearMessages()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, loading, onClose, clearMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      return
    }

    const requestData = {
      amount,
      businessNo: formData.businessNo,
      operator: formData.operator,
      description: formData.description || undefined,
      relatedEventId: formData.relatedEventId || undefined
    }

    let success = false
    switch (operationType) {
      case EventType.RECHARGE:
        success = await recharge(requestData)
        break
      case EventType.CONSUME:
        success = await consume(requestData)
        break
      case EventType.REFUND:
        success = await refund(requestData)
        break
      case EventType.FREEZE:
        success = await freeze(requestData)
        break
      case EventType.UNFREEZE:
        success = await unfreeze(requestData)
        break
    }
  }

  const consumeEvents = events.filter(e => e.type === EventType.CONSUME)

  if (!isOpen) return null

  const titleMap = {
    [EventType.RECHARGE]: '账户充值',
    [EventType.CONSUME]: '账户消费',
    [EventType.REFUND]: '账户退款',
    [EventType.FREEZE]: '冻结账户',
    [EventType.UNFREEZE]: '解冻账户'
  }

  const buttonColorMap = {
    [EventType.RECHARGE]: 'bg-emerald-600 hover:bg-emerald-700',
    [EventType.CONSUME]: 'bg-red-600 hover:bg-red-700',
    [EventType.REFUND]: 'bg-blue-600 hover:bg-blue-700',
    [EventType.FREEZE]: 'bg-amber-600 hover:bg-amber-700',
    [EventType.UNFREEZE]: 'bg-cyan-600 hover:bg-cyan-700'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            {titleMap[operationType]}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              金额 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="请输入金额"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              业务单据号
            </label>
            <input
              type="text"
              value={formData.businessNo}
              onChange={(e) => setFormData(prev => ({ ...prev, businessNo: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50"
              placeholder="自动生成"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              操作人
            </label>
            <input
              type="text"
              value={formData.operator}
              onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="操作人"
            />
          </div>

          {operationType === EventType.REFUND && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关联消费事件 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.relatedEventId}
                onChange={(e) => setFormData(prev => ({ ...prev, relatedEventId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                required
              >
                <option value="">请选择关联的消费事件</option>
                {consumeEvents.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.businessNo} - ¥{event.amount.toFixed(2)} - {new Date(event.occurredAt).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
              rows={3}
              placeholder="请输入备注信息"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 ${buttonColorMap[operationType]} text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]`}
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                确认{EventTypeLabels[operationType]}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
