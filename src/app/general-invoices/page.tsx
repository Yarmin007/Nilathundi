'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, FileText, ChevronRight, Loader2, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function GeneralInvoicesList() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchInvoices() }, [])

  const fetchInvoices = async () => {
    const { data } = await supabase.from('general_invoices').select('*').order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Other Invoices</h1>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Non-spice billing.</p>
        </div>
        <Link href="/general-invoices/new" className="bg-black text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-md active:scale-95 transition-transform">
            <Plus className="w-4 h-4"/> <span className="hidden md:inline">New Invoice</span><span className="md:hidden">New</span>
        </Link>
      </div>

      {loading ? (
          <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300"/></div>
      ) : invoices.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-100">
              <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2"/>
              <p className="text-gray-500 text-sm">No invoices found.</p>
          </div>
      ) : (
          <div className="space-y-3">
            {/* List of Cards */}
            {invoices.map(inv => (
                <Link key={inv.id} href={`/general-invoices/${inv.id}`} className="block bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-black transition-colors active:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="font-mono font-bold text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded">
                                NT {String(inv.invoice_number).padStart(2,'0')} / {inv.year}
                            </span>
                        </div>
                        <span className="font-extrabold text-gray-900">{inv.total_amount?.toLocaleString()} MVR</span>
                    </div>
                    
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="font-bold text-gray-800 text-sm mb-1">{inv.customer_name}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar className="w-3 h-3"/> {new Date(inv.date).toLocaleDateString()}
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300"/>
                    </div>
                </Link>
            ))}
          </div>
      )}
    </div>
  )
}