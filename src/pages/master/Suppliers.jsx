import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../../api/products'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const defaultForm = {
  code: '',
  name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  is_active: true
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

const Suppliers = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, limit],
    queryFn: () => getSuppliers({ page, limit })
  })

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); closeModal() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSupplier(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); closeModal() }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteTarget(null) }
  })

  const openCreate = () => {
    setEditItem(null)
    setForm(defaultForm)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      code: item.code || '',
      name: item.name || '',
      contact_name: item.contact_name || '',
      contact_email: item.contact_email || '',
      contact_phone: item.contact_phone || '',
      address: item.address || '',
      is_active: item.is_active ?? true
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
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      errs.contact_email = 'Format email tidak valid'
    }
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    const payload = {
      ...form,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      address: form.address || null
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const suppliers = data?.data || []
  const meta = data?.meta || {}
  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Supplier</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> Tambah Supplier
        </Button>
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
                    {['No', 'Kode', 'Nama', 'Kontak', 'Email', 'Telepon', 'Status', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                        Tidak ada data supplier
                      </td>
                    </tr>
                  ) : suppliers.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.contact_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.contact_email || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.contact_phone || '—'}</td>
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
                totalPages={meta.totalPages}
                total={meta.total}
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
        title={editItem ? 'Edit Supplier' : 'Tambah Supplier'}
        onConfirm={handleSubmit}
        confirmLabel={editItem ? 'Simpan' : 'Tambah'}
        loading={isMutating}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kode"
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              error={formErrors.code}
              placeholder="Contoh: SUP-001"
            />
            <Input
              label="Nama Supplier"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={formErrors.name}
              placeholder="Nama perusahaan"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nama Kontak"
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
              placeholder="Nama PIC"
            />
            <Input
              label="No. Telepon"
              value={form.contact_phone}
              onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            error={formErrors.contact_email}
            placeholder="email@supplier.com"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Alamat</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              rows={3}
              placeholder="Alamat lengkap supplier..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <Toggle
            label="Status Aktif"
            checked={form.is_active}
            onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        message={`Apakah Anda yakin ingin menghapus supplier "${deleteTarget?.name}"?`}
      />
    </div>
  )
}

export default Suppliers
