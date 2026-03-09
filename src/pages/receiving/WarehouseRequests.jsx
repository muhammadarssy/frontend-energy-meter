import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Filter } from 'lucide-react'
import { getWarehouseRequests, approveWarehouseRequest, rejectWarehouseRequest } from '../../api/receiving'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const statusColor = { pending: 'yellow', approved: 'green', rejected: 'red' }
const statusLabel = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }
const requestTypeLabel = {
  inbound_receiving: 'Penerimaan',
  inbound_assembly: 'Assembly'
}

const WarehouseRequests = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('inbound_receiving')
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const params = {
    page,
    limit,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { request_type: typeFilter } : {})
  }

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse-requests', params],
    queryFn: () => getWarehouseRequests(params)
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['warehouse-requests'] })

  const approveMutation = useMutation({
    mutationFn: (id) => approveWarehouseRequest(id),
    onSuccess: () => { invalidate(); setApproveTarget(null) }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }) => rejectWarehouseRequest(id, { notes }),
    onSuccess: () => { invalidate(); setRejectTarget(null); setRejectNotes('') }
  })

  const items = data?.data || []
  const pagination = data?.meta?.pagination || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Permintaan Gudang</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
        >
          <option value="">Semua Tipe</option>
          <option value="inbound_receiving">Penerimaan</option>
          <option value="inbound_assembly">Assembly</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['#', 'Tipe Request', 'No. GR / Assembly', 'Gudang', 'Status', 'Dibuat', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                        Tidak ada permintaan gudang
                      </td>
                    </tr>
                  ) : items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3">
                        <Badge color={item.request_type === 'inbound_assembly' ? 'purple' : 'blue'}>
                          {requestTypeLabel[item.request_type] || item.request_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {item.receiving_header?.gr_number || item.assembly_order?.order_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.warehouse?.name || item.warehouse_id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={statusColor[item.status] || 'gray'}>
                          {statusLabel[item.status] || item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setApproveTarget(item)}
                              title="Setujui"
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setRejectTarget(item); setRejectNotes('') }}
                              title="Tolak"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {item.status === 'approved' && item.approved_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(item.approved_at).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                total={pagination.totalItems}
                limit={limit}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Approve confirm */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => approveMutation.mutate(approveTarget?.id)}
        title="Setujui Permintaan Gudang"
        message={`Setujui permintaan masuk gudang dari ${approveTarget?.receiving_header?.gr_number || approveTarget?.assembly_order?.order_number || 'ini'}? Stok akan diperbarui.`}
        confirmLabel="Setujui"
        loading={approveMutation.isPending}
      />

      {/* Reject dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Tolak Permintaan Gudang</h3>
            <p className="text-sm text-gray-600">
              Tolak permintaan dari <span className="font-mono">{rejectTarget.receiving_header?.gr_number || rejectTarget.assembly_order?.order_number || '—'}</span>?
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Alasan penolakan</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                placeholder="Catatan alasan penolakan..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectTarget(null); setRejectNotes('') }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectTarget.id, notes: rejectNotes })}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {rejectMutation.isPending ? 'Memproses...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WarehouseRequests
