import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { challenges, type ChallengeData } from '../data/challenges'
import {
  getSubmissions,
  getScoreboard,
  getAdminUsers,
  toggleUserBan,
  deleteSubmission,
  toggleChallengeVisibility,
  getNotifications,
  createNotification,
  deleteNotification,
  setFreezeScoreboard,
  type SubmissionEntry,
  type ScoreboardEntry,
  type CTFdUserAccount,
  type CTFdNotification,
} from '../services/ctfd'
import PageTransition from '../components/PageTransition'
import BattleworldBg from '../components/BattleworldBg'
import CommandButton from '../components/CommandButton'

const OFFICIAL_FLAGS: Record<string, string> = {
  'wv-01': 'DOOM{last_transmission_o9k8oxu63wvc3sksjil21oqf}',
  'wv-02': 'DOOM{dust_in_lens_txydxk7pk4xqb6d52weevylm}',
  'wv-03': 'DOOM{ashfall_archive_1tcjy06eq4eqtf78l51eaoq3}',
  'wv-04': 'DOOM{protocol_primer_1bp29ipvjf6xsml0z0040eph}',
  'os-01': 'DOOM{rift_capture_2aojmk18bjvjwfzgrfky2a6s}',
  'os-02': 'DOOM{quarantine_cipher_cujthgybvpfrpfgqkcffqknd}',
  'os-03': 'DOOM{frozen_build_z28q6xuirowjr7v5lm0dp2s3}',
  'os-04': 'DOOM{containment_console_qvb08mba2j13e8x8mxhab118}',
  'os-05': 'DOOM{memory_ledger_0uexmmhstk43sn691h0w769l}',
  'dn-01': 'DOOM{entropy_collapse_5zm1mfit0gedpccphedzt0pq}',
  'dn-02': 'DOOM{ghost_compiler_r2gtlopvw0nd4hv75q6c0n7v}',
  'dn-03': 'DOOM{redline_relay_0mj83hzfjb5jcgxqzsra8d2g}',
}

