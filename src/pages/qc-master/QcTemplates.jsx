import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, List, Pencil, X, Check, GripVertical } from 'lucide-react'
import {
  getQcTemplates, createQcTemplate, updateQcTemplate, deleteQcTemplate,
  getChecklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem
} from '../../api/qcMaster'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const defaultForm = {
  code: '',
  name: '',
  description: '',
  qc_phase: '',
  display_order: '',
  is_active: true,
  // Level Inspection fields
  level: 'II',
  aql_critical: '',
  aql_major: '',
  aql_minor: '',
  sample_size: '',
  accept_critical: '',
  accept_major: '',
  accept_minor: '',
  reject_critical: '',
  reject_major: '',
  reject_minor: ''
}

const phaseOptions = [
  { value: 'receiving', label: 'Receiving' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'shipping', label: 'Shipping' }
]

const phaseColorMap = {
  receiving: 'blue',
  assembly: 'purple',
  shipping: 'green'
}

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
    <span className="text-sm text-gray-700">{label}</span>
  </div>
)

const QcTemplates = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10
  const [phaseFilter, setPhaseFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Checklist management
  const [checklistTarget, setChecklistTarget] = useState(null) // template object
  const defaultItemForm = { label: '', description: '', display_order: '', is_required: true }
  const [newItemForm, setNewItemForm] = useState(defaultItemForm)
  const [newItemErrors, setNewItemErrors] = useState({})
  const [editItemId, setEditItemId] = useState(null)
  const [editItemForm, setEditItemForm] = useState({})

  const params = {
    page,
    limit,
    ...(phaseFilter ? { qc_phase: phaseFilter } : {})
  }

  const { data, isLoading } = useQuery({
    queryKey: ['qc-templates', params],
    queryFn: () => getQcTemplates(params)
  })

  const createMutation = useMutation({
    mutationFn: (data) => createQcTemplate(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc-templates'] }); closeModal() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateQcTemplate(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc-templates'] }); closeModal() }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteQcTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc-templates'] }); setDeleteTarget(null) }
  })

  // Checklist queries/mutations
  const { data: checklistData, isLoading: checklistLoading } = useQuery({
    queryKey: ['checklist-items', checklistTarget?.id],
    queryFn: () => getChecklistItems(checklistTarget.id),
    enabled: !!checklistTarget
  })
  const checklistItems = checklistData?.data || []

  const addItemMutation = useMutation({
    mutationFn: (data) => addChecklistItem(checklistTarget.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-items', checklistTarget?.id] })
      setNewItemForm(defaultItemForm)
      setNewItemErrors({})
    }
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }) => updateChecklistItem(checklistTarget.id, itemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-items', checklistTarget?.id] })
      setEditItemId(null)
    }
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => deleteChecklistItem(checklistTarget.id, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist-items', checklistTarget?.id] })
  })

  const handleAddItem = () => {
    const errs = {}
    if (!newItemForm.label.trim()) errs.label = 'Label wajib diisi'
    if (Object.keys(errs).length > 0) { setNewItemErrors(errs); return }
    addItemMutation.mutate({
      label: newItemForm.label.trim(),
      description: newItemForm.description || undefined,
      display_order: newItemForm.display_order !== '' ? Number(newItemForm.display_order) : 0,
      is_required: newItemForm.is_required
    })
  }

  const startEditItem = (item) => {
    setEditItemId(item.id)
    setEditItemForm({
      label: item.label,
      description: item.description || '',
      display_order: item.display_order ?? 0,
      is_required: item.is_required
    })
  }

  const saveEditItem = () => {
    updateItemMutation.mutate({
      itemId: editItemId,
      data: {
        label: editItemForm.label.trim(),
        description: editItemForm.description || undefined,
        display_order: Number(editItemForm.display_order),
        is_required: editItemForm.is_required
      }
    })
  }

  const openCreate = () => {
    setEditItem(null)
    setForm(defaultForm)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    const li = item.level_inspection || {}
    setForm({
      code: item.code || '',
      name: item.name || '',
      description: item.description || '',
      qc_phase: item.qc_phase || '',
      display_order: item.display_order ?? '',
      is_active: item.is_active ?? true,
      level: li.level || 'II',
      aql_critical: li.aql_critical ?? '',
      aql_major: li.aql_major ?? '',
      aql_minor: li.aql_minor ?? '',
      sample_size: li.sample_size ?? '',
      accept_critical: li.accept_critical ?? '',
      accept_major: li.accept_major ?? '',
      accept_minor: li.accept_minor ?? '',
      reject_critical: li.reject_critical ?? '',
      reject_major: li.reject_major ?? '',
      reject_minor: li.reject_minor ?? ''
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditItem(null)
    setForm(defaultForm)
    setFormErrors({})
  }

  const validate = () => {
    const errs = {}
    if (!form.code.trim()) errs.code = 'Kode wajib diisi'
    if (!form.name.trim()) errs.name = 'Nama wajib diisi'
    return errs
  }

  const toNum = (v) => v === '' || v === null || v === undefined ? undefined : Number(v)

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description || undefined,
      qc_phase: form.qc_phase || undefined,
      display_order: form.display_order !== '' ? Number(form.display_order) : undefined,
      is_active: form.is_active,
      level: form.level,
      aql_critical: toNum(form.aql_critical),
      aql_major: toNum(form.aql_major),
      aql_minor: toNum(form.aql_minor),
      sample_size: toNum(form.sample_size),
      accept_critical: toNum(form.accept_critical),
      accept_major: toNum(form.accept_major),
      accept_minor: toNum(form.accept_minor),
      reject_critical: toNum(form.reject_critical),
      reject_major: toNum(form.reject_major),
      reject_minor: toNum(form.reject_minor)
    }

    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const templates = data?.data || []
  const pagination = data?.meta?.pagination || {}
  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">QC Templates</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> Tambah Template
        </Button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3">
        <select
          value={phaseFilter}
          onChange={(e) => { setPhaseFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Semua Phase</option>
          {phaseOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['No', 'Kode', 'Nama Template', 'Phase', 'Level', 'AQL C/M/m', 'Urutan', 'Status', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                        Tidak ada QC template
                      </td>
                    </tr>
                  ) : templates.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3">
                        {item.qc_phase ? (
                          <Badge color={phaseColorMap[item.qc_phase] || 'gray'}>
                            {item.qc_phase}
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {item.level_inspection ? (
                          <Badge color="blue">{item.level_inspection.level}</Badge>
                        ) : <span className="text-gray-300 text-xs">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.level_inspection
                          ? `${item.level_inspection.aql_critical} / ${item.level_inspection.aql_major} / ${item.level_inspection.aql_minor}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.display_order ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge color={item.is_active ? 'green' : 'gray'}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setChecklistTarget(item); setNewItemForm(defaultItemForm); setEditItemId(null) }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Kelola Checklist"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit QC Template' : 'Tambah QC Template'}
        onConfirm={handleSubmit}
        confirmLabel={editItem ? 'Simpan' : 'Tambah'}
        loading={isMutating}
      >
        <div className="space-y-4">
          <Input
            label="Kode"
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            error={formErrors.code}
            placeholder="Contoh: QCT-001"
          />
          <Input
            label="Nama Template"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            placeholder="Nama template QC"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Deskripsi template..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <Select
            label="Phase QC"
            value={form.qc_phase}
            onChange={(e) => setForm((f) => ({ ...f, qc_phase: e.target.value }))}
            options={phaseOptions}
            placeholder="Pilih phase"
          />
          <Input
            label="Urutan Tampil"
            type="number"
            value={form.display_order}
            onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
            placeholder="0"
          />
          <Toggle
            label="Status Aktif"
            checked={form.is_active}
            onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
          />

          <hr className="border-gray-200" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parameter Level Inspeksi (AQL)</p>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Level Inspeksi"
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              options={[{ value: 'I', label: 'Level I' }, { value: 'II', label: 'Level II' }, { value: 'III', label: 'Level III' }]}
            />
            <Input
              label="Ukuran Sample"
              type="number"
              value={form.sample_size}
              onChange={(e) => setForm((f) => ({ ...f, sample_size: e.target.value }))}
              placeholder="Jumlah unit dicek"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">AQL (Critical / Major / Minor)</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Critical" type="number" step="0.01" value={form.aql_critical} onChange={(e) => setForm((f) => ({ ...f, aql_critical: e.target.value }))} placeholder="0.00" />
              <Input label="Major" type="number" step="0.01" value={form.aql_major} onChange={(e) => setForm((f) => ({ ...f, aql_major: e.target.value }))} placeholder="0.00" />
              <Input label="Minor" type="number" step="0.01" value={form.aql_minor} onChange={(e) => setForm((f) => ({ ...f, aql_minor: e.target.value }))} placeholder="0.00" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Batas Accept</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Critical" type="number" value={form.accept_critical} onChange={(e) => setForm((f) => ({ ...f, accept_critical: e.target.value }))} placeholder="0" />
              <Input label="Major" type="number" value={form.accept_major} onChange={(e) => setForm((f) => ({ ...f, accept_major: e.target.value }))} placeholder="0" />
              <Input label="Minor" type="number" value={form.accept_minor} onChange={(e) => setForm((f) => ({ ...f, accept_minor: e.target.value }))} placeholder="0" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Batas Reject</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Critical" type="number" value={form.reject_critical} onChange={(e) => setForm((f) => ({ ...f, reject_critical: e.target.value }))} placeholder="0" />
              <Input label="Major" type="number" value={form.reject_major} onChange={(e) => setForm((f) => ({ ...f, reject_major: e.target.value }))} placeholder="0" />
              <Input label="Minor" type="number" value={form.reject_minor} onChange={(e) => setForm((f) => ({ ...f, reject_minor: e.target.value }))} placeholder="0" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Checklist Items Modal */}
      {checklistTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Checklist Items</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="font-mono">{checklistTarget.code}</span> — {checklistTarget.name}
                </p>
              </div>
              <button onClick={() => setChecklistTarget(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {checklistLoading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : checklistItems.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Belum ada checklist item</p>
              ) : checklistItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {editItemId === item.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={editItemForm.label}
                          onChange={(e) => setEditItemForm((f) => ({ ...f, label: e.target.value }))}
                          placeholder="Label"
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          value={editItemForm.display_order}
                          onChange={(e) => setEditItemForm((f) => ({ ...f, display_order: e.target.value }))}
                          placeholder="Urutan"
                          className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        value={editItemForm.description}
                        onChange={(e) => setEditItemForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Deskripsi (opsional)"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={editItemForm.is_required}
                            onChange={(e) => setEditItemForm((f) => ({ ...f, is_required: e.target.checked }))}
                            className="rounded" />
                          Wajib
                        </label>
                        <div className="flex gap-1">
                          <button onClick={saveEditItem} disabled={updateItemMutation.isPending}
                            className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditItemId(null)}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          <span className="text-sm font-medium text-gray-800">{item.label}</span>
                          {item.is_required && (
                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Wajib</span>
                          )}
                          <span className="text-xs text-gray-400">#{item.display_order}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5 ml-5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEditItem(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItemMutation.mutate(item.id)}
                          disabled={deleteItemMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Item */}
            <div className="p-5 border-t border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tambah Item Baru</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    value={newItemForm.label}
                    onChange={(e) => setNewItemForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Label checklist *"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      newItemErrors.label ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {newItemErrors.label && <p className="text-xs text-red-500 mt-0.5">{newItemErrors.label}</p>}
                </div>
                <input
                  type="number"
                  value={newItemForm.display_order}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, display_order: e.target.value }))}
                  placeholder="Urutan"
                  className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                value={newItemForm.description}
                onChange={(e) => setNewItemForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi (opsional)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={newItemForm.is_required}
                    onChange={(e) => setNewItemForm((f) => ({ ...f, is_required: e.target.checked }))}
                    className="rounded" />
                  Wajib diisi
                </label>
                <button
                  onClick={handleAddItem}
                  disabled={addItemMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        message={`Apakah Anda yakin ingin menghapus template "${deleteTarget?.name}"?`}
      />
    </div>
  )
}

export default QcTemplates
