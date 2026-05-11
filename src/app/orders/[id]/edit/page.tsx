'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, ArrowLeft, Save } from 'lucide-react'

export default function EditOrder() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (id) fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setOrder({ ...order, [name]: value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('orders')
      .update({
        po_number: order.po_number,
        po_date: order.po_date,
        delivery_date: order.delivery_date,
        currency: order.currency,
        total_amount: Number(order.total_amount),
        weight_kg: Number(order.weight_kg),
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      alert(`Error saving: ${error.message}`)
    } else {
      router.push('/') // Redirects back to the dashboard after saving
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return <div className="p-20 text-center text-gray-500 font-medium">Order not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Edit Order</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Updating PO #{order.po_number}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PO Number */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">PO Number</label>
              <input
                type="text"
                name="po_number"
                value={order.po_number || ''}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Currency</label>
              <select
                name="currency"
                value={order.currency || 'MVR'}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none bg-white"
              >
                <option value="MVR">MVR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Total Amount</label>
              <input
                type="number"
                step="0.01"
                name="total_amount"
                value={order.total_amount || ''}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            {/* Weight (kg) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                name="weight_kg"
                value={order.weight_kg || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            {/* PO Date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">PO Date</label>
              <input
                type="date"
                name="po_date"
                value={order.po_date || ''}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Delivery Date</label>
              <input
                type="date"
                name="delivery_date"
                value={order.delivery_date || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
              />
            </div>
          </div>

          <hr className="border-gray-100 my-6" />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}