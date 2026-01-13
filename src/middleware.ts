import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. SAFETY FIX: Use placeholders to prevent "Internal Server Error" crashes
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

  // 4. Check if user is logged in (Wrapped in try/catch for safety)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    // If Supabase fails, just treat the user as "Logged Out" instead of crashing
    console.error('Middleware Auth Error:', e)
  }

  // 5. SECURITY RULES:
  const path = request.nextUrl.pathname

  // If NOT logged in -> Block access to everything except Login page
  if (!user && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If ALREADY logged in -> Redirect away from Login page to Dashboard
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  // Don't block images, static files, or icons
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}