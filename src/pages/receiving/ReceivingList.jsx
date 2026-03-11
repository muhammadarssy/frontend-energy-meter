import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight, ChevronDown, Plus, Search, Edit2,
  ScanLine, Trash2, X, PackageCheck, ClipboardCheck, History,
  Paperclip, Download, FileText, Image, File
} from 'lucide-react'
import {
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder,
  getReceivingHeaders, getReceivingHeader, createReceivingHeader,
  createReceivingItem, deleteReceivingItem,
  getSerialStagings, scanSerial, deleteSerial,
  getReceivingConfirmations, createReceivingConfirmation,
  getAttachments, uploadAttachments, deleteAttachment, FILE_BASE_URL
} from '../../api/receiving'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ProductSearch from '../../components/ui/ProductSearch'

const isConfirmed = (grHeader) => (grHeader._count?.confirmations ?? 0) > 0
const itemTypeLabel = { product: 'Produk', service: 'Servis', material: 'Material' }

// ─── Serial Scan Panel ────────────────────────────────────────────────────────
const SerialScanPanel = ({ item, onClose }) => {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [lastError, setLastError] = useState('')
  const [lastSuccess, setLastSuccess] = useState('')
  const inputRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['serials', item.id],
    queryFn: () => getSerialStagings(item.id),
    refetchInterval: 3000
  })

  const scanMutation = useMutation({
    mutationFn: (sn) => scanSerial(item.id, sn),
    onSuccess: (_, sn) => {
      qc.invalidateQueries({ queryKey: ['serials', item.id] })
      setLastSuccess(`✓ ${sn} berhasil discan`)
      setLastError('')
      setInput('')
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Gagal scan serial'
      setLastError(msg.includes('duplicate') || msg.includes('Duplikat') ? `Duplikat: ${input}` : msg)
      setLastSuccess('')
      setInput('')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (sid) => deleteSerial(item.id, sid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['serials', item.id] })
  })

  const serials = data?.data?.serials || []
  const scanned = serials.length

  const handleScan = (e) => {
    e.preventDefault()
    const sn = input.trim()
    if (!sn) return
    scanMutation.mutate(sn)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{item.product?.name} — Scan Barcode</p>
          <p className={`text-xs mt-0.5 font-semibold ${scanned >= item.quantity ? 'text-green-600' : 'text-blue-600'}`}>
            Sudah scan: {scanned} / {item.quantity}{scanned > item.quantity && ' ⚠️ Melebihi'}
          </p>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleScan} className="flex gap-2">
        <div className="flex-1 relative">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scan atau ketik serial number..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button type="submit" size="sm" disabled={!input.trim() || scanMutation.isPending}>Scan</Button>
      </form>
      {lastError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{lastError}</p>}
      {lastSuccess && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{lastSuccess}</p>}
      {isLoading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : serials.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">Belum ada serial discan</p>
      ) : (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {serials.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="font-mono text-gray-700">{i + 1}. {s.serial_number}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{s.scanned_at ? new Date(s.scanned_at).toLocaleTimeString('id-ID') : ''}</span>
                <button onClick={() => deleteMutation.mutate(s.id)} className="p-1 text-gray-300 hover:text-red-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
const AddItemModal = ({ headerId, grStatus, isOpen, onClose }) => {
  const qc = useQueryClient()
  const [form, setForm] = useState({ product_id: '', _product: null, quantity: '', item_type: 'product', is_serialized: false, notes: '' })
  const [errors, setErrors] = useState({})

  const mutation = useMutation({
    mutationFn: (d) => createReceivingItem(headerId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gr-detail', headerId] })
      setForm({ product_id: '', _product: null, quantity: '', item_type: 'product', is_serialized: false, notes: '' })
      setErrors({})
      onClose()
    }
  })

  const validate = () => {
    const errs = {}
    if (!form.product_id) errs.product_id = 'Pilih produk'
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = 'Kuantitas harus > 0'
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const { _product, ...payload } = form
    mutation.mutate({ ...payload, quantity: Number(form.quantity), notes: form.notes || undefined })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Item" onConfirm={handleSubmit} confirmLabel="Tambah" loading={mutation.isPending}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Produk <span className="text-red-500">*</span></label>
          <ProductSearch
            value={form.product_id}
            selectedName={form._product?.name || ''}
            onChange={(prod) => setForm(f => ({
              ...f,
              product_id: prod ? prod.id : '',
              _product: prod,
              is_serialized: prod ? prod.is_serialize : false
            }))}
            error={errors.product_id}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Kuantitas <span className="text-red-500">*</span></label>
            <input
              type="number" min={1}
              value={form.quantity}
              onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tipe Item</label>
            <select
              value={form.item_type}
              onChange={(e) => setForm(f => ({ ...f, item_type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="product">Produk</option>
              <option value="material">Material</option>
              <option value="service">Servis</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              id="add_serialized"
              type="checkbox"
              checked={form.is_serialized}
              onChange={(e) => setForm(f => ({ ...f, is_serialized: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="add_serialized" className="text-sm text-gray-700">Item memiliki serial number (perlu scan)</label>
          </div>
          {form.product_id && (
            <span className="text-xs text-gray-400 italic">otomatis dari produk</span>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Catatan</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2} placeholder="Opsional..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </Modal>
  )
}

// ─── Confirm Receiving Modal ──────────────────────────────────────────────────
const ConfirmReceivingModal = ({ headerId, isOpen, onClose }) => {
  const qc = useQueryClient()
  const [note, setNote] = useState('')

  React.useEffect(() => { if (isOpen) setNote('') }, [isOpen])

  const mutation = useMutation({
    mutationFn: (data) => createReceivingConfirmation(headerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receiving-confirmations', headerId] })
      qc.invalidateQueries({ queryKey: ['po-grs'] })
      onClose()
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Penerimaan"
      onConfirm={() => mutation.mutate({ note: note || undefined })}
      confirmLabel="Konfirmasi"
      loading={mutation.isPending}
    >
      <div className="space-y-3">
        {mutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {mutation.error?.response?.data?.message || 'Terjadi kesalahan'}
          </p>
        )}
        <p className="text-sm text-gray-600">Konfirmasi penerimaan barang ini? Riwayat konfirmasi akan disimpan.</p>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Catatan <span className="text-gray-400 font-normal">(opsional)</span></label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Catatan untuk konfirmasi ini..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </Modal>
  )
}

// ─── Documents Panel ──────────────────────────────────────────────────────────
const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
  if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
  return <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const DocumentsPanel = ({ entityType, entityId, readonly }) => {
  const qc = useQueryClient()
  const fileInputRef = React.useRef(null)
  const [selectedFiles, setSelectedFiles] = React.useState([])
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: () => getAttachments(entityType, entityId),
    enabled: !!entityId
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAttachment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', entityType, entityId] })
  })

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files))
    setUploadError('')
  }

  const handleUpload = async () => {
    if (!selectedFiles.length) return
    setUploading(true)
    setUploadError('')
    try {
      await uploadAttachments(entityType, entityId, selectedFiles)
      qc.invalidateQueries({ queryKey: ['attachments', entityType, entityId] })
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Gagal upload file')
    } finally {
      setUploading(false)
    }
  }

  const attachments = data?.data || []

  return (
    <div className="mt-1 mb-2 ml-4 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Paperclip className="w-3 h-3 text-gray-400" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dokumen</p>
        {attachments.length > 0 && (
          <span className="text-xs text-gray-400">({attachments.length})</span>
        )}
      </div>

      {/* Upload area */}
      {!readonly && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              id={`doc-input-${entityId}`}
            />
            <label
              htmlFor={`doc-input-${entityId}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200 bg-white rounded-lg hover:bg-blue-50 cursor-pointer"
            >
              <Paperclip className="w-3 h-3" /> Pilih File
            </label>
            {selectedFiles.length > 0 && (
              <>
                <span className="text-xs text-gray-500 truncate max-w-[180px]">
                  {selectedFiles.map(f => f.name).join(', ')}
                </span>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Mengupload...' : `Upload ${selectedFiles.length} file`}
                </button>
              </>
            )}
          </div>
          {uploadError && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{uploadError}</p>
          )}
          <p className="text-xs text-gray-400">Format: JPG, PNG, PDF, DOCX, XLSX (maks 10MB/file)</p>
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="flex justify-center py-2"><Spinner /></div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-1">Belum ada dokumen</p>
      ) : (
        <div className="space-y-1">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              {getFileIcon(att.file_type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{att.file_name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(att.file_size)}</p>
              </div>
              <a
                href={`${FILE_BASE_URL}${att.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-gray-400 hover:text-blue-600 rounded flex-shrink-0"
                title="Buka / Download"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              {!readonly && (
                <button
                  onClick={() => deleteMutation.mutate(att.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1 text-gray-300 hover:text-red-500 rounded flex-shrink-0"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── GR Row (expandable, lazy load items) ────────────────────────────────────
const GRRow = ({ grHeader }) => {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [scanItemId, setScanItemId] = useState(null)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['gr-detail', grHeader.id],
    queryFn: () => getReceivingHeader(grHeader.id),
    enabled: expanded
  })

  const { data: confData } = useQuery({
    queryKey: ['receiving-confirmations', grHeader.id],
    queryFn: () => getReceivingConfirmations(grHeader.id),
    enabled: expanded
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => deleteReceivingItem(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gr-detail', grHeader.id] })
      setDeleteTarget(null)
    }
  })

  const fullGR = data?.data
  const items = fullGR?.receiving_items || []
  const scanItem = items.find(i => i.id === scanItemId)
  const confirmations = confData?.data || []

  return (
    <div className="ml-6 border-l-2 border-blue-100 pl-3">
      {/* GR Header Row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-blue-50/60 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-50 group"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="text-blue-400 flex-shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <span className="font-mono font-semibold text-sm text-blue-800">{grHeader.gr_number}</span>
        <Badge color={isConfirmed(grHeader) ? 'green' : 'yellow'} className="text-xs">
          {isConfirmed(grHeader) ? 'Dikonfirmasi' : 'Pending'}
        </Badge>
        <span className="text-xs text-gray-500 ml-1">
          {grHeader.received_date ? new Date(grHeader.received_date).toLocaleDateString('id-ID') : '—'}
        </span>
        <span className="text-xs text-gray-400">{grHeader.location}</span>
        {grHeader.batch?.code && (
          <span className="text-xs text-gray-400 font-mono">• batch: {grHeader.batch.code}</span>
        )}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          {!isConfirmed(grHeader) && (
            <button
              onClick={() => setAddItemOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded-md"
            >
              <Plus className="w-3 h-3" /> Item
            </button>
          )}
          {!isConfirmed(grHeader) && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 hover:bg-green-100 rounded-md border border-green-200"
            >
              <ClipboardCheck className="w-3 h-3" /> Konfirmasi
            </button>
          )}
          <button
            onClick={() => { setDocsOpen(v => !v); if (!expanded) setExpanded(true) }}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border ${docsOpen ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-gray-500 hover:bg-gray-100 border-gray-200'}`}
          >
            <Paperclip className="w-3 h-3" /> Dokumen
          </button>
        </div>
      </div>

      {/* Items (expandable) */}
      {expanded && (
        <div className="ml-4 mt-1 mb-2">
          {isLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-gray-400">
              <PackageCheck className="w-6 h-6 mb-1 text-gray-300" />
              <p className="text-xs">Belum ada item</p>
              {!isConfirmed(grHeader) && (
                <button onClick={() => setAddItemOpen(true)} className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Tambah Item
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['#', 'Produk', 'Tipe', 'Qty', 'Serial', 'Catatan', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const scannedCount = item.serial_stagings?.length ?? 0
                    const isScanActive = item.id === scanItemId
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">
                            {item.product?.name}
                            {item.product?.sap_code && <span className="ml-1 text-gray-400 font-mono">({item.product.sap_code})</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{itemTypeLabel[item.item_type] || item.item_type}</td>
                          <td className="px-3 py-2 font-semibold text-gray-700">{item.quantity}</td>
                          <td className="px-3 py-2">
                            {item.is_serialized ? (
                              <span className={`font-semibold ${scannedCount >= item.quantity ? 'text-green-600' : 'text-blue-600'}`}>
                                {scannedCount}/{item.quantity}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-400 max-w-[120px] truncate">{item.notes || '—'}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              {item.is_serialized && (
                                <button
                                  onClick={() => setScanItemId(isScanActive ? null : item.id)}
                                  className={`p-1 rounded ${isScanActive ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                  title="Scan Serial"
                                >
                                  <ScanLine className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isConfirmed(grHeader) && (
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isScanActive && scanItem && (
                          <tr>
                            <td colSpan={7} className="px-3 pb-2">
                              <SerialScanPanel item={scanItem} onClose={() => setScanItemId(null)} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation History */}
      {expanded && confirmations.length > 0 && (
        <div className="ml-4 mt-1 mb-2">
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <History className="w-3 h-3 text-gray-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Riwayat Konfirmasi</p>
          </div>
          <div className="space-y-1">
            {confirmations.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-xs bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-gray-600 font-medium">{c.user?.name || '—'}</span>
                <span className="text-gray-400">{new Date(c.confirmed_at).toLocaleString('id-ID')}</span>
                {c.note && <span className="text-gray-500 truncate max-w-[200px]">· {c.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Panel */}
      {expanded && docsOpen && (
        <DocumentsPanel
          entityType="receiving_header"
          entityId={grHeader.id}
          readonly={isConfirmed(grHeader)}
        />
      )}

      <AddItemModal
        headerId={grHeader.id}
        isOpen={addItemOpen}
        onClose={() => setAddItemOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteItemMutation.mutate(deleteTarget?.id)}
        title="Hapus Item"
        message={`Hapus item "${deleteTarget?.product?.name || 'ini'}"?`}
        confirmLabel="Hapus"
        loading={deleteItemMutation.isPending}
      />

      <ConfirmReceivingModal
        headerId={grHeader.id}
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}

// ─── PO Row (expandable, lazy load GRs) ──────────────────────────────────────
const PORow = ({ po, onEditPO, onAddGR }) => {
  const [expanded, setExpanded] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['po-grs', po.id],
    queryFn: () => getReceivingHeaders({ purchase_order_id: po.id, limit: 100 }),
    enabled: expanded
  })

  const grs = data?.data || []

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* PO Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 group"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="text-gray-400 flex-shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono font-bold text-gray-800">{po.po_number}</span>
          <span className="text-xs text-gray-400">
            {po.order_date ? new Date(po.order_date).toLocaleDateString('id-ID') : '—'}
          </span>
          {po.notes && (
            <span className="text-xs text-gray-400 truncate max-w-[200px]">— {po.notes}</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onAddGR(po)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 hover:bg-green-50 rounded-md border border-green-200"
          >
            <Plus className="w-3 h-3" /> Tambah GR
          </button>
          <button
            onClick={() => onEditPO(po)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* GR List */}
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-gray-100 pt-2">
          {isLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : grs.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-xs">
              Belum ada GR untuk PO ini.{' '}
              <button onClick={() => onAddGR(po)} className="text-blue-600 hover:underline">Tambah GR</button>
            </div>
          ) : (
            grs.map(gr => <GRRow key={gr.id} grHeader={gr} />)
          )}
        </div>
      )}
    </div>
  )
}

// ─── Create Receiving Modal (PO + GR + Items dalam 1 form) ───────────────────
const defaultGRForm = { gr_number: '', location: '', received_date: '', notes: '' }
const defaultItem = () => ({ product_id: '', _product: null, quantity: '', item_type: 'product', is_serialized: false, notes: '' })

const CreateReceivingModal = ({ isOpen, onClose, preselectedPO }) => {
  const qc = useQueryClient()
  // PO section
  const [poMode, setPoMode] = useState('new')
  const [poForm, setPoForm] = useState({ po_number: '', order_date: '', notes: '' })
  const [selectedPoId, setSelectedPoId] = useState('')
  // GR section
  const [grForm, setGrForm] = useState(defaultGRForm)
  // Items section
  const [items, setItems] = useState([defaultItem()])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const { data: posData } = useQuery({
    queryKey: ['purchase-orders-all'],
    queryFn: () => getPurchaseOrders({ limit: 100 }),
    enabled: isOpen && !preselectedPO && poMode === 'existing'
  })

  const pos = posData?.data || []

  const resetForm = () => {
    setPoMode(preselectedPO ? 'existing' : 'new')
    setPoForm({ po_number: '', order_date: '', notes: '' })
    setSelectedPoId('')
    setGrForm(defaultGRForm)
    setItems([defaultItem()])
    setErrors({})
    setSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validate = () => {
    const errs = {}
    if (!preselectedPO) {
      if (poMode === 'new') {
        if (!poForm.po_number.trim()) errs.po_number = 'No. PO wajib diisi'
        if (!poForm.order_date) errs.order_date = 'Tanggal PO wajib diisi'
      } else {
        if (!selectedPoId) errs.selectedPoId = 'Pilih Purchase Order'
      }
    }
    if (!grForm.gr_number.trim()) errs.gr_number = 'No. GR wajib diisi'
    if (!grForm.location.trim()) errs.location = 'Lokasi wajib diisi'
    if (!grForm.received_date) errs.received_date = 'Tanggal penerimaan wajib diisi'
    items.forEach((item, i) => {
      if (!item.product_id) errs[`item_${i}_product`] = 'Pilih produk'
      if (!item.quantity || Number(item.quantity) <= 0) errs[`item_${i}_qty`] = 'Qty > 0'
    })
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)
    try {
      // 1. Resolve PO id
      let poId = preselectedPO?.id || selectedPoId
      if (!preselectedPO && poMode === 'new') {
        const poRes = await createPurchaseOrder({
          po_number: poForm.po_number.trim(),
          order_date: new Date(poForm.order_date).toISOString(),
          notes: poForm.notes || undefined
        })
        poId = poRes.data?.id
      }

      // 2. Create GR (batch auto-generated by backend)
      const grRes = await createReceivingHeader({
        gr_number: grForm.gr_number.trim(),
        location: grForm.location.trim(),
        received_date: new Date(grForm.received_date).toISOString(),
        notes: grForm.notes || undefined,
        purchase_order_id: poId
      })
      const grId = grRes.data?.id

      // 3. Create items
      for (const item of items) {
        if (item.product_id) {
          const { _product, ...itemPayload } = item
          await createReceivingItem(grId, {
            ...itemPayload,
            quantity: Number(item.quantity),
            notes: item.notes || undefined
          })
        }
      }

      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['po-grs', poId] })
      handleClose()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Terjadi kesalahan'
      setErrors(e => ({ ...e, _submit: msg }))
    } finally {
      setSubmitting(false)
    }
  }

  const addItem = () => setItems(arr => [...arr, defaultItem()])
  const removeItem = (i) => setItems(arr => arr.filter((_, idx) => idx !== i))
  const setItemField = (i, key, val) => setItems(arr => arr.map((it, idx) => idx === i ? { ...it, [key]: val } : it))
  const selectItemProduct = (i, prod) => {
    setItems(arr => arr.map((it, idx) => idx === i ? {
      ...it,
      product_id: prod ? prod.id : '',
      _product: prod,
      is_serialized: prod ? prod.is_serialize : false
    } : it))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={preselectedPO ? `Tambah GR — ${preselectedPO.po_number}` : 'Buat Penerimaan Baru'}
      onConfirm={handleSubmit}
      confirmLabel="Simpan"
      loading={submitting}
    >
      <div className="space-y-5">
        {errors._submit && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errors._submit}</p>
        )}

        {/* ── Section 1: PO ───────────────────────────────────── */}
        {!preselectedPO && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchase Order</p>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={poMode === 'new'} onChange={() => setPoMode('new')} className="text-blue-600" />
                <span className="text-sm text-gray-700">Buat PO Baru</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={poMode === 'existing'} onChange={() => setPoMode('existing')} className="text-blue-600" />
                <span className="text-sm text-gray-700">Pilih PO yang Ada</span>
              </label>
            </div>
            {poMode === 'new' ? (
              <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                <Input
                  label="No. Purchase Order" required
                  value={poForm.po_number}
                  onChange={(e) => setPoForm(f => ({ ...f, po_number: e.target.value }))}
                  error={errors.po_number}
                  placeholder="Contoh: PO-2026-001"
                />
                <Input
                  label="Tanggal PO" type="date" required
                  value={poForm.order_date}
                  onChange={(e) => setPoForm(f => ({ ...f, order_date: e.target.value }))}
                  error={errors.order_date}
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Catatan PO</label>
                  <textarea
                    value={poForm.notes}
                    onChange={(e) => setPoForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Opsional..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="pl-4 border-l-2 border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">Purchase Order <span className="text-red-500">*</span></label>
                <select
                  value={selectedPoId}
                  onChange={(e) => setSelectedPoId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih PO --</option>
                  {pos.map(p => <option key={p.id} value={p.id}>{p.po_number}</option>)}
                </select>
                {errors.selectedPoId && <p className="mt-1 text-xs text-red-500">{errors.selectedPoId}</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Section 2: GR ───────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Good Receipt (GR)</p>
          <div className="space-y-3 pl-4 border-l-2 border-gray-100">
            <Input
              label="No. GR" required
              value={grForm.gr_number}
              onChange={(e) => setGrForm(f => ({ ...f, gr_number: e.target.value }))}
              error={errors.gr_number}
              placeholder="Contoh: GR-2026-001"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Lokasi Penerimaan" required
                value={grForm.location}
                onChange={(e) => setGrForm(f => ({ ...f, location: e.target.value }))}
                error={errors.location}
                placeholder="Cth: Gudang A"
              />
              <Input
                label="Tanggal Penerimaan" type="date" required
                value={grForm.received_date}
                onChange={(e) => setGrForm(f => ({ ...f, received_date: e.target.value }))}
                error={errors.received_date}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Catatan GR</label>
              <textarea
                value={grForm.notes}
                onChange={(e) => setGrForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Opsional..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Items ─────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item yang Diterima</p>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Plus className="w-3 h-3" /> Tambah Item
            </button>
          </div>
          <div className="space-y-3 pl-4 border-l-2 border-gray-100">
            {items.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 relative">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="absolute top-2 right-2 p-0.5 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Produk <span className="text-red-500">*</span></label>
                  <ProductSearch
                    value={item.product_id}
                    selectedName={item._product?.name || ''}
                    onChange={(prod) => selectItemProduct(i, prod)}
                    error={errors[`item_${i}_product`]}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Qty <span className="text-red-500">*</span></label>
                    <input
                      type="number" min={1}
                      value={item.quantity}
                      onChange={(e) => setItemField(i, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors[`item_${i}_qty`] && <p className="mt-1 text-xs text-red-500">{errors[`item_${i}_qty`]}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Tipe</label>
                    <select
                      value={item.item_type}
                      onChange={(e) => setItemField(i, 'item_type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="product">Produk</option>
                      <option value="material">Material</option>
                      <option value="service">Servis</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer" title="Otomatis dari data produk, bisa diubah manual">
                      <input
                        type="checkbox"
                        checked={item.is_serialized}
                        onChange={(e) => setItemField(i, 'is_serialized', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-xs text-gray-600">
                        Serial
                        {item.product_id && <span className="ml-1 text-gray-400">(auto)</span>}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Edit PO Modal ────────────────────────────────────────────────────────────
const EditPOModal = ({ po, isOpen, onClose }) => {
  const qc = useQueryClient()
  const [form, setForm] = useState({ po_number: '', order_date: '', notes: '' })
  const [errors, setErrors] = useState({})

  React.useEffect(() => {
    if (po) {
      setForm({
        po_number: po.po_number || '',
        order_date: po.order_date ? po.order_date.slice(0, 10) : '',
        notes: po.notes || ''
      })
    }
  }, [po])

  const mutation = useMutation({
    mutationFn: (data) => updatePurchaseOrder(po.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      onClose()
    }
  })

  const validate = () => {
    const errs = {}
    if (!form.po_number.trim()) errs.po_number = 'No. PO wajib diisi'
    if (!form.order_date) errs.order_date = 'Tanggal PO wajib diisi'
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    mutation.mutate({
      po_number: form.po_number.trim(),
      order_date: new Date(form.order_date).toISOString(),
      notes: form.notes || undefined
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Purchase Order" onConfirm={handleSubmit} confirmLabel="Simpan" loading={mutation.isPending}>
      <div className="space-y-4">
        <Input label="No. Purchase Order" required value={form.po_number}
          onChange={(e) => setForm(f => ({ ...f, po_number: e.target.value }))}
          error={errors.po_number} placeholder="Contoh: PO-2026-001"
        />
        <Input label="Tanggal PO" type="date" required value={form.order_date}
          onChange={(e) => setForm(f => ({ ...f, order_date: e.target.value }))}
          error={errors.order_date}
        />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Catatan</label>
          <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3} placeholder="Opsional..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ReceivingList = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [addGRTarget, setAddGRTarget] = useState(null) // PO untuk Tambah GR
  const [editPOTarget, setEditPOTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', { page, search }],
    queryFn: () => getPurchaseOrders({ page, limit: 10, search })
  })

  const pos = data?.data || []
  const pagination = data?.meta?.pagination || {}

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Penerimaan Barang</h2>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4" /> Buat Penerimaan
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari No. PO..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">Cari</Button>
      </form>

      {/* Tree List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : pos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-14 text-gray-400">
          <PackageCheck className="w-10 h-10 mb-3 text-gray-300" />
          <p className="text-sm">Belum ada data penerimaan</p>
          <Button size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Buat Penerimaan
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {pos.map(po => (
            <PORow
              key={po.id}
              po={po}
              onEditPO={setEditPOTarget}
              onAddGR={setAddGRTarget}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.totalItems}
          limit={10}
          onPageChange={setPage}
        />
      )}

      {/* Modals */}
      <CreateReceivingModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <CreateReceivingModal
        isOpen={!!addGRTarget}
        onClose={() => setAddGRTarget(null)}
        preselectedPO={addGRTarget}
      />
      <EditPOModal po={editPOTarget} isOpen={!!editPOTarget} onClose={() => setEditPOTarget(null)} />
    </div>
  )
}

export default ReceivingList
