// src/app/statements/page.tsx

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FileText, Plus, Loader2, Eye, Trash2, X, AlertCircle, CheckSquare, Square, Filter, Calendar, Edit } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function StatementsPage() {
  const [loading, setLoading] = useState(true)
  const [statements, setStatements] = useState<any[]>([])
  
  // --- FILTER STATE ---
  const [selectedYear, setSelectedYear] = useState('all')
  const [availableYears, setAvailableYears] = useState<string[]>([])

  // --- GENERATOR & EDIT STATE ---
  const [showModal, setShowModal] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [editingStmt, setEditingStmt] = useState<any>(null)
  
  // Dates fallback if selection is empty
  const [dateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [docDate, setDocDate] = useState('') 

  // Selection Logic
  const [availableOrders, setAvailableOrders] = useState<any[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())

  // Previews
  const [previewNewTotal, setPreviewNewTotal] = useState(0)
  const [prevOutstanding, setPrevOutstanding] = useState(0)
  const [lastStmtInfo, setLastStmtInfo] = useState<any>(null)

  // --- DELETE STATE ---
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [statementToDelete, setStatementToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchStatements()
  }, [selectedYear]) // Re-fetch when filter changes

  // 1. Fetch Orders when Modal Opens (Handles both New and Edit modes)
  useEffect(() => {
    if(showModal) fetchOrdersForModal()
  }, [showModal])

  // 2. Recalculate Total when Selection Changes or Orders Load
  useEffect(() => {
    calculateSelectedTotal()
  }, [selectedOrderIds, availableOrders])

  const fetchStatements = async () => {
    setLoading(true)
    let query = supabase.from('statements').select('*').order('created_at', { ascending: false })

    // Apply Year Filter
    if (selectedYear !== 'all') {
        const start = `${selectedYear}-01-01`
        const end = `${selectedYear}-12-31`
        query = query.gte('created_at', start).lte('created_at', end)
    }

    const { data } = await query
    
    // Extract available years for filter
    if (selectedYear === 'all' && data) {
        const years = Array.from(new Set(data.map(s => new Date(s.created_at).getFullYear().toString())))
        setAvailableYears(years.sort().reverse())
    }

    setStatements(data || [])
    setLoading(false)
  }

  // --- LOGIC: FETCH & SELECT ---
  const fetchOrdersForModal = async () => {
    setLoading(true) 

    // 1. Fetch ONLY Unassigned & Unpaid Invoices
    const { data: rawUnassigned } = await supabase
      .from('orders')
      .select('*')
      .is('statement_id', null)
      .not('invoice_number', 'is', null) 
      .or('payment_status.neq.Paid,payment_status.is.null')
      .order('po_date', { ascending: true })
    
    const unassignedOrders = rawUnassigned || []

    if (editingStmt) {
        // --- EDIT MODE ---
        const { data: attached } = await supabase
          .from('orders')
          .select('*')
          .eq('statement_id', editingStmt.id)
          .order('po_date', { ascending: true })
        
        // Combine attached and unassigned so user can add or remove
        const combined = [...(attached || []), ...unassignedOrders].sort((a, b) => new Date(a.po_date).getTime() - new Date(b.po_date).getTime())
        setAvailableOrders(combined)
        
        // Pre-check the currently attached orders
        setSelectedOrderIds(new Set((attached || []).map(o => o.id)))
        
        // Use the locked historical outstanding balance for this specific edit
        setPrevOutstanding(Number(editingStmt.previous_balance) || 0)
    } else {
        // --- NEW STATEMENT MODE ---
        setAvailableOrders(unassignedOrders)
        
        // Default: Select ALL found unassigned orders
        const allIds = new Set(unassignedOrders.map(o => o.id))
        setSelectedOrderIds(allIds)

        // Real Unpaid Debt Calculation (Pending debt from PREVIOUS statements)
        const { data: unpaidFromPrevious } = await supabase
          .from('orders')
          .select('total_amount')
          .not('statement_id', 'is', null)
          .or('payment_status.neq.Paid,payment_status.is.null')

        const totalUnpaidPrevious = (unpaidFromPrevious || []).reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0)
        setPrevOutstanding(Math.max(0, totalUnpaidPrevious))

        // Find Previous Statement Info
        const { data: lastStmt } = await supabase
          .from('statements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() 

        setLastStmtInfo(lastStmt || null)
    }
    
    setLoading(false)
  }

  const calculateSelectedTotal = () => {
    const total = availableOrders
        .filter(o => selectedOrderIds.has(o.id))
        .reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0)
    setPreviewNewTotal(total)
  }

  const toggleOrder = (id: string) => {
    const next = new Set(selectedOrderIds)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    setSelectedOrderIds(next)
  }

  const handleNewStatement = () => {
    setEditingStmt(null)
    setDocDate('')
    setShowModal(true)
  }

  const handleEditStatement = (stmt: any) => {
    setEditingStmt(stmt)
    setDocDate(stmt.created_at ? stmt.created_at.split('T')[0] : '')
    setShowModal(true)
  }

  const handleSaveStatement = async () => {
    if (selectedOrderIds.size === 0) {
      alert('Please select at least one invoice to include in this statement.')
      return
    }

    setGenLoading(true)
    
    // Determine statement duration bound dynamically from selected invoices
    const selectedOrdersData = availableOrders.filter(o => selectedOrderIds.has(o.id))
    const startDates = selectedOrdersData.map(o => o.po_date).filter(Boolean).sort()
    const finalStartDate = startDates[0] || dateRange.start
    const finalEndDate = startDates[startDates.length - 1] || dateRange.end
    const finalTotal = previewNewTotal + prevOutstanding

    const snapshotData = {
      orders: selectedOrdersData.map(o => ({
        id: o.id,
        po_date: o.po_date,
        invoice_number: o.invoice_number,
        po_number: o.po_number,
        total_amount: o.total_amount
      }))
    }

    if (editingStmt) {
        // --- UPDATE EXISTING STATEMENT ---
        const updatePayload: any = {
            start_date: finalStartDate,
            end_date: finalEndDate,
            total_amount: finalTotal,
            previous_balance: prevOutstanding,
            snapshot: snapshotData
        }

        // If date on paper was edited, update created_at as well
        if (docDate) {
            updatePayload.created_at = new Date(docDate).toISOString()
        }

        const { data: updatedStmt, error } = await supabase
            .from('statements')
            .update(updatePayload)
            .eq('id', editingStmt.id)
            .select()
            .single()

        if (!error && updatedStmt) {
            // Update order associations in database
            const prevAttachedIds = new Set(availableOrders.filter(o => o.statement_id === editingStmt.id).map(o => o.id))
            const addedIds = Array.from(selectedOrderIds).filter(id => !prevAttachedIds.has(id))
            const removedIds = Array.from(prevAttachedIds).filter(id => !selectedOrderIds.has(id))

            // Free removed invoices
            if (removedIds.length > 0) {
                await supabase.from('orders').update({ statement_id: null }).in('id', removedIds)
            }
            // Lock added invoices
            if (addedIds.length > 0) {
                await supabase.from('orders').update({ statement_id: editingStmt.id }).in('id', addedIds)
            }

            setShowModal(false)
            fetchStatements()
        } else {
            alert('Error updating statement: ' + (error?.message || 'Unknown error'))
        }
    } else {
        // --- CREATE NEW STATEMENT ---
        const { data: setting } = await supabase.from('settings').select('value').eq('key', 'next_statement_number').single()
        const nextNum = setting?.value || 1
        
        const creationTimestamp = docDate ? new Date(docDate).toISOString() : new Date().toISOString()
        const targetYear = new Date(creationTimestamp).getFullYear()

        const { data: existing } = await supabase
            .from('statements')
            .select('id')
            .eq('statement_number', nextNum)
            .gte('created_at', `${targetYear}-01-01`)
            .lte('created_at', `${targetYear}-12-31`)
            .maybeSingle()

        if (existing) {
            alert(`STOP: Statement #${nextNum}/${targetYear.toString().slice(-2)} already exists! \n\nPlease delete the old one first if you want to replace it, or check your settings counter.`)
            setGenLoading(false)
            return
        }

        const { data: newStatement, error } = await supabase.from('statements').insert([{
          statement_number: nextNum,
          start_date: finalStartDate,
          end_date: finalEndDate,
          total_amount: finalTotal,
          previous_balance: prevOutstanding, 
          previous_statement_number: lastStmtInfo ? String(lastStmtInfo.statement_number) : null,
          created_at: creationTimestamp,
          snapshot: snapshotData,
          is_locked: true
        }]).select().single()

        if (!error && newStatement) {
          await supabase
            .from('orders')
            .update({ statement_id: newStatement.id })
            .in('id', Array.from(selectedOrderIds))

          await supabase.rpc('increment_counter', { row_key: 'next_statement_number' })
          setShowModal(false)
          fetchStatements()
          setDocDate('')
        } else {
          alert('Error: ' + (error?.message || 'Failed to create statement header'))
        }
    }
    setGenLoading(false)
  }

  // --- DELETE ACTIONS ---
  const promptDelete = (id: string) => {
    setStatementToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!statementToDelete) return
    setDeleteLoading(true)
    const { error } = await supabase.from('statements').delete().eq('id', statementToDelete)
    if (!error) {
      await supabase.from('orders').update({ statement_id: null }).eq('statement_id', statementToDelete)
      fetchStatements()
      setShowDeleteModal(false)
      setStatementToDelete(null)
    } else {
      alert("Error deleting: " + error.message)
    }
    setDeleteLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 pt-6 px-4 relative overflow-x-hidden">
      
      {/* HEADER: Stacked on Mobile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Statements</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium mt-1">Monthly billing summaries.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center w-full md:w-auto">
            {/* YEAR FILTER */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer w-full"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button 
                onClick={handleNewStatement}
                className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
                <Plus className="w-5 h-5"/> <span className="md:hidden lg:inline">New Statement</span> <span className="hidden md:inline lg:hidden">New</span>
            </button>
        </div>
      </div>

      {/* STATEMENTS LIST */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-h-[300px]">
        {loading ? (
          <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300"/></div>
        ) : statements.length === 0 ? (
          <div className="p-20 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
            <p>No statements found.</p>
          </div>
        ) : (
          <>
            {/* --- MOBILE CARD VIEW --- */}
            <div className="block md:hidden divide-y divide-gray-100">
                {statements.map((stmt) => (
                    <div key={stmt.id} className="p-5 flex flex-col gap-3 relative">
                        <Link href={`/statements/${stmt.id}`} className="absolute inset-0 z-0"></Link>
                        
                        <div className="flex justify-between items-start relative z-10 pointer-events-none">
                            <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs border border-purple-100">
                                #{String(stmt.statement_number).padStart(4, '0')}/{new Date(stmt.created_at).getFullYear().toString().slice(-2)}
                            </span>
                            <span className="font-extrabold text-gray-900 text-lg">
                                {Number(stmt.total_amount)?.toLocaleString()} <span className="text-xs font-medium text-gray-400">MVR</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 p-2 rounded-lg w-fit relative z-10 pointer-events-none">
                            <Calendar className="w-3 h-3"/>
                            {stmt.start_date ? new Date(stmt.start_date).toLocaleDateString('en-GB') : '-'} ➜ {stmt.end_date ? new Date(stmt.end_date).toLocaleDateString('en-GB') : '-'}
                        </div>

                        <div className="flex justify-between items-center mt-1 relative z-20">
                            <div className="text-xs text-gray-400 pointer-events-none">
                               Generated: {new Date(stmt.created_at).toLocaleDateString('en-GB')}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleEditStatement(stmt)
                                    }} 
                                    className="text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 p-2 rounded-lg transition-all shadow-sm active:scale-95"
                                >
                                    <Edit className="w-4 h-4"/>
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        promptDelete(stmt.id)
                                    }} 
                                    className="text-red-400 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 p-2 rounded-lg transition-all shadow-sm active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- DESKTOP TABLE VIEW --- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Statement #</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Due</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statements.map((stmt) => (
                    <tr key={stmt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-5">
                        <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded text-sm">
                          #{String(stmt.statement_number).padStart(4, '0')}/{new Date(stmt.created_at).getFullYear().toString().slice(-2)}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">Generated: {new Date(stmt.created_at).toLocaleDateString('en-GB')}</div>
                      </td>
                      <td className="p-5 text-sm font-medium text-gray-600">
                        {stmt.start_date ? new Date(stmt.start_date).toLocaleDateString('en-GB') : '-'} <span className="text-gray-300 mx-1">➜</span> {stmt.end_date ? new Date(stmt.end_date).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="p-5 text-sm font-bold text-gray-900">
                        {Number(stmt.total_amount)?.toLocaleString()} MVR
                      </td>
                      <td className="p-5 text-right flex justify-end gap-2">
                        <button onClick={() => handleEditStatement(stmt)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-lg transition-all border border-transparent hover:border-blue-100" title="Edit">
                          <Edit className="w-5 h-5"/>
                        </button>
                        <Link href={`/statements/${stmt.id}`} className="text-gray-500 hover:text-black hover:bg-gray-100 p-2.5 rounded-lg transition-all border border-transparent hover:border-gray-200" title="View">
                          <Eye className="w-5 h-5"/>
                        </Link>
                        <button onClick={() => promptDelete(stmt.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-lg transition-all border border-transparent hover:border-red-100">
                          <Trash2 className="w-5 h-5"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* --- NEW/EDIT STATEMENT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 md:p-6 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg md:text-xl font-extrabold text-gray-900">
                      {editingStmt ? `Edit Statement #${String(editingStmt.statement_number).padStart(4, '0')}` : 'New Statement'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6 text-gray-400 hover:text-black"/></button>
                </div>

                <div className="space-y-4 mb-4 flex-shrink-0">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date on Paper (Optional)</label>
                        <input 
                            type="date" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-base md:text-sm font-bold"
                            value={docDate} 
                            onChange={e => setDocDate(e.target.value)} 
                        />
                    </div>
                </div>

                {/* --- SELECTION LIST --- */}
                <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 rounded-xl border border-gray-100 mb-4">
                    <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Select Invoices</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedOrderIds.size === availableOrders.length) {
                                        setSelectedOrderIds(new Set())
                                    } else {
                                        setSelectedOrderIds(new Set(availableOrders.map(o => o.id)))
                                    }
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                            >
                                {selectedOrderIds.size === availableOrders.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-xs bg-white px-2 py-0.5 rounded font-bold border border-gray-200">
                                {selectedOrderIds.size} / {availableOrders.length}
                            </span>
                        </div>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1">
                        {availableOrders.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-400">All available invoices have already been assigned to statements!</div>
                        ) : availableOrders.map(order => {
                            const isSelected = selectedOrderIds.has(order.id)
                            return (
                                <div 
                                    key={order.id} 
                                    onClick={() => toggleOrder(order.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all active:scale-98 ${
                                        isSelected 
                                        ? 'bg-white border-blue-200 shadow-sm' 
                                        : 'bg-transparent border-transparent hover:bg-gray-100 opacity-50'
                                    }`}
                                >
                                    <div className={isSelected ? 'text-blue-600' : 'text-gray-300'}>
                                        {isSelected ? <CheckSquare className="w-6 h-6"/> : <Square className="w-6 h-6"/>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                                                Inv #{String(order.invoice_number || '').padStart(4,'0')}
                                            </span>
                                            <span className={`text-sm font-mono font-bold ${isSelected ? 'text-black' : 'text-gray-400'}`}>
                                                {Number(order.total_amount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                            {order.po_date || 'No Date'} • PO: {order.po_number || '-'}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* PREVIEW BOX */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex-shrink-0 mb-4 space-y-3">
                    <div className="flex justify-between items-center text-xs md:text-sm text-gray-600">
                        <span className="flex items-center gap-1">Invoices Subtotal:</span>
                        <span className="font-bold">{previewNewTotal.toLocaleString()} MVR</span>
                    </div>

                    <div className="flex justify-between items-center text-xs md:text-sm text-gray-600">
                        <label htmlFor="prevBalance" className="flex items-center gap-1 font-medium">
                            Prev. Balance <AlertCircle className="w-3 h-3 text-gray-400"/>:
                        </label>
                        <input
                            id="prevBalance"
                            type="number"
                            step="0.01"
                            value={prevOutstanding}
                            onChange={(e) => setPrevOutstanding(Number(e.target.value) || 0)}
                            className="w-28 bg-white border border-gray-200 rounded px-2 py-1 text-right font-bold text-gray-800 focus:outline-blue-500"
                        />
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex justify-between text-base md:text-lg font-extrabold text-gray-900">
                        <span>Total Due:</span>
                        <span>{(previewNewTotal + prevOutstanding).toLocaleString()} MVR</span>
                    </div>
                </div>

                <button 
                    onClick={handleSaveStatement} 
                    disabled={genLoading}
                    className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 transition-transform"
                >
                    {genLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : editingStmt ? 'Update Statement' : 'Generate Statement'}
                </button>
             </div>
        </div>
      )}
      
      {/* DELETE CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full scale-100 animate-in zoom-in-95 duration-200">
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Statement?</h3>
                 <p className="text-gray-500 text-sm mb-6 leading-relaxed">This will only delete the statement document. The invoices inside it will remain safe and become unassigned again.</p>
                 <div className="flex gap-3">
                    <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 active:bg-gray-50">Cancel</button>
                    <button onClick={confirmDelete} disabled={deleteLoading} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:bg-red-800 flex justify-center items-center">
                        {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Delete'}
                    </button>
                 </div>
            </div>
        </div>
      )}

    </div>
  )
}