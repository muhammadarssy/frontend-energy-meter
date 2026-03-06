import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Shield, Key } from 'lucide-react'
import {
  getUsers, createUser, updateUser, deleteUser,
  getRoles, getPermissions, assignUserRoles, assignUserPermissions
} from '../../api/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const defaultForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  department: '',
  is_active: true
}

const Users = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Assign role / permission
  const [assignRoleTarget, setAssignRoleTarget] = useState(null)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [assignPermTarget, setAssignPermTarget] = useState(null)
  const [selectedPerms, setSelectedPerms] = useState([])

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, search],
    queryFn: () => getUsers({ page, limit, search: search || undefined })
  })

  const createMutation = useMutation({
    mutationFn: (data) => createUser(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal() }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeleteTarget(null) }
  })

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, role_ids }) => assignUserRoles(id, role_ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setAssignRoleTarget(null) }
  })

  const assignPermsMutation = useMutation({
    mutationFn: ({ id, permission_ids }) => assignUserPermissions(id, permission_ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setAssignPermTarget(null) }
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: !!assignRoleTarget
  })

  const { data: permsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
    enabled: !!assignPermTarget
  })

  const openAssignRole = (user) => {
    setAssignRoleTarget(user)
    const ids = (user.roles || user.user_roles || []).map((r) => r.role_id || r.id)
    setSelectedRoles(ids)
  }

  const openAssignPerm = (user) => {
    setAssignPermTarget(user)
    const ids = (user.permissions || user.user_permissions || []).map((p) => p.permission_id || p.id)
    setSelectedPerms(ids)
  }

  const openCreate = () => {
    setEditUser(null)
    setForm(defaultForm)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (user) => {
    setEditUser(user)
    setForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      department: user.department || '',
      is_active: user.is_active ?? true
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditUser(null)
    setForm(defaultForm)
    setFormErrors({})
  }

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Nama wajib diisi'
    if (!form.username.trim()) errors.username = 'Username wajib diisi'
    if (!form.email.trim()) errors.email = 'Email wajib diisi'
    if (!editUser && !form.password.trim()) errors.password = 'Password wajib diisi untuk user baru'
    return errors
  }

  const handleSubmit = () => {
    const errors = validate()
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    const payload = { ...form }
    if (editUser && !payload.password) delete payload.password

    if (editUser) {
      updateMutation.mutate({ id: editUser.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const users = data?.data || []
  const meta = data?.meta || {}
  const isMutating = createMutation.isPending || updateMutation.isPending
  const allRoles = rolesData?.data || rolesData || []
  const allPerms = permsData?.data || permsData || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Manajemen User</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> Tambah User
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, username, email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" size="sm">Cari</Button>
        </form>
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
                    {['No', 'Nama', 'Username', 'Email', 'Departemen', 'Status', 'Role', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                        Tidak ada data pengguna
                      </td>
                    </tr>
                  ) : users.map((user, idx) => (
                    <tr key={user.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.username}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-gray-600">{user.department || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge color={user.is_active ? 'green' : 'gray'}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || user.user_roles || []).length === 0
                            ? <span className="text-gray-400 text-xs">—</span>
                            : (user.roles || user.user_roles || []).map((r) => (
                              <Badge key={r.id || r.role_id} color="purple">{r.name || r.role?.name}</Badge>
                            ))
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openAssignRole(user)}
                            title="Assign Role"
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openAssignPerm(user)}
                            title="Assign Permission"
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editUser ? 'Edit User' : 'Tambah User'}
        onConfirm={handleSubmit}
        confirmLabel={editUser ? 'Simpan Perubahan' : 'Tambah User'}
        loading={isMutating}
      >
        <div className="space-y-4">
          <Input
            label="Nama Lengkap"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            placeholder="Masukkan nama lengkap"
          />
          <Input
            label="Username"
            required
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            error={formErrors.username}
            placeholder="Masukkan username"
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={formErrors.email}
            placeholder="Masukkan email"
          />
          {!editUser && (
            <Input
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={formErrors.password}
              placeholder="Masukkan password"
            />
          )}
          {editUser && (
            <Input
              label="Password Baru (opsional)"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Kosongkan jika tidak ingin diubah"
            />
          )}
          <Input
            label="Departemen"
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="Masukkan departemen"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-gray-700">Status Aktif</span>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        message={`Apakah Anda yakin ingin menghapus pengguna "${deleteTarget?.name}"?`}
      />

      {/* Assign Role Modal */}
      <Modal
        isOpen={!!assignRoleTarget}
        onClose={() => setAssignRoleTarget(null)}
        title={`Assign Role — ${assignRoleTarget?.name}`}
        onConfirm={() => assignRolesMutation.mutate({ id: assignRoleTarget.id, role_ids: selectedRoles })}
        confirmLabel="Simpan Role"
        loading={assignRolesMutation.isPending}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Pilih role untuk <span className="font-semibold text-gray-700">{assignRoleTarget?.name}</span>.
          </p>
          {allRoles.length === 0 ? (
            <div className="flex justify-center py-4 text-gray-400 text-sm">Memuat data role...</div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {allRoles.map((role) => (
                <label key={role.id} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() =>
                      setSelectedRoles((prev) =>
                        prev.includes(role.id) ? prev.filter((x) => x !== role.id) : [...prev, role.id]
                      )
                    }
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{role.name}</p>
                    {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Assign Permission Modal */}
      <Modal
        isOpen={!!assignPermTarget}
        onClose={() => setAssignPermTarget(null)}
        title={`Assign Permission — ${assignPermTarget?.name}`}
        onConfirm={() => assignPermsMutation.mutate({ id: assignPermTarget.id, permission_ids: selectedPerms })}
        confirmLabel="Simpan Permission"
        loading={assignPermsMutation.isPending}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Pilih permission langsung untuk <span className="font-semibold text-gray-700">{assignPermTarget?.name}</span>.{' '}
            <span className="text-gray-400">(Di luar dari permission yg sudah dimiliki via role)</span>
          </p>
          {allPerms.length === 0 ? (
            <div className="flex justify-center py-4 text-gray-400 text-sm">Memuat data permission...</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{selectedPerms.length} dipilih dari {allPerms.length}</span>
                <div className="flex gap-3">
                  <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => setSelectedPerms(allPerms.map((p) => p.id))}>Pilih Semua</button>
                  <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => setSelectedPerms([])}>Kosongkan</button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {allPerms.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(perm.id)}
                      onChange={() =>
                        setSelectedPerms((prev) =>
                          prev.includes(perm.id) ? prev.filter((x) => x !== perm.id) : [...prev, perm.id]
                        )
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-mono text-blue-700">{perm.name}</span>
                    {perm.description && <span className="text-xs text-gray-400 truncate">— {perm.description}</span>}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Users
