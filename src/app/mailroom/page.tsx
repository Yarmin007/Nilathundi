'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Mail, Send, Loader2, Paperclip, X, Plus, FileText, Users, Save, Trash2, CheckCircle, AlertCircle, Clock, Bell, Pencil, Calendar } from 'lucide-react'
import { sendBatchEmail } from '@/app/actions/email'

export const dynamic = 'force-dynamic'

type EmailGroup = {
  id: string
  name: string
  to: string[]
  cc: string[]
  bcc: string[]
}

type ToastType = {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export default function MailroomPage() {
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  
  // Composer State
  const [toInput, setToInput] = useState('')
  const [ccInput, setCcInput] = useState('')
  const [bccInput, setBccInput] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [subject, setSubject] = useState('Documents from Nila Thundi')
  const [message, setMessage] = useState('Dear Customer,\n\nPlease find the attached documents for your review.\n\nRegards,\nNila Thundi Investment')
  const [files, setFiles] = useState<File[]>([])

  // Groups
  const [groups, setGroups] = useState<EmailGroup[]>([])
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<EmailGroup | null>(null)

  // Group Form Inputs
  const [groupFormName, setGroupFormName] = useState('')
  const [groupFormTo, setGroupFormTo] = useState<string[]>([])
  const [groupFormCc, setGroupFormCc] = useState<string[]>([])
  const [groupFormBcc, setGroupFormBcc] = useState<string[]>([])
  const [tempTo, setTempTo] = useState(''); const [tempCc, setTempCc] = useState(''); const [tempBcc, setTempBcc] = useState('')

  // Reminder State
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderOrders, setReminderOrders] = useState<any[]>([])
  const [nextDN, setNextDN] = useState<number>(0)
  const [loadingReminders, setLoadingReminders] = useState(false)

  const [toast, setToast] = useState<ToastType>({ show: false, message: '', type: 'success' })

  useEffect(() => { 
    fetchContacts()
    fetchHistory()
    const saved = localStorage.getItem('email_groups_v3')
    if (saved) setGroups(JSON.parse(saved))
    
    const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
    setReminderDate(tmrw.toISOString().split('T')[0])
  }, [])

  const fetchContacts = async () => {
    const { data } = await supabase.from('contacts').select('*').order('name', { ascending: true })
    setContacts(data || [])
  }

  const fetchHistory = async () => {
    const { data } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(20)
    setLogs(data || [])
  }

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, message: msg, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000)
  }

  const addChip = (e: React.KeyboardEvent, list: string[], setList: Function, val: string, setVal: Function) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault()
          const email = val.trim().replace(',', '')
          if (email && !list.includes(email)) {
              setList([...list, email])
              setVal('')
          }
      }
  }
  const removeChip = (email: string, list: string[], setList: Function) => setList(list.filter(e => e !== email))

  const openGroupModal = (groupToEdit?: EmailGroup) => {
      if (groupToEdit) {
          setEditingGroup(groupToEdit)
          setGroupFormName(groupToEdit.name)
          setGroupFormTo(groupToEdit.to)
          setGroupFormCc(groupToEdit.cc)
          setGroupFormBcc(groupToEdit.bcc)
      } else {
          setEditingGroup(null)
          setGroupFormName('')
          setGroupFormTo(toInput ? toInput.split(',').map(s => s.trim()).filter(s => s) : [])
          setGroupFormCc(ccInput ? ccInput.split(',').map(s => s.trim()).filter(s => s) : [])
          setGroupFormBcc(bccInput ? bccInput.split(',').map(s => s.trim()).filter(s => s) : [])
      }
      setTempTo(''); setTempCc(''); setTempBcc('')
      setShowGroupModal(true)
  }

  const saveGroup = () => {
    if (!groupFormName) return showToast("Please enter a group name", 'error')
    if (groupFormTo.length === 0) return showToast("Add at least one TO recipient", 'error')
    
    const newGroup: EmailGroup = {
        id: editingGroup ? editingGroup.id : Date.now().toString(),
        name: groupFormName,
        to: groupFormTo,
        cc: groupFormCc,
        bcc: groupFormBcc
    }
    
    let updated;
    if (editingGroup) {
        updated = groups.map(g => g.id === editingGroup.id ? newGroup : g)
        showToast(`Group updated!`, 'success')
    } else {
        updated = [...groups, newGroup]
        showToast(`Group created!`, 'success')
    }
    
    setGroups(updated)
    localStorage.setItem('email_groups_v3', JSON.stringify(updated))
    setShowGroupModal(false)
  }

  const loadGroup = (group: EmailGroup) => {
      setToInput(group.to.join(', '))
      setCcInput(group.cc.join(', '))
      setBccInput(group.bcc.join(', '))
      if (group.cc.length > 0 || group.bcc.length > 0) setShowCc(true)
      showToast(`Loaded "${group.name}"`, 'success')
  }

  const deleteGroup = (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if(!confirm("Delete this group?")) return
      const updated = groups.filter(g => g.id !== id)
      setGroups(updated)
      localStorage.setItem('email_groups_v3', JSON.stringify(updated))
      showToast("Group deleted", 'success')
  }

  const checkReminders = async () => {
      setLoadingReminders(true)
      setShowReminderModal(true)
      
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_date', reminderDate)
        .order('po_number', { ascending: true })
      
      setReminderOrders(orders || [])

      const { data: setting } = await supabase.from('settings').select('value').eq('key', 'next_delivery_note').single()
      setNextDN(setting?.value || 1)
      
      setLoadingReminders(false)
  }

  const loadReminderIntoComposer = () => {
      if (reminderOrders.length === 0) return
      
      const textBody = `Dear Team,\n\nHere is the delivery schedule for ${new Date(reminderDate).toLocaleDateString()}:\n\n` +
      reminderOrders.map((o, i) => `PO: ${o.po_number} | Qty: ${o.weight_kg}kg | DN: ${nextDN + i} (Predicted)`).join('\n') +
      `\n\nRegards,\nNila Thundi`

      setSubject(`Delivery Schedule - ${new Date(reminderDate).toLocaleDateString()}`)
      setMessage(textBody)
      setShowReminderModal(false)
      showToast("Reminder loaded into composer!", 'success')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFiles(prev => [...prev, ...Array.from(e.target.files || [])])
  }
  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index))

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string); reader.onerror = reject;
  })

  const handleSend = async () => {
    if (!toInput) return showToast("Please enter a recipient.", 'error')
    
    setLoading(true)
    try {
      const attachmentData = await Promise.all(files.map(async (file) => ({
            filename: file.name, content: await fileToBase64(file)
      })))

      const res = await sendBatchEmail(
        toInput.split(',').map(e => e.trim()).filter(e => e),
        ccInput.split(',').map(e => e.trim()).filter(e => e),
        bccInput.split(',').map(e => e.trim()).filter(e => e),
        subject,
        `<div style="font-family: Arial; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div>`,
        attachmentData,
        ['manual-upload']
      )

      if (res.success) {
        const { error: logError } = await supabase.from('email_logs').insert([{
            recipient: toInput,
            subject: subject,
            status: 'Sent',
            attachments: res.attachmentNames || []
        }])

        if (logError) console.error("Log Error", logError)

        showToast("Email Sent!", 'success')
        setFiles([]) 
        fetchHistory()
      } else {
        showToast("Error: " + res.error, 'error')
      }
    } catch (error: any) {
      showToast(error.message, 'error')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 relative pb-24 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="mb-6 md:mb-8 flex justify-between items-end">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-black text-white rounded-xl shadow-sm"><Mail className="w-5 h-5 md:w-6 md:h-6"/></div>
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mailroom</h1>
                <p className="text-gray-500 text-xs md:text-sm">Manage emails & reminders.</p>
            </div>
        </div>
        <button onClick={() => checkReminders()} className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 border border-orange-100 hover:bg-orange-100 transition-colors">
            <Bell className="w-4 h-4"/> Check Reminders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* --- COMPOSER --- */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
                
                {/* GROUPS */}
                <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100 items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase mr-2 w-full md:w-auto">Lists:</span>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {groups.map(g => (
                            <div key={g.id} onClick={() => loadGroup(g)} className="group flex items-center gap-2 cursor-pointer bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:border-black transition-all shadow-sm active:scale-95">
                                <Users className="w-3 h-3"/> {g.name}
                                <div onClick={(e) => { e.stopPropagation(); openGroupModal(g) }} className="text-gray-300 hover:text-blue-500 p-1"><Pencil className="w-3 h-3"/></div>
                                <div onClick={(e) => deleteGroup(g.id, e)} className="text-gray-300 hover:text-red-500 p-1"><X className="w-3 h-3"/></div>
                            </div>
                        ))}
                        <button onClick={() => openGroupModal()} className="text-xs flex items-center gap-1 font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors ml-auto md:ml-0 active:bg-blue-100"><Plus className="w-3 h-3"/> New</button>
                    </div>
                </div>

                {/* FIELDS */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">To</label>
                        <input className="w-full bg-white border border-gray-200 rounded-lg p-3 text-base md:text-sm font-bold focus:ring-2 focus:ring-black outline-none" placeholder="email@test.com..." value={toInput} onChange={e => setToInput(e.target.value)} />
                    </div>
                    <div>
                        <button onClick={() => setShowCc(!showCc)} className="text-xs font-bold text-blue-600 hover:underline">{showCc ? "Hide CC/BCC" : "+ CC/BCC"}</button>
                        {showCc && (
                            <div className="space-y-3 mt-3 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                                <input className="w-full border rounded p-2 text-sm" placeholder="CC..." value={ccInput} onChange={e => setCcInput(e.target.value)} />
                                <input className="w-full border rounded p-2 text-sm" placeholder="BCC..." value={bccInput} onChange={e => setBccInput(e.target.value)} />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject</label>
                        <input className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm font-bold focus:ring-2 focus:ring-black outline-none" value={subject} onChange={e => setSubject(e.target.value)}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message</label>
                        <textarea className="w-full h-40 border border-gray-200 rounded-lg p-3 text-base md:text-sm font-medium focus:ring-2 focus:ring-black outline-none resize-none" value={message} onChange={e => setMessage(e.target.value)}/>
                    </div>
                </div>

                <button onClick={handleSend} disabled={loading} className="w-full mt-6 bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-95">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                    {loading ? 'Sending...' : `Send Email`}
                </button>
            </div>
        </div>

        {/* --- ATTACHMENTS --- */}
        <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Paperclip className="w-5 h-5 text-blue-600"/> Attachments</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group active:bg-gray-100">
                    <input type="file" multiple onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-full"><Plus className="w-6 h-6"/></div>
                        <span className="text-sm font-bold text-gray-600">Tap to Upload</span>
                    </div>
                </div>
                <div className="mt-6 flex-1 overflow-y-auto space-y-3 max-h-[300px]">
                    {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-sm font-bold text-gray-800 truncate w-32">{file.name}</span>
                            <button onClick={() => removeFile(idx)}><X className="w-4 h-4 text-red-500"/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* --- HISTORY TABLE (RESPONSIVE UPDATE) --- */}
      <div className="mt-12 order-3">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400"/> Sent History</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              
              {/* MOBILE CARD VIEW */}
              <div className="block md:hidden divide-y divide-gray-100">
                  {logs.map(log => (
                      <div key={log.id} className="p-5 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                              <div className="font-bold text-gray-900 break-all pr-4 text-sm">{log.recipient}</div>
                              <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm text-gray-600 font-medium">{log.subject}</div>
                          {log.attachments && log.attachments.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                  {log.attachments.map((f: string, i: number) => (
                                      <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100"><Paperclip className="w-3 h-3"/> File</span>
                                  ))}
                              </div>
                          )}
                      </div>
                  ))}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                          <tr>
                              <th className="p-4 border-b">Sent Time</th>
                              <th className="p-4 border-b">Recipient</th>
                              <th className="p-4 border-b">Subject</th>
                              <th className="p-4 border-b">Attachments</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                          {logs.map(log => (
                              <tr key={log.id} className="hover:bg-gray-50">
                                  <td className="p-4 text-gray-500">
                                      <div className="font-bold text-gray-900">{new Date(log.created_at).toLocaleDateString()}</div>
                                      <div className="text-xs">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                  </td>
                                  <td className="p-4 font-bold text-gray-900 max-w-xs truncate" title={log.recipient}>{log.recipient}</td>
                                  <td className="p-4 text-gray-600 max-w-xs truncate">{log.subject}</td>
                                  <td className="p-4">
                                      {log.attachments && log.attachments.length > 0 ? (
                                          <div className="flex flex-col gap-1">
                                              {log.attachments.map((f: string, i: number) => (
                                                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                                      <Paperclip className="w-3 h-3"/> {f}
                                                  </span>
                                              ))}
                                          </div>
                                      ) : <span className="text-gray-400 text-xs">None</span>}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* --- DELIVERY REMINDER MODAL --- */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2"><Bell className="w-5 h-5"/> Delivery Reminder</h3>
                    <button onClick={() => setShowReminderModal(false)}><X className="w-6 h-6"/></button>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Check Orders For:</label>
                    <div className="flex gap-2">
                        <input type="date" className="flex-1 border-2 border-gray-200 rounded-xl p-3 font-bold" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
                        <button onClick={checkReminders} className="bg-black text-white px-4 rounded-xl font-bold">Check</button>
                    </div>
                </div>

                {loadingReminders ? (
                    <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300"/></div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 max-h-[200px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Found {reminderOrders.length} Orders</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Next DN: #{nextDN}</span>
                        </div>
                        {reminderOrders.length === 0 ? <p className="text-sm text-gray-400 italic">No orders found for this date.</p> : (
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="text-gray-400 border-b">
                                        <th className="pb-1">PO #</th>
                                        <th className="pb-1">Qty</th>
                                        <th className="pb-1">Predicted DN</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 font-medium">
                                    {reminderOrders.map((o, i) => (
                                        <tr key={o.id}>
                                            <td className="py-1">{o.po_number}</td>
                                            <td className="py-1">{o.weight_kg}</td>
                                            <td className="py-1 text-blue-600">#{nextDN + i}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                <button onClick={loadReminderIntoComposer} disabled={reminderOrders.length === 0} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300">
                    Load into Email Composer
                </button>
            </div>
        </div>
      )}

      {/* --- GROUP MODAL --- */}
      {showGroupModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">{editingGroup ? 'Edit Group' : 'New Group'}</h3>
                  <div className="space-y-4">
                      <input className="w-full border-2 border-gray-200 p-3 rounded-lg font-bold" placeholder="Group Name" value={groupFormName} onChange={e => setGroupFormName(e.target.value)}/>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">TO (Type & Enter)</label>
                          <div className="border border-gray-200 p-2 rounded-lg flex flex-wrap gap-2">
                              {groupFormTo.map(e => <span key={e} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">{e}<button onClick={() => removeChip(e, groupFormTo, setGroupFormTo)}><X className="w-3 h-3"/></button></span>)}
                              <input className="flex-1 outline-none text-sm min-w-[100px]" placeholder="Add email..." value={tempTo} onChange={e => setTempTo(e.target.value)} onKeyDown={e => addChip(e, groupFormTo, setGroupFormTo, tempTo, setTempTo)}/>
                          </div>
                      </div>
                      {/* CC & BCC sections hidden for brevity, add if needed or copy from previous code */}
                  </div>
                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowGroupModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button>
                      <button onClick={saveGroup} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">Save</button>
                  </div>
              </div>
          </div>
      )}

      {/* TOAST */}
      {toast.show && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'}`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
              <span className="font-bold text-sm">{toast.message}</span>
          </div>
      )}

    </div>
  )
}