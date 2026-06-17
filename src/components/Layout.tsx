import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Wallet,
  History,
  Database,
  GitBranch,
  Layers
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '账户总览', icon: Wallet },
    { path: '/timeline', label: '事务时间线', icon: History },
    { path: '/snapshots', label: '快照管理', icon: Database }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-white shadow-lg border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">事件溯源</h1>
                <p className="text-xs text-gray-500">账户记账系统</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">事件溯源架构</span>
              </div>
              <p className="text-xs text-slate-500">
                所有余额变更以追加事件方式存储，通过事件回放计算余额，支持任意时间点查询。
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
