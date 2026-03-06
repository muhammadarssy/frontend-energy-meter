import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Unlink, Search } from 'lucide-react'
import { getProduct, getProductQcTemplates, assignQcTemplate, unassignQcTemplate } from '../../api/products'
import { getQcTemplates } from '../../api/qcMaster'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const phaseColorMap = { receiving: 'blue', assembly: 'purple', shipping: 'green' }

const QcTemplateAssignments = () => {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [unassignTarget, setUnassignTarget] = useState(null)

  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId)
  })

  const { data: assignedData, isLoading } = useQuery({
    queryKey: ['product-qc-templates', productId],
    queryFn: () => getProductQcTemplates(productId)
  })

  // Fetch available (unassigned) templates when assign modal is open
  const { data: availableData, isLoading: availableLoading } = useQuery({
    queryKey: ['qc-templates-unassigned'],
    queryFn: () => getQcTemplates({ unassigned: true, limit: 100, is_active: true }),
    enabled: assignModalOpen
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['product-qc-templates', productId] })

  const assignMutation = useMutation({
    mutationFn: (templateId) => assignQcTemplate(productId, templateId),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['qc-templates-unassigned'] })
      setAssignModalOpen(false)
    }
  })

  const unassignMutation = useMutation({
    mutationFn: (templateId) => unassignQcTemplate(productId, templateId),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['qc-templates-unassigned'] })
      setUnassignTarget(null)
    }
  })

  const assigned = assignedData?.data || []
  const product = productData?.data

  const available = (availableData?.data || []).filter((t) => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return t.code.toLowerCase().includes(s) || t.name.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800">Template QC Terpilih</h2>
          {product && (
            <p className="text-sm text-gray-500">{product.name} — {product.sap_code}</p>
          )}
        </div>
        <Button onClick={() => setAssignModalOpen(true)} size="sm">
          <Plus className="w-4 h-4" /> Pilih Template
        </Button>
      </div>

      {/* Assigned templates table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Kode', 'Nama Template', 'Phase', 'Level', 'Sample', 'AQL C/M/m', 'Accept C/M/m', 'Reject C/M/m', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assigned.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                      Belum ada QC Template yang dipilih untuk produk ini
                    </td>
                  </tr>
                ) : assigned.map((item, idx) => {
                  const li = item.level_inspection
                  return (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3">
                        {item.qc_phase ? <Badge color={phaseColorMap[item.qc_phase] || 'gray'}>{item.qc_phase}</Badge> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {li ? <Badge color="blue">{li.level}</Badge> : <span className="text-gray-300 text-xs">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{li?.sample_size ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {li ? `${li.aql_critical} / ${li.aql_major} / ${li.aql_minor}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {li ? `${li.accept_critical ?? '—'} / ${li.accept_major ?? '—'} / ${li.accept_minor ?? '—'}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {li ? `${li.reject_critical ?? '—'} / ${li.reject_major ?? '—'} / ${li.reject_minor ?? '—'}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={item.is_active ? 'green' : 'gray'}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setUnassignTarget(item)}
                          title="Lepas dari produk ini"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setSearch('') }}
        title="Pilih QC Template"
        size="lg"
        hideConfirm
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama template..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {availableLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : available.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">
              {search ? 'Template tidak ditemukan' : 'Semua template sudah di-assign atau belum ada template'}
            </p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {available.map((t) => {
                const li = t.level_inspection
                return (
                  <button
                    key={t.id}
                    onClick={() => assignMutation.mutate(t.id)}
                    disabled={assignMutation.isPending}
                    className="w-full flex items-start justify-between gap-3 px-3 py-3 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-500">{t.code}</span>
                        <span className="font-medium text-sm text-gray-800">{t.name}</span>
                        {t.qc_phase && <Badge color={phaseColorMap[t.qc_phase] || 'gray'}>{t.qc_phase}</Badge>}
                      </div>
                      {li && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Level {li.level} · AQL {li.aql_critical}/{li.aql_major}/{li.aql_minor} · Sample {li.sample_size ?? '—'}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-blue-600 font-medium shrink-0 mt-0.5">Pilih</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Unassign confirm */}
      <ConfirmDialog
        isOpen={!!unassignTarget}
        onClose={() => setUnassignTarget(null)}
        onConfirm={() => unassignMutation.mutate(unassignTarget?.id)}
        loading={unassignMutation.isPending}
        message={`Lepas template "${unassignTarget?.name}" dari produk ini? Template akan kembali ke pool dan bisa di-assign ke produk lain.`}
      />
    </div>
  )
}

export default QcTemplateAssignments

