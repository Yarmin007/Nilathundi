import { Suspense } from 'react'
import InvoicesContent from './InvoicesContent'

export const dynamic = 'force-dynamic'

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-gray-400">Loading invoices...</div>}>
      <InvoicesContent />
    </Suspense>
  )
}