'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, DollarSign, Package, CheckCircle2, AlertCircle, FileText, Scale, Filter, Menu } from 'lucide-react'
import AlertDialog from '@/components/AlertDialog'

export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  
  // Filter States
  const [year, setYear] = useState('all') 
  const [month, setMonth] = useState('all') 

  // Statistics
  const [stats, setStats] = useState({
    pendingMVR: 0,
    pendingUSD: 0,
    earnedMVR: 0,
    earnedUSD: 0,
    weight: 0 
  })

  // Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: ''
  })

  useEffect(() => {
    fetchDashboardData()
  }, [month, year])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    let query = supabase
      .from('orders')
      .select('*')
      .order('po_date', { ascending: false })
      .order('invoice_number', { ascending: false })

    if (year !== 'all') {
      if (month !== 'all') {
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
        query = query.gte('po_date', `${year}-${month}-01`).lte('po_date', `${year}-${month}-${lastDay}`)
      } else {
        query = query.gte('po_date', `${year}-01-01`).lte('po_date', `${year}-12-31`)
      }
    }

    const { data, error } = await query
    if (error) console.error('Error fetching:', error)
    
    const fetchedOrders = data || []
    setOrders(fetchedOrders)

    let pendingMVR = 0, pendingUSD = 0, earnedMVR = 0, earnedUSD = 0, totalKg = 0

    fetchedOrders.forEach(order => {
      const amount = Number(order.total_amount || 0)
      const currency = order.currency?.trim().toUpperCase() || 'MVR'
      let currentWeight = 0
      
      if (currency === 'USD') {
          currentWeight = amount / 11
      } else {
          currentWeight = Number(order.weight_kg || 0)
      }
      totalKg += currentWeight

      if (order.payment_status === 'Paid') {
        if (currency === 'MVR') earnedMVR += amount
        else if (currency === 'USD') earnedUSD += amount
      } else {
        if (currency === 'MVR') pendingMVR += amount
        else if (currency === 'USD') pendingUSD += amount
      }
    })

    setStats({ pendingMVR, pendingUSD, earnedMVR, earnedUSD, weight: totalKg })
    setLoading(false)
  }

  const getYearSuffix = (dateStr: string) => {
    if (!dateStr) return '26'
    return new Date(dateStr).getFullYear().toString().slice(-2)
  }

  const togglePayment = async (order: any) => {
    if (!order.invoice_number) {
        setAlertState({ isOpen: true, title: "Action Blocked", message: "Generate an invoice first!" })
        return
    }
    const newStatus = order.payment_status === 'Paid' ? 'Pending' : 'Paid'
    setOrders(orders.map(o => o.id === order.id ? { ...o, payment_status: newStatus } : o))
    await supabase.from('orders').update({ payment_status: newStatus }).eq('id', order.id)
    fetchDashboardData()
  }

  const markDelivered = async (order: any) => {
    if (order.delivery_status === 'Delivered') return
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'next_delivery_note').single()
    const nextId = setting?.value || 1

    await supabase.from('orders').update({
      delivery_status: 'Delivered',
      delivery_note: nextId, 
      delivery_date: new Date().toISOString().split('T')[0] 
    }).eq('id', order.id)

    await supabase.rpc('increment_counter', { row_key: 'next_delivery_note' })
    fetchDashboardData()
  }

  return (
    // MOBILE FIX: Added horizontal padding (px-4)
    <div className="max-w-7xl mx-auto pb-20 pt-4 md:pt-8 px-4 relative">
      
      {/* HEADER: Flex-col for mobile (stacks vertically), Row for Desktop */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-6 md:mb-10 gap-6">
        <div className="h-16 md:h-24 w-auto">
          {/* Logo SVG */}
          <svg viewBox="0 0 1729.3 1384.1" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
            <defs><style>{`.cls-1{font-size:270px;font-family:sans-serif;font-weight:800;fill:#000;}.cls-2{font-size:139px;font-family:sans-serif;font-weight:600;fill:#000;letter-spacing:0.05em;}.shape-black{fill:#1a1a1a;}.shape-orange{fill:#f26722;}`}</style></defs>
            <g>
              <polygon className="shape-black" points="1214.4,280.2 1214.4,820.7 1022.5,820.7 673.9,472.1 673.9,672.7 821.9,820.7 673.9,820.7 514.9,820.7 514.9,280.2 706.8,280.2 1055.4,628.8 1055.4,280.2 1214.4,280.2"/>
              <polygon className="shape-orange" points="514.9,0 514.9,166.9 763.8,166.9 975,422.3 975,166.9 1214.4,166.9 1214.4,0 514.9,0"/>
              <text className="cls-1" x="0" y="1185">NILA THUNDI</text>
              <text className="cls-2" x="410" y="1355">INVESTMENT</text>
            </g>
          </svg>
        </div>

        {/* FILTERS: Full width on mobile */}
        <div className="flex w-full md:w-auto justify-between md:justify-start gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
           <div className="flex items-center px-3 text-gray-400"><Filter className="w-4 h-4" /></div>
           <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent font-bold text-sm p-2 outline-none cursor-pointer text-gray-700 flex-1 md:flex-none">
             <option value="all">All Months</option>
             <option disabled>──────────</option>
             {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>Month {m}</option>)}
           </select>
           <div className="w-[1px] bg-gray-200 my-1"></div>
           <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent font-bold text-sm p-2 outline-none cursor-pointer text-gray-700 flex-1 md:flex-none">
             <option value="all">All Years</option>
             <option value="2026">2026</option>
             <option value="2025">2025</option>
             <option value="2024">2024</option>
           </select>
        </div>
      </div>

      {/* STATS CARDS: Grid 1 column on mobile, 5 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 mb-8">
        {/* Pending MVR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-row md:flex-col justify-between items-center md:items-start">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase"><AlertCircle className="w-4 h-4"/> Pending (MVR)</div>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900">{stats.pendingMVR.toLocaleString()}</div>
        </div>

        {/* Pending USD */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-row md:flex-col justify-between items-center md:items-start">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase"><AlertCircle className="w-4 h-4"/> Pending (USD)</div>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900">${stats.pendingUSD.toLocaleString()}</div>
        </div>

        {/* Earned MVR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-row md:flex-col justify-between items-center md:items-start">
          <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase"><DollarSign className="w-4 h-4"/> Earned (MVR)</div>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900">{stats.earnedMVR.toLocaleString()}</div>
        </div>

        {/* Earned USD */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-row md:flex-col justify-between items-center md:items-start">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase"><DollarSign className="w-4 h-4"/> Earned (USD)</div>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900">${stats.earnedUSD.toLocaleString()}</div>
        </div>

        {/* Weight */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-row md:flex-col justify-between items-center md:items-start">
           <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase"><Scale className="w-4 h-4"/> Total Weight</div>
           <div className="text-2xl md:text-3xl font-extrabold text-gray-900">{stats.weight.toFixed(1)} <span className="text-sm text-gray-400">kg</span></div>
        </div>
      </div>

      {/* TABLE: Added overflow-x-auto to make it scrollable on mobile */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order List</span>
         </div>
         
         <div className="overflow-x-auto">
           <table className="w-full text-left whitespace-nowrap">
             <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase">Date</th>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase">Details</th>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase">Status</th>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase">Invoice</th>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {loading ? (
                 <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-300"/></td></tr>
               ) : orders.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-400">No orders found.</td></tr>
               ) : orders.map((order) => {
                 const yearSuffix = getYearSuffix(order.po_date)
                 const currency = order.currency?.trim().toUpperCase() || 'MVR'
                 const amount = Number(order.total_amount || 0)
                 
                 const displayWeight = currency === 'USD' 
                     ? (amount / 11).toFixed(1) 
                     : Number(order.weight_kg || 0).toFixed(0)

                 return (
                 <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                   <td className="p-5 text-sm font-medium text-gray-500 w-32">
                      {order.po_date || order.delivery_date}
                   </td>
                   <td className="p-5">
                     <div className="font-bold text-gray-900 text-lg">PO #{order.po_number}</div>
                     <div className="text-xs text-gray-500 font-bold mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded">
                       {currency} {amount.toLocaleString()} • <span className="text-black">{displayWeight} kg</span>
                     </div>
                   </td>
                   <td className="p-5">
                     {order.delivery_status === 'Delivered' ? (
                       <div className="flex items-center gap-3">
                         <CheckCircle2 className="w-5 h-5 text-green-500"/>
                         <div>
                           <span className="block text-xs font-bold text-green-700 uppercase">Delivered</span>
                           {(order.delivery_note || order.delivery_note_number) && (
                              <span className="block text-[10px] font-mono text-gray-400">
                                  DN: {String(order.delivery_note || order.delivery_note_number).padStart(2,'0')}/{yearSuffix}
                              </span>
                           )}
                         </div>
                       </div>
                     ) : (
                       <button onClick={() => markDelivered(order)} className="flex items-center gap-2 text-gray-600 bg-white border border-gray-200 hover:bg-black hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                         <Package className="w-4 h-4"/> Mark Delivered
                       </button>
                     )}
                   </td>
                   <td className="p-5">
                     {order.invoice_number ? (
                       <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600"/>
                          <span className="text-sm font-bold font-mono text-blue-600">
                              #{String(order.invoice_number).padStart(4,'0')}/{yearSuffix}
                          </span>
                       </div>
                     ) : (
                       <span className="text-xs font-bold text-gray-300">--</span>
                   )}
                   </td>
                   <td className="p-5 text-right">
                     <button 
                       onClick={() => togglePayment(order)}
                       className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                         order.payment_status === 'Paid' 
                         ? 'bg-black text-white border-black' 
                         : 'bg-white text-gray-500 hover:text-red-500 hover:border-red-500'
                       }`}
                     >
                       {order.payment_status === 'Paid' ? 'PAID' : 'MARK PAID'}
                     </button>
                   </td>
                 </tr>
                 )
               })}
             </tbody>
           </table>
         </div>
      </div>

      <AlertDialog 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
      />
    </div>
  )
}