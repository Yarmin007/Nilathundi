'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Download, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function DeliveryNoteView() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)

  useEffect(() => { if (id) fetchOrder() }, [id])

  useEffect(() => {
    if (order) {
      document.title = `DN-${order.delivery_note_number || order.po_number}`
    }
  }, [order])

  const fetchOrder = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', id).single()
    setOrder(data)
  }

  // --- MOBILE PDF FIX (STRICT A4) ---
  const printStyles = `
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body {
        min-width: 210mm !important; 
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important; 
        padding: 0 !important; 
        background: white; 
        -webkit-print-color-adjust: exact; 
        overflow: hidden !important;
      }
      nav, .no-print { display: none !important; }
      #dn-container { 
        width: 100% !important; 
        height: 100% !important; 
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

  // --- MAP DATA ---
  const dateObj = new Date(order.delivery_date || order.po_date || new Date())
  const yearShort = String(dateObj.getFullYear()).slice(-2)
  const dnRaw = order.delivery_note_number || order.delivery_note || 0
  
  // Format as 01/26
  const dnNumber = `${String(dnRaw).padStart(2, '0')}/${yearShort}`
  
  const poNumber = order.po_number || '---'
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB') : ''
  const deliveryDate = formatDate(order.delivery_date)
  const weight = order.weight_kg || 0
  const total = order.total_amount || 0
  const unitPrice = weight > 0 ? (total / weight).toFixed(2) : '0.00'
  const totalFormatted = total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  const isMVR = order.currency !== 'USD'

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center">
      <style>{printStyles}</style>
      
      {/* TOOLBAR */}
      <div className="w-full md:w-[210mm] mb-6 flex justify-between items-center no-print">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => window.print()} className="bg-black text-white px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 shadow-md">
          <Download className="w-4 h-4" /> Save PDF
        </button>
      </div>

      {/* SVG CONTAINER */}
      <div id="dn-container" className="bg-white shadow-2xl overflow-hidden relative mx-auto print:shadow-none w-full md:w-[210mm] aspect-[210/297]">
        <svg version="1.1" viewBox="0 0 595.3 841.9" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
          <defs>
            <style>{`
              .st0{font-size:21.1px;}
              .st0,.st1{fill:#010101;}
              .st0,.st1,.st2,.st3{font-family: GalanoGrotesque-SemiBold, 'Galano Grotesque', sans-serif; font-weight:600;}
              .st4,.st5,.st6{fill:#f26722;}
              .st1{font-size:10.9px;}
              .st7,.st8,.st9{fill:#fff;}
              .st8{font-size:36.2px;}
              .st8,.st9{font-family: MyriadPro-Regular, 'Myriad Pro', sans-serif;}
              .st9{font-size:14.9px;}
              .st10,.st11,.st2,.st3{fill:#231f20;}
              .st10,.st11,.st5{font-family: ArialRoundedMTBold, 'Arial Rounded MT Bold', sans-serif;}
              .st10,.st5{font-size:14px;}
              .st11{font-size:16px;}
              .st2{font-size:11.1px;}
              .st6{fill-rule:evenodd;}
              .st12{fill:#e6e7e8;}
              .st3{font-size:34.6px;}
              .st13{fill:#1a1a1a;}
            `}</style>
          </defs>
          
          <g>
            <polygon className="st13" points="129 54.5 129 96.7 114 96.7 86.8 69.5 86.8 85.2 98.3 96.7 86.8 96.7 74.4 96.7 74.4 54.5 89.4 54.5 116.6 81.8 116.6 54.5 129 54.5 129 54.5"/>
            <polygon className="st6" points="74.4 32.6 74.4 45.7 93.8 45.7 110.3 65.6 110.3 45.7 129 45.7 129 32.6 74.4 32.6 74.4 32.6"/>
            <text className="st0" transform="translate(34.2 125.2)">NILA THUNDI</text>
            <text className="st1" transform="translate(66.2 138.4)">INVESTMENT</text>
          </g>

          <text className="st3" transform="translate(286.9 144.3)">DELIVERY NOTE</text>
          
          <text className="st11" transform="translate(286.9 182)">DN No:</text>
          <text className="st11" transform="translate(426.5 182)">{dnNumber}</text>

          <text className="st11" transform="translate(286.9 206.2)">Delivery Date:</text>
          <text className="st11" transform="translate(426.5 206.7)">{deliveryDate}</text>

          <text className="st11" transform="translate(286.9 230.5)">PO No:</text>
          <text className="st11" transform="translate(426.5 230.5)">{poNumber}</text>

          <text className="st11" transform="translate(35.6 225.6)">Delivery to:</text>
          <text className="st2" transform="translate(45.4 247.3)">SS&L Beach Pvt Ltd</text>
          <text className="st2" transform="translate(45.4 266.8)">C/O Anantara Resort & Spa</text>
          <text className="st2" transform="translate(45.4 286.3)">Meerubahuru Aage, Ameer Ahmed Magu</text>
          <text className="st2" transform="translate(45.4 305.7)">purchasing.amd@anantara.com</text>

          <g>
            <text className="st2" transform="translate(286.9 41.9)">Lagoona, Laamu Gan, Thundi</text>
            <text className="st2" transform="translate(286.9 58.4)">9951813, 7471813</text>
          </g>

          {/* TOTAL BOX */}
          <rect className="st4" x="286.9" y="246.6" width="308.3" height="71.2"/>
          <text className="st9" transform="translate(311.6 286.5)">Total Due:</text>
          
          {isMVR && (
             <path className="st7" d="M430.2,283c-.1-.1-.2-.2-.3-.3-.5-.4-.7-1-.5-1.6.2-.6.7-1,1.3-1,.6,0,1.2.2,1.8.4.2,0,.4.1.6.2.3.2.6.1.9-.1.3-.3.6-.5,1-.8,0,0-.2-.1-.2-.2-.4-.2-.6-.6-.7-1.1-.1-1.2.6-1.9,1.8-1.7.6.1,1.1.3,1.7.5.3,0,.5,0,.7,0,1.8-1,3.7-1.9,5.5-2.9,0,0,.1,0,.2,0,.4-.3.8-.3,1.3,0,.4.3.6,1,.5,1.4-.2.4-.6.6-.9.8-1.2.6-2.5,1.2-3.7,1.8,0,0-.2,0-.3.2.2,0,.3.1.4.1.5.2,1.1.4,1.6.7.5.3.8,1.1.6,1.8-.2.5-.7.9-1.4.8-.6,0-1.2-.2-1.8-.4-.7-.2-1.4-.4-2.1-.6-.2,0-.3,0-.5.1-.3.3-.6.5-1,.8.5.2.9.4,1.3.6.7.4,1,.9.9,1.7,0,.7-.6,1.2-1.3,1.2-.4,0-.7,0-1.1-.2-1-.3-2-.6-2.9-.9-.2,0-.3,0-.5,0-1.9,1.2-3.8,2.5-5.7,3.7-1.3.8-2.6,1.5-4,2-.4.1-.8.2-1.1.3-.4,0-.7,0-.9-.3-.8-.7-1-1.5-1-2.5,0-.3.2-.6.6-.6.3,0,.6,0,1,0,.3,0,.5,0,.8,0,.6,0,1.2,0,1.7-.3,1.7-.8,3.3-1.8,4.9-2.8.3-.2.7-.4,1.1-.7"/>
          )}
          
          <text className="st8" transform="translate(585 292.8)" textAnchor="end">
             {!isMVR && '$'}{totalFormatted}
          </text>

          {/* TABLE */}
          <rect className="st12" y="384.9" width="595.3" height="58.7"/>
          <text className="st5" transform="translate(35.6 370)">Item Description</text>
          <text className="st5" transform="translate(235.1 370)" textAnchor="middle">Quantity</text>
          <text className="st5" transform="translate(374.4 370)" textAnchor="end" x="50">Unit Price</text>
          <text className="st5" transform="translate(513.8 370)" textAnchor="end" x="35">Total</text>

          {/* TABLE ROW */}
          <text className="st2" transform="translate(35.6 417.7)">Local Dhivehi Hanaakuri Havaadhu</text>
          <text className="st2" transform="translate(235.1 417.7)" textAnchor="middle">{weight}</text>
          <text className="st2" transform="translate(374.4 417.7)" textAnchor="end" x="50">{unitPrice}</text>
          <text className="st2" transform="translate(513.8 417.7)" textAnchor="end" x="35">{totalFormatted}</text>

          <text className="st10" transform="translate(341.7 506.7)">Subtotal</text>
          <text className="st10" transform="translate(507.5 506.7)" textAnchor="end" x="40">{totalFormatted}</text>

          <text className="st10" transform="translate(35.6 651.5)">Terms and Condition</text>
          <text className="st10" transform="translate(35.6 668.3)">Payment is due within 15 Days</text>

          <text className="st5" transform="translate(343.7 761.6)">Thank you for your business</text>
          <text className="st10" transform="translate(56 750.4)">Ibrahim Yoosuf</text>
          <text className="st10" transform="translate(78.7 772.9)">Director</text>
          <rect className="st4" x=".8" y="791.7" width="594.5" height="2.3"/>
        </svg>
      </div>
    </div>
  )
}