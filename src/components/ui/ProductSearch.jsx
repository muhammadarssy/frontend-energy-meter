import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Package } from 'lucide-react'
import { getProducts } from '../../api/products'

/**
 * Searchable product combobox.
 *
 * Props:
 *   value          – product_id yang terpilih (string | '')
 *   selectedName   – nama produk yang terpilih (untuk display)
 *   onChange(prod) – dipanggil dengan full product object saat pilih, atau null saat clear
 *   placeholder    – placeholder input
 *   error          – pesan error validasi
 */
const ProductSearch = ({ value, selectedName = '', onChange, placeholder = 'Cari nama / kode produk...', error }) => {
  const [inputValue, setInputValue] = useState(selectedName)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Sync display text when selectedName changes from outside
  useEffect(() => {
    setInputValue(selectedName || '')
  }, [selectedName])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        // If user left input without picking, restore display name
        setInputValue(selectedName || '')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selectedName])

  const { data, isFetching } = useQuery({
    queryKey: ['product-search', search],
    queryFn: () => getProducts({ search, limit: 15, is_active: true }),
    enabled: open,
    staleTime: 10_000
  })

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    setOpen(true)

    // Clear selection if user starts typing freely
    if (value) onChange(null)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSearch(val), 300)
  }

  const handleFocus = () => {
    setOpen(true)
    if (!value) setSearch(inputValue)
  }

  const handleSelect = (product) => {
    setInputValue(product.name)
    setOpen(false)
    setSearch('')
    onChange(product)
  }

  const handleClear = () => {
    setInputValue('')
    setSearch('')
    setOpen(false)
    onChange(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const products = data?.data || []

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 ${value ? 'pr-8' : 'pr-3'} py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {isFetching ? (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">Mencari...</div>
          ) : products.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-400 text-center flex flex-col items-center gap-1">
              <Package className="w-5 h-5 text-gray-300" />
              {search ? `Tidak ditemukan untuk "${search}"` : 'Ketik untuk mencari produk'}
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {products.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                      value === p.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${value === p.id ? 'text-blue-700' : 'text-gray-800'}`}>
                        {p.name}
                      </p>
                      {p.sap_code && (
                        <p className="text-xs text-gray-400 font-mono">{p.sap_code}</p>
                      )}
                    </div>
                    {p.is_serialize && (
                      <span className="flex-shrink-0 text-xs text-blue-500 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                        SN
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default ProductSearch
