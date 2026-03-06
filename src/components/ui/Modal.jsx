import React from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'
import Button from './Button'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = 'Simpan',
  cancelLabel = 'Batal',
  confirmVariant = 'primary',
  loading = false,
  size = 'md'
}) => {
  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }[size] || 'max-w-lg'

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizeClass} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {onConfirm && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default Modal
