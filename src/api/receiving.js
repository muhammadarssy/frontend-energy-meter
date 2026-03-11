import apiClient from './client'

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export const getPurchaseOrders = async (params = {}) => {
  const res = await apiClient.get('/purchase-orders', { params })
  return res.data
}

export const getPurchaseOrder = async (id) => {
  const res = await apiClient.get(`/purchase-orders/${id}`)
  return res.data
}

export const createPurchaseOrder = async (data) => {
  const res = await apiClient.post('/purchase-orders', data)
  return res.data
}

export const updatePurchaseOrder = async (id, data) => {
  const res = await apiClient.patch(`/purchase-orders/${id}`, data)
  return res.data
}

// ─── Batches ─────────────────────────────────────────────────────────────────

export const getBatches = async (params = {}) => {
  const res = await apiClient.get('/batches', { params })
  return res.data
}

export const createBatch = async (data) => {
  const res = await apiClient.post('/batches', data)
  return res.data
}

// ─── Receiving Headers ────────────────────────────────────────────────────────

export const getReceivingHeaders = async (params = {}) => {
  const res = await apiClient.get('/receiving-headers', { params })
  return res.data
}

export const getReceivingHeader = async (id) => {
  const res = await apiClient.get(`/receiving-headers/${id}`)
  return res.data
}

export const createReceivingHeader = async (data) => {
  const res = await apiClient.post('/receiving-headers', data)
  return res.data
}

export const updateReceivingHeader = async (id, data) => {
  const res = await apiClient.patch(`/receiving-headers/${id}`, data)
  return res.data
}

// ─── Receiving Items ──────────────────────────────────────────────────────────

export const getReceivingItems = async (headerId) => {
  const res = await apiClient.get(`/receiving-headers/${headerId}/items`)
  return res.data
}

export const createReceivingItem = async (headerId, data) => {
  const res = await apiClient.post(`/receiving-headers/${headerId}/items`, data)
  return res.data
}

export const updateReceivingItem = async (itemId, data) => {
  const res = await apiClient.patch(`/receiving-items/${itemId}`, data)
  return res.data
}

export const deleteReceivingItem = async (itemId) => {
  const res = await apiClient.delete(`/receiving-items/${itemId}`)
  return res.data
}

// ─── Receiving Confirmations ──────────────────────────────────────────────────

export const getReceivingConfirmations = async (headerId) => {
  const res = await apiClient.get(`/receiving-headers/${headerId}/confirmations`)
  return res.data
}

export const createReceivingConfirmation = async (headerId, data) => {
  const res = await apiClient.post(`/receiving-headers/${headerId}/confirmations`, data)
  return res.data
}

// ─── Serial Stagings ─────────────────────────────────────────────────────────

export const getSerialStagings = async (receivingItemId) => {
  const res = await apiClient.get(`/receiving-items/${receivingItemId}/serials`)
  return res.data
}

export const getSerialStatus = async (receivingItemId) => {
  const res = await apiClient.get(`/receiving-items/${receivingItemId}/serials/status`)
  return res.data
}

export const scanSerial = async (receivingItemId, serialNumber) => {
  const res = await apiClient.post(`/receiving-items/${receivingItemId}/serials/scan`, { serial_number: serialNumber })
  return res.data
}

export const deleteSerial = async (receivingItemId, serialId) => {
  const res = await apiClient.delete(`/receiving-items/${receivingItemId}/serials/${serialId}`)
  return res.data
}

// ─── Warehouse Requests ───────────────────────────────────────────────────────

export const getWarehouseRequests = async (params = {}) => {
  const res = await apiClient.get('/warehouse-requests', { params })
  return res.data
}

export const createWarehouseRequest = async (data) => {
  const res = await apiClient.post('/warehouse-requests', data)
  return res.data
}

export const approveWarehouseRequest = async (id) => {
  const res = await apiClient.patch(`/warehouse-requests/${id}/approve`)
  return res.data
}

export const rejectWarehouseRequest = async (id, data) => {
  const res = await apiClient.patch(`/warehouse-requests/${id}/reject`, data)
  return res.data
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export const FILE_BASE_URL = apiClient.defaults.baseURL.replace('/api', '')

export const getAttachments = async (entityType, entityId) => {
  const res = await apiClient.get(`/attachments/entity/${entityType}/${entityId}`)
  return res.data
}

export const uploadAttachments = async (entityType, entityId, files) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  formData.append('entity_type', entityType)
  formData.append('entity_id', entityId)
  const res = await apiClient.post('/attachments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const deleteAttachment = async (id) => {
  const res = await apiClient.delete(`/attachments/${id}`)
  return res.data
}
