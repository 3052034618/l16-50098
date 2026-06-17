import React, { useEffect, useState } from 'react'
import {
  Wallet,
  CreditCard,
  Lock,
  Unlock,
  Plus,
  Minus,
  RefreshCw,
  Snowflake,
  Sun,
  Clock,
  Search,
  History,
  Database,
  HardDrive,
  ArrowRight
} from 'lucide-react'
import { EventType, BalanceResponse } from '../../shared/types'
import { useAccountStore } from '../store/useAccountStore'
import { OperationModal } from '../components/OperationModal'
import { formatMoney, formatDate } from '../lib/format'

type OperationType = EventType.RECHARGE | EventType.CONSUME | EventType.REFUND | EventType.FREEZE | EventType.UNFREEZE | null

export const Dashboard: React.FC = () => {
  const { balance, fetchBalance, fetchEvents, events } = useAccountStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [operationType, setOperationType] = useState<OperationType>(null)
  const [queryDate, setQueryDate] = useState('')
  const [queryTime, setQueryTime] = useState('')
  const [historicalBalance, setHistoricalBalance] = useState<BalanceResponse | null>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const fetchBalanceAt = useAccountStore(state => state.fetchBalanceAt)
  const createSnapshot = useAccountStore(state => state.createSnapshot)
  const createArchive = useAccountStore(state => state.createArchive)
  const loading = useAccountStore(state => state.loading)
  const error = useAccountStore(state => state.error)
  const successMessage = useAccountStore(state => state.successMessage)
  const clearMessages = useAccountStore(state => state.clearMessages)

  useEffect(() => {
    fetchBalance()
    fetchEvents({ pageSize: 5 })
  }, [fetchBalance, fetchEvents])

  const openModal = (type: OperationType) => {
    setOperationType(type)
    setModalOpen(true)
  }

  const handleHistoricalQuery = async () => {
    if (!queryDate || !queryTime) return
    
    setQueryLoading(true)
    const timestamp = `${queryDate}T${queryTime}:00.000Z`
    const result = await fetchBalanceAt(timestamp)
    setHistoricalBalance(result)
    setQueryLoading(false)
  }

  const quickActions = [
    {
      type: EventType.RECHARGE as const,
      label: '充值',
      icon: Plus,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      type: EventType.CONSUME as const,
      label: '消费',
      icon: Minus,
      color: 'bg-red-500 hover:bg-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      type: EventType.REFUND as const,
      label: '退款',
      icon: RefreshCw,
      color: 'bg-blue-500 hover:bg-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      type: EventType.FREEZE as const,
      label: '冻结',
      icon: Snowflake,
      color: 'bg-amber-500 hover:bg-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      type: EventType.UNFREEZE as const,
      label: '解冻',
      icon: Sun,
      color: 'bg-cyan-500 hover:bg-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600'
    }
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

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={clearMessages} className="text-green-400 hover:text-green-600">
            关闭
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-sm opacity-80">总余额</span>
          </div>
          <div className="text-3xl font-bold font-mono mb-2">
            {balance ? formatMoney(balance.totalBalance) : '¥0.00'}
          </div>
          <div className="text-sm opacity-70">
            {balance ? `截至 ${formatDate(balance.timestamp)}` : '加载中...'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">可用余额</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 font-mono mb-2">
            {balance ? formatMoney(balance.availableBalance) : '¥0.00'}
          </div>
          {balance && balance.calculatedFrom && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Database className="w-3 h-3" />
              从{balance.calculatedFrom === 'snapshot' ? '快照' : '初始状态'}计算，回放 {balance.eventReplayed} 个事件
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${balance?.isFrozen ? 'bg-amber-50' : 'bg-gray-50'}`}>
              {balance?.isFrozen ? (
                <Lock className="w-6 h-6 text-amber-600" />
              ) : (
                <Unlock className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <span className="text-sm text-gray-500">冻结余额</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 font-mono mb-2">
            {balance ? formatMoney(balance.frozenBalance) : '¥0.00'}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full inline-block ${balance?.isFrozen ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
            {balance?.isFrozen ? '账户冻结中' : '账户正常'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          快捷操作
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.type}
              onClick={() => openModal(action.type)}
              disabled={loading}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200 disabled:opacity-50"
            >
              <div className={`p-3 rounded-xl ${action.bgColor} group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-6 h-6 ${action.textColor}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            历史时间点查询
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择日期
                </label>
                <input
                  type="date"
                  value={queryDate}
                  onChange={(e) => setQueryDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择时间
                </label>
                <input
                  type="time"
                  value={queryTime}
                  onChange={(e) => setQueryTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleHistoricalQuery}
              disabled={!queryDate || !queryTime || queryLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {queryLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  查询该时间点余额
                </>
              )}
            </button>

            {historicalBalance && (
              <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div className="text-sm text-gray-600 mb-2">查询结果</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">总余额</div>
                    <div className="text-lg font-bold text-gray-900 font-mono">
                      {formatMoney(historicalBalance.totalBalance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">可用余额</div>
                    <div className="text-lg font-bold text-emerald-600 font-mono">
                      {formatMoney(historicalBalance.availableBalance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">冻结余额</div>
                    <div className="text-lg font-bold text-amber-600 font-mono">
                      {formatMoney(historicalBalance.frozenBalance)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  从{historicalBalance.calculatedFrom === 'snapshot' ? '快照' : '初始状态'}计算，回放 {historicalBalance.eventReplayed} 个事件
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            数据管理
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">创建快照</div>
                <div className="text-sm text-gray-500">保存当前账户状态，加速后续查询</div>
              </div>
              <button
                onClick={() => createSnapshot()}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4" />
                创建
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">归档历史事件</div>
                <div className="text-sm text-gray-500">压缩归档快照之前的事件，节省存储空间</div>
              </div>
              <button
                onClick={() => createArchive()}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                归档
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" />
            最近事务
          </h2>
          <button 
            onClick={() => window.location.href = '/timeline'}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {events.slice(0, 5).map((event, index) => (
            <div key={event.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  event.type === EventType.RECHARGE || event.type === EventType.REFUND
                    ? 'bg-emerald-500'
                    : event.type === EventType.CONSUME
                    ? 'bg-red-500'
                    : event.type === EventType.FREEZE
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`} />
                <div>
                  <div className="font-medium text-gray-900">
                    {event.type === EventType.RECHARGE ? '充值' :
                     event.type === EventType.CONSUME ? '消费' :
                     event.type === EventType.REFUND ? '退款' :
                     event.type === EventType.FREEZE ? '冻结' :
                     event.type === EventType.UNFREEZE ? '解冻' : '补偿'}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(event.occurredAt)}</div>
                </div>
              </div>
              <div className={`font-mono font-bold ${
                event.type === EventType.RECHARGE || event.type === EventType.REFUND || event.type === EventType.UNFREEZE
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}>
                {event.type === EventType.RECHARGE || event.type === EventType.REFUND || event.type === EventType.UNFREEZE ? '+' : '-'}
                {formatMoney(event.amount)}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              暂无事务记录
            </div>
          )}
        </div>
      </div>

      {operationType && (
        <OperationModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setOperationType(null)
          }}
          operationType={operationType}
        />
      )}
    </div>
  )
}
