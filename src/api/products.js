import apiClient from './client'

// Products
export const getProducts = async (params = {}) => {
  const res = await apiClient.get('/products', { params })
  return res.data
}

export const getProduct = async (id) => {
  const res = await apiClient.get(`/products/${id}`)
  return res.data
}

export const createProduct = async (data) => {
  const res = await apiClient.post('/products', data)
  return res.data
}

export const updateProduct = async (id, data) => {
  const res = await apiClient.patch(`/products/${id}`, data)
  return res.data
}

export const deleteProduct = async (id) => {
  const res = await apiClient.delete(`/products/${id}`)
  return res.data
}

// QC Templates assigned to a product (via /products/:id/level-inspections)
export const getProductQcTemplates = async (productId) => {
  const res = await apiClient.get(`/products/${productId}/level-inspections`)
  return res.data
}

export const assignQcTemplate = async (productId, qcTemplateId) => {
  const res = await apiClient.post(`/products/${productId}/level-inspections`, { qc_template_id: qcTemplateId })
  return res.data
}

export const unassignQcTemplate = async (productId, templateId) => {
  const res = await apiClient.delete(`/products/${productId}/level-inspections/${templateId}`)
  return res.data
}

// Master dropdowns (untuk select/options)
export const getSuppliers = async (params = {}) => {
  const res = await apiClient.get('/master/suppliers', { params: { limit: 100, ...params } })
  return res.data
}

export const getProductTypes = async (params = {}) => {
  const res = await apiClient.get('/master/product-types', { params: { limit: 100, ...params } })
  return res.data
}

export const getProductCategories = async (params = {}) => {
  const res = await apiClient.get('/master/product-categories', { params: { limit: 100, ...params } })
  return res.data
}

// Suppliers CRUD
export const createSupplier = async (data) => {
  const res = await apiClient.post('/master/suppliers', data)
  return res.data
}

export const updateSupplier = async (id, data) => {
  const res = await apiClient.patch(`/master/suppliers/${id}`, data)
  return res.data
}

export const deleteSupplier = async (id) => {
  const res = await apiClient.delete(`/master/suppliers/${id}`)
  return res.data
}

// Product Types CRUD
export const createProductType = async (data) => {
  const res = await apiClient.post('/master/product-types', data)
  return res.data
}

export const updateProductType = async (id, data) => {
  const res = await apiClient.patch(`/master/product-types/${id}`, data)
  return res.data
}

export const deleteProductType = async (id) => {
  const res = await apiClient.delete(`/master/product-types/${id}`)
  return res.data
}

// Product Categories CRUD
export const createProductCategory = async (data) => {
  const res = await apiClient.post('/master/product-categories', data)
  return res.data
}

export const updateProductCategory = async (id, data) => {
  const res = await apiClient.patch(`/master/product-categories/${id}`, data)
  return res.data
}

export const deleteProductCategory = async (id) => {
  const res = await apiClient.delete(`/master/product-categories/${id}`)
  return res.data
}

// ─── Import / Export ────────────────────────────────────────────────────────

export const exportProducts = async (params = {}) => {
  const res = await apiClient.get('/products/export', { params, responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = `products_${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export const downloadProductTemplate = async () => {
  const res = await apiClient.get('/products/template', { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = 'products_template.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export const importProducts = async (file) => {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post('/products/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}
