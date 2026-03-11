import apiClient from './client'

export const getTrackingItems = async (params = {}) => {
  const res = await apiClient.get('/tracking', { params })
  return res.data
}

export const getTrackingItem = async (id) => {
  const res = await apiClient.get(`/tracking/${id}`)
  return res.data
}
