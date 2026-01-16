'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Printer } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function StatementView() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [statement, setStatement] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: stmt } = await supabase.from('statements').select('*').eq('id', id).single()
    if (!stmt) {
        alert("Statement not found")
        return
    }
    setStatement(stmt)

    const { data: ords } = await supabase
      .from('orders')
      .select('*')
      .gte('po_date', stmt.start_date)
      .lte('po_date', stmt.end_date)
      .not('invoice_number', 'is', null)
      .order('po_date', { ascending: true })
    
    setOrders(ords || [])
    setLoading(false)
  }

  // --- HELPERS ---
  const getYearSuffix = (dateStr: string) => {
      if (!dateStr) return '26' 
      return new Date(dateStr).getFullYear().toString().slice(-2)
  }

  // --- PRINT CSS (Strict A4) ---
  const printStyles = `
    @page { 
      size: A4 portrait; 
      margin: 0 !important; 
    }
    @media print {
      body * {
        visibility: hidden;
      }
      #statement-container, #statement-container * {
        visibility: visible;
      }
      #statement-container {
        position: fixed;
        left: 0;
        top: 0;
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        z-index: 9999;
        transform: none !important;
      }
      html, body {
        height: 100vh;
        overflow: hidden;
        margin: 0 !important;
        padding: 0 !important;
        background: white;
      }
      nav, .no-print { display: none !important; }
    }
  `

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin w-8 h-8 text-gray-300" /></div>
  if (!statement) return <div className="text-center p-20">Statement not found</div>

  // --- SVG LAYOUT CONFIG ---
  const START_Y = 400.4
  const ROW_HEIGHT = 23.35
  const RECT_START_Y = 384.9
  const RECT_HEIGHT = 22.9
  
  let rows: any[] = []
  let runningBalance = 0
  let currentRowIndex = 0

  // 1. Previous Balance
  if (statement.previous_balance && statement.previous_balance > 0) {
      runningBalance += statement.previous_balance
      
      const prevYear = getYearSuffix(statement.start_date)
      const prevDesc = statement.previous_statement_number 
          ? `Outstanding From Previous Statement ${String(statement.previous_statement_number).padStart(4, '0')}/${prevYear}`
          : "Opening Balance Brought Forward"

      rows.push({
          id: 'prev-bal',
          type: 'opening',
          desc: prevDesc,
          amount: statement.previous_balance,
          balance: runningBalance,
          yText: START_Y + (currentRowIndex * ROW_HEIGHT),
          yRect: RECT_START_Y + (currentRowIndex * ROW_HEIGHT),
          isEven: currentRowIndex % 2 === 0
      })
      currentRowIndex++
  }

  // 2. Order Rows
  orders.forEach((order) => {
    runningBalance += order.total_amount
    rows.push({
      ...order,
      type: 'order',
      balance: runningBalance,
      yText: START_Y + (currentRowIndex * ROW_HEIGHT),
      yRect: RECT_START_Y + (currentRowIndex * ROW_HEIGHT),
      isEven: currentRowIndex % 2 === 0
    })
    currentRowIndex++
  })

  // Final Total
  const totalDue = runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const stmtNumber = String(statement.statement_number).padStart(4, '0') + '/' + getYearSuffix(statement.created_at)
  const stmtDate = new Date(statement.created_at).toLocaleDateString('en-GB')

  return (
    // MOBILE FIX: p-4 instead of p-8
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center print:bg-white print:p-0 print:block">
      <style>{printStyles}</style>
      
      {/* TOOLBAR: Stacked on mobile */}
      <div className="w-full md:w-[210mm] mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black self-start md:self-auto">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button 
          onClick={() => window.print()} 
          className="w-full md:w-auto bg-black text-white px-5 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-gray-800 shadow-md active:scale-95 transition-transform"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* SVG CONTAINER: Responsive Logic */}
      {/* w-full fits mobile, md:w-[210mm] locks to A4 width on PC, aspect-[210/297] keeps A4 shape */}
      <div 
        id="statement-container"
        className="bg-white shadow-2xl overflow-hidden relative mx-auto print:shadow-none w-full md:w-[210mm] aspect-[210/297]" 
      >
        <svg version="1.1" viewBox="0 0 595.3 841.9" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
          <defs>
            <style>{`
              .st0{font-size:21.1px;}.st0,.st1,.st2,.st3{font-family:sans-serif;font-weight:600;}.st0,.st2{fill:#010101;}
              .st1{font-size:44px;}.st1,.st4,.st5,.st3{fill:#231f20;}.st6,.st7,.st8{fill:#f26722;}
              .st11{fill:#e6e7e8;}.st2{font-size:10.9px;}.st12{fill:#f1f2f2;}
              .st14{font-size:28px; fill:#fff;}.st14,.st15{font-family:sans-serif;}.st15{font-size:14.9px;fill:#fff;}
              .st4,.st5,.st16,.st7{font-family:sans-serif;font-weight:bold;}
              .st4,.st7{font-size:14px;}.st5,.st16{font-size:16px;}.st3{font-size:11.1px;}
              .st17{fill:#1a1a1a;}
              .st9-orange{fill:#f26722; fill-rule:evenodd;}
            `}</style>
          </defs>

          {/* BACKGROUND ROWS */}
          <g id="Backgrounds">
            {rows.map((row) => (
              <rect 
                key={`rect-${row.id}`} 
                x="0" 
                y={row.yRect} 
                width="595.3" 
                height={RECT_HEIGHT} 
                className={row.isEven ? "st11" : "st12"} 
              />
            ))}
          </g>

          {/* TOP LOGO */}
          <g>
            <polygon className="st17" points="129 54.5 129 96.7 114 96.7 86.8 69.5 86.8 85.2 98.3 96.7 86.8 96.7 74.4 96.7 74.4 54.5 89.4 54.5 116.6 81.8 116.6 54.5 129 54.5 129 54.5"/>
            <polygon className="st9-orange" points="74.4 32.6 74.4 45.7 93.8 45.7 110.3 65.6 110.3 45.7 129 45.7 129 32.6 74.4 32.6 74.4 32.6"/>
            <text className="st0" transform="translate(34.2 125.2)">NILA THUNDI</text>
            <text className="st2" transform="translate(66.2 138.4)">INVESTMENT</text>
          </g>

          {/* HEADER INFO */}
          <text className="st1" transform="translate(283.9 115.8)">
            <tspan x="0" y="0">BILLING</tspan><tspan x="0" y="52.8">STATEMENT</tspan>
          </text>
          <text className="st5" transform="translate(286.9 197)">Statement No:</text>
          <text className="st5" transform="translate(427.9 197.2)">{stmtNumber}</text>
          <text className="st5" transform="translate(286.9 225.4)">Date:</text>
          <text className="st5" transform="translate(426.5 220.7)">{stmtDate}</text>
          <text className="st5" transform="translate(35.6 225.6)">Invoice to:</text>
          <text className="st3" transform="translate(45.4 247.3)">SS&L Beach Pvt Ltd</text>
          <text className="st3" transform="translate(45.4 266.8)">C/O Anantara Resort & Spa</text>
          <text className="st3" transform="translate(45.4 286.3)">Meerubahuru Aage, Ameer Ahmed Magu</text>
          <g>
            <text className="st3" transform="translate(286.9 41.9)">Lagoona, Laamu Gan, Thundi</text>
            <text className="st3" transform="translate(286.9 58.4)">9951813, 7471813</text>
          </g>

          {/* TOTAL DUE BOX */}
          <rect className="st6" x="286.9" y="246.6" width="308.3" height="71.2"/>
          <text className="st15" transform="translate(311.6 286.5)">Total Due:</text>
          
          {/* MVR Logo */}
          <g transform="translate(-40, 0)"> 
             <path fill="#ffffff" d="M430.2,283c-.1-.1-.2-.2-.3-.3-.5-.4-.7-1-.5-1.6.2-.6.7-1,1.3-1,.6,0,1.2.2,1.8.4.2,0,.4.1.6.2.3.2.6.1.9-.1.3-.3.6-.5,1-.8,0,0-.2-.1-.2-.2-.4-.2-.6-.6-.7-1.1-.1-1.2.6-1.9,1.8-1.7.6.1,1.1.3,1.7.5.3,0,.5,0,.7,0,1.8-1,3.7-1.9,5.5-2.9,0,0,.1,0,.2,0,.4-.3.8-.3,1.3,0,.4.3.6,1,.5,1.4-.2.4-.6.6-.9.8-1.2.6-2.5,1.2-3.7,1.8,0,0-.2,0-.3.2.2,0,.3.1.4.1.5.2,1.1.4,1.6.7.5.3.8,1.1.6,1.8-.2.5-.7.9-1.4.8-.6,0-1.2-.2-1.8-.4-.7-.2-1.4-.4-2.1-.6-.2,0-.3,0-.5.1-.3.3-.6.5-1,.8.5.2.9.4,1.3.6.7.4,1,.9.9,1.7,0,.7-.6,1.2-1.3,1.2-.4,0-.7,0-1.1-.2-1-.3-2-.6-2.9-.9-.2,0-.3,0-.5,0-1.9,1.2-3.8,2.5-5.7,3.7-1.3.8-2.6,1.5-4,2-.4.1-.8.2-1.1.3-.4,0-.7,0-.9-.3-.8-.7-1-1.5-1-2.5,0-.3.2-.6.6-.6.3,0,.6,0,1,0,.3,0,.5,0,.8,0,.6,0,1.2,0,1.7-.3,1.7-.8,3.3-1.8,4.9-2.8.3-.2.7-.4,1.1-.7"/>
          </g>
          <text className="st14" transform="translate(415 292.8)">{totalDue}</text>

          {/* TABLE HEADERS */}
          <g className="st7">
            <text x="30"  y="370" textAnchor="start">Date</text>
            <text x="155" y="370" textAnchor="middle">Invoice #</text>
            <text x="255" y="370" textAnchor="middle">PO #</text>
            <text x="415" y="370" textAnchor="end">Amount</text>
            <text x="500" y="370" textAnchor="end">Payments</text>
            <text x="585" y="370" textAnchor="end">Balance</text>
          </g>

          {/* TABLE DATA */}
          <g id="DataRows">
            {rows.map((row) => {
              if (row.type === 'opening') {
                  return (
                    <g key={row.id}>
                        <text className="st3" x="30" y={row.yText} textAnchor="start">{row.desc}</text>
                        <text className="st3" x="415" y={row.yText} textAnchor="end">{row.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</text>
                        <text className="st3" x="500" y={row.yText} textAnchor="end">0.00</text>
                        <text className="st3" x="585" y={row.yText} textAnchor="end">{row.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</text>
                    </g>
                  )
              }
              const dateStr = new Date(row.po_date).toLocaleDateString('en-GB')
              const invSuffix = getYearSuffix(row.po_date)
              const invNum = row.invoice_number ? String(row.invoice_number).padStart(4,'0') + '/' + invSuffix : 'PENDING'
              return (
                <g key={row.id}>
                  <text className="st3" x="30"  y={row.yText} textAnchor="start">{dateStr}</text>
                  <text className="st3" x="155" y={row.yText} textAnchor="middle">{invNum}</text>
                  <text className="st3" x="255" y={row.yText} textAnchor="middle">{row.po_number || '-'}</text>
                  <text className="st3" x="415" y={row.yText} textAnchor="end">{row.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</text>
                  <text className="st3" x="500" y={row.yText} textAnchor="end">0.00</text>
                  <text className="st3" x="585" y={row.yText} textAnchor="end">{row.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</text>
                </g>
              )
            })}
          </g>

          {/* FOOTER */}
          <rect className="st6" x=".8" y="830.9" width="594.5" height="2.3"/>
          <text className="st7" transform="translate(357.5 811.5)">Thank you for your business</text>
          
          <g>
            <text className="st4" transform="translate(357.6 729.5)">Account Detail:</text>
            <text className="st4" transform="translate(357.6 751.8)">Name: </text>
            <text className="st4" transform="translate(456.8 751.8)">Ibrahim Yoosuf</text>
            <text className="st4" transform="translate(357.6 774.2)" xmlSpace="preserve">Account No:   </text>
            <text className="st4" transform="translate(456.8 774.2)">7707360119101</text>
          </g>

          <text className="st4" transform="translate(69.7 800.3)">Ibrahim Yoosuf</text>
          <text className="st4" transform="translate(92.5 822.8)">Director</text>

        </svg>
      </div>
    </div>
  )
}   