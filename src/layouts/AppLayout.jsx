import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/users': 'Manajemen Pengguna',
  '/products': 'Produk',
  '/products/new': 'Tambah Produk',
  '/qc-master/templates': 'QC Templates',
  '/qc-master/defect-types': 'Tipe Defect',
  '/receiving/purchase-orders': 'Purchase Orders',
  '/receiving': 'Penerimaan Barang',
  '/receiving/warehouse-requests': 'Permintaan Gudang'
}

const getPageTitle = (pathname) => {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.includes('/level-inspections')) return 'Level Inspeksi'
  if (pathname.includes('/edit')) return 'Edit Produk'
  if (/^\/receiving\/[^/]+$/.test(pathname) && pathname !== '/receiving/warehouse-requests') return 'Detail Penerimaan'
  return 'Energy Meter'
}

const AppLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700">{user?.name || user?.username || 'Admin'}</p>
                <p className="text-gray-400 text-xs">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
