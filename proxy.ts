import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  // Supabase not configured yet: let requests through instead of failing with 500.
  if (!supabaseUrl || !supabaseAnonKey) {
    return res
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options) {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })

  try {
    await supabase.auth.getUser()
  } catch (error) {
    // Never break page/API rendering because the auth service is unreachable.
    console.error('[proxy] Supabase auth check failed:', error)
  }

  return res
}

export const config = {
  matcher: ['/watch/:path*', '/api/:path*'],
}
