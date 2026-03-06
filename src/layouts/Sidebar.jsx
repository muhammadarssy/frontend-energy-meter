import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  AlertTriangle,
  Zap,
  Truck,
  Tag,
  Shield,
  Key,
  FolderOpen
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Pengguna',
    to: '/users',
    icon: Users
  },
  {
    label: 'Produk',
    to: '/products',
    icon: Package
  }
]

const accessItems = [
  {
    label: 'Role',
    to: '/access/roles',
    icon: Shield
  },
  {
    label: 'Permission',
    to: '/access/permissions',
    icon: Key
  }
]

const masterItems = [
  {
    label: 'Supplier',
    to: '/master/suppliers',
    icon: Truck
  },
  {
    label: 'Tipe Produk',
    to: '/master/product-types',
    icon: Tag
  },
  {
    label: 'Kategori Produk',
    to: '/master/product-categories',
    icon: FolderOpen
  }
]

const qcItems = [
  {
    label: 'QC Templates',
    to: '/qc-master/templates',
    icon: ClipboardList
  },
  {
    label: 'Tipe Defect',
    to: '/qc-master/defect-types',
    icon: AlertTriangle
  }
]

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg leading-tight">
          Energy Meter
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {/* Access Control Section */}
        <div className="pt-4">
          <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Hak Akses
          </p>
          {accessItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Master Data Section */}
        <div className="pt-4">
          <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Master Data
          </p>
          {masterItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* QC Master Section */}
        <div className="pt-4">
          <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            QC Master
          </p>
          {qcItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">v1.0.0</p>
      </div>
    </div>
  )
}

export default Sidebar
