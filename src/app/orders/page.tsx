'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, DollarSign, Package, CheckCircle2, AlertCircle, FileText, Scale } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  
  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    earnedMVR: 0,
    earnedUSD: 0,
    weight: 0 
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    // FETCH ALL ORDERS
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('delivery_date', { ascending: false }) 
      .order('po_date', { ascending: false })

    if (error) console.error('Error fetching:', error)
    
    const fetchedOrders = data || []
    setOrders(fetchedOrders)

    // Calculate Stats
    let pending = 0
    let mvr = 0
    let usd = 0
    let totalKg = 0

    fetchedOrders.forEach(order => {
      let currentWeight = 0
      if (order.currency === 'USD') {
          currentWeight = (order.total_amount || 0) / 11
      } else {
          currentWeight = order.weight_kg || 0
      }
      totalKg += currentWeight

      if (order.payment_status === 'Paid') {
        if (order.currency === 'MVR') mvr += order.total_amount
        if (order.currency === 'USD') usd += order.total_amount
      } else {
        if (order.currency === 'MVR') pending += order.total_amount
      }
    })

    setStats({ pending, earnedMVR: mvr, earnedUSD: usd, weight: totalKg })
    setLoading(false)
  }

  // --- HELPER: GET DYNAMIC YEAR ---
  const getYearSuffix = (dateStr: string) => {
    if (!dateStr) return '26' 
    return new Date(dateStr).getFullYear().toString().slice(-2)
  }

  // --- ACTIONS ---

  const togglePayment = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid'
    setOrders(orders.map(o => o.id === id ? { ...o, payment_status: newStatus } : o))
    await supabase.from('orders').update({ payment_status: newStatus }).eq('id', id)
    fetchDashboardData()
  }

  const markDelivered = async (order: any) => {
    if (order.delivery_status === 'Delivered') return

    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'next_delivery_note').single()
    const nextId = setting?.value || 1

    await supabase.from('orders').update({
      delivery_status: 'Delivered',
      delivery_note_number: nextId,
      delivery_date: new Date().toISOString().split('T')[0] 
    }).eq('id', order.id)

    await supabase.rpc('increment_counter', { row_key: 'next_delivery_note' })
    await supabase.from('settings').update({ value: nextId + 1 }).eq('key', 'next_delivery_note') 

    fetchDashboardData()
  }

  return (
    // MOBILE FIX: Reduced padding p-4, overflow-hidden to prevent scroll issues
    <div className="max-w-7xl mx-auto pb-24 pt-4 px-4 overflow-x-hidden">
      
      {/* Top Header: LOGO (Responsive Sizing) */}
      <div className="flex justify-start mb-8 md:mb-12">
        <div className="w-[280px] md:w-[350px] h-auto -ml-4 md:-ml-8 -mt-4 md:-mt-6">
          <svg viewBox="0 0 1729.2891 1384.0683" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <g>
              <polygon fill="#1a1a1a" points="1214.3734 280.2037 1214.3734 820.6929 1022.4915 820.6929 673.8839 472.0855 673.8839 672.6942 821.8838 820.6929 673.8839 820.6929 514.9215 820.6929 514.9215 280.2037 706.8033 280.2037 1055.41 628.8111 1055.41 280.2037 1214.3734 280.2037 1214.3734 280.2037"/>
              <polygon fill="#f26722" points="514.9215 0 514.9215 166.9099 763.8444 166.9099 975.0262 422.3141 975.0262 166.9099 1214.3734 166.9099 1214.3734 0 514.9215 0 514.9215 0"/>
              <path fill="#010101" d="M37.8,1185.6h47.2l89.1,135.2V1185.6h42.1v211.9h-45.9l-90.4-137.9v137.9H37.8V1185.6z M242.7,1185.6h44.3v211.9h-44.3V1185.6z M314.2,1185.6h44.3v171.7h79.1v40.2h-123.4V1185.6z M523.4,1185.6h45.6l64.2,211.9h-47.5l-12.7-46.7h-54.5l-12.7,46.7h-46.7L523.4,1185.6z M559.8,1315.6l-19.2-69.6l-19.2,69.6H559.8z M750.3,1225.8v171.7h-44.3v-171.7h-59.4v-40.2h163v40.2H750.3z M835,1185.6h44.3v85.8h83.7v-85.8h44.3v211.9h-44.3v-86.1h-83.7v86.1H835V1185.6z M1035.8,1185.6h44.3v132.8c0,26.7,13.2,42.4,38.9,42.4c25.1,0,38.6-15.7,38.6-42.4v-132.8h44.3v130.6c0,53.4-30.2,84.5-82.9,84.5c-51.3,0-83.1-30-83.1-84.5V1185.6z M1234.7,1185.6h47.2l89.1,135.2V1185.6h42.1v211.9h-45.9l-90.4-137.9v137.9h-42.1V1185.6z M1439.6,1185.6h58c63.4,0,98.2,33.2,98.2,104.2c0,72.6-35.6,107.7-100.9,107.7h-55.3V1185.6z M1483.9,1357.3h10.8c38.9,0,57.2-18.1,57.2-66.4c0-45.9-17.5-65.1-55.9-65.1h-12.1V1357.3z M1617.2,1185.6h44.3v211.9h-44.3V1185.6z"/>
              <path fill="#010101" d="M417.8,1354.6h24.3v138.9h-24.3V1354.6z M469.1,1354.6h23.5l50.8,88.6v-88.6h21.7v138.9h-23.6l-50.7-89v89h-21.7V1354.6z M590.2,1354.6h24.6l28.6,110.4l28.3-110.4h24.6l-41.4,138.9h-23.3L590.2,1354.6z M716.4,1354.6h68.2v20.7h-43.9v37.6h40.4v20.7h-40.4v39.2h46.1v20.7h-70.4V1354.6z M800.7,1354.6h65.8v22.8c-15.1,1.1-26,4-26,20.4c0,25,65.8,15.1,65.8,59.3c0,25.8-19.3,38.1-43.5,38.1c-25,0-43.3-11.5-47.5-30.7h23.9c2.8,9,12.2,12.9,22.2,12.9c13.2,0,20.6-5.4,20.6-18.2c0-26.7-65.8-15.8-65.8-59.2c0-25,18.9-36.9,41.9-36.9c20.3,0,38.3,9.4,43.2,28.8h-23.8c-3.1-8.5-10.4-11.5-19.4-11.5c-11.5,0-17.8,4.7-17.8,15.7h-19.6V1354.6z M936.7,1375.3h-28.5v-20.7h81.3v20.7h-28.5v118.2h-24.3V1375.3z M1009.6,1354.6h26.5l26.3,86l26.1-86h26.4v138.9h-22.1v-97.1l-25.1,80.7h-11.1l-25.1-80.7v97.1h-21.9V1354.6z M1134.4,1354.6h68.2v20.7h-43.9v37.6h40.4v20.7h-40.4v39.2h46.1v20.7h-70.4V1354.6z M1218.7,1354.6h23.5l50.8,88.6v-88.6h21.7v138.9h-23.6l-50.7-89v89h-21.7V1354.6z M1339.8,1375.3h-28.5v-20.7h81.3v20.7h-28.5v118.2h-24.3V1375.3z"/>
            </g>
          </svg>
        </div>
      </div>

      {/* Money Cards (Stacked on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3 text-orange-600 font-bold text-xs uppercase tracking-wider"><AlertCircle className="w-4 h-4"/> Pending (MVR)</div>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{stats.pending.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3 text-green-600 font-bold text-xs uppercase tracking-wider"><DollarSign className="w-4 h-4"/> Earned (MVR)</div>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{stats.earnedMVR.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-xs uppercase tracking-wider"><DollarSign className="w-4 h-4"/> Earned (USD)</div>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">${stats.earnedUSD.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-2 mb-3 text-purple-600 font-bold text-xs uppercase tracking-wider"><Scale className="w-4 h-4"/> Total Weight</div>
           <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{stats.weight.toFixed(1)} <span className="text-sm text-gray-400 font-medium">kg</span></div>
        </div>
      </div>

      {/* The Live Table (Scrollable on Mobile) */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
           <table className="w-full text-left whitespace-nowrap">
             <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery Date</th>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Order Details</th>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery Status</th>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                 <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Payment</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {loading ? (
                 <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/></td></tr>
               ) : orders.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-medium">No orders found.</td></tr>
               ) : orders.map((order) => {
                 
                 const yearSuffix = getYearSuffix(order.po_date)

                 const displayWeight = order.currency === 'USD' 
                     ? (order.total_amount / 11).toFixed(1) 
                     : (order.weight_kg || 0)

                 return (
                 <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                   <td className="p-5 text-sm font-medium text-gray-500 w-32">
                      {order.delivery_date ? order.delivery_date : <span className="text-gray-300 italic">{order.po_date}</span>}
                   </td>
                   
                   <td className="p-5">
                     <div className="font-bold text-gray-900 text-lg">PO #{order.po_number}</div>
                     <div className="text-xs text-gray-500 font-bold mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded">
                       {order.currency} {order.total_amount.toLocaleString()} • <span className="text-black">{displayWeight} kg</span>
                     </div>
                   </td>

                   <td className="p-5">
                     {order.delivery_status === 'Delivered' ? (
                       <div className="flex items-center gap-3">
                         <div className="bg-green-100 text-green-700 p-1.5 rounded-full"><CheckCircle2 className="w-4 h-4"/></div>
                         <div>
                           <span className="block text-xs font-bold text-green-700 uppercase">Delivered</span>
                           {order.delivery_note_number && (
                              <span className="block text-[10px] font-mono text-gray-400">DN: {String(order.delivery_note_number).padStart(2,'0')}/{yearSuffix}</span>
                           )}
                         </div>
                       </div>
                     ) : (
                       <button onClick={() => markDelivered(order)} className="flex items-center gap-2 text-gray-600 bg-white border border-gray-200 hover:bg-black hover:text-white hover:border-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95">
                         <Package className="w-4 h-4"/> Mark Delivered
                       </button>
                     )}
                   </td>

                   <td className="p-5">
                     {order.invoice_number ? (
                       <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600"/>
                          <span className="text-sm font-bold font-mono text-blue-600">#{String(order.invoice_number).padStart(4,'0')}/{yearSuffix}</span>
                       </div>
                     ) : (
                       <span className="text-xs font-bold text-gray-400 border border-dashed border-gray-300 px-3 py-1 rounded-full">Not Generated</span>
                     )}
                   </td>

                   <td className="p-5 text-right">
                     <button 
                       onClick={() => togglePayment(order.id, order.payment_status)}
                       className={`px-5 py-2 rounded-lg text-xs font-bold border shadow-sm transition-all ${
                         order.payment_status === 'Paid' 
                         ? 'bg-black text-white border-black hover:bg-gray-800' 
                         : 'bg-white text-gray-500 border-gray-200 hover:border-red-500 hover:text-red-500'
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
    </div>
  )
}