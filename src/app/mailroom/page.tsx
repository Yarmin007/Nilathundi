'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Mail, Send, Loader2, Paperclip, X, Plus, FileText, Users, Save, Trash2, CheckCircle, AlertCircle, Clock, ChevronDown } from 'lucide-react'
import { sendBatchEmail } from '@/app/actions/email'

export const dynamic = 'force-dynamic'

// --- TYPES ---
type EmailGroup = {
  id: string
  name: string
  to: string[]  // Changed to Array for easier management
  cc: string[]
  bcc: string[]
}

type ToastType = {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export default function MailroomPage() {
  // --- STATE ---
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  
  // Email Fields (Input strings for the main form)
  const [toInput, setToInput] = useState('')
  const [ccInput, setCcInput] = useState('')
  const [bccInput, setBccInput] = useState('')
  const [showCc, setShowCc] = useState(false)
  
  const [subject, setSubject] = useState('Documents from Nila Thundi Investment')
  const [message, setMessage] = useState('Dear Customer,\n\nPlease find the attached documents for your review.\n\nRegards,\nNila Thundi Investment')

  // File Attachments
  const [files, setFiles] = useState<File[]>([])

  // Groups
  const [groups, setGroups] = useState<EmailGroup[]>([])
  const [showGroupModal, setShowGroupModal] = useState(false)
  
  // Group Form State (Arrays for the Modal Chips)
  const [groupFormName, setGroupFormName] = useState('')
  const [groupFormTo, setGroupFormTo] = useState<string[]>([])
  const [groupFormCc, setGroupFormCc] = useState<string[]>([])
  const [groupFormBcc, setGroupFormBcc] = useState<string[]>([])
  
  // Temporary input state for the chips
  const [tempTo, setTempTo] = useState('')
  const [tempCc, setTempCc] = useState('')
  const [tempBcc, setTempBcc] = useState('')

  // Toast Notification
  const [toast, setToast] = useState<ToastType>({ show: false, message: '', type: 'success' })

  // --- INITIALIZATION ---
  useEffect(() => { 
    fetchContacts()
    fetchHistory()
    const saved = localStorage.getItem('email_groups_v3') // Version 3 for new format
    if (saved) setGroups(JSON.parse(saved))
  }, [])

  const fetchContacts = async () => {
    const { data } = await supabase.from('contacts').select('*').order('name', { ascending: true })
    setContacts(data || [])
  }

  const fetchHistory = async () => {
    const { data } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(20)
    setLogs(data || [])
  }

  // --- HANDLERS ---

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, message: msg, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000)
  }

  // --- CHIP LOGIC (For Modal) ---
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
  
  const removeChip = (email: string, list: string[], setList: Function) => {
      setList(list.filter(e => e !== email))
  }

  // --- GROUP LOGIC ---
  
  // 1. Open Modal (Parse current inputs into chips)
  const openGroupModal = () => {
      setGroupFormName('')
      // Split current inputs by comma to prepopulate
      setGroupFormTo(toInput ? toInput.split(',').map(s => s.trim()).filter(s => s) : [])
      setGroupFormCc(ccInput ? ccInput.split(',').map(s => s.trim()).filter(s => s) : [])
      setGroupFormBcc(bccInput ? bccInput.split(',').map(s => s.trim()).filter(s => s) : [])
      
      setTempTo('')
      setTempCc('')
      setTempBcc('')
      setShowGroupModal(true)
  }

  // 2. Save Group
  const saveGroup = () => {
    if (!groupFormName) return showToast("Please enter a group name", 'error')
    if (groupFormTo.length === 0) return showToast("Add at least one TO recipient", 'error')
    
    const newGroup: EmailGroup = {
        id: Date.now().toString(),
        name: groupFormName,
        to: groupFormTo,
        cc: groupFormCc,
        bcc: groupFormBcc
    }
    
    const updated = [...groups, newGroup]
    setGroups(updated)
    localStorage.setItem('email_groups_v3', JSON.stringify(updated))
    
    setShowGroupModal(false)
    showToast(`Group "${groupFormName}" saved!`, 'success')
  }

  // 3. Load Group
  const loadGroup = (group: EmailGroup) => {
      setToInput(group.to.join(', '))
      setCcInput(group.cc.join(', '))
      setBccInput(group.bcc.join(', '))
      if (group.cc.length > 0 || group.bcc.length > 0) setShowCc(true)
      showToast(`Loaded "${group.name}"`, 'success')
  }

  // 4. Delete Group
  const deleteGroup = (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if(!confirm("Delete this group?")) return
      const updated = groups.filter(g => g.id !== id)
      setGroups(updated)
      localStorage.setItem('email_groups_v3', JSON.stringify(updated))
      showToast("Group deleted", 'success')
  }

  // --- FILE LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])])
    }
  }
  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index))

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const addRecipient = (email: string) => {
    if (!toInput) setToInput(email)
    else if (!toInput.includes(email)) setToInput(prev => `${prev}, ${email}`)
  }

  // --- SEND EMAIL ---
  const handleSend = async () => {
    if (files.length === 0) return showToast("Please attach at least one file.", 'error')
    if (!toInput) return showToast("Please enter a recipient.", 'error')
    
    setLoading(true)

    try {
      const attachmentData = await Promise.all(
        files.map(async (file) => ({
            filename: file.name,
            content: await fileToBase64(file)
        }))
      )

      const cleanTo = toInput.split(',').map(e => e.trim()).filter(e => e)
      const cleanCc = ccInput.split(',').map(e => e.trim()).filter(e => e)
      const cleanBcc = bccInput.split(',').map(e => e.trim()).filter(e => e)

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; white-space: pre-wrap;">
            ${message.replace(/\n/g, '<br>')}
        </div>
      `

      const res = await sendBatchEmail(cleanTo, cleanCc, cleanBcc, subject, htmlBody, attachmentData, ['manual-upload'])

      if (res.success) {
        showToast("Email Sent Successfully!", 'success')
        setFiles([]) 
        fetchHistory()
      } else {
        showToast("Error: " + res.error, 'error')
      }

    } catch (error: any) {
      console.error(error)
      showToast(error.message, 'error')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 relative pb-20">
      
      {/* HEADER */}
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-black text-white rounded-xl"><Mail className="w-6 h-6"/></div>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Mailroom</h1>
            <p className="text-gray-500 text-sm">Upload files and manage email lists.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: COMPOSER --- */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                
                {/* --- GROUP BAR --- */}
                <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100 items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase mr-2">Lists:</span>
                    
                    {groups.map(g => (
                        <div key={g.id} onClick={() => loadGroup(g)} className="group flex items-center gap-2 cursor-pointer bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black hover:text-white hover:border-black transition-all shadow-sm">
                            <Users className="w-3 h-3"/> {g.name}
                            <div onClick={(e) => deleteGroup(g.id, e)} className="text-gray-300 group-hover:text-red-400 hover:bg-white/20 rounded p-0.5 transition-colors"><X className="w-3 h-3"/></div>
                        </div>
                    ))}
                    
                    <button onClick={openGroupModal} className="text-xs flex items-center gap-1 font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors ml-auto">
                        <Plus className="w-3 h-3"/> New List
                    </button>
                </div>

                {/* TO FIELD */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">To (Recipients)</label>
                    <input 
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                        placeholder="email1@test.com, email2@test.com..."
                        value={toInput}
                        onChange={e => setToInput(e.target.value)}
                    />
                    <div className="mt-1 text-[10px] text-gray-400 font-medium">Separate multiple emails with commas.</div>
                    
                    {/* QUICK ADD INDIVIDUALS */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {contacts.slice(0, 5).map(c => (
                            <button key={c.id} onClick={() => addRecipient(c.email)} className="px-2 py-1 bg-gray-50 border rounded text-[10px] font-bold hover:bg-black hover:text-white transition-colors flex items-center gap-1">
                                <Plus className="w-3 h-3"/> {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CC / BCC */}
                <div className="mb-4">
                    <button onClick={() => setShowCc(!showCc)} className="text-xs font-bold text-blue-600 hover:underline">{showCc ? "Hide CC / BCC" : "+ Add CC / BCC"}</button>
                    {showCc && (
                        <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">CC</label>
                                <input className="w-full border rounded p-2 text-sm" placeholder="cc@test.com..." value={ccInput} onChange={e => setCcInput(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">BCC</label>
                                <input className="w-full border rounded p-2 text-sm" placeholder="bcc@test.com..." value={bccInput} onChange={e => setBccInput(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                {/* SUBJECT & BODY */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject</label>
                    <input className="w-full border border-gray-200 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none" value={subject} onChange={e => setSubject(e.target.value)}/>
                </div>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message</label>
                    <textarea className="w-full h-40 border border-gray-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none resize-none" value={message} onChange={e => setMessage(e.target.value)}/>
                </div>

                <button onClick={handleSend} disabled={loading || files.length === 0} className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                    {loading ? 'Sending...' : `Send Email (${files.length} Attachments)`}
                </button>
            </div>
        </div>

        {/* --- RIGHT: ATTACHMENTS --- */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Paperclip className="w-5 h-5 text-blue-600"/> Attachments</h3>
                
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                    <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                    <div className="flex flex-col items-center gap-2 pointer-events-none group-hover:scale-105 transition-transform">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-full"><Plus className="w-8 h-8"/></div>
                        <span className="text-sm font-bold text-gray-600">Click or Drag Files</span>
                        <span className="text-xs text-gray-400">PDF, PNG, JPG</span>
                    </div>
                </div>

                <div className="mt-6 flex-1 overflow-y-auto space-y-3 max-h-[400px]">
                    {files.length === 0 && <div className="text-center text-gray-400 text-xs py-10 italic">No files attached yet.<br/>Drag them here.</div>}
                    {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white rounded border border-gray-100"><FileText className="w-4 h-4 text-red-500"/></div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-gray-800 truncate block w-32 lg:w-40">{file.name}</span>
                                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                                </div>
                            </div>
                            <button onClick={() => removeFile(idx)} className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded"><X className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* --- HISTORY SECTION --- */}
      <div className="mt-12">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400"/> History</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                      <tr>
                          <th className="p-4 border-b">Date</th>
                          <th className="p-4 border-b">Recipients</th>
                          <th className="p-4 border-b">Subject</th>
                          <th className="p-4 border-b">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                      {logs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50">
                              <td className="p-4 text-gray-500 w-40">{new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                              <td className="p-4 font-bold text-gray-900 max-w-xs truncate" title={log.recipient}>{log.recipient}</td>
                              <td className="p-4 text-gray-600 max-w-xs truncate">{log.subject}</td>
                              <td className="p-4"><span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3"/> Sent</span></td>
                          </tr>
                      ))}
                      {logs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No sent history yet.</td></tr>}
                  </tbody>
              </table>
          </div>
      </div>

      {/* --- CREATE GROUP MODAL (WITH CHIPS) --- */}
      {showGroupModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h3 className="font-bold text-xl text-gray-900">Create Email Group</h3>
                          <p className="text-sm text-gray-500">Add emails and press Enter.</p>
                      </div>
                      <button onClick={() => setShowGroupModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="space-y-6">
                      {/* Name */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Group Name</label>
                          <input autoFocus className="w-full border-2 border-gray-200 p-2 rounded-lg font-bold focus:border-black outline-none" placeholder="e.g. Accounting Team" value={groupFormName} onChange={e => setGroupFormName(e.target.value)}/>
                      </div>
                      
                      {/* TO Chips */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">To (Recipients)</label>
                          <div className="border border-gray-200 p-2 rounded-lg min-h-[50px] flex flex-wrap gap-2 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                              {groupFormTo.map(email => (
                                  <span key={email} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                      {email}
                                      <button onClick={() => removeChip(email, groupFormTo, setGroupFormTo)} className="hover:text-blue-900"><X className="w-3 h-3"/></button>
                                  </span>
                              ))}
                              <input 
                                  className="flex-1 outline-none text-sm min-w-[150px]" 
                                  placeholder="Type email & hit Enter..." 
                                  value={tempTo}
                                  onChange={e => setTempTo(e.target.value)}
                                  onKeyDown={e => addChip(e, groupFormTo, setGroupFormTo, tempTo, setTempTo)}
                              />
                          </div>
                      </div>

                      {/* CC Chips */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">CC</label>
                          <div className="border border-gray-200 p-2 rounded-lg min-h-[50px] flex flex-wrap gap-2 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                              {groupFormCc.map(email => (
                                  <span key={email} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                      {email}
                                      <button onClick={() => removeChip(email, groupFormCc, setGroupFormCc)} className="hover:text-black"><X className="w-3 h-3"/></button>
                                  </span>
                              ))}
                              <input 
                                  className="flex-1 outline-none text-sm min-w-[150px]" 
                                  placeholder="Type email & hit Enter..." 
                                  value={tempCc}
                                  onChange={e => setTempCc(e.target.value)}
                                  onKeyDown={e => addChip(e, groupFormCc, setGroupFormCc, tempCc, setTempCc)}
                              />
                          </div>
                      </div>

                      {/* BCC Chips */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">BCC</label>
                          <div className="border border-gray-200 p-2 rounded-lg min-h-[50px] flex flex-wrap gap-2 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                              {groupFormBcc.map(email => (
                                  <span key={email} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                      {email}
                                      <button onClick={() => removeChip(email, groupFormBcc, setGroupFormBcc)} className="hover:text-black"><X className="w-3 h-3"/></button>
                                  </span>
                              ))}
                              <input 
                                  className="flex-1 outline-none text-sm min-w-[150px]" 
                                  placeholder="Type email & hit Enter..." 
                                  value={tempBcc}
                                  onChange={e => setTempBcc(e.target.value)}
                                  onKeyDown={e => addChip(e, groupFormBcc, setGroupFormBcc, tempBcc, setTempBcc)}
                              />
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                      <button onClick={() => setShowGroupModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                      <button onClick={saveGroup} className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Save Group</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toast.show && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300 border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'}`}>
              <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {toast.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
              </div>
              <div>
                  <h4 className="font-bold text-sm text-black">{toast.type === 'success' ? 'Success' : 'Error'}</h4>
                  <p className="text-xs text-gray-500 font-medium">{toast.message}</p>
              </div>
          </div>
      )}

    </div>
  )
}