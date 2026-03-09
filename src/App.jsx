import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './layouts/AppLayout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Users from './pages/users/Users'
import Products from './pages/products/Products'
import ProductForm from './pages/products/ProductForm'
import LevelInspections from './pages/products/LevelInspections'
import QcTemplates from './pages/qc-master/QcTemplates'
import DefectTypes from './pages/qc-master/DefectTypes'
import Suppliers from './pages/master/Suppliers'
import ProductTypes from './pages/master/ProductTypes'
import ProductCategories from './pages/master/ProductCategories'
import Roles from './pages/roles/Roles'
import Permissions from './pages/roles/Permissions'
import ReceivingList from './pages/receiving/ReceivingList'
import WarehouseRequests from './pages/receiving/WarehouseRequests'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="products/:id/level-inspections" element={<LevelInspections />} />
        <Route path="qc-master/templates" element={<QcTemplates />} />
        <Route path="qc-master/defect-types" element={<DefectTypes />} />
        <Route path="master/suppliers" element={<Suppliers />} />
        <Route path="master/product-types" element={<ProductTypes />} />
        <Route path="master/product-categories" element={<ProductCategories />} />
        <Route path="access/roles" element={<Roles />} />
        <Route path="access/permissions" element={<Permissions />} />
        <Route path="receiving" element={<ReceivingList />} />
        <Route path="receiving/warehouse-requests" element={<WarehouseRequests />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
