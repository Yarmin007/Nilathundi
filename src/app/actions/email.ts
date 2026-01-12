'use server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Attachment = {
  filename: string
  content: string 
}

// ---------------------------------------------------------
// ✅ CONFIGURATION
// Sender: Uses your verified domain to allow sending to ANYONE.
const SENDER_IDENTITY = 'Nila Thundi <admin@nilathundi.com>'

// Replies: All replies will go directly to your Gmail.
const REPLY_TO_EMAIL = 'abdulla.yarmin@gmail.com'
// ---------------------------------------------------------

// 1. BATCH SENDING (For Mailroom)
export async function sendBatchEmail(
  to: string[],
  cc: string[],
  bcc: string[],
  subject: string,
  htmlContent: string,
  attachments: Attachment[],
  docIds: string[]
) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error("Missing RESEND_API_KEY")
    const resend = new Resend(apiKey)

    const formattedAttachments = attachments.map(att => {
      const cleanBase64 = att.content.includes('base64,') ? att.content.split('base64,')[1] : att.content
      return { filename: att.filename, content: Buffer.from(cleanBase64, 'base64') }
    })

    const { data, error } = await resend.emails.send({
      from: SENDER_IDENTITY,
      replyTo: REPLY_TO_EMAIL, 
      to: to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject: subject,
      html: htmlContent,
      attachments: formattedAttachments,
    } as any)

    if (error) return { success: false, error: error.message }

    await supabase.from('email_logs').insert({
      recipient: to.join(', '),
      subject: subject,
      attachment_name: `${attachments.length} Files Attached`,
      document_type: 'batch',
      document_id: docIds.join(','),
      status: 'sent'
    })
    
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// 2. SINGLE SENDING (For Invoice/Statement Buttons)
export async function sendDocumentEmail(
  toEmail: string, 
  subject: string, 
  htmlContent: string,
  fileName: string,
  pdfBase64: string,
  docType: string,
  docId: string
) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error("Missing RESEND_API_KEY")
    const resend = new Resend(apiKey)

    const cleanBase64 = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64
    const buffer = Buffer.from(cleanBase64, 'base64')

    const { data, error } = await resend.emails.send({
      from: SENDER_IDENTITY,
      replyTo: REPLY_TO_EMAIL,
      to: [toEmail],
      subject: subject,
      html: htmlContent,
      attachments: [{ filename: fileName, content: buffer }],
    } as any)

    if (error) return { success: false, error: error.message }

    await supabase.from('email_logs').insert({
      recipient: toEmail,
      subject: subject,
      attachment_name: fileName,
      document_type: docType,
      document_id: docId,
      status: 'sent'
    })
    
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// 3. HELPER FOR STATEMENTS
export async function sendStatementEmail(toEmail: string, statementNum: string, pdfBase64: string) {
  const subject = `Statement #${statementNum} - Nila Thundi Investment`
  const html = `<div style="font-family: sans-serif;"><h2>Billing Statement Available</h2><p>Please find attached statement #${statementNum}.</p></div>`
  
  return sendDocumentEmail(
    toEmail, subject, html, 
    `Statement-${statementNum.replace('/', '-')}.pdf`, 
    pdfBase64, 'statement', 'one-click-send'
  )
}