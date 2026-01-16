'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Download, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function GeneralInvoiceView() {
  const { id } = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)

  useEffect(() => { if(id) fetchInvoice() }, [id])

  useEffect(() => {
    if (invoice) {
      const yearShort = invoice.year ? invoice.year.slice(-2) : '26'
      const invNum = String(invoice.invoice_number).padStart(4, '0')
      document.title = `Invoice-NT-${invNum}-${yearShort}` 
    }
  }, [invoice])

  const fetchInvoice = async () => {
    const { data } = await supabase.from('general_invoices').select('*').eq('id', id).single()
    setInvoice(data)
  }

  const printStyles = `
    @page { size: A4 portrait; margin: 0 !important; }
    @media print {
      body * { visibility: hidden; }
      #invoice-container, #invoice-container * { visibility: visible; }
      #invoice-container {
        position: fixed; left: 0; top: 0; width: 210mm !important; height: 297mm !important;
        margin: 0 !important; padding: 0 !important; border: none !important; z-index: 9999; transform: none !important;
      }
      html, body { height: 100%; overflow: hidden; margin: 0 !important; padding: 0 !important; background: white; }
      nav, .no-print { display: none !important; }
    }
  `

  if (!invoice) return <div className="flex justify-center p-20"><Loader2 className="animate-spin w-8 h-8 text-gray-400" /></div>

  const items = invoice.items || []
  const totalAmount = invoice.total_amount || 0
  const totalFormatted = totalAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  
  const yearShort = invoice.year ? invoice.year.slice(-2) : '26'
  const invoiceNo = `NT ${String(invoice.invoice_number).padStart(2,'0')} / ${yearShort}`
  const dateObj = new Date(invoice.date)
  const invoiceDate = `${String(dateObj.getDate()).padStart(2,'0')}/${String(dateObj.getMonth()+1).padStart(2,'0')}/${String(dateObj.getFullYear()).slice(-2)}`

  // --- UPDATED LAYOUT CONSTANTS ---
  const ROW_HEIGHT = 35 // Made thinner (was 58.7)
  const TABLE_START_Y = 384.9
  const TEXT_OFFSET_Y = 20 // Adjusted for thinner row
  
  const minFooterY = 590
  const tableEndY = TABLE_START_Y + (items.length * ROW_HEIGHT)
  const footerStartY = Math.max(minFooterY, tableEndY + 40) // +40 gap
  const footerOffset = footerStartY - minFooterY
  const svgHeight = Math.max(841.9, footerStartY + 250)

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center print:bg-white print:p-0 print:block">
      <style>{printStyles}</style>
      
      <div className="w-full md:w-[210mm] mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black self-start md:self-auto">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => window.print()} className="bg-black text-white px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 shadow-md">
          <Download className="w-4 h-4" /> Save PDF
        </button>
      </div>

      <div id="invoice-container" className="bg-white shadow-2xl overflow-hidden relative mx-auto print:shadow-none w-full md:w-[210mm] aspect-[210/297]">
        <svg version="1.1" viewBox={`0 0 595.3 ${svgHeight}`} xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
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
              .inv2-st3{font-size:10.5px;} /* Slightly smaller main text */
              .inv2-st4{font-size:9px;}
              .inv2-st9{fill-rule:evenodd;}
              .inv2-st15{fill:#e6e7e8;}
              .inv2-st16{fill:#1a1a1a;}
              /* UPDATED SUB-DESC STYLE: Black and small */
              .sub-desc{font-size: 8.5px; fill: #231f20; font-family: sans-serif; font-weight: normal;}
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
          <text className="inv2-st6" transform="translate(286.9 206.2)">Invoice Date:</text>
          <text className="inv2-st6" transform="translate(426.5 206.7)">{invoiceDate}</text>

          <text className="inv2-st6" transform="translate(35.6 225.6)">Invoice to:</text>
          <text className="inv2-st3" transform="translate(45.4 247.3)">{invoice.customer_name}</text>
          <text className="inv2-st3" transform="translate(45.4 266.8)">{invoice.customer_address || ''}</text>
          
          <g>
            <text className="inv2-st3" transform="translate(286.9 41.9)">Lagoona, Laamu Gan, Thundi</text>
            <text className="inv2-st3" transform="translate(286.9 58.4)">9951813, 7471813</text>
          </g>
          
          <rect className="inv2-st7" x="286.9" y="246.6" width="308.3" height="71.2"/>
          <text className="inv2-st13" transform="translate(311.6 286.5)">Total Due:</text>
          <g transform="translate(-40, 0)">
             <path className="inv2-st11" d="M430.2,283c-.1-.1-.2-.2-.3-.3-.5-.4-.7-1-.5-1.6.2-.6.7-1,1.3-1,.6,0,1.2.2,1.8.4.2,0,.4.1.6.2.3.2.6.1.9-.1.3-.3.6-.5,1-.8,0,0-.2-.1-.2-.2-.4-.2-.6-.6-.7-1.1-.1-1.2.6-1.9,1.8-1.7.6.1,1.1.3,1.7.5.3,0,.5,0,.7,0,1.8-1,3.7-1.9,5.5-2.9,0,0,.1,0,.2,0,.4-.3.8-.3,1.3,0,.4.3.6,1,.5,1.4-.2.4-.6.6-.9.8-1.2.6-2.5,1.2-3.7,1.8,0,0-.2,0-.3.2.2,0,.3.1.4.1.5.2,1.1.4,1.6.7.5.3.8,1.1.6,1.8-.2.5-.7.9-1.4.8-.6,0-1.2-.2-1.8-.4-.7-.2-1.4-.4-2.1-.6-.2,0-.3,0-.5.1-.3.3-.6.5-1,.8.5.2.9.4,1.3.6.7.4,1,.9.9,1.7,0,.7-.6,1.2-1.3,1.2-.4,0-.7,0-1.1-.2-1-.3-2-.6-2.9-.9-.2,0-.3,0-.5,0-1.9,1.2-3.8,2.5-5.7,3.7-1.3.8-2.6,1.5-4,2-.4.1-.8.2-1.1.3-.4,0-.7,0-.9-.3-.8-.7-1-1.5-1-2.5,0-.3.2-.6.6-.6.3,0,.6,0,1,0,.3,0,.5,0,.8,0,.6,0,1.2,0,1.7-.3,1.7-.8,3.3-1.8,4.9-2.8.3-.2.7-.4,1.1-.7"/>
          </g>
          <text className="inv2-st12" transform="translate(410 292.8)">{totalFormatted}</text>

          <g className="inv2-st8">
            <text x="36"  y="370" textAnchor="start">Item Description</text>
            <text x="280" y="370" textAnchor="middle">Quantity</text>
            <text x="430" y="370" textAnchor="end">Unit Price</text>
            <text x="550" y="370" textAnchor="end">Total</text>
          </g>

          {items.map((item: any, i: number) => {
             const yPos = TABLE_START_Y + (i * ROW_HEIGHT)
             const textY = yPos + TEXT_OFFSET_Y
             const bgClass = i % 2 === 0 ? "inv2-st15" : "inv2-st10" 
             
             return (
               <g key={i}>
                 <rect className={bgClass} y={yPos} width="595.3" height={ROW_HEIGHT}/>
                 <text className="inv2-st3" x="36" y={item.subDescription ? textY - 3 : textY + 2} textAnchor="start">{item.description}</text>
                 {item.subDescription && (
                    <text className="sub-desc" x="36" y={textY + 8} textAnchor="start">{item.subDescription}</text>
                 )}
                 <text className="inv2-st3" x="280" y={textY + 2} textAnchor="middle">{item.quantity}</text>
                 <text className="inv2-st3" x="430" y={textY + 2} textAnchor="end">{Number(item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</text>
                 <text className="inv2-st3" x="550" y={textY + 2} textAnchor="end">{(item.quantity * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</text>
               </g>
             )
          })}

          <g transform={`translate(0, ${footerOffset})`}>
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
          </g>
        </svg>
      </div>
    </div>
  )
}