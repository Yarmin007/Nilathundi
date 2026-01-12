'use client'
import { X, AlertCircle } from 'lucide-react'

interface AlertDialogProps {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
}

export default function AlertDialog({ isOpen, title = "Notice", message, onClose }: AlertDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Box */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header (Icon + Close) */}
        <div className="flex justify-between items-start mb-4">
          <div className="bg-orange-50 p-3 rounded-full">
             <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-extrabold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Button */}
        <button 
          onClick={onClose}
          className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
        >
          Okay, Got it
        </button>

      </div>
    </div>
  )
}