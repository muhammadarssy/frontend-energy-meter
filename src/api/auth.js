import apiClient from './client'

export const login = async (loginField, password) => {
  const res = await apiClient.post('/auth/login', { login: loginField, password })
  return res.data
}

export const getMe = async () => {
  const res = await apiClient.get('/auth/me')
  return res.data
}

export const getUsers = async (params = {}) => {
  const res = await apiClient.get('/auth/users', { params })
  return res.data
}

export const createUser = async (data) => {
  const res = await apiClient.post('/auth/users', data)
  return res.data
}

export const updateUser = async (id, data) => {
  const res = await apiClient.patch(`/auth/users/${id}`, data)
  return res.data
}

export const deleteUser = async (id) => {
  const res = await apiClient.delete(`/auth/users/${id}`)
  return res.data
}

export const assignUserRoles = async (id, role_ids) => {
  const res = await apiClient.put(`/auth/users/${id}/roles`, { role_ids })
  return res.data
}

export const assignUserPermissions = async (id, permission_ids) => {
  const res = await apiClient.put(`/auth/users/${id}/permissions`, { permission_ids })
  return res.data
}

// ─── Roles ────────────────────────────────────────────────────────────────────
export const getRoles = async () => {
  const res = await apiClient.get('/auth/roles')
  return res.data
}

export const createRole = async (data) => {
  const res = await apiClient.post('/auth/roles', data)
  return res.data
}

export const updateRole = async (id, data) => {
  const res = await apiClient.patch(`/auth/roles/${id}`, data)
  return res.data
}

export const deleteRole = async (id) => {
  const res = await apiClient.delete(`/auth/roles/${id}`)
  return res.data
}

export const assignRolePermissions = async (id, permission_ids) => {
  const res = await apiClient.put(`/auth/roles/${id}/permissions`, { permission_ids })
  return res.data
}

// ─── Permissions ──────────────────────────────────────────────────────────────
export const getPermissions = async () => {
  const res = await apiClient.get('/auth/permissions')
  return res.data
}

export const createPermission = async (data) => {
  const res = await apiClient.post('/auth/permissions', data)
  return res.data
}

export const updatePermission = async (id, data) => {
  const res = await apiClient.patch(`/auth/permissions/${id}`, data)
  return res.data
}

export const deletePermission = async (id) => {
  const res = await apiClient.delete(`/auth/permissions/${id}`)
  return res.data
}
