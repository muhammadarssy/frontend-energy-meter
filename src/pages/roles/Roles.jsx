import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Shield } from 'lucide-react'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRolePermissions,
  getPermissions
} from '../../api/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const defaultForm = { name: '', description: '' }

// Checkbox list for multi-select permissions
const PermCheckList = ({ allPerms, selected, onChange }) => {
  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  const groups = allPerms.reduce((acc, p) => {
    const group = p.name.split(':')[0] || 'other'
    if (!acc[group]) acc[group] = []
    acc[group].push(p)
    return acc
  }, {})

  return (
    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
      {Object.entries(groups).map(([group, perms]) => (
        <div key={group} className="px-3 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{group}</p>
          <div className="space-y-1">
            {perms.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{p.name}</span>
                {p.description && (
                  <span className="text-xs text-gray-400 truncate">— {p.description}</span>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const Roles = () => {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Assign permissions state
  const [assignTarget, setAssignTarget] = useState(null) // role object
  const [selectedPerms, setSelectedPerms] = useState([])

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles
  })

  const { data: permsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
    enabled: !!assignTarget
  })

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); closeModal() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRole(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); closeModal() }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setDeleteTarget(null) }
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, permission_ids }) => assignRolePermissions(id, permission_ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setAssignTarget(null) }
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

  const openAssign = (role) => {
    setAssignTarget(role)
    const currentIds = (role.permissions || role.role_permissions || []).map(
      (rp) => rp.permission_id || rp.id
    )
    setSelectedPerms(currentIds)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nama role wajib diisi'
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    const payload = { name: form.name, description: form.description || null }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleAssign = () => {
    assignMutation.mutate({ id: assignTarget.id, permission_ids: selectedPerms })
  }

  const roles = rolesData?.data || rolesData || []
  const allPerms = permsData?.data || permsData || []
  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Manajemen Role</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> Tambah Role
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['No', 'Nama Role', 'Deskripsi', 'Jumlah Permission', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data role</td>
                  </tr>
                ) : roles.map((role, idx) => {
                  const permCount = (role.permissions?.length ?? role.role_permissions?.length ?? 0)
                  return (
                    <tr key={role.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{role.name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{role.description || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge color="blue">{permCount} permission</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openAssign(role)}
                            title="Assign Permissions"
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(role)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(role)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Role' : 'Tambah Role'}
        onConfirm={handleSubmit}
        confirmLabel={editItem ? 'Simpan' : 'Tambah'}
        loading={isMutating}
      >
        <div className="space-y-4">
          <Input
            label="Nama Role"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            placeholder="Contoh: admin, manager, operator"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Deskripsi role (opsional)..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Assign Permissions Modal */}
      <Modal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={`Assign Permission — ${assignTarget?.name}`}
        onConfirm={handleAssign}
        confirmLabel="Simpan Akses"
        loading={assignMutation.isPending}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Pilih permission yang akan diberikan ke role <span className="font-semibold text-gray-700">{assignTarget?.name}</span>.
          </p>
          {allPerms.length === 0 ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{selectedPerms.length} dipilih dari {allPerms.length}</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setSelectedPerms(allPerms.map((p) => p.id))}
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:underline"
                    onClick={() => setSelectedPerms([])}
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
              <PermCheckList allPerms={allPerms} selected={selectedPerms} onChange={setSelectedPerms} />
            </>
          )}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        message={`Apakah Anda yakin ingin menghapus role "${deleteTarget?.name}"?`}
      />
    </div>
  )
}

export default Roles
