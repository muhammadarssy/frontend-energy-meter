import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Layers, Download, Upload, FileDown, CheckCircle, XCircle } from 'lucide-react'
import { getProducts, deleteProduct, exportProducts, downloadProductTemplate, importProducts } from '../../api/products'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const Products = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const fileInputRef = useRef(null)

  const params = {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(isActiveFilter !== '' ? { is_active: isActiveFilter } : {})
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setDeleteTarget(null) }
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const products = data?.data || []
  const pagination = data?.meta?.pagination || {}

  return (
    <div className="space-y-4">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setImportLoading(true)
          setImportResult(null)
          try {
            const res = await importProducts(file)
            setImportResult(res.data || res)
            qc.invalidateQueries({ queryKey: ['products'] })
          } catch (err) {
            setImportResult({ error: err?.response?.data?.message || 'Import gagal' })
          } finally {
            setImportLoading(false)
            e.target.value = ''
          }
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Produk</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try { await downloadProductTemplate() } catch {}
            }}
          >
            <FileDown className="w-4 h-4" /> Template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={importLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={exportLoading}
            onClick={async () => {
              setExportLoading(true)
              try { await exportProducts(params) } catch {}
              setExportLoading(false)
            }}
          >
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={() => navigate('/products/new')} size="sm">
            <Plus className="w-4 h-4" /> Tambah Produk
          </Button>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-xl border p-4 text-sm ${
          importResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              {importResult.error
                ? <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                : <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />}
              <div>
                {importResult.error ? (
                  <p>{importResult.error}</p>
                ) : (
                  <>
                    <p className="font-medium">Import selesai</p>
                    <p className="mt-0.5">
                      Dibuat: <strong>{importResult.created}</strong> &nbsp;|
                      Diperbarui: <strong>{importResult.updated}</strong> &nbsp;|
                      Dilewati: <strong>{importResult.skipped}</strong>
                    </p>
                    {importResult.errors?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-700">Baris dengan error ({importResult.errors.length}):</p>
                        <ul className="mt-1 space-y-0.5">
                          {importResult.errors.map((e, i) => (
                            <li key={i} className="text-red-600 text-xs">
                              Baris {e.row} {e.sap_code ? `(${e.sap_code})` : ''}: {e.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari kode SAP, nama produk..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={isActiveFilter}
            onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
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
                    {['No', 'Kode SAP', 'Nama Produk', 'Tipe', 'Supplier', 'Kategori', 'Serialized', 'QC', 'Status', 'Tgl Dibuat', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                        Tidak ada data produk
                      </td>
                    </tr>
                  ) : products.map((product, idx) => (
                    <tr key={product.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{product.sap_code || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-4 py-3 text-gray-600">{product.product_type?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{product.supplier?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(product.categories || []).length === 0
                            ? <span className="text-gray-400 text-xs">—</span>
                            : (product.categories || []).map((cm) => (
                              <Badge key={cm.id || cm.category_id} color="yellow">
                                {cm.name || cm.category?.name}
                              </Badge>
                            ))
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={product.is_serialize ? 'blue' : 'gray'}>
                          {product.is_serialize ? 'Ya' : 'Tidak'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={product.is_qc ? 'purple' : 'gray'}>
                          {product.is_qc ? 'Ya' : 'Tidak'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={product.is_active ? 'green' : 'gray'}>
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/products/${product.id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/products/${product.id}/level-inspections`)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Level Inspeksi"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
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
                totalPages={pagination.totalPages}
                total={pagination.totalItems}
                limit={limit}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        message={`Apakah Anda yakin ingin menghapus produk "${deleteTarget?.name}"?`}
      />
    </div>
  )
}

export default Products
