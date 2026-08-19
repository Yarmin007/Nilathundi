'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react'

export default function EditGeneralInvoice() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Invoice Data
  const [company, setCompany] = useState('Nila Thundi')
  const [invoiceNum, setInvoiceNum] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [date, setDate] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [year, setYear] = useState('')
  
  // Contacts for Autocomplete
  const [contacts, setContacts] = useState<any[]>([])

  useEffect(() => { 
      fetchInvoice()
      fetchContacts() 
  }, [])

  const fetchInvoice = async () => {
    const { data, error } = await supabase.from('general_invoices').select('*').eq('id', id).single()
    if (error) {
        alert("Error fetching invoice")
        router.back()
        return
    }
    
    // Load Data
    setCompany(data.company || 'Nila Thundi')
    setYear(data.year)
    setInvoiceNum(data.invoice_number)
    setCustomerName(data.customer_name)
    setCustomerAddress(data.customer_address || '')
    setCustomerEmail(data.customer_email || '')
    setCustomerPhone(data.customer_phone || '')
    setDate(data.date)
    setItems(data.items || [])
    setLoading(false)
  }

  const fetchContacts = async () => {
      const { data } = await supabase.from('contacts').select('*').order('name', { ascending: true })
      setContacts(data || [])
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setCustomerName(val)
      const match = contacts.find(c => c.name.toLowerCase() === val.toLowerCase())
      if (match) {
          if (match.address) setCustomerAddress(match.address)
          if (match.email && match.email !== '-') setCustomerEmail(match.email)
          if (match.phone && match.phone !== '-') setCustomerPhone(match.phone)
      }
  }

  const handleItemChange = (i: number, field: string, val: any) => {
    const newItems = [...items]
    if (field === 'quantity' || field === 'price') {
         if (isNaN(val)) val = 0;
    }
    // @ts-ignore
    newItems[i][field] = val
    setItems(newItems)
  }

  const handleUpdate = async () => {
    if (!customerName) return alert("Customer Name is required")
    setSaving(true)
    
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)

    const { error } = await supabase.from('general_invoices').update({
      company: company,
      date: date,
      customer_name: customerName,
      customer_address: customerAddress,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      items: items,
      total_amount: total
    }).eq('id', id)

    if (error) alert("Error updating: " + error.message)
    else router.push(`/general-invoices/${id}`) // Go back to view
    setSaving(false)
  }

  if(loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300"/></div>

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5"/></button>
        <h1 className="text-xl md:text-2xl font-bold">Edit Invoice</h1>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        
        {/* Company Selection */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit border border-gray-200">
            <button type="button" onClick={() => setCompany('Nila Thundi')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${company === 'Nila Thundi' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}>Nila Thundi</button>
            <button type="button" onClick={() => setCompany('3S')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${company === '3S' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}>3S</button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className={`flex-1 p-3 rounded-xl border ${company === '3S' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                <span className={`block text-[10px] font-bold uppercase ${company === '3S' ? 'text-orange-400' : 'text-blue-400'}`}>Invoice #</span>
                <span className={`text-lg font-mono font-bold ${company === '3S' ? 'text-orange-700' : 'text-blue-700'}`}>
                    {company === '3S' ? '' : 'NT '}
                    {company === '3S' ? String(invoiceNum).padStart(4, '0') : String(invoiceNum).padStart(2, '0')} / {year}
                </span>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full font-bold p-3 bg-gray-50 border border-gray-200 rounded-xl" />
            </div>
        </div>

        {/* Customer */}
        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="text-xs font-bold text-gray-500 uppercase">Customer Details</label>
            <input 
                list="contactsList"
                value={customerName} 
                onChange={handleCustomerChange} 
                className="w-full font-bold p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-black" 
                placeholder="Customer Name" 
            />
            <datalist id="contactsList">
                {contacts.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            <input 
                value={customerAddress} 
                onChange={e => setCustomerAddress(e.target.value)} 
                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-black text-sm" 
                placeholder="Address / Notes" 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                    value={customerEmail} 
                    onChange={e => setCustomerEmail(e.target.value)} 
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-black text-sm" 
                    placeholder="Email Address" 
                    type="email"
                />
                <input 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)} 
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-black text-sm" 
                    placeholder="Phone Number" 
                />
            </div>
        </div>

        <hr className="border-gray-100"/>

        {/* Items */}
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-gray-900">Items</h3>
                <button onClick={() => setItems([...items, { description: '', subDescription: '', quantity: 1, price: 0 }])} className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-200"><Plus className="w-3 h-3"/> Add</button>
            </div>
            
            {items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 relative">
                    <input 
                        placeholder="Description" 
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-1 focus:ring-black outline-none"
                        value={item.description}
                        onChange={e => handleItemChange(i, 'description', e.target.value)}
                    />
                    <input 
                        placeholder="Sub-description" 
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 focus:ring-1 focus:ring-black outline-none"
                        value={item.subDescription}
                        onChange={e => handleItemChange(i, 'subDescription', e.target.value)}
                    />
                    <div className="flex gap-2 mt-1">
                        <div className="flex-1">
                             <span className="text-[10px] text-gray-400 font-bold uppercase">Qty</span>
                             <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-center"
                                value={item.quantity} 
                                onChange={e => handleItemChange(i, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value))} 
                             />
                        </div>
                        <div className="flex-[2]">
                             <span className="text-[10px] text-gray-400 font-bold uppercase">Price</span>
                             <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-center"
                                value={item.price} 
                                onChange={e => handleItemChange(i, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))} 
                             />
                        </div>
                        <div className="flex-1 text-right">
                             <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                             <div className="p-2 text-sm font-bold text-gray-900 pt-2">{(item.quantity * item.price).toLocaleString()}</div>
                        </div>
                    </div>
                    {items.length > 1 && (
                        <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    )}
                </div>
            ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold text-gray-500">Total Amount</span>
                <span className="text-2xl font-extrabold text-gray-900">{items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} <span className="text-xs text-gray-400">MVR</span></span>
            </div>
            <button onClick={handleUpdate} disabled={saving} className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800">
                {saving ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  )
}