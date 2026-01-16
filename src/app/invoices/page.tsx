'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, Printer, Loader2, ArrowRight, X, Filter, FileText, Truck, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function InvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 1. Initialize Tab from URL or Default to 'pending'
  const initialTab = searchParams.get('tab') || 'pending'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  
  // FILTER STATE
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [availableYears, setAvailableYears] = useState<string[]>([])

  // MODAL STATE
  const [showModal, setShowModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  // 2. Sync State when URL changes (e.g. Back Button)
  useEffect(() => {
    const tab = searchParams.get('tab') || 'pending'
    setActiveTab(tab)
  }, [searchParams])

  useEffect(() => {
    fetchYears()
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [activeTab, selectedYear])

  // 3. Update URL when Tab is clicked
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.replace(`/invoices?tab=${tab}`, { scroll: false })
  }

  const fetchYears = async () => {
    const { data } = await supabase.from('orders').select('po_date').not('po_date', 'is', null)
    if (data) {
      const years = Array.from(new Set(data.map(item => new Date(item.po_date).getFullYear().toString())))
      setAvailableYears(years.sort().reverse())
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    let query = supabase.from('orders').select('*')

    if (selectedYear !== 'all') {
      const start = `${selectedYear}-01-01`
      const end = `${selectedYear}-12-31`
      query = query.gte('po_date', start).lte('po_date', end)
    }

    if (activeTab === 'pending') {
      query = query.eq('delivery_status', 'Delivered').is('invoice_number', null).order('delivery_date', { ascending: true })
    } else {
      query = query.not('invoice_number', 'is', null).order('po_date', { ascending: false }) 
    }

    const { data, error } = await query
    if (error) console.error('Error:', error)
    else setOrders(data || [])
    
    setLoading(false)
  }

  const promptGenerateInvoice = (order: any) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const confirmGeneration = async () => {
    if (!selectedOrder) return
    setProcessing(true)

    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'next_invoice_number').single()
    const nextInv = setting?.value || 1
    const finalDate = selectedOrder.delivery_date || selectedOrder.po_date;

    const { error } = await supabase.from('orders').update({ invoice_number: nextInv, invoice_date: finalDate }).eq('id', selectedOrder.id)

    if (!error) {
      await supabase.rpc('increment_counter', { row_key: 'next_invoice_number' })
      fetchOrders()
      closeModal()
    } else {
      alert('Error: ' + error.message)
    }
    setProcessing(false)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedOrder(null)
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 pt-6 px-4 relative">
      
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Invoices</h1>
        <p className="text-sm md:text-base text-gray-500 font-medium mt-1">Manage and generate your billing documents.</p>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex w-full md:w-auto gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-200">
          <button onClick={() => handleTabChange('pending')} className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black'}`}>To Generate</button>
          <button onClick={() => handleTabChange('history')} className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black'}`}>History</button>
        </div>

        <div className="w-full md:w-auto flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 md:py-2 shadow-sm">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full md:w-auto bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE / CARD VIEW */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-h-[300px]">
        {loading ? (
          <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300"/></div>
        ) : orders.length === 0 ? (
          <div className="p-20 text-center text-gray-400">
            {activeTab === 'pending' ? <p>All items invoiced!</p> : <p>No invoices found.</p>}
          </div>
        ) : (
          <>
            {/* MOBILE VIEW */}
            <div className="block md:hidden divide-y divide-gray-100">
                {orders.map((order) => {
                    const yearShort = String(new Date(order.po_date || new Date()).getFullYear()).slice(-2)
                    return (
                        <div key={order.id} className="p-5 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">PO Number</span>
                                    <span className="font-bold text-gray-900 text-lg">#{order.po_number}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Date</span>
                                    <span className="text-sm font-medium text-gray-600">{order.po_date}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Weight</span>
                                    <div className="font-bold text-gray-900">{order.weight_kg} kg</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                                    <div className="font-bold text-gray-900">{order.currency} {order.total_amount?.toLocaleString()}</div>
                                </div>
                            </div>

                            {activeTab === 'history' && (
                                <div className="flex gap-2">
                                    <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono font-bold border border-blue-100">
                                        INV: {String(order.invoice_number).padStart(4, '0')}/{yearShort}
                                    </div>
                                    <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono font-bold border border-green-100">
                                        DN: {order.delivery_note ? String(order.delivery_note).padStart(2, '0') : '--'}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pending' ? (
                                <button onClick={() => promptGenerateInvoice(order)} className="w-full bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                                    Generate Invoice <ArrowRight className="w-4 h-4"/>
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <Link href={`/invoices/${order.id}`} className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 border border-blue-100">
                                        <FileText className="w-4 h-4"/> Invoice
                                    </Link>
                                    <Link href={`/invoices/${order.id}/delivery-note`} className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 border border-green-100">
                                        <Truck className="w-4 h-4"/> Note
                                    </Link>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Date</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Details</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Qty</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Amount</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">
                      {activeTab === 'history' ? 'Refs' : 'Delivery Note'}
                    </th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const yearShort = String(new Date(order.po_date || new Date()).getFullYear()).slice(-2)
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-5 text-sm font-medium text-gray-500">
                          {order.po_date || order.delivery_date}
                        </td>
                        <td className="p-5 font-bold text-gray-900">PO #{order.po_number}</td>
                        <td className="p-5 text-sm font-bold text-gray-900">
                          {order.weight_kg}
                        </td>
                        <td className="p-5 text-sm font-bold text-gray-600">
                          {order.currency} {order.total_amount?.toLocaleString()}
                        </td>
                        <td className="p-5">
                          {activeTab === 'history' ? (
                            <div className="flex flex-col gap-1">
                               <span className="font-mono text-blue-600 font-bold text-xs">
                                 Inv: #{String(order.invoice_number).padStart(4, '0')}/{yearShort}
                               </span>
                               <span className="font-mono text-green-600 font-bold text-xs">
                                 DN: {order.delivery_note ? String(order.delivery_note).padStart(2, '0') : '--'}
                               </span>
                            </div>
                          ) : (
                            <span className="font-mono text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs">
                              DN: {order.delivery_note ? String(order.delivery_note).padStart(2, '0') : '--'}
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          {activeTab === 'pending' ? (
                            <button onClick={() => promptGenerateInvoice(order)} className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 ml-auto shadow-md">
                              Generate <ArrowRight className="w-3 h-3"/>
                            </button>
                          ) : (
                            <div className="flex justify-end gap-2">
                               <Link href={`/invoices/${order.id}`} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100" title="View Invoice">
                                  <FileText className="w-5 h-5"/>
                               </Link>
                               <Link href={`/invoices/${order.id}/delivery-note`} className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100" title="View Delivery Note">
                                  <Truck className="w-5 h-5"/>
                               </Link>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Invoice?</h3>
            <p className="text-sm text-gray-500 mb-8">This will create a permanent invoice number for <b>PO #{selectedOrder.po_number}</b>.</p>
            <div className="flex gap-3">
              <button onClick={closeModal} disabled={processing} className="flex-1 px-4 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={confirmGeneration} disabled={processing} className="flex-1 px-4 py-3.5 rounded-xl bg-black text-white font-bold text-sm flex justify-center items-center gap-2 shadow-lg">{processing ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}