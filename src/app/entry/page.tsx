'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Save, Loader2, Trash2, Scale, Calendar, FileText, DollarSign, AlertTriangle, X, Pencil, Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function NewEntry() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  // --- STATE ---
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // EDIT STATE
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    po_number: '',
    po_date: new Date().toISOString().split('T')[0],
    delivery_date: new Date().toISOString().split('T')[0],
    currency: 'MVR',
    total_amount: '',
    weight_kg: '', 
    unit_price: '169.62', // Default Price
    description: ''
  })

  useEffect(() => {
    fetchRecentOrders()
  }, [])

  // --- AUTO-CALCULATION LOGIC ---
  useEffect(() => {
    const weight = parseFloat(formData.weight_kg)
    const price = parseFloat(formData.unit_price)

    if (!isNaN(weight) && !isNaN(price)) {
      const calculatedTotal = (weight * price).toFixed(2)
      setFormData(prev => ({ ...prev, total_amount: calculatedTotal }))
    }
  }, [formData.weight_kg, formData.unit_price])


  // Fetch last 5 entries
  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) setRecentOrders(data)
  }

  // --- EDIT LOGIC ---
  const handleEdit = (order: any) => {
    setEditingId(order.id)
    
    // Calculate what the unit price was (approx) so the math still works
    const weight = order.weight_kg || 0
    const total = order.total_amount || 0
    const calculatedPrice = weight > 0 ? (total / weight).toFixed(2) : '169.62'

    setFormData({
      po_number: order.po_number,
      po_date: order.po_date,
      delivery_date: order.delivery_date || order.po_date,
      currency: order.currency,
      total_amount: order.total_amount,
      weight_kg: order.weight_kg,
      unit_price: calculatedPrice,
      description: order.description || ''
    })
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
        po_number: '',
        po_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        currency: 'MVR',
        total_amount: '',
        weight_kg: '', 
        unit_price: '169.62', 
        description: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      po_number: formData.po_number,
      po_date: formData.po_date,
      delivery_date: formData.delivery_date,
      currency: formData.currency,
      total_amount: parseFloat(formData.total_amount),
      weight_kg: parseFloat(formData.weight_kg) || 0,
      payment_status: 'Unpaid',
      delivery_status: 'Pending' // Usually resets to pending if you edit significantly, or you can keep it.
    }

    let error;

    if (editingId) {
      // UPDATE EXISTING
      const { error: updateError } = await supabase
        .from('orders')
        .update({
             po_number: payload.po_number,
             po_date: payload.po_date,
             delivery_date: payload.delivery_date,
             currency: payload.currency,
             total_amount: payload.total_amount,
             weight_kg: payload.weight_kg
        })
        .eq('id', editingId)
      error = updateError
    } else {
      // CREATE NEW
      const { error: insertError } = await supabase.from('orders').insert([payload])
      error = insertError
    }

    if (error) {
      alert('Error saving order: ' + error.message)
    } else {
      cancelEdit() // Resets form and editingId
      fetchRecentOrders() 
    }
    setLoading(false)
  }

  // --- DELETE LOGIC ---
  const promptDelete = (id: string) => {
    setEntryToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!entryToDelete) return
    setDeleteLoading(true)

    const { error } = await supabase.from('orders').delete().eq('id', entryToDelete)
    
    if (!error) {
      // AUTO-SYNC COUNTERS (Optional: keeps numbers tidy during testing)
      await supabase.rpc('sync_counters')

      fetchRecentOrders()
      setShowDeleteModal(false)
      setEntryToDelete(null)
    } else {
        alert("Error deleting: " + error.message)
    }
    setDeleteLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 pt-8 relative">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {editingId ? 'Edit Entry' : 'New Entry'}
        </h1>
        <p className="text-gray-500 font-medium mt-1">
            {editingId ? 'Update the details below.' : 'Add a new Purchase Order to the system.'}
        </p>
      </div>

      {/* THE FORM CARD */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden p-8 mb-10 transition-colors ${editingId ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PO Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  required
                  value={formData.po_date}
                  onChange={(e) => setFormData({...formData, po_date: e.target.value})}
                  className="w-full pl-10 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-lg focus:ring-black focus:border-black block p-3 outline-none transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  required
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                  className="w-full pl-10 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-lg focus:ring-black focus:border-black block p-3 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200/50" />

          {/* Section 2: Order Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PO Number</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 9928"
                  value={formData.po_number}
                  onChange={(e) => setFormData({...formData, po_number: e.target.value})}
                  className="w-full pl-10 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-lg focus:ring-black focus:border-black block p-3 outline-none transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Weight (Kg)</label>
              <div className="relative">
                <Scale className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                  className="w-full pl-10 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-lg focus:ring-black focus:border-black block p-3 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Money & Calculations */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
            
            {/* Price Per Kg */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price Per Kg</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 font-bold text-sm">MVR</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  className="w-full pl-12 bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-lg focus:ring-black focus:border-black block p-3 outline-none transition-all" 
                />
              </div>
            </div>

            {/* Total Amount (Auto Calculated) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Total Amount (Auto)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-green-600" />
                <input 
                  type="number" 
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  className="w-full pl-10 bg-green-50/50 border-2 border-green-100 text-green-700 text-lg font-extrabold rounded-lg focus:ring-green-500 focus:border-green-500 block p-3 outline-none transition-all" 
                />
              </div>
            </div>

             {/* Currency Toggle */}
            <div className="md:col-span-3 flex justify-end">
                <div className="flex bg-gray-50 rounded-lg border border-gray-200 p-1">
                    <button
                    type="button"
                    onClick={() => setFormData({...formData, currency: 'MVR'})}
                    className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${formData.currency === 'MVR' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                    >
                    MVR
                    </button>
                    <button
                    type="button"
                    onClick={() => setFormData({...formData, currency: 'USD'})}
                    className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${formData.currency === 'USD' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                    >
                    USD
                    </button>
                </div>
            </div>

          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex gap-3">
            {editingId && (
                <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="flex-1 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-bold rounded-xl text-sm px-5 py-4 flex items-center justify-center gap-2 transition-all"
                >
                    <Ban className="w-5 h-5" /> Cancel Edit
                </button>
            )}
            
            <button 
                type="submit" 
                disabled={loading}
                className={`flex-[2] text-white font-bold rounded-xl text-sm px-5 py-4 text-center flex items-center justify-center gap-2 transition-all shadow-md ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'}`}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {editingId ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>

        </form>
      </div>

      {/* RECENTLY ADDED LIST */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recently Added</h3>
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">No entries yet. Add one above!</div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className={`flex justify-between items-center p-4 border-b border-gray-100 last:border-0 transition-colors ${editingId === order.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}>
                <div>
                   <div className="font-bold text-gray-900 text-sm">PO #{order.po_number}</div>
                   <div className="text-xs text-gray-500 font-medium mt-0.5">
                      Del: {order.delivery_date || order.po_date} • {order.currency} {order.total_amount} • <span className="text-black font-bold">{order.weight_kg} kg</span>
                   </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                    onClick={() => handleEdit(order)}
                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all group"
                    title="Edit Entry"
                    >
                        <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                    onClick={() => promptDelete(order.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all group"
                    title="Delete Entry"
                    >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- CUSTOM DELETE MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 scale-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-4">
              <div className="bg-red-50 p-3 rounded-full">
                 <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Entry?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors flex justify-center items-center gap-2"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Delete Forever'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}