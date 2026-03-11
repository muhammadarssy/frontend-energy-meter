import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Activity, Package, Hash, Box } from 'lucide-react'
import { getTrackingItems } from '../../api/tracking'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  created:    { label: 'Dibuat',           color: 'blue' },
  on_qc:      { label: 'Sedang QC',        color: 'yellow' },
  qc_passed:  { label: 'QC Lulus',         color: 'green' },
  qc_failed:  { label: 'QC Gagal',         color: 'red' },
  in_transit: { label: 'Dalam Pengiriman', color: 'purple' },
  stored:     { label: 'Tersimpan',        color: 'teal' },
  shipped:    { label: 'Dikirim',          color: 'indigo' },
  delivered:  { label: 'Terkirim',         color: 'gray' }
}

const TYPE_CONFIG = {
  receiving: { label: 'Penerimaan', color: 'blue' },
  assembly:  { label: 'Perakitan',  color: 'purple' },
  shipping:  { label: 'Pengiriman', color: 'green' }
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG)

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
    <span className="text-xs text-gray-800 font-medium text-right break-all">{value ?? '—'}</span>
  </div>
)

const TrackingDetailModal = ({ item, isOpen, onClose }) => {
  if (!item) return null
  const status = STATUS_CONFIG[item.status] || { label: item.status, color: 'gray' }
  const type = TYPE_CONFIG[item.tracking_type] || { label: item.tracking_type, color: 'gray' }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Tracking" showFooter={false}>
      <div className="space-y-1">
        <DetailRow label="Kode Item" value={<span className="font-mono">{item.code_item}</span>} />
        <DetailRow label="Produk" value={
          <span>{item.product?.name}{item.product?.sap_code ? ` (${item.product.sap_code})` : ''}</span>
        } />
        <DetailRow label="Tipe Tracking" value={
          <Badge color={type.color}>{type.label}</Badge>
        } />
        <DetailRow label="Status" value={
          <Badge color={status.color}>{status.label}</Badge>
        } />
        <DetailRow label="Serialized" value={item.is_serialize ? 'Ya' : 'Tidak'} />
        {item.serial_number && (
          <DetailRow label="Serial Number" value={<span className="font-mono">{item.serial_number}</span>} />
        )}
        <DetailRow label="Qty Awal" value={item.original_quantity} />
        <DetailRow label="Qty Saat Ini" value={item.current_quantity} />
        <DetailRow label="Qty Terpakai" value={item.consumed_quantity} />
        {item.batch && (
          <DetailRow label="Batch" value={<span className="font-mono">{item.batch.code}</span>} />
        )}
        {item.notes && <DetailRow label="Catatan" value={item.notes} />}
        <DetailRow label="Dibuat" value={new Date(item.created_at).toLocaleString('id-ID')} />
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TrackingList = () => {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('receiving')
  const [filterStatus, setFilterStatus] = useState('')
  const [detailItem, setDetailItem] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tracking', { page, search, tracking_type: filterType, status: filterStatus }],
    queryFn: () => getTrackingItems({
      page,
      limit: 20,
      search: search || undefined,
      tracking_type: filterType || undefined,
      status: filterStatus || undefined
    })
  })

  const items = data?.data || []
  const pagination = data?.meta?.pagination || {}

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const handleFilterType = (val) => { setFilterType(val); setPage(1) }
  const handleFilterStatus = (val) => { setFilterStatus(val); setPage(1) }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Data Tracking</h2>
          {pagination.totalItems > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{pagination.totalItems} record ditemukan</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari kode item / serial..."
              className="pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button type="submit" variant="secondary" size="sm">Cari</Button>
        </form>

        {/* Tipe */}
        <select
          value={filterType}
          onChange={(e) => handleFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Tipe</option>
          <option value="receiving">Penerimaan</option>
          <option value="assembly">Perakitan</option>
          <option value="shipping">Pengiriman</option>
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => handleFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Status</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-gray-400">
          <Activity className="w-10 h-10 mb-3 text-gray-300" />
          <p className="text-sm">Tidak ada data tracking</p>
          {(search || filterStatus) && (
            <button
              onClick={() => { clearSearch(); setFilterStatus(''); }}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Kode Item', 'Produk', 'Tipe', 'Status', 'Serial', 'Qty', 'Batch', 'Dibuat'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => {
                const status = STATUS_CONFIG[item.status] || { label: item.status, color: 'gray' }
                const type = TYPE_CONFIG[item.tracking_type] || { label: item.tracking_type, color: 'gray' }
                const rowNum = (pagination.currentPage - 1) * 20 + idx + 1
                return (
                  <tr
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">{rowNum}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-800">{item.code_item}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-800 truncate max-w-[160px]">{item.product?.name || '—'}</p>
                      {item.product?.sap_code && (
                        <p className="text-xs text-gray-400 font-mono">{item.product.sap_code}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={type.color} className="text-xs">{type.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={status.color} className="text-xs">{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {item.is_serialize ? (
                        <span className="font-mono text-xs text-gray-600">{item.serial_number || '—'}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-semibold">
                      {item.current_quantity}
                      {item.original_quantity !== item.current_quantity && (
                        <span className="text-gray-400 font-normal">/{item.original_quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.batch ? (
                        <span className="font-mono text-xs text-gray-500">{item.batch.code}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.totalItems}
          limit={20}
          onPageChange={setPage}
        />
      )}

      {/* Detail Modal */}
      <TrackingDetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  )
}

export default TrackingList
