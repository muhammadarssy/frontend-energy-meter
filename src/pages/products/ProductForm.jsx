import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import {
  getProduct,
  createProduct,
  updateProduct,
  getSuppliers,
  getProductTypes,
  getProductCategories
} from '../../api/products'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
    <span className="text-sm text-gray-700">{label}</span>
  </div>
)

const ProductForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [form, setForm] = useState({
    sap_code: '',
    name: '',
    description: '',
    product_type_id: '',
    supplier_id: '',
    is_serialize: false,
    is_qc: false,
    is_active: true,
    category_ids: []
  })
  const [errors, setErrors] = useState({})

  // Fetch existing product data for edit
  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: isEdit
  })

  // Populate form when editing
  useEffect(() => {
    if (isEdit && productData?.data) {
      const p = productData.data
      setForm({
        sap_code: p.sap_code || '',
        name: p.name || '',
        description: p.description || '',
        product_type_id: p.product_type_id || '',
        supplier_id: p.supplier_id || '',
        is_serialize: p.is_serialize ?? false,
        is_qc: p.is_qc ?? false,
        is_active: p.is_active ?? true,
        category_ids: p.categories?.map((c) => c.id) || []
      })
    }
  }, [isEdit, productData])

  // Dropdown data
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers
  })

  const { data: typesData } = useQuery({
    queryKey: ['product-types'],
    queryFn: getProductTypes
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategories
  })

  const supplierOptions = (suppliersData?.data || []).map((s) => ({ value: s.id, label: s.name }))
  const typeOptions = (typesData?.data || []).map((t) => ({ value: t.id, label: t.name }))
  const categories = categoriesData?.data || []

  const createMutation = useMutation({
    mutationFn: (data) => createProduct(data),
    onSuccess: () => navigate('/products')
  })

  const updateMutation = useMutation({
    mutationFn: (data) => updateProduct(id, data),
    onSuccess: () => navigate('/products')
  })

  const validate = () => {
    const errs = {}
    if (!form.sap_code.trim()) errs.sap_code = 'Kode SAP wajib diisi'
    if (!form.name.trim()) errs.name = 'Nama produk wajib diisi'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    const payload = {
      ...form,
      product_type_id: form.product_type_id || undefined,
      supplier_id: form.supplier_id || undefined
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const toggleCategory = (catId) => {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(catId)
        ? f.category_ids.filter((id) => id !== catId)
        : [...f.category_ids, catId]
    }))
  }

  const isMutating = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error || updateMutation.error

  if (isEdit && loadingProduct) {
    return (
      <div className="flex justify-center py-12"><Spinner /></div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Error banner */}
          {mutationError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {mutationError.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode SAP"
              required
              value={form.sap_code}
              onChange={(e) => setForm((f) => ({ ...f, sap_code: e.target.value }))}
              error={errors.sap_code}
              placeholder="Masukkan kode SAP"
            />
            <Input
              label="Nama Produk"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
              placeholder="Masukkan nama produk"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Masukkan deskripsi produk..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipe Produk"
              value={form.product_type_id}
              onChange={(e) => setForm((f) => ({ ...f, product_type_id: e.target.value }))}
              options={typeOptions}
              placeholder="Pilih tipe produk"
            />
            <Select
              label="Supplier"
              value={form.supplier_id}
              onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
              options={supplierOptions}
              placeholder="Pilih supplier"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Toggle
              label="Produk Serialized"
              checked={form.is_serialize}
              onChange={(v) => setForm((f) => ({ ...f, is_serialize: v }))}
            />
            <Toggle
              label="Memerlukan QC"
              checked={form.is_qc}
              onChange={(v) => setForm((f) => ({ ...f, is_qc: v }))}
            />
            <Toggle
              label="Status Aktif"
              checked={form.is_active}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
            />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Kategori Produk</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = form.category_ids.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Waktu */}
          {isEdit && productData?.data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tanggal Dibuat</label>
                <p className="text-sm text-gray-700">
                  {productData.data.created_at
                    ? new Date(productData.data.created_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Terakhir Diperbarui</label>
                <p className="text-sm text-gray-700">
                  {productData.data.updated_at
                    ? new Date(productData.data.updated_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
            Batal
          </Button>
          <Button type="submit" loading={isMutating}>
            <Save className="w-4 h-4" />
            {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
