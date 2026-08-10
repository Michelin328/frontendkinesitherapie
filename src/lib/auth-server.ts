import { cookies } from 'next/headers'

export interface AuthInfo {
  chuId?: string
  serviceId?: string
}

function decoderTokenServeur(token: string): AuthInfo {
  try {
    const payload = token.split('.')[1]
    const decoded = Buffer.from(
      payload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8')
    const json = JSON.parse(decoded)
    return {
      chuId: json?.services?.[0]?.chu?.id,
      serviceId: json?.services?.[0]?.serviceId,
    }
  } catch {
    return {}
  }
}

export async function getAuthInfo(): Promise<AuthInfo> {
  const cookieStore = await cookies()
  const token = cookieStore.get('authToken')?.value
  if (!token) return {}
  return decoderTokenServeur(token)
}
