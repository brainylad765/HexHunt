export interface CTFdUser {
  id: number
  name: string
  email: string
  team_id?: number | null
  score?: number
  type?: string
}

export interface CTFdTeam {
  id: number
  name: string
  score?: number
  members?: Array<{ id: number; name: string }>
}

export interface ScoreboardEntry {
  pos: number
  account_id: number
  account_url?: string
  name: string
  score: number
  members?: Array<{ id: number; name: string; score?: number }>
}

export interface SubmissionEntry {
  id: number
  type: string
  challenge_id: number
  user_id: number
  team_id?: number | null
  date: string
  provided: string
  user?: { name: string }
  team?: { name: string }
  challenge?: { name: string }
}

export interface CTFdChallenge {
  id: number
  name: string
  category: string
  value: number
  solves?: number
  solved_by_me?: boolean
  description?: string
  connection_info?: string | null
  files?: string[]
}

export interface CTFdNotification {
  id: number
  title: string
  content: string
  html?: string
  date: string
  user_id?: number | null
  team_id?: number | null
}

export interface CTFdConfig {
  id?: number
  key: string
  value: string | null
}

export interface CTFdUserAccount {
  id: number
  name: string
  email?: string
  type?: string
  banned?: boolean
  verified?: boolean
  team_id?: number | null
  score?: number
  created?: string
}

export interface CTFdFlag {
  id: number
  challenge_id: number
  type: string
  content: string
  data?: string
}

export interface SubmitResult {
  status: 'correct' | 'incorrect' | 'already_solved' | 'blocked' | 'error'
  message: string
}

let cachedNonce: string | null = null

export async function getCsrfNonce(forceRefresh = false): Promise<string> {
  if (cachedNonce && !forceRefresh) return cachedNonce

  try {
    const res = await fetch('/', { credentials: 'include' })
    const text = await res.text()
    const match = text.match(/['"]csrfNonce['"]:\s*['"]([^'"]+)['"]/) ||
                  text.match(/name=["']nonce["']\s+type=["']hidden["']\s+value=["']([^"']+)["']/) ||
                  text.match(/value=["']([^"']+)["']\s+name=["']nonce["']/)
    if (match && match[1]) {
      cachedNonce = match[1]
      return cachedNonce
    }
  } catch (err) {
    console.warn('Could not extract csrfNonce from root, trying /login:', err)
  }

  try {
    const res = await fetch('/login', { credentials: 'include' })
    const text = await res.text()
    const match = text.match(/['"]csrfNonce['"]:\s*['"]([^'"]+)['"]/) ||
                  text.match(/name=["']nonce["']\s+type=["']hidden["']\s+value=["']([^"']+)["']/) ||
                  text.match(/value=["']([^"']+)["']\s+name=["']nonce["']/)
    if (match && match[1]) {
      cachedNonce = match[1]
      return cachedNonce
    }
  } catch (err) {
    console.warn('Could not fetch nonce from /login:', err)
  }

  return ''
}

export async function getCurrentUser(): Promise<CTFdUser | null> {
  try {
    const res = await fetch('/api/v1/users/me', { credentials: 'include' })
    if (!res.ok) return null
    const json = await res.json()
    if (json.success && json.data) {
      const user = json.data as CTFdUser
      // Check if user is admin either by name or by fetching user detail
      if (user.name?.toLowerCase() === 'admin') {
        user.type = 'admin'
      } else {
        try {
          const detailRes = await fetch(`/api/v1/users/${user.id}`, { credentials: 'include' })
          if (detailRes.ok) {
            const detailJson = await detailRes.json()
            if (detailJson.success && detailJson.data?.type) {
              user.type = detailJson.data.type
            }
          }
        } catch {
          // ignore error
        }
      }
      return user
    }
    return null
  } catch {
    return null
  }
}

export async function getCurrentTeam(): Promise<CTFdTeam | null> {
  try {
    const res = await fetch('/api/v1/teams/me', { credentials: 'include' })
    if (!res.ok) return null
    const json = await res.json()
    if (json.success && json.data) {
      return json.data as CTFdTeam
    }
    return null
  } catch {
    return null
  }
}

export async function getChallenges(): Promise<CTFdChallenge[]> {
  try {
    const res = await fetch('/api/v1/challenges', { credentials: 'include' })
    if (!res.ok) return []
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data as CTFdChallenge[]
    }
    return []
  } catch {
    return []
  }
}

export async function getChallengeDetail(id: number): Promise<CTFdChallenge | null> {
  try {
    const res = await fetch(`/api/v1/challenges/${id}`, { credentials: 'include' })
    if (!res.ok) return null
    const json = await res.json()
    if (json.success && json.data) {
      return json.data as CTFdChallenge
    }
    return null
  } catch {
    return null
  }
}

export async function submitFlag(challengeId: number, flag: string): Promise<SubmitResult> {
  try {
    const nonce = await getCsrfNonce()
    const res = await fetch('/api/v1/challenges/attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': nonce,
      },
      credentials: 'include',
      body: JSON.stringify({
        challenge_id: challengeId,
        submission: flag.trim(),
      }),
    })

    const data = await res.json()

    // Check if blocked by team gate or auth
    if (res.status === 403 || res.status === 401) {
      const errorMsg = data?.errors?.['']?.[0] || data?.errors || 'Forbidden: Submission blocked.'
      return {
        status: 'blocked',
        message: Array.isArray(errorMsg) ? errorMsg[0] : String(errorMsg),
      }
    }

    if (data.success && data.data) {
      const status = data.data.status
      if (status === 'correct') {
        return { status: 'correct', message: data.data.message || 'Signature match! Access granted.' }
      }
      if (status === 'already_solved') {
        return { status: 'already_solved', message: 'Challenge is already solved by your team.' }
      }
      return { status: 'incorrect', message: data.data.message || 'Signature rejected.' }
    }

    return {
      status: 'error',
      message: data?.errors?.['']?.[0] || 'Submission failed. Please check connection.',
    }
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Network error communicating with CTFd authority.',
    }
  }
}

export async function loginToCtfd(name: string, password: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Clear any previous session first so Flask-Login accepts the new user
    await logoutFromCtfd()
    cachedNonce = null

    const nonce = await getCsrfNonce(true)
    const formData = new URLSearchParams()
    formData.append('name', name.trim())
    formData.append('password', password)
    formData.append('nonce', nonce)

    await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: formData.toString(),
    })

    // Reset nonce cache after session change
    cachedNonce = null

    // Verify session by querying /api/v1/users/me
    const user = await getCurrentUser()
    if (user && user.name) {
      return { success: true }
    }
    return { success: false, message: 'Invalid operative callsign or security key.' }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error communicating with CTFd authority.' }
  }
}

export async function logoutFromCtfd(): Promise<void> {
  try {
    await fetch('/logout', { credentials: 'include' })
    cachedNonce = null
  } catch (err) {
    console.error('Logout error:', err)
  }
}

export async function getScoreboard(): Promise<ScoreboardEntry[]> {
  try {
    const res = await fetch('/api/v1/scoreboard', { credentials: 'include' })
    if (!res.ok) return []
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data as ScoreboardEntry[]
    }
    return []
  } catch {
    return []
  }
}

export async function getSubmissions(): Promise<SubmissionEntry[]> {
  try {
    const res = await fetch('/api/v1/submissions', { credentials: 'include' })
    if (!res.ok) return []
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data as SubmissionEntry[]
    }
    return []
  } catch {
    return []
  }
}

export async function deleteSubmission(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const nonce = await getCsrfNonce()
    const res = await fetch(`/api/v1/submissions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': nonce,
      },
      credentials: 'include',
    })
    const json = await res.json()
    return { success: json.success ?? res.ok }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to delete submission.' }
  }
}

export async function toggleChallengeVisibility(
  challengeId: number,
  state: 'visible' | 'hidden'
): Promise<{ success: boolean; message?: string }> {
  try {
    const nonce = await getCsrfNonce()
    const res = await fetch(`/api/v1/challenges/${challengeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': nonce,
      },
      credentials: 'include',
      body: JSON.stringify({ state }),
    })
    const json = await res.json()
    return { success: json.success ?? res.ok }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to toggle challenge state.' }
  }
}

export async function getChallengeFlags(challengeId: number): Promise<CTFdFlag[]> {
  try {
    const res = await fetch(`/api/v1/challenges/${challengeId}/flags`, { credentials: 'include' })
    if (!res.ok) return []
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data as CTFdFlag[]
    }
    return []
  } catch {
    return []
  }
}

