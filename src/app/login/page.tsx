'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Invalid email or password.")
      setLoading(false)
    } else {
      router.push('/') 
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm">
        
        {/* LOGO AREA - Responsive Sizing */}
        <div className="text-center mb-6 md:mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 relative">
                <Image 
                    src="/logo-dashboard.svg" 
                    alt="Logo" 
                    fill 
                    className="object-contain"
                    priority
                />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Nila Thundi</h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1 uppercase tracking-wide font-bold">Authorized Access</p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                <span className="text-xs font-bold leading-tight">{error}</span>
            </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Email</label>
                <input 
                    type="email" 
                    required
                    // text-base prevents iOS zoom
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base font-bold text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    placeholder="admin@nilathundi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Password</label>
                <input 
                    type="password" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base font-bold text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-base hover:bg-gray-800 active:scale-95 transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:active:scale-100 mt-2"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Enter Dashboard"}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">
                Private System • {new Date().getFullYear()}
            </p>
        </div>

      </div>
    </div>
  )
}