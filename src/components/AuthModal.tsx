import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { loginToCtfd, logoutFromCtfd } from '../services/ctfd'
import CommandButton from './CommandButton'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const { state, isAdmin, refreshFromCtfd, logoutUser } = useGame()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please provide operative callsign and security key.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await loginToCtfd(username, password)
      if (result.success) {
        setSuccess('AUTHENTICATION SUCCESSFUL // SYNCING SATELLITE...')
        await refreshFromCtfd()
        setTimeout(() => {
          setSuccess(null)
          onClose()
          if (username.trim().toLowerCase() === 'admin') {
            navigate('/admin')
          }
        }, 800)
      } else {
        setError(result.message || 'Authentication failed. Check credentials.')
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with CTFd authority.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    setError(null)
    try {
      await logoutUser()
      setUsername('')
      setPassword('')
      setSuccess('SESSION TERMINATED // READY FOR NEW OPERATIVE CREDENTIALS.')
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err: any) {
      setError(err?.message || 'Error during sign out.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-modal-title">
            <span>◆</span> OPERATIVE AUTHENTICATION PORTAL
          </div>
          <button className="auth-modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="auth-modal-body">
          {state.ctfdUser ? (
            <div className="auth-active-profile">
              <div className={`auth-status-badge ${isAdmin ? 'auth-status-badge--admin' : ''}`}>
                {isAdmin ? '👑 MASTER OVERSEER // ROOT ACCESS' : '● ACTIVE OPERATIVE SESSION'}
              </div>
              <div className="auth-profile-row">
                <span className="auth-label">CALLSIGN:</span>
                <span className="auth-val">{state.ctfdUser.name.toUpperCase()}</span>
              </div>
              <div className="auth-profile-row">
                <span className="auth-label">EMAIL:</span>
                <span className="auth-val">{state.ctfdUser.email}</span>
              </div>
              <div className="auth-profile-row">
                <span className="auth-label">{isAdmin ? 'ROLE:' : 'SQUAD / TEAM:'}</span>
                <span className="auth-val" style={{ color: isAdmin ? 'var(--danger, #c73a32)' : 'inherit', fontWeight: 'bold' }}>
                  {isAdmin ? 'MASTER CTFd OVERSEER' : (state.ctfdTeam?.name || 'SOLO / NO TEAM')}
                </span>
              </div>
              {!isAdmin && (
                <div className="auth-profile-row">
                  <span className="auth-label">TOTAL SCORE:</span>
                  <span className="auth-val auth-score">{state.ctfdTeam?.score ?? state.ctfdUser.score ?? 0} PTS</span>
                </div>
              )}

              <div className="auth-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {isAdmin && (
                  <CommandButton
                    variant="primary"
                    onClick={() => {
                      onClose()
                      navigate('/admin')
                    }}
                    style={{
                      background: 'var(--danger, #c73a32)',
                      borderColor: '#ff6b6b',
                      color: '#fff',
                    }}
                  >
                    ⚡ OPEN ADMIN PANEL
                  </CommandButton>
                )}
                <CommandButton
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={loading}
                  style={{ borderColor: 'var(--danger, #c73a32)', color: 'var(--danger, #c73a32)' }}
                >
                  {loading ? 'TERMINATING...' : 'LOGOUT / SWITCH OPERATIVE'}
                </CommandButton>
                <CommandButton variant="primary" onClick={onClose}>
                  RESUME MISSION
                </CommandButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="auth-form">
              <p className="auth-description">
                Authenticate with your official CTFd credentials to sync progress, submit flags, and contribute scores to your squad.
              </p>

              {error && <div className="auth-alert auth-alert--error">{error}</div>}
              {success && <div className="auth-alert auth-alert--success">{success}</div>}

              <div className="auth-input-group">
                <label htmlFor="ctf-username">OPERATIVE CALLSIGN / EMAIL</label>
                <input
                  id="ctf-username"
                  type="text"
                  placeholder="e.g. player1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="ctf-password">SECURITY ACCESS KEY</label>
                <input
                  id="ctf-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="auth-actions" style={{ marginTop: '1.5rem' }}>
                <CommandButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? 'AUTHENTICATING WITH CTFD...' : '▶ AUTHENTICATE OPERATIVE'}
                </CommandButton>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 8, 5, 0.85);
          backdrop-filter: blur(6px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: modalFadeIn 0.2s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .auth-modal-card {
          background: #080d09;
          border: 1px solid var(--emerald, #2be066);
          border-radius: 4px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 0 30px rgba(43, 224, 102, 0.25), inset 0 0 15px rgba(43, 224, 102, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: var(--mono-font, 'Space Mono', monospace);
        }

        .auth-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(43, 224, 102, 0.25);
          background: rgba(43, 224, 102, 0.05);
        }

        .auth-modal-title {
          font-family: var(--heading-font, 'Orbitron', 'Barlow Condensed', sans-serif);
          font-size: 1rem;
          font-weight: 700;
          color: var(--emerald, #2be066);
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .auth-modal-close {
          background: transparent;
          border: none;
          color: var(--text-muted, #66736a);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.2rem 0.5rem;
          transition: color 0.2s;
        }
        .auth-modal-close:hover {
          color: var(--danger, #c73a32);
        }

        .auth-modal-body {
          padding: 1.5rem;
        }

        .auth-description {
          font-size: 0.8rem;
          color: var(--text-secondary, #aab8ae);
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }

        .auth-alert {
          padding: 0.75rem 1rem;
          border-radius: 4px;
          font-size: 0.8rem;
          margin-bottom: 1.25rem;
        }
        .auth-alert--error {
          background: rgba(199, 58, 50, 0.15);
          border: 1px solid var(--danger, #c73a32);
          color: var(--danger, #c73a32);
        }
        .auth-alert--success {
          background: rgba(43, 224, 102, 0.15);
          border: 1px solid var(--emerald, #2be066);
          color: var(--emerald, #2be066);
        }

        .auth-input-group {
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .auth-input-group label {
          font-size: 0.75rem;
          color: var(--text-muted, #888);
          letter-spacing: 0.08em;
        }

        .auth-input-group input {
          background: #0d140e;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.75rem 1rem;
          color: var(--text-primary, #fff);
          font-family: inherit;
          font-size: 0.9rem;
          border-radius: 3px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input-group input:focus {
          border-color: var(--emerald, #2be066);
          box-shadow: 0 0 10px rgba(43, 224, 102, 0.2);
        }



        .auth-active-profile {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .auth-status-badge {
          align-self: flex-start;
          font-size: 0.7rem;
          color: var(--emerald, #2be066);
          background: rgba(43, 224, 102, 0.12);
          border: 1px solid var(--emerald, #2be066);
          padding: 0.25rem 0.6rem;
          border-radius: 3px;
          margin-bottom: 0.5rem;
          letter-spacing: 0.1em;
        }
        .auth-status-badge--admin {
          color: #ff6b6b;
          background: rgba(199, 58, 50, 0.18);
          border-color: var(--danger, #c73a32);
          box-shadow: 0 0 10px rgba(199, 58, 50, 0.3);
        }
        .auth-profile-row {
          display: flex;
          justify-content: space-between;
          padding-bottom: 0.5rem;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
          font-size: 0.85rem;
        }
        .auth-label {
          color: var(--text-muted, #888);
        }
        .auth-val {
          color: var(--text-primary, #fff);
          font-weight: 700;
        }
        .auth-score {
          color: var(--signal, #f0b93d);
        }
      `}</style>
    </div>
  )
}
