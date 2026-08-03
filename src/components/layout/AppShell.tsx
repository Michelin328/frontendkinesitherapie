'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AppShellProps {
  children: React.ReactNode
  searchPlaceholder?: string
  showSearch?: boolean
  topBarActions?: React.ReactNode
}

const AUTH_URL = 'https://authentification-front.vercel.app/login'
const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL
const TOKEN_KEY = 'authToken'

function deconnecter(redirect = true) {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('serviceId')
  if (redirect) {
    const redirectUrl = encodeURIComponent(window.location.origin)
    window.location.href = `${AUTH_URL}?redirect=${redirectUrl}`
  }
}

function decoderToken(token: string): { userId?: string; exp?: number } | null {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function AppShellInner({
  children,
  searchPlaceholder,
  showSearch = true,
  topBarActions,
}: AppShellProps) {
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [banniereVisible, setBanniereVisible] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const pathname = usePathname()

  function cyclerPreview() {
    setPreviewMode((m) => (m === 'desktop' ? 'tablet' : m === 'tablet' ? 'mobile' : 'desktop'))
  }

  useEffect(() => {
    const tokenFromUrl = searchParams.get('accessToken')
    const serviceIdFromUrl = searchParams.get('serviceId')
    if (tokenFromUrl) {
      localStorage.setItem(TOKEN_KEY, tokenFromUrl)
      if (serviceIdFromUrl) { localStorage.setItem('serviceId', serviceIdFromUrl) }
      const url = new URL(window.location.href)
      url.searchParams.delete('accessToken')
      url.searchParams.delete('serviceId')
      window.history.replaceState({}, '', url.toString())
    }
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      deconnecter()
      return
    }

    const payload = decoderToken(token)
    if (!payload || !payload.exp || !payload.userId) {
      deconnecter()
      return
    }

    const maintenant = Math.floor(Date.now() / 1000)
    if (payload.exp < maintenant) {
      deconnecter()
      return
    }

    if (!USER_API_URL) {
      setChecking(false)
      return
    }

    fetch(`${USER_API_URL}/${payload.userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          deconnecter()
          return
        }
        setChecking(false)
      })
      .catch(() => {
        setChecking(false)
      })
  }, [searchParams])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Verification de la connexion...</p>
      </div>
    )
  }

  const dimensionsFrame =
    previewMode === 'tablet'
      ? 'w-[820px] h-[1120px] rounded-[2rem] p-3'
      : 'w-[380px] h-[780px] rounded-[2.5rem] p-3'

  return (
    <div className="flex min-h-screen bg-background">
      {previewMode === 'desktop' && <Sidebar open={menuOuvert} onClose={() => setMenuOuvert(false)} />}
      <div className={previewMode === 'desktop' ? 'flex-1 lg:ml-64 flex flex-col min-h-screen' : 'flex-1 flex flex-col min-h-screen'}>
        <TopBar
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          actions={topBarActions}
          onMenuClick={() => setMenuOuvert(true)}
          previewMode={previewMode}
          onTogglePreview={cyclerPreview}
          onNouvelleNotification={() => setBanniereVisible(true)}
          onBellClick={() => setBanniereVisible(false)}
        />
        {banniereVisible && (
          <div className="mx-4 md:mx-8 mt-4 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600">notifications_active</span>
            <p className="text-sm font-semibold text-amber-800 flex-1">Une nouvelle demande est arrivée ! Consultez les notifications.</p>
            <button onClick={() => setBanniereVisible(false)} className="text-amber-600 hover:text-amber-800 flex-shrink-0">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}
        {previewMode === 'desktop' ? (
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-300/60 p-6 overflow-auto">
            <div className={'bg-black shadow-2xl max-w-full max-h-[85vh] ' + dimensionsFrame}>
              <iframe
                src={pathname}
                className="w-full h-full rounded-[1.6rem] border-0 bg-white"
                title="Apercu responsive"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AppShell(props: AppShellProps) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Chargement...</p>
      </div>
    }>
      <AppShellInner {...props} />
    </Suspense>
  )
}
