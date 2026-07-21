'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AppShellProps {
  children: React.ReactNode
  searchPlaceholder?: string
  showSearch?: boolean
  topBarActions?: React.ReactNode
}

const AUTH_URL = 'https://auth-client-dun.vercel.app/login'
const TOKEN_KEY = 'authToken'

export default function AppShell({
  children,
  searchPlaceholder,
  showSearch = true,
  topBarActions,
}: AppShellProps) {
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (tokenFromUrl) {
      localStorage.setItem(TOKEN_KEY, tokenFromUrl)
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
    }

    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      const redirectUrl = encodeURIComponent(window.location.origin)
      window.location.href = `${AUTH_URL}?redirect=${redirectUrl}`
      return
    }

    setChecking(false)
  }, [searchParams])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Verification de la connexion...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          actions={topBarActions}
        />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
