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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        {/* LOGO AREA */}
        <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 relative">
                {/* Using your uploaded logo file */}
                <Image 
                    src="/logo-dashboard.svg" 
                    alt="Nila Thundi Logo" 
                    fill 
                    className="object-contain"
                    priority
                />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nila Thundi Investment</h1>
            <p className="text-gray-500 text-sm mt-1">Authorized Personnel Only</p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                <AlertCircle className="w-5 h-5"/>
                <span className="text-sm font-bold">{error}</span>
            </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                <input 
                    type="email" 
                    required
                    className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-900 focus:border-black outline-none transition-colors"
                    placeholder="admin@nilathundi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                <input 
                    type="password" 
                    required
                    className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-900 focus:border-black outline-none transition-colors"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Sign In"}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Nila Thundi Investment. Private System.
            </p>
        </div>

      </div>
    </div>
  )
}