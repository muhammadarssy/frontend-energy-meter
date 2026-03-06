import apiClient from './client'

// QC Templates
export const getQcTemplates = async (params = {}) => {
  const res = await apiClient.get('/qc-templates', { params })
  return res.data
}

export const createQcTemplate = async (data) => {
  const res = await apiClient.post('/qc-templates', data)
  return res.data
}

export const updateQcTemplate = async (id, data) => {
  const res = await apiClient.patch(`/qc-templates/${id}`, data)
  return res.data
}

export const deleteQcTemplate = async (id) => {
  const res = await apiClient.delete(`/qc-templates/${id}`)
  return res.data
}

// Checklist Items
export const getChecklistItems = async (templateId) => {
  const res = await apiClient.get(`/qc-templates/${templateId}/checklist-items`)
  return res.data
}

export const addChecklistItem = async (templateId, data) => {
  const res = await apiClient.post(`/qc-templates/${templateId}/checklist-items`, data)
  return res.data
}

export const updateChecklistItem = async (templateId, itemId, data) => {
  const res = await apiClient.patch(`/qc-templates/${templateId}/checklist-items/${itemId}`, data)
  return res.data
}

export const deleteChecklistItem = async (templateId, itemId) => {
  const res = await apiClient.delete(`/qc-templates/${templateId}/checklist-items/${itemId}`)
  return res.data
}

// Level Inspection per template (1:1)
export const getTemplateLevelInspection = async (templateId) => {
  const res = await apiClient.get(`/qc-templates/${templateId}/level-inspection`)
  return res.data
}

export const saveTemplateLevelInspection = async (templateId, data) => {
  const res = await apiClient.put(`/qc-templates/${templateId}/level-inspection`, data)
  return res.data
}

export const deleteTemplateLevelInspection = async (templateId) => {
  const res = await apiClient.delete(`/qc-templates/${templateId}/level-inspection`)
  return res.data
}

// Defect Types
export const getDefectTypes = async (params = {}) => {
  const res = await apiClient.get('/defect-types', { params })
  return res.data
}

export const createDefectType = async (data) => {
  const res = await apiClient.post('/defect-types', data)
  return res.data
}

export const updateDefectType = async (id, data) => {
  const res = await apiClient.patch(`/defect-types/${id}`, data)
  return res.data
}

export const deleteDefectType = async (id) => {
  const res = await apiClient.delete(`/defect-types/${id}`)
  return res.data
}