export async function getAdminUsers(): Promise<CTFdUserAccount[]> {
  try {
    const res = await fetch('/api/v1/users', { credentials: 'include' })
    if (!res.ok) return []
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data as CTFdUserAccount[]
    }
    return []
  } catch {
    return []
  }
}

export async function toggleUserBan(
  userId: number,
  banned: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    const nonce = await getCsrfNonce()
    const res = await fetch(`/api/v1/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': nonce,
      },
      credentials: 'include',
      body: JSON.stringify({ banned }),
    })
    const json = await res.json()
    return { success: json.success ?? res.ok }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to update user status.' }
  }
}

export async function getNotifications(): Promise<CTFdNotification[]> {
  try {
    const res = await fetch('/api/v1/notifications', { credentials: 'include' })
    if (!res.ok) return []
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data as CTFdNotification[]
    }
    return []
  } catch {
    return []
  }
}

export async function createNotification(
  title: string,
  content: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const nonce = await getCsrfNonce()
    const res = await fetch('/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': nonce,
      },
      credentials: 'include',
      body: JSON.stringify({ title, content }),
    })
    const json = await res.json()
    return { success: json.success ?? res.ok }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to broadcast notification.' }
  }
}

export async function deleteNotification(
  notificationId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const nonce = await getCsrfNonce()
    const res = await fetch(`/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': nonce,
      },
      credentials: 'include',
    })
    const json = await res.json()
    return { success: json.success ?? res.ok }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to delete notification.' }
  }
}

export async function getConfigs(): Promise<Record<string, string | null>> {
  try {
    const res = await fetch('/api/v1/configs', { credentials: 'include' })
    if (!res.ok) return {}
    const json = await res.json()
    const map: Record<string, string | null> = {}
    if (json.success && Array.isArray(json.data)) {
      json.data.forEach((item: { key: string; value: string | null }) => {
        map[item.key] = item.value
      })
    }
    return map
  } catch {
    return {}
  }
}

export async function setFreezeScoreboard(freeze: boolean): Promise<{ success: boolean }> {
  try {
    const nonce = await getCsrfNonce()
    const res = await fetch('/api/v1/configs', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': nonce,
      },
      credentials: 'include',
      body: JSON.stringify({ freeze: freeze ? 'true' : '' }),
    })
    const json = await res.json()
    return { success: json.success ?? res.ok }
  } catch {
    return { success: false }
  }
}