export default function Admin() {
  const navigate = useNavigate()
  const { state, isAdmin, isScoreboardFrozen, refreshFromCtfd } = useGame()

  const [activeTab, setActiveTab] = useState<'control' | 'challenges' | 'submissions' | 'users' | 'broadcasts'>('control')
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([])
  const [standings, setStandings] = useState<ScoreboardEntry[]>([])
  const [users, setUsers] = useState<CTFdUserAccount[]>([])
  const [notificationsList, setNotificationsList] = useState<CTFdNotification[]>([])
  const [challengeVisibility, setChallengeVisibility] = useState<Record<number, boolean>>({})
  
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'correct' | 'incorrect'>('all')

  // Broadcast form state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifContent, setNotifContent] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMsg({ text, type })
    setTimeout(() => setActionMsg(null), 3500)
  }

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [subs, scores, userList, notifs] = await Promise.all([
        getSubmissions(),
        getScoreboard(),
        getAdminUsers(),
        getNotifications(),
      ])

      setSubmissions(subs)
      setStandings(scores)
      setUsers(userList)
      setNotificationsList(notifs)

      // Initialize challenge visibility map
      const visMap: Record<number, boolean> = {}
      challenges.forEach((ch) => {
        visMap[ch.ctfdId] = true // default deployed
      })
      setChallengeVisibility((prev) => ({ ...visMap, ...prev }))
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
      const interval = setInterval(loadAdminData, 10000)
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <PageTransition>
        <BattleworldBg variant="challenge" />
        <main className="admin-denied-container">
          <div className="denied-box">
            <span className="denied-icon">⚠</span>
            <h1 className="denied-title">CLEARANCE DENIED // 403</h1>
            <p className="denied-desc">
              DOOMSDAY COMMAND PROTOCOL: Administrative access is strictly restricted to verified Battleworld Command Overseers.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Current Operative: <strong>{state.ctfdUser?.name || 'GUEST / ANONYMOUS'}</strong> (Rank: {state.ctfdUser?.type || 'operative'})
            </p>
            <CommandButton variant="primary" onClick={() => navigate('/hub')}>
              ← RETURN TO OPERATIVE GRID
            </CommandButton>
          </div>
        </main>
      </PageTransition>
    )
  }

  // Admin Actions
  const handleToggleFreeze = async () => {
    const next = !isScoreboardFrozen
    const success = await setFreezeScoreboard(next)
    if (success.success) {
      await refreshFromCtfd()
      showFeedback(next ? 'Scoreboard frozen for all operatives.' : 'Scoreboard unfrozen. Live ranking restored.')
    } else {
      showFeedback('Failed to update scoreboard freeze setting.', 'error')
    }
  }

  const handleToggleVisibility = async (chalId: number) => {
    const currentVis = challengeVisibility[chalId] !== false
    const nextState = currentVis ? 'hidden' : 'visible'
    const res = await toggleChallengeVisibility(chalId, nextState)
    if (res.success) {
      setChallengeVisibility((prev) => ({ ...prev, [chalId]: !currentVis }))
      showFeedback(`Challenge #${chalId} visibility set to ${nextState.toUpperCase()}.`)
    } else {
      showFeedback(`Failed to update challenge #${chalId} visibility.`, 'error')
    }
  }

  const handleDeleteSubmission = async (subId: number) => {
    if (!window.confirm(`Are you sure you want to delete submission #${subId}?`)) return
    const res = await deleteSubmission(subId)
    if (res.success) {
      setSubmissions((prev) => prev.filter((s) => s.id !== subId))
      showFeedback(`Submission #${subId} successfully removed.`)
    } else {
      showFeedback(`Failed to delete submission #${subId}.`, 'error')
    }
  }

  const handleToggleBan = async (userId: number, currentBanned: boolean) => {
    const nextBanned = !currentBanned
    const res = await toggleUserBan(userId, nextBanned)
    if (res.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, banned: nextBanned } : u)))
      showFeedback(`Operative #${userId} ${nextBanned ? 'BANNED' : 'UNBANNED'}.`)
    } else {
      showFeedback(`Failed to update ban status for operative #${userId}.`, 'error')
    }
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim() || !notifContent.trim()) {
      showFeedback('Please provide both broadcast title and alert content.', 'error')
      return
    }

    setBroadcasting(true)
    const res = await createNotification(notifTitle.trim(), notifContent.trim())
    setBroadcasting(false)

    if (res.success) {
      setNotifTitle('')
      setNotifContent('')
      showFeedback('Broadcast transmitted to all active operatives!')
      const notifs = await getNotifications()
      setNotificationsList(notifs)
      refreshFromCtfd()
    } else {
      showFeedback('Failed to transmit broadcast.', 'error')
    }
  }

  const handleDeleteNotification = async (notifId: number) => {
    const res = await deleteNotification(notifId)
    if (res.success) {
      setNotificationsList((prev) => prev.filter((n) => n.id !== notifId))
      showFeedback('Broadcast removed from transmission registry.')
      refreshFromCtfd()
    } else {
      showFeedback('Failed to delete broadcast.', 'error')
    }
  }

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    showFeedback(`Flag for ${code} copied to clipboard!`)
  }

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (submissionFilter === 'correct') return s.type === 'correct'
    if (submissionFilter === 'incorrect') return s.type !== 'correct'
    return true
  })

  const totalSolves = submissions.filter((s) => s.type === 'correct').length
  const passRate = submissions.length > 0 ? Math.round((totalSolves / submissions.length) * 100) : 0

  return (
    <PageTransition>
      <BattleworldBg variant="challenge" />

      <main className="admin-container">
        {/* Navigation & Mode Return */}
        <div className="admin-top-bar">
          <div className="admin-top-left">
            <CommandButton variant="ghost" onClick={() => navigate('/hub')}>
              ← RETURN TO OPERATIVE GRID
            </CommandButton>
            <span className="admin-server-tag">
              ● CTFd AUTHORITY PORT 8000: <strong style={{ color: 'var(--emerald)' }}>ONLINE</strong>
            </span>
          </div>

          <div className="admin-top-right">
            <button
              type="button"
              className={`btn-freeze ${isScoreboardFrozen ? 'btn-freeze--active' : ''}`}
              onClick={handleToggleFreeze}
            >
              {isScoreboardFrozen ? '☀️ UNFREEZE SCOREBOARD' : '❄️ FREEZE SCOREBOARD'}
            </button>
            <a
              href="http://localhost:8000/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ctfd-admin"
              title="Open CTFd Flask-Admin Backend on port 8000"
            >
              🛠️ CTFd MASTER ADMIN ↗
            </a>
            <CommandButton variant="primary" size="sm" onClick={loadAdminData} disabled={loading}>
              {loading ? 'SYNCING...' : '⟳ SYNC'}
            </CommandButton>
          </div>
        </div>

        {actionMsg && (
          <div className={`admin-toast admin-toast--${actionMsg.type}`}>
            {actionMsg.type === 'success' ? '✓' : '⚠'} {actionMsg.text}
          </div>
        )}

        <header className="admin-header">
          <div className="admin-badge">● BATTLEWORLD COMMAND OVERRIDE // ADMIN PANEL</div>
          <h1 className="admin-title">ADMINISTRATIVE CONTROL CENTER</h1>
          <p className="admin-sub">
            Master oversight console: challenge lifecycle, live flag submission audit, operative accounts & global broadcasts.
          </p>

          {/* Metric Tiles */}
          <div className="admin-metrics-grid">
            <div className="admin-metric-card">
              <span className="metric-label">OPERATIONS</span>
              <span className="metric-val">{challenges.length}</span>
              <span className="metric-sub">12 ACTIVE TARGETS</span>
            </div>
            <div className="admin-metric-card">
              <span className="metric-label">TOTAL ATTEMPTS</span>
              <span className="metric-val">{submissions.length}</span>
              <span className="metric-sub">SUBMISSIONS AUDITED</span>
            </div>
            <div className="admin-metric-card">
              <span className="metric-label">VERIFIED SOLVES</span>
              <span className="metric-val" style={{ color: 'var(--emerald, #2be066)' }}>{totalSolves}</span>
              <span className="metric-sub">{passRate}% SUCCESS RATE</span>
            </div>
            <div className="admin-metric-card">
              <span className="metric-label">REGISTERED SQUADS</span>
              <span className="metric-val" style={{ color: 'var(--signal, #f0b93d)' }}>{standings.length}</span>
              <span className="metric-sub">ON SCOREBOARD</span>
            </div>
            <div className="admin-metric-card">
              <span className="metric-label">ACTIVE BROADCASTS</span>
              <span className="metric-val" style={{ color: '#ff6b6b' }}>{notificationsList.length}</span>
              <span className="metric-sub">TRANSMISSIONS</span>
            </div>
          </div>

          {/* 5 Admin Control Tabs */}
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${activeTab === 'control' ? 'active' : ''}`}
              onClick={() => setActiveTab('control')}
            >
              🛡️ MISSION CONTROL
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === 'challenges' ? 'active' : ''}`}
              onClick={() => setActiveTab('challenges')}
            >
              🎯 CHALLENGES ({challenges.length})
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              📡 SUBMISSION AUDIT ({submissions.length})
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 OPERATIVES & SQUADS ({users.length})
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === 'broadcasts' ? 'active' : ''}`}
              onClick={() => setActiveTab('broadcasts')}
            >
              📢 BROADCASTS ({notificationsList.length})
            </button>
          </div>
        </header>

        {/* TAB 1: MISSION CONTROL */}
        {activeTab === 'control' && (
          <div className="admin-panel-section">
            <div className="admin-card-grid">
              <div className="admin-control-box">
                <h3 className="control-box-title">⚡ SCOREBOARD & EVENT STATE</h3>
                <p className="control-box-desc">
                  Control tournament progression, score updates, and live visibility for all players.
                </p>
                <div className="control-status-row">
                  <span>SCOREBOARD VISIBILITY:</span>
                  <strong style={{ color: isScoreboardFrozen ? 'var(--signal)' : 'var(--emerald)' }}>
                    {isScoreboardFrozen ? '❄️ FROZEN (NO NEW SCORES DISPLAYED)' : '● ACTIVE (REAL-TIME LIVE STANDINGS)'}
                  </strong>
                </div>
                <div style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className={`btn-action-large ${isScoreboardFrozen ? 'btn-action-large--gold' : 'btn-action-large--red'}`}
                    onClick={handleToggleFreeze}
                  >
                    {isScoreboardFrozen ? '☀️ UNFREEZE SCOREBOARD' : '❄️ FREEZE SCOREBOARD NOW'}
                  </button>
                </div>
              </div>

              <div className="admin-control-box">
                <h3 className="control-box-title">📡 CTFd BACKEND AUTHORITY</h3>
                <p className="control-box-desc">
                  Connection telemetry to local Flask CTFd instance running on port 8000.
                </p>
                <div className="control-status-row">
                  <span>BACKEND STATUS:</span>
                  <strong style={{ color: 'var(--emerald)' }}>● ONLINE & RESPONSIVE</strong>
                </div>
                <div className="control-status-row">
                  <span>M-04 SERVICE STATUS:</span>
                  <strong style={{ color: 'var(--signal)' }}>● PORT 8081 / STATIC RESERVE READY</strong>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                  <a
                    href="http://localhost:8000/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action-large btn-action-large--outline"
                  >
                    OPEN CTFd FLASK ADMIN ↗
                  </a>
                  <button
                    type="button"
                    className="btn-action-large btn-action-large--outline"
                    onClick={loadAdminData}
                  >
                    FLUSH TELEMETRY CACHE
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Standings Preview */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--mono-font)', fontSize: '1.1rem', color: 'var(--signal)', marginBottom: '0.75rem' }}>
                🏆 CURRENT TOURNAMENT PODIUM (TOP SQUADS)
              </h3>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>RANK</th>
                      <th>SQUAD NAME</th>
                      <th>OPERATIVES</th>
                      <th style={{ textAlign: 'right' }}>SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.slice(0, 5).map((team, idx) => (
                      <tr key={team.account_id}>
                        <td style={{ fontWeight: 'bold' }}>#{team.pos || idx + 1}</td>
                        <td style={{ fontWeight: 'bold', color: '#fff' }}>{team.name.toUpperCase()}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {team.members?.map((m) => m.name).join(', ') || 'No members listed'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--emerald)' }}>
                          {team.score} PTS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHALLENGE DIRECTOR */}
        {activeTab === 'challenges' && (
          <div className="admin-panel-section">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>CODE</th>
                    <th>OPERATION TITLE</th>
                    <th>CATEGORY</th>
                    <th>POINTS</th>
                    <th>STATUS</th>
                    <th>OFFICIAL SOLUTION FLAG</th>
                    <th style={{ textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((ch) => {
                    const isVisible = challengeVisibility[ch.ctfdId] !== false
                    const flag = OFFICIAL_FLAGS[ch.id] || 'FLAG_NOT_SET'
                    const isCopied = copiedCode === ch.code

                    return (
                      <tr key={ch.id}>
                        <td style={{ color: 'var(--emerald)', fontWeight: 'bold' }}>[{ch.code}]</td>
                        <td style={{ fontWeight: 'bold' }}>
                          {ch.title}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            CTFd ID: #{ch.ctfdId} • Sector: {ch.universe.toUpperCase()}
                          </div>
                        </td>
                        <td>
                          <span className="admin-cat-pill">{ch.category.toUpperCase()}</span>
                        </td>
                        <td style={{ color: 'var(--signal)', fontWeight: 'bold' }}>{ch.points} PTS</td>
                        <td>
                          <span className={`status-pill ${isVisible ? 'status-visible' : 'status-hidden'}`}>
                            {isVisible ? '● DEPLOYED' : '○ HIDDEN'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <code className="admin-flag-box">{flag}</code>
                            <button
                              type="button"
                              className="btn-copy-flag"
                              onClick={() => copyToClipboard(flag, ch.code)}
                              title="Copy flag to clipboard"
                            >
                              {isCopied ? 'COPIED!' : 'COPY'}
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className={`btn-action-small ${isVisible ? 'btn-action-small--red' : 'btn-action-small--green'}`}
                              onClick={() => handleToggleVisibility(ch.ctfdId)}
                              title={isVisible ? 'Hide from players' : 'Make visible to players'}
                            >
                              {isVisible ? 'HIDE' : 'DEPLOY'}
                            </button>
                            <button
                              type="button"
                              className="btn-action-small btn-action-small--ghost"
                              onClick={() => navigate(`/challenge/${ch.id}`)}
                              title="Test as operative"
                            >
                              TEST
                            </button>
                            <a
                              href={`http://localhost:8000/admin/challenges/${ch.ctfdId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-action-small btn-action-small--outline"
                              title="Edit in CTFd Flask Backend"
                            >
                              EDIT ↗
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SUBMISSION AUDIT STREAM */}
        {activeTab === 'submissions' && (
          <div className="admin-panel-section">
            {/* Filter buttons */}
            <div className="sub-filter-row">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FILTER SUBMISSIONS:</span>
              <button
                type="button"
                className={`filter-btn ${submissionFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSubmissionFilter('all')}
              >
                ALL ATTEMPTS ({submissions.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${submissionFilter === 'correct' ? 'active' : ''}`}
                onClick={() => setSubmissionFilter('correct')}
              >
                ✓ VERIFIED SOLVES ({totalSolves})
              </button>
              <button
                type="button"
                className={`filter-btn ${submissionFilter === 'incorrect' ? 'active' : ''}`}
                onClick={() => setSubmissionFilter('incorrect')}
              >
                ✕ REJECTED FLAGS ({submissions.length - totalSolves})
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>TIMESTAMP</th>
                    <th>OPERATIVE / SQUAD</th>
                    <th>TARGET</th>
                    <th>SUBMITTED PAYLOAD</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>VERDICT</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>PURGE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        NO SUBMISSIONS FOUND FOR THIS FILTER
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const ch = challenges.find((c) => c.ctfdId === sub.challenge_id)
                      const isCorrect = sub.type === 'correct'

                      return (
                        <tr key={sub.id}>
                          <td style={{ color: 'var(--text-muted)' }}>#{sub.id}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(sub.date).toLocaleTimeString()}
                          </td>
                          <td style={{ fontWeight: 'bold' }}>
                            {sub.user?.name || `User #${sub.user_id}`}
                            {sub.team?.name && (
                              <span style={{ color: 'var(--signal)', fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                                [{sub.team.name}]
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ color: 'var(--emerald)', fontWeight: 'bold' }}>
                              [{ch?.code || `ID ${sub.challenge_id}`}]
                            </span>{' '}
                            {ch?.title || sub.challenge?.name}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <code>{sub.provided}</code>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`verdict-pill ${isCorrect ? 'verdict-correct' : 'verdict-incorrect'}`}>
                              {isCorrect ? '✓ CORRECT' : '✕ REJECTED'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-purge"
                              onClick={() => handleDeleteSubmission(sub.id)}
                              title="Delete submission entry"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: OPERATIVES & SQUADS */}
        {activeTab === 'users' && (
          <div className="admin-panel-section">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>CALLSIGN</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'center' }}>BAN / UNBAN</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isBan = !!u.banned
                    const isRoot = u.type === 'admin' || u.name?.toLowerCase() === 'admin'

                    return (
                      <tr key={u.id}>
                        <td style={{ color: 'var(--text-muted)' }}>#{u.id}</td>
                        <td style={{ fontWeight: 'bold', color: '#fff' }}>
                          {u.name.toUpperCase()}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {u.email || '—'}
                        </td>
                        <td>
                          <span className={`role-pill ${isRoot ? 'role-admin' : 'role-user'}`}>
                            {isRoot ? '👑 ADMIN' : 'OPERATIVE'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${isBan ? 'status-hidden' : 'status-visible'}`}>
                            {isBan ? '🚫 BANNED' : '● ACTIVE'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isRoot ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROTECTED</span>
                          ) : (
                            <button
                              type="button"
                              className={`btn-action-small ${isBan ? 'btn-action-small--green' : 'btn-action-small--red'}`}
                              onClick={() => handleToggleBan(u.id, isBan)}
                            >
                              {isBan ? 'UNBAN' : 'BAN'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BROADCASTS & TRANSMISSIONS */}
        {activeTab === 'broadcasts' && (
          <div className="admin-panel-section">
            {/* New Broadcast Form */}
            <div className="broadcast-box">
              <h3 className="control-box-title">📢 TRANSMIT GLOBAL ANNOUNCEMENT</h3>
              <p className="control-box-desc">
                Instantly broadcast an announcement alert across the entire tournament. All connected operatives will see this banner live on their screens.
              </p>

              <form onSubmit={handleSendBroadcast} style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="admin-field-label">ANNOUNCEMENT TITLE / SUBJECT</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. HINT RELEASED FOR OPERATION M-04"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="admin-field-label">ANNOUNCEMENT MESSAGE / PAYLOAD</label>
                  <textarea
                    className="admin-textarea"
                    placeholder="Enter announcement text to broadcast to players..."
                    rows={3}
                    value={notifContent}
                    onChange={(e) => setNotifContent(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-action-large btn-action-large--red"
                  disabled={broadcasting}
                >
                  {broadcasting ? 'TRANSMITTING...' : '📡 TRANSMIT BROADCAST TO ALL OPERATIVES'}
                </button>
              </form>
            </div>

            {/* Active Announcements List */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--mono-font)', fontSize: '1.1rem', color: 'var(--signal)', marginBottom: '0.75rem' }}>
                TRANSMISSION LOG ({notificationsList.length})
              </h3>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th>TIMESTAMP</th>
                      <th>TITLE</th>
                      <th>CONTENT</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>REMOVE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificationsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          NO BROADCASTS SENT YET
                        </td>
                      </tr>
                    ) : (
                      notificationsList.map((n) => (
                        <tr key={n.id}>
                          <td style={{ color: 'var(--text-muted)' }}>#{n.id}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(n.date).toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 'bold', color: '#fff' }}>{n.title}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{n.content}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-purge"
                              onClick={() => handleDeleteNotification(n.id)}
                              title="Delete announcement"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .admin-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1.5rem 5rem 1.5rem;
          font-family: var(--body-font, 'Barlow', sans-serif);
          color: #e2e8f0;
        }

        .admin-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .admin-top-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .admin-server-tag {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.75rem;
          background: rgba(16, 21, 16, 0.8);
          border: 1px solid rgba(43, 224, 102, 0.3);
          padding: 0.35rem 0.8rem;
          border-radius: 4px;
        }

        .admin-top-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .btn-freeze {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.4rem 0.85rem;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.5);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-freeze:hover {
          background: rgba(56, 189, 248, 0.3);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
        }
        .btn-freeze--active {
          background: rgba(240, 185, 61, 0.2);
          color: var(--signal, #f0b93d);
          border-color: var(--signal, #f0b93d);
        }

        .btn-ctfd-admin {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.4rem 0.85rem;
          background: rgba(199, 58, 50, 0.15);
          color: #ff6b6b;
          border: 1px solid rgba(199, 58, 50, 0.4);
          border-radius: 4px;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }
        .btn-ctfd-admin:hover {
          background: rgba(199, 58, 50, 0.3);
          border-color: var(--danger, #c73a32);
          color: #fff;
        }

        .admin-toast {
          padding: 0.75rem 1.25rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.85rem;
          animation: toastIn 0.3s ease-out;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-toast--success {
          background: rgba(43, 224, 102, 0.15);
          border: 1px solid var(--emerald, #2be066);
          color: var(--emerald-bright, #55ff88);
        }
        .admin-toast--error {
          background: rgba(199, 58, 50, 0.2);
          border: 1px solid var(--danger, #c73a32);
          color: #ff8080;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-badge {
          display: inline-block;
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.75rem;
          color: var(--danger, #c73a32);
          letter-spacing: 0.15em;
          margin-bottom: 0.5rem;
          background: rgba(199, 58, 50, 0.1);
          padding: 0.2rem 0.6rem;
          border: 1px solid rgba(199, 58, 50, 0.3);
          border-radius: 3px;
        }

        .admin-title {
          font-family: var(--heading-font, 'Barlow Condensed', sans-serif);
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 0.5rem 0;
          letter-spacing: 0.05em;
          text-shadow: 0 0 20px rgba(199, 58, 50, 0.3);
        }

        .admin-sub {
          color: var(--text-secondary, #aab8ae);
          font-size: 0.95rem;
          margin: 0 0 1.5rem 0;
          max-width: 800px;
        }

        .admin-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .admin-metric-card {
          background: rgba(16, 21, 16, 0.8);
          border: 1px solid rgba(138, 98, 56, 0.3);
          padding: 1rem 1.25rem;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .metric-label {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.7rem;
          color: var(--text-muted, #66736a);
          letter-spacing: 0.1em;
        }

        .metric-val {
          font-family: var(--heading-font, 'Barlow Condensed', sans-serif);
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
        }

        .metric-sub {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.65rem;
          color: var(--text-muted, #66736a);
        }

        .admin-tabs {
          display: flex;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(138, 98, 56, 0.3);
          padding-bottom: 0.5rem;
          overflow-x: auto;
        }

        .admin-tab {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary, #aab8ae);
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .admin-tab:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }
        .admin-tab.active {
          color: #fff;
          background: rgba(199, 58, 50, 0.25);
          border-color: var(--danger, #c73a32);
          box-shadow: 0 0 10px rgba(199, 58, 50, 0.3);
        }

        .admin-panel-section {
          margin-top: 1.5rem;
        }

        .admin-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 1.5rem;
        }

        .admin-control-box, .broadcast-box {
          background: rgba(16, 21, 16, 0.85);
          border: 1px solid rgba(138, 98, 56, 0.4);
          padding: 1.5rem;
          border-radius: 8px;
        }

        .control-box-title {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 1.1rem;
          font-weight: bold;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .control-box-desc {
          color: var(--text-secondary, #aab8ae);
          font-size: 0.85rem;
          margin: 0 0 1rem 0;
          line-height: 1.4;
        }

        .control-status-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.75rem;
        }

        .btn-action-large {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.6rem 1.25rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
        }
        .btn-action-large--red {
          background: var(--danger, #c73a32);
          color: #fff;
          border-color: #ff6b6b;
          box-shadow: 0 0 12px rgba(199, 58, 50, 0.35);
        }
        .btn-action-large--red:hover {
          background: #e0453c;
          box-shadow: 0 0 18px rgba(199, 58, 50, 0.55);
        }
        .btn-action-large--gold {
          background: rgba(240, 185, 61, 0.2);
          color: var(--signal, #f0b93d);
          border-color: var(--signal, #f0b93d);
        }
        .btn-action-large--gold:hover {
          background: rgba(240, 185, 61, 0.35);
        }
        .btn-action-large--outline {
          background: transparent;
          color: #cbd5e1;
          border-color: #4a5568;
        }
        .btn-action-large--outline:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #94a3b8;
          color: #fff;
        }

        .admin-field-label {
          display: block;
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.75rem;
          color: var(--text-muted, #66736a);
          margin-bottom: 0.35rem;
          letter-spacing: 0.05em;
        }

        .admin-input, .admin-textarea {
          width: 100%;
          background: rgba(10, 13, 10, 0.9);
          border: 1px solid rgba(138, 98, 56, 0.4);
          color: #fff;
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.85rem;
          padding: 0.6rem 0.8rem;
          border-radius: 4px;
          box-sizing: border-box;
        }
        .admin-input:focus, .admin-textarea:focus {
          outline: none;
          border-color: var(--emerald, #2be066);
          box-shadow: 0 0 8px rgba(43, 224, 102, 0.3);
        }

        .admin-table-wrapper {
          background: rgba(16, 21, 16, 0.8);
          border: 1px solid rgba(138, 98, 56, 0.3);
          border-radius: 8px;
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.8rem;
        }

        .admin-table th {
          background: rgba(10, 13, 10, 0.95);
          color: var(--text-muted, #66736a);
          padding: 0.85rem 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(138, 98, 56, 0.3);
          letter-spacing: 0.05em;
        }

        .admin-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }

        .admin-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        .status-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
        }
        .status-visible {
          background: rgba(43, 224, 102, 0.15);
          color: var(--emerald, #2be066);
          border: 1px solid rgba(43, 224, 102, 0.4);
        }
        .status-hidden {
          background: rgba(199, 58, 50, 0.15);
          color: var(--danger, #c73a32);
          border: 1px solid rgba(199, 58, 50, 0.4);
        }

        .admin-cat-pill {
          font-size: 0.65rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary, #aab8ae);
          padding: 0.15rem 0.45rem;
          border-radius: 3px;
        }

        .admin-flag-box {
          background: rgba(0, 0, 0, 0.5);
          padding: 0.25rem 0.5rem;
          border: 1px solid rgba(240, 185, 61, 0.3);
          border-radius: 3px;
          color: var(--signal, #f0b93d);
          font-size: 0.75rem;
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
        }

        .btn-copy-flag {
          background: rgba(240, 185, 61, 0.15);
          border: 1px solid rgba(240, 185, 61, 0.4);
          color: var(--signal, #f0b93d);
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.65rem;
          font-weight: bold;
          padding: 0.2rem 0.45rem;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-copy-flag:hover {
          background: rgba(240, 185, 61, 0.3);
          color: #fff;
        }

        .btn-action-small {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          text-decoration: none;
        }
        .btn-action-small--red {
          background: rgba(199, 58, 50, 0.2);
          color: #ff6b6b;
          border-color: rgba(199, 58, 50, 0.5);
        }
        .btn-action-small--red:hover {
          background: var(--danger, #c73a32);
          color: #fff;
        }
        .btn-action-small--green {
          background: rgba(43, 224, 102, 0.2);
          color: var(--emerald-bright, #55ff88);
          border-color: rgba(43, 224, 102, 0.5);
        }
        .btn-action-small--green:hover {
          background: var(--emerald, #2be066);
          color: #000;
        }
        .btn-action-small--ghost {
          background: transparent;
          color: #cbd5e1;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .btn-action-small--ghost:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .btn-action-small--outline {
          background: transparent;
          color: #94a3b8;
          border-color: rgba(255, 255, 255, 0.15);
        }
        .btn-action-small--outline:hover {
          border-color: #fff;
          color: #fff;
        }

        .sub-filter-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          font-family: var(--mono-font, 'Space Mono', monospace);
          flex-wrap: wrap;
        }

        .filter-btn {
          background: rgba(16, 21, 16, 0.8);
          border: 1px solid rgba(138, 98, 56, 0.3);
          color: var(--text-secondary, #aab8ae);
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.75rem;
          padding: 0.35rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }
        .filter-btn.active {
          background: rgba(43, 224, 102, 0.15);
          color: var(--emerald-bright, #55ff88);
          border-color: var(--emerald, #2be066);
        }

        .verdict-pill {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: bold;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
        }
        .verdict-correct {
          background: rgba(43, 224, 102, 0.2);
          color: var(--emerald, #2be066);
          border: 1px solid rgba(43, 224, 102, 0.5);
        }
        .verdict-incorrect {
          background: rgba(199, 58, 50, 0.2);
          color: var(--danger, #c73a32);
          border: 1px solid rgba(199, 58, 50, 0.5);
        }

        .btn-purge {
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0.2rem;
          border-radius: 3px;
          transition: all 0.2s ease;
        }
        .btn-purge:hover {
          background: rgba(199, 58, 50, 0.3);
          border-color: var(--danger, #c73a32);
        }

        .role-pill {
          font-size: 0.7rem;
          font-weight: bold;
          padding: 0.15rem 0.45rem;
          border-radius: 3px;
        }
        .role-admin {
          background: rgba(199, 58, 50, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(199, 58, 50, 0.5);
        }
        .role-user {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary, #aab8ae);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .admin-denied-container {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .denied-box {
          background: rgba(16, 21, 16, 0.95);
          border: 2px solid var(--danger, #c73a32);
          box-shadow: 0 0 30px rgba(199, 58, 50, 0.4);
          padding: 3rem 2.5rem;
          border-radius: 8px;
          text-align: center;
          max-width: 550px;
          font-family: var(--mono-font, 'Space Mono', monospace);
        }

        .denied-icon {
          font-size: 3rem;
          color: var(--danger, #c73a32);
          display: block;
          margin-bottom: 1rem;
        }

        .denied-title {
          font-size: 1.8rem;
          color: #fff;
          margin: 0 0 1rem 0;
          letter-spacing: 0.1em;
        }

        .denied-desc {
          color: var(--text-secondary, #aab8ae);
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0 0 1rem 0;
        }
      `}</style>
    </PageTransition>
  )
}
