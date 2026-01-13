import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. ANTI-CRASH FIX: Use placeholders if keys are missing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // 3. Create the Supabase client
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 4. SAFE AUTH CHECK (Wrapped in try/catch so it never crashes)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error('Middleware Auth Error:', e)
    // If auth fails, we just assume "No User" and continue safely
  }

  // 5. SECURITY RULES
  const path = request.nextUrl.pathname

  // Rule A: If NOT logged in, kick them to /login
  if (!user && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rule B: If ALREADY logged in, kick them to Dashboard (/)
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}