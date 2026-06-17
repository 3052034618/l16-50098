import React, { useEffect, useState } from 'react'
import {
  Database,
  HardDrive,
  Clock,
  Plus,
  Archive,
  TrendingUp,
  CreditCard,
  Lock,
  Package,
  BarChart3
} from 'lucide-react'
import { useAccountStore } from '../store/useAccountStore'
import { formatMoney, formatDate, formatBytes } from '../lib/format'

export const Snapshots: React.FC = () => {
  const { snapshots, fetchSnapshots } = useAccountStore()
  const createSnapshot = useAccountStore(state => state.createSnapshot)
  const createArchive = useAccountStore(state => state.createArchive)
  const loading = useAccountStore(state => state.loading)
  const error = useAccountStore(state => state.error)
  const successMessage = useAccountStore(state => state.successMessage)
  const clearMessages = useAccountStore(state => state.clearMessages)

  const [archiveStats, setArchiveStats] = useState<{
    totalArchives: number
    totalOriginalSize: number
    totalCompressedSize: number
    compressionRatio: number
    archivedEventCount: number
  } | null>(null)

  useEffect(() => {
    fetchSnapshots()
    loadArchiveStats()
  }, [fetchSnapshots])

  const loadArchiveStats = async () => {
    try {
      const response = await fetch('/api/snapshots/archive/stats')
      const data = await response.json()
      if (data.success && data.data) {
        setArchiveStats(data.data)
      }
    } catch (err) {
      console.error('Failed to load archive stats:', err)
    }
  }

  const handleCreateSnapshot = async () => {
    const success = await createSnapshot()
    if (success) {
      fetchSnapshots()
    }
  }

  const handleCreateArchive = async () => {
    const success = await createArchive()
    if (success) {
      fetchSnapshots()
      loadArchiveStats()
    }
  }

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {snapshots.length}
          </div>
          <div className="text-sm text-gray-500">快照总数</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <HardDrive className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {snapshots.length > 0 ? snapshots[0].eventCount : 0}
          </div>
          <div className="text-sm text-gray-500">累计事件数</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Archive className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {archiveStats?.totalArchives || 0}
          </div>
          <div className="text-sm text-gray-500">归档次数</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {archiveStats?.compressionRatio.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-gray-500">压缩率</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            创建快照
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            创建当前账户状态的快照，用于加速后续余额查询。快照会记录当前的总余额、可用余额和冻结余额。
          </p>
          <button
            onClick={handleCreateSnapshot}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                创建快照
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5 text-purple-600" />
            归档历史事件
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            将最新快照之前的事件进行压缩归档，减少存储空间占用。归档后的事件仍可查询和恢复。
          </p>
          <button
            onClick={handleCreateArchive}
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Package className="w-5 h-5" />
                执行归档
              </>
            )}
          </button>
        </div>
      </div>

      {archiveStats && archiveStats.totalArchives > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            归档统计
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">原始大小</div>
              <div className="text-lg font-bold text-gray-900">
                {formatBytes(archiveStats.totalOriginalSize)}
              </div>
            </div>
            <div className="bg-white/80 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">压缩后大小</div>
              <div className="text-lg font-bold text-gray-900">
                {formatBytes(archiveStats.totalCompressedSize)}
              </div>
            </div>
            <div className="bg-white/80 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">节省空间</div>
              <div className="text-lg font-bold text-emerald-600">
                {formatBytes(archiveStats.totalOriginalSize - archiveStats.totalCompressedSize)}
              </div>
            </div>
            <div className="bg-white/80 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">归档事件数</div>
              <div className="text-lg font-bold text-gray-900">
                {archiveStats.archivedEventCount}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          快照历史
        </h2>

        {snapshots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">快照时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">总余额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">可用余额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">冻结余额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">事件版本</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {snapshots.map((snapshot, index) => (
                  <tr key={snapshot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(snapshot.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{snapshot.id}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="font-mono font-semibold text-gray-900">
                          {formatMoney(snapshot.totalBalance)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-500" />
                        <span className="font-mono font-semibold text-emerald-600">
                          {formatMoney(snapshot.availableBalance)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-500" />
                        <span className="font-mono font-semibold text-amber-600">
                          {formatMoney(snapshot.frozenBalance)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        snapshot.isFrozen 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {snapshot.isFrozen ? '已冻结' : '正常'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">
                        v{snapshot.lastEventVersion}
                      </div>
                      <div className="text-xs text-gray-500">
                        {snapshot.eventCount} 条事件
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="mb-2">暂无快照记录</p>
            <p className="text-sm text-gray-400">点击上方按钮创建第一个快照</p>
          </div>
        )}
      </div>
    </div>
  )
}
