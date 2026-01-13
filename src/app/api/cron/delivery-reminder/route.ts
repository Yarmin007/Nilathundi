import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// 1. Init Clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

// 2. Configuration
const RECIPIENTS = process.env.CRON_EMAIL_RECIPIENTS 
  ? process.env.CRON_EMAIL_RECIPIENTS.split(',') 
  : ['admin@nilathundi.com'] // Fallback

export async function GET(request: Request) {
  try {
    // Security: Verify this request is actually from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // -----------------------------------------------------------------
    // 3. CALCULATE "TODAY" IN MALDIVES TIME (UTC+5)
    // -----------------------------------------------------------------
    const now = new Date()
    // Add 5 hours to UTC to get Maldives time
    const maldivesTime = new Date(now.getTime() + (5 * 60 * 60 * 1000))
    const targetDate = maldivesTime.toISOString().split('T')[0] // YYYY-MM-DD

    console.log(`[CRON] Checking orders for: ${targetDate}`)

    // 4. Fetch Orders for Today
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_date', targetDate)
      .order('po_number', { ascending: true })

    if (!orders || orders.length === 0) {
      console.log('[CRON] No orders today.')
      return NextResponse.json({ message: 'No orders found for today.' })
    }

    // 5. Fetch Next Delivery Note Number
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'next_delivery_note')
      .single()
    
    const startDN = setting?.value || 1

    // 6. Build HTML Table
    let tableRows = ''
    let totalQty = 0
    let totalValue = 0

    orders.forEach((o, index) => {
      const predictedDN = startDN + index
      totalQty += (o.weight_kg || 0)
      totalValue += (o.total_amount || 0)

      tableRows += `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; border: 1px solid #ddd;">${o.po_number}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${o.weight_kg} kg</td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #2563eb;">#${predictedDN}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${o.total_amount.toLocaleString()}</td>
        </tr>
      `
    })

    // Add Totals Row
    tableRows += `
      <tr style="background-color: #f9fafb; font-weight: bold;">
          <td style="padding: 10px; border: 1px solid #ddd;">TOTAL</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${totalQty.toFixed(1)} kg</td>
          <td style="padding: 10px; border: 1px solid #ddd;">-</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${totalValue.toLocaleString()}</td>
      </tr>
    `

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #000;">🚚 Delivery Schedule</h2>
        <p><b>Date:</b> ${targetDate} (Today)</p>
        <p>Here is the list of orders scheduled for delivery today:</p>
        
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; font-size: 14px;">
          <thead>
            <tr style="background-color: #000; color: #fff;">
                <th style="padding: 10px; text-align: left;">PO #</th>
                <th style="padding: 10px; text-align: left;">Qty</th>
                <th style="padding: 10px; text-align: left;">Predicted DN</th>
                <th style="padding: 10px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This is an automated message from Nila Thundi System.<br>
          Generated at 09:00 AM MVT.
        </p>
      </div>
    `

    // 7. Send Email
    await resend.emails.send({
      from: 'Nila Thundi System <admin@nilathundi.com>',
      to: RECIPIENTS,
      subject: `[AUTO] Delivery Schedule - ${targetDate}`,
      html: htmlBody
    })

    // 8. Log the event
    await supabase.from('email_logs').insert({
        recipient: RECIPIENTS.join(', '),
        subject: `[AUTO] Delivery Schedule - ${targetDate}`,
        attachment_name: 'Automated Report',
        status: 'sent'
    })

    return NextResponse.json({ success: true, count: orders.length })

  } catch (error: any) {
    console.error('[CRON ERROR]', error)
    return new NextResponse(error.message, { status: 500 })
  }
}