import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission
} from '../../api/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const defaultForm = { name: '', description: '' }

const Permissions = () => {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions
  })

  const createMutation = useMutation({
    mutationFn: createPermission,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions'] }); closeModal() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePermission(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions'] }); closeModal() }
  })

  const deleteMutation = useMutation({
    mutationFn: deletePermission,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions'] }); setDeleteTarget(null) }
  })

  const openCreate = () => {
    setEditItem(null)
    setForm(defaultForm)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name || '', description: item.description || '' })
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
    if (!form.name.trim()) errs.name = 'Nama permission wajib diisi'
    if (!/^[a-z0-9_:.-]+$/.test(form.name.trim())) {
      errs.name = 'Gunakan format: resource:action (contoh: users:read)'
    }
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    const payload = { name: form.name.trim(), description: form.description || null }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const allPerms = data?.data || data || []
  const filtered = search
    ? allPerms.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : allPerms
  const isMutating = createMutation.isPending || updateMutation.isPending

  // Group by resource prefix
  const groups = filtered.reduce((acc, p) => {
    const group = p.name.includes(':') ? p.name.split(':')[0] : 'other'
    if (!acc[group]) acc[group] = []
    acc[group].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Manajemen Permission</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> Tambah Permission
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari permission... (contoh: users:read)"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grouped Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-10 text-center text-gray-400">
          Tidak ada data permission
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([group, perms]) => (
            <div key={group} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group}</span>
                <span className="text-xs text-gray-400">({perms.length})</span>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {['No', 'Nama Permission', 'Deskripsi', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perms.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-500 w-10">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-700 bg-blue-50/50">{item.name}</td>
                      <td className="px-4 py-3 text-gray-500">{item.description || '—'}</td>
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
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Permission' : 'Tambah Permission'}
        onConfirm={handleSubmit}
        confirmLabel={editItem ? 'Simpan' : 'Tambah'}
        loading={isMutating}
      >
        <div className="space-y-4">
          <Input
            label="Nama Permission"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            placeholder="Contoh: users:read, products:write"
          />
          <p className="text-xs text-gray-400 -mt-2">
            Gunakan format <code className="bg-gray-100 px-1 rounded">resource:action</code> (huruf kecil, tanpa spasi)
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Deskripsi singkat permission ini..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        message={`Apakah Anda yakin ingin menghapus permission "${deleteTarget?.name}"?`}
      />
    </div>
  )
}

export default Permissions
