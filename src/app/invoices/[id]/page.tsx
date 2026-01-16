'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Download, ArrowLeft, Eye, Truck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function InvoiceView() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [order, setOrder] = useState<any>(null)

  useEffect(() => { if (id) fetchOrder() }, [id])

  useEffect(() => {
    if (order) {
      const yearShort = new Date(order.po_date || new Date()).getFullYear().toString().slice(-2)
      const invNum = String(order.invoice_number).padStart(4, '0')
      document.title = `Invoice-${invNum}-${yearShort}` 
    }
  }, [order])

  const fetchOrder = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', id).single()
    setOrder(data)
  }

  // --- MOBILE PDF FIX ---
  const printStyles = `
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { 
        min-width: 210mm !important; 
        width: 210mm !important; 
        margin: 0; 
        padding: 0; 
        background: white; 
        -webkit-print-color-adjust: exact; 
      }
      nav, .no-print { display: none !important; }
      #invoice-container { 
        width: 210mm !important; 
        height: 297mm !important; 
        position: absolute; 
        top: 0; 
        left: 0; 
        margin: 0 !important; 
        border: none !important; 
        overflow: hidden !important; 
        transform: none !important;
      }
    }
  `

  if (!order) return <div className="flex justify-center p-20"><Loader2 className="animate-spin w-8 h-8 text-gray-400" /></div>

  // Calculations
  const weight = order.weight_kg || 0
  const totalAmount = order.total_amount
  const unitPrice = weight > 0 ? (totalAmount / weight).toFixed(2) : '0.00'
  const totalFormatted = totalAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  const yearShort = String(new Date(order.invoice_date || order.po_date).getFullYear()).slice(-2)
  const invoiceNo = String(order.invoice_number).padStart(4, '0') + '/' + yearShort
  const deliveryNote = String(order.delivery_note || order.delivery_note_number || '000').padStart(3, '0')
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB') : ''
  const deliveryDate = formatDate(order.delivery_date || order.po_date)
  const invoiceDate = formatDate(order.invoice_date || order.delivery_date || order.po_date)

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center">
      <style>{printStyles}</style>
      
      {/* TOOLBAR */}
      <div className="w-full md:w-[210mm] mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black self-start md:self-auto">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            {/* NEW: DELIVERY NOTE BUTTON */}
            <button 
                onClick={() => router.push(`/invoices/${id}/delivery-note`)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm"
            >
                <Truck className="w-4 h-4" /> Delivery Note
            </button>

            <button onClick={() => window.print()} className="bg-black text-white px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 shadow-md">
              <Download className="w-4 h-4" /> Save PDF
            </button>
        </div>
      </div>

      {/* INVOICE SVG CONTAINER (Your Original Code) */}
      <div 
        id="invoice-container"
        className="bg-white shadow-2xl overflow-hidden relative mx-auto print:shadow-none w-full md:w-[210mm] aspect-[210/297]"
      >
        <svg version="1.1" viewBox="0 0 595.3 841.9" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
          <defs>
            <style>{`
              .inv2-st0{font-size:21.1px;}
              .inv2-st0,.inv2-st1,.inv2-st2,.inv2-st3,.inv2-st4{font-family:sans-serif;font-weight:600;}
              .inv2-st0,.inv2-st2{fill:#010101;}
              .inv2-st1{font-size:44px;}
              .inv2-st1,.inv2-st3,.inv2-st4,.inv2-st5,.inv2-st6{fill:#231f20;}
              .inv2-st7,.inv2-st8,.inv2-st9{fill:#f26722;}
              .inv2-st2{font-size:10.9px;}
              .inv2-st10{fill:#f1f2f2;}
              .inv2-st11{fill:#fff;}
              .inv2-st12{font-size:30px; font-family:sans-serif; fill:#fff;}
              .inv2-st13{font-size:14.9px; font-family:sans-serif; fill:#fff;}
              .inv2-st5,.inv2-st6,.inv2-st8,.inv2-st14{font-family:sans-serif;font-weight:bold;}
              .inv2-st5,.inv2-st8{font-size:14px;}
              .inv2-st6,.inv2-st14{font-size:16px;}
              .inv2-st3{font-size:11.1px;}
              .inv2-st4{font-size:9px;}
              .inv2-st9{fill-rule:evenodd;}
              .inv2-st15{fill:#e6e7e8;}
              .inv2-st16{fill:#1a1a1a;}
            `}</style>
          </defs>
          
          <g>
            <polygon className="inv2-st16" points="129 54.5 129 96.7 114 96.7 86.8 69.5 86.8 85.2 98.3 96.7 86.8 96.7 74.4 96.7 74.4 54.5 89.4 54.5 116.6 81.8 116.6 54.5 129 54.5 129 54.5"/>
            <polygon className="inv2-st9" points="74.4 32.6 74.4 45.7 93.8 45.7 110.3 65.6 110.3 45.7 129 45.7 129 32.6 74.4 32.6 74.4 32.6"/>
            <text className="inv2-st0" transform="translate(34.2 125.2)">NILA THUNDI</text>
            <text className="inv2-st2" transform="translate(66.2 138.4)">INVESTMENT</text>
          </g>

          <text className="inv2-st1" transform="translate(286.9 154.6)">INVOICE</text>
          <text className="inv2-st6" transform="translate(286.9 182)">Invoice No:</text>
          <text className="inv2-st6" transform="translate(426.5 182)">{invoiceNo}</text>
          
          <text className="inv2-st6" transform="translate(35.6 225.6)">Invoice to:</text>
          <text className="inv2-st3" transform="translate(45.4 247.3)">SS&L Beach Pvt Ltd</text>
          <text className="inv2-st3" transform="translate(45.4 266.8)">C/O Anantara Resort & Spa</text>
          
          <g>
            <text className="inv2-st3" transform="translate(286.9 41.9)">Lagoona, Laamu Gan, Thundi</text>
            <text className="inv2-st3" transform="translate(286.9 58.4)">9951813, 7471813</text>
          </g>
          
          <text className="inv2-st3" transform="translate(45.4 286.3)">Meerubahuru Aage, Ameer Ahmed Magu</text>
          <text className="inv2-st3" transform="translate(45.4 305.7)">purchasing.amd@anantara.com</text>
          
          <text className="inv2-st6" transform="translate(286.9 206.2)">Invoice Date:</text>
          <text className="inv2-st6" transform="translate(426.5 206.7)">{invoiceDate}</text>
          <text className="inv2-st6" transform="translate(286.9 230.5)">Delivery Note:</text>
          <text className="inv2-st6" transform="translate(426.5 230.5)">{deliveryNote}</text>

          <rect className="inv2-st7" x="286.9" y="246.6" width="308.3" height="71.2"/>
          <text className="inv2-st13" transform="translate(311.6 286.5)">Total Due:</text>
          
          {order.currency === 'MVR' && (
             <g transform="translate(-40, 0)">
                 <path className="inv2-st11" d="M430.2,283c-.1-.1-.2-.2-.3-.3-.5-.4-.7-1-.5-1.6.2-.6.7-1,1.3-1,.6,0,1.2.2,1.8.4.2,0,.4.1.6.2.3.2.6.1.9-.1.3-.3.6-.5,1-.8,0,0-.2-.1-.2-.2-.4-.2-.6-.6-.7-1.1-.1-1.2.6-1.9,1.8-1.7.6.1,1.1.3,1.7.5.3,0,.5,0,.7,0,1.8-1,3.7-1.9,5.5-2.9,0,0,.1,0,.2,0,.4-.3.8-.3,1.3,0,.4.3.6,1,.5,1.4-.2.4-.6.6-.9.8-1.2.6-2.5,1.2-3.7,1.8,0,0-.2,0-.3.2.2,0,.3.1.4.1.5.2,1.1.4,1.6.7.5.3.8,1.1.6,1.8-.2.5-.7.9-1.4.8-.6,0-1.2-.2-1.8-.4-.7-.2-1.4-.4-2.1-.6-.2,0-.3,0-.5.1-.3.3-.6.5-1,.8.5.2.9.4,1.3.6.7.4,1,.9.9,1.7,0,.7-.6,1.2-1.3,1.2-.4,0-.7,0-1.1-.2-1-.3-2-.6-2.9-.9-.2,0-.3,0-.5,0-1.9,1.2-3.8,2.5-5.7,3.7-1.3.8-2.6,1.5-4,2-.4.1-.8.2-1.1.3-.4,0-.7,0-.9-.3-.8-.7-1-1.5-1-2.5,0-.3.2-.6.6-.6.3,0,.6,0,1,0,.3,0,.5,0,.8,0,.6,0,1.2,0,1.7-.3,1.7-.8,3.3-1.8,4.9-2.8.3-.2.7-.4,1.1-.7"/>
             </g>
          )}
          <text className="inv2-st12" transform="translate(410 292.8)">
             {order.currency === 'USD' ? '$' : ''}{totalFormatted}
          </text>

          <rect className="inv2-st15" y="384.9" width="595.3" height="58.7"/>
          <rect className="inv2-st10" y="443.6" width="595.3" height="58.7"/>
          <rect className="inv2-st15" y="502.3" width="595.3" height="58.7"/>
          
          <g className="inv2-st8">
            <text x="36"  y="370" textAnchor="start">Item Description</text>
            <text x="280" y="370" textAnchor="middle">Quantity</text>
            <text x="430" y="370" textAnchor="end">Unit Price</text>
            <text x="550" y="370" textAnchor="end">Total</text>
          </g>

          <g>
            <text className="inv2-st3" x="36" y="411.6" textAnchor="start">Local Dhivehi Hanaakuri Havaadhu</text>
            <text className="inv2-st4" x="36" y="424.3" textAnchor="start">
                <tspan x="36" dy="0">PO - {order.po_number}</tspan>
                <tspan x="36" dy="10.8">Delivery Date: {deliveryDate}</tspan>
            </text>
          </g>
          
          <text className="inv2-st3" x="280" y="417.7" textAnchor="middle">{weight}</text>
          <text className="inv2-st3" x="430" y="417.7" textAnchor="end">{unitPrice}</text>
          <text className="inv2-st3" x="550" y="417.7" textAnchor="end">{totalFormatted}</text>

          <text className="inv2-st5" transform="translate(35.6 592.6)">Account Detail:</text>
          <text className="inv2-st5" transform="translate(35.6 615)">Name: </text>
          <text className="inv2-st5" transform="translate(35.6 637.3)" xmlSpace="preserve">Account No:   </text>
          <text className="inv2-st5" transform="translate(134.8 637.3)">7707360119101</text>
          <text className="inv2-st5" transform="translate(134.8 615)">Ibrahim Yoosuf</text>

          <text className="inv2-st5" transform="translate(341.7 590.4)">Subtotal</text>
          <text className="inv2-st5" x="550" y="590.4" textAnchor="end">{totalFormatted}</text> 
          
          <text className="inv2-st5" x="550" y="615.4" textAnchor="end">0</text>
          <text className="inv2-st5" x="550" y="640.4" textAnchor="end">0</text>
          <text className="inv2-st5" transform="translate(342.5 615.4)">Tax</text>
          <text className="inv2-st5" transform="translate(342.6 640.4)">Discount</text>

          <rect className="inv2-st7" x="303.9" y="672.2" width="292.8" height="35.6"/>
          
          <text className="inv2-st14" x="550" y="697" textAnchor="end" fill="#fff">{totalFormatted}</text>
          <text className="inv2-st14" transform="translate(342.5 695.3)" fill="#fff">Total Due:</text>

          <text className="inv2-st5" transform="translate(56 750.4)">Ibrahim Yoosuf</text>
          <text className="inv2-st5" transform="translate(78.7 772.9)">Director</text>
          <rect className="inv2-st7" x=".8" y="791.7" width="594.5" height="2.3"/>
          <text className="inv2-st8" transform="translate(343.7 761.6)">Thank you for your business</text>
        </svg>
      </div>
    </div>
  )
}