import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://192.168.3.171:3020/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor — attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('em_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('em_token')
      localStorage.removeItem('em_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
