'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Loader2, Users, CheckCircle } from 'lucide-react'

export default function NewGeneralInvoice() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nextNum, setNextNum] = useState(1)
  
  // Contacts State
  const [contacts, setContacts] = useState<any[]>([])
  
  // Form Data
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState([{ description: '', subDescription: '', quantity: 1, price: 0 }])
  
  const currentYear = new Date().getFullYear().toString()

  useEffect(() => { 
      fetchNextNumber()
      fetchContacts() 
  }, [])

  const fetchNextNumber = async () => {
    const { data } = await supabase.from('general_invoices').select('invoice_number').eq('year', currentYear).order('invoice_number', { ascending: false }).limit(1).maybeSingle()
    if (data) setNextNum(data.invoice_number + 1)
  }

  const fetchContacts = async () => {
      const { data } = await supabase.from('contacts').select('*').order('name', { ascending: true })
      setContacts(data || [])
  }

  // Handle Contact Selection
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setCustomerName(val)
      
      // Auto-fill address if name matches
      const match = contacts.find(c => c.name.toLowerCase() === val.toLowerCase())
      if (match && match.address) {
          setCustomerAddress(match.address)
      }
  }

  const saveContact = async () => {
      if(!customerName) return
      
      const { error } = await supabase.from('contacts').upsert(
          { name: customerName, address: customerAddress }, 
          { onConflict: 'name' }
      )
      
      if(!error) {
          alert("Contact Saved!")
          fetchContacts()
      } else {
          alert("Error saving contact: " + error.message)
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

  const handleSave = async () => {
    if (!customerName) return alert("Customer Name is required")
    setLoading(true)
    await fetchNextNumber()
    
    const { data, error } = await supabase.from('general_invoices').insert([{
      invoice_number: nextNum,
      year: currentYear,
      date: date,
      customer_name: customerName,
      customer_address: customerAddress,
      items: items,
      total_amount: items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
      status: 'Pending'
    }]).select()

    if (error) alert("Error: " + error.message)
    else router.push(`/general-invoices/${data[0].id}`)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5"/></button>
        <h1 className="text-xl md:text-2xl font-bold">New General Invoice</h1>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="block text-[10px] font-bold text-blue-400 uppercase">Invoice #</span>
                <span className="text-lg font-mono font-bold text-blue-700">NT {String(nextNum).padStart(2, '0')} / {currentYear}</span>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full font-bold p-3 bg-gray-50 border border-gray-200 rounded-xl" />
            </div>
        </div>

        {/* Customer Section */}
        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase">Customer Details</label>
                <button onClick={saveContact} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-black hover:text-white transition-colors">
                    <Save className="w-3 h-3"/> Save Contact
                </button>
            </div>
            
            <input 
                list="contactsList"
                value={customerName} 
                onChange={handleCustomerChange} 
                className="w-full font-bold p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-black" 
                placeholder="Customer Name (Type to search...)" 
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
        </div>

        <hr className="border-gray-100"/>

        {/* Items List */}
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-gray-900">Items</h3>
                <button onClick={() => setItems([...items, { description: '', subDescription: '', quantity: 1, price: 0 }])} className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-200"><Plus className="w-3 h-3"/> Add</button>
            </div>
            
            {items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 relative">
                    <input 
                        placeholder="Description (e.g. Web Development)" 
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-1 focus:ring-black outline-none"
                        value={item.description}
                        onChange={e => handleItemChange(i, 'description', e.target.value)}
                    />
                    <input 
                        placeholder="Small details (e.g. 50% Advance)" 
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
            <button onClick={handleSave} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800">
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Generate Invoice'}
            </button>
        </div>
      </div>
    </div>
  )
}