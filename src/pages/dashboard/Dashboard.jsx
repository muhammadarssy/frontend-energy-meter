import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, Users, ClipboardList, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getProducts } from '../../api/products'
import { getUsers } from '../../api/auth'
import { getQcTemplates, getDefectTypes } from '../../api/qcMaster'
import Spinner from '../../components/ui/Spinner'

const StatCard = ({ label, value, icon: Icon, color, loading }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100', text: 'text-orange-600' }
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.text}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        {loading ? (
          <div className="mt-1"><Spinner size="sm" /></div>
        ) : (
          <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { user } = useAuth()

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-count'],
    queryFn: () => getProducts({ limit: 1, page: 1 })
  })

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users-count'],
    queryFn: () => getUsers({ limit: 1, page: 1 })
  })

  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ['qc-templates-count'],
    queryFn: () => getQcTemplates({ limit: 1, page: 1 })
  })

  const { data: defectData, isLoading: loadingDefects } = useQuery({
    queryKey: ['defect-types-count'],
    queryFn: () => getDefectTypes({ limit: 1, page: 1 })
  })

  const stats = [
    {
      label: 'Total Produk',
      value: productsData?.meta?.total,
      icon: Package,
      color: 'blue',
      loading: loadingProducts
    },
    {
      label: 'Total Pengguna',
      value: usersData?.meta?.total,
      icon: Users,
      color: 'green',
      loading: loadingUsers
    },
    {
      label: 'QC Templates',
      value: templatesData?.meta?.total,
      icon: ClipboardList,
      color: 'purple',
      loading: loadingTemplates
    },
    {
      label: 'Tipe Defect',
      value: defectData?.meta?.total,
      icon: AlertTriangle,
      color: 'orange',
      loading: loadingDefects
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold">
          Selamat datang, {user?.name || user?.username || 'Admin'}!
        </h2>
        <p className="mt-1 text-blue-100 text-sm">
          Sistem Manajemen Energy Meter — Panel Administrasi
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Akses Cepat</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Kelola Produk', href: '/products', icon: Package, color: 'text-blue-600' },
            { label: 'Kelola Pengguna', href: '/users', icon: Users, color: 'text-green-600' },
            { label: 'QC Templates', href: '/qc-master/templates', icon: ClipboardList, color: 'text-purple-600' },
            { label: 'Tipe Defect', href: '/qc-master/defect-types', icon: AlertTriangle, color: 'text-orange-600' }
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-center"
            >
              <item.icon className={`w-6 h-6 ${item.color}`} />
              <span className="text-sm text-gray-600">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
