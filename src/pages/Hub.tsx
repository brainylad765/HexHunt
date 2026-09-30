import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { challenges, type ChallengeData } from '../data/challenges'
import PageTransition from '../components/PageTransition'
import BattleworldBg from '../components/BattleworldBg'
import CommandButton from '../components/CommandButton'
import BattleworldCore from '../components/BattleworldCore'

// Universe SVG icons
function WebverseIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <circle cx="24" cy="4" r="2.5" fill="currentColor" opacity="0.8" />
      <circle cx="24" cy="44" r="2.5" fill="currentColor" opacity="0.8" />
      <circle cx="4" cy="24" r="2.5" fill="currentColor" opacity="0.8" />
      <circle cx="44" cy="24" r="2.5" fill="currentColor" opacity="0.8" />
      <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="38" cy="10" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="10" cy="38" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="38" cy="38" r="2" fill="currentColor" opacity="0.5" />
      <line x1="24" y1="6.5" x2="24" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="24" y1="30" x2="24" y2="41.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="6.5" y1="24" x2="18" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="30" y1="24" x2="41.5" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.6" />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function OsintverseIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="24" y1="24" x2="24" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M24 24 L24 4 A20 20 0 0 1 43.3 34 Z" fill="currentColor" opacity="0.15" />
      <line x1="24" y1="14" x2="24" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="24" y1="30" x2="24" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="14" y1="24" x2="18" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function DarknetIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <rect x="10" y="10" width="6" height="6" fill="currentColor" opacity="0.3" />
      <rect x="32" y="10" width="6" height="6" fill="currentColor" opacity="0.2" />
      <rect x="10" y="32" width="6" height="6" fill="currentColor" opacity="0.2" />
      <rect x="32" y="32" width="6" height="6" fill="currentColor" opacity="0.3" />
      <line x1="24" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="24" y1="13" x2="35" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="24" y1="35" x2="13" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="24" y1="35" x2="35" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="13" y1="13" x2="13" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="35" y1="13" x2="35" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <rect x="20" y="20" width="8" height="8" fill="currentColor" opacity="0.7" />
      <rect x="22" y="22" width="4" height="4" fill="currentColor" opacity="0.95" />
    </svg>
  )
}

interface CategoryMeta {
  key: string
  label: string
  icon: string
  color: string
  desc: string
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'crypto', label: 'CRYPTOGRAPHY', icon: '🔐', color: '#38bdf8', desc: 'Ciphers, rotational shifts, frequency tables & fault analysis' },
  { key: 'forensics', label: 'FORENSICS', icon: '🔍', color: '#c084fc', desc: 'Raster steganography, DNS pcap exfiltration & memory dumps' },
  { key: 'web', label: 'WEB SECURITY', icon: '🌐', color: '#f59e0b', desc: 'Containment APIs, authorization gates & relay authentication' },
  { key: 'reverse', label: 'REVERSE ENGINEERING', icon: '⚙️', color: '#fb923c', desc: 'Binary decompilation, stripped routines & key check algorithms' },
  { key: 'osint', label: 'OSINT', icon: '🛰️', color: '#34d399', desc: 'Incident correlation, public footprints & digital surveillance' },
  { key: 'misc', label: 'MISC / ENCODING', icon: '🧩', color: '#f43f5e', desc: 'Multi-layer transport encoding & protocol packet recovery' },
]

function getDifficultyMeta(difficulty: string) {
  if (difficulty === 'easy') {
    return { label: 'EASY', rank: 1, color: 'var(--emerald, #2be066)', badgeClass: 'diff-easy' }
  }
  if (difficulty === 'moderate' || difficulty === 'medium') {
    return { label: 'MEDIUM', rank: 2, color: 'var(--signal, #f0b93d)', badgeClass: 'diff-medium' }
  }
  return { label: 'HARD', rank: 3, color: 'var(--danger, #c73a32)', badgeClass: 'diff-hard' }
}

export default function Hub() {
  const { state, isAdmin, isUniverseUnlocked, isChallengeSolved } = useGame()
  const navigate = useNavigate()

  const [viewMode, setViewMode] = useState<'sectors' | 'categories' | 'matrix'>('sectors')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unsolved' | 'solved'>('all')
  const [sortBy, setSortBy] = useState<
    'diff-asc' | 'diff-desc' | 'pts-desc' | 'pts-asc' | 'code' | 'category'
  >('diff-asc')

  const universes = [
    { id: 'webverse' as const, name: 'SECTOR 01 // INITIATION', tier: 'EASY TIER', Icon: WebverseIcon, color: 'var(--wv-primary)', challenges: 4 },
    { id: 'osintverse' as const, name: 'SECTOR 02 // BREACH', tier: 'MEDIUM TIER', Icon: OsintverseIcon, color: 'var(--os-primary)', challenges: 5 },
    { id: 'darknet' as const, name: 'SECTOR 03 // DOOMSDAY', tier: 'HARD TIER', Icon: DarknetIcon, color: 'var(--dn-primary)', challenges: 3 },
  ]

  const unlockedSectorsCount = universes.filter(u => isUniverseUnlocked(u.id)).length

  // Filter and sort challenges for Matrix / Category views
  const filteredChallenges = useMemo(() => {
    return challenges.filter(ch => {
      if (selectedCategory !== 'all' && ch.category !== selectedCategory) return false
      if (selectedDifficulty !== 'all') {
        const diffRank = getDifficultyMeta(ch.difficulty).rank
        if (selectedDifficulty === 'easy' && diffRank !== 1) return false
        if (selectedDifficulty === 'medium' && diffRank !== 2) return false
        if (selectedDifficulty === 'hard' && diffRank !== 3) return false
      }
      if (selectedStatus === 'solved' && !isChallengeSolved(ch.id)) return false
      if (selectedStatus === 'unsolved' && isChallengeSolved(ch.id)) return false
      return true
    }).sort((a, b) => {
      const aDiff = getDifficultyMeta(a.difficulty).rank
      const bDiff = getDifficultyMeta(b.difficulty).rank
      if (sortBy === 'diff-asc') return aDiff - bDiff || a.points - b.points
      if (sortBy === 'diff-desc') return bDiff - aDiff || b.points - a.points
      if (sortBy === 'pts-desc') return b.points - a.points
      if (sortBy === 'pts-asc') return a.points - b.points
      if (sortBy === 'category') return a.category.localeCompare(b.category) || aDiff - bDiff
      return a.code.localeCompare(b.code)
    })
  }, [selectedCategory, selectedDifficulty, selectedStatus, sortBy, isChallengeSolved])

  const totalPoints = challenges.reduce((sum, c) => sum + c.points, 0)
  const earnedPoints = challenges.reduce((sum, c) => sum + (isChallengeSolved(c.id) ? c.points : 0), 0)
  const totalSolved = challenges.filter(c => isChallengeSolved(c.id)).length

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rotX = Math.max(-8, Math.min(8, -(y / rect.height) * 16))
    const rotY = Math.max(-8, Math.min(8, (x / rect.width) * 16))
    e.currentTarget.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = `rotateX(0deg) rotateY(0deg)`
  }

  return (
    <PageTransition>
      <BattleworldBg variant="hub" />
      
      <main className="hub-container">
        <header className="hub-header">
          <p style={{ fontFamily: 'var(--mono-font)', fontSize: '0.8rem', color: 'var(--bronze)', letterSpacing: '0.2em', marginBottom: '0.5rem', opacity: 0.9 }}>
            BATTLEWORLD // SECTOR 616
          </p>
          <p style={{ fontFamily: 'var(--mono-font)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '1.25rem' }}>
            — CLASSIFIED TACTICAL GRID —
          </p>
          <h1 style={{ color: 'var(--emerald-bright)', fontFamily: 'var(--heading-font)', fontWeight: 800, fontSize: '2.4rem', textShadow: '0 0 20px var(--emerald-glow)', margin: '0 0 1rem 0' }}>
            BATTLEWORLD COMMAND CENTER
          </h1>

          <div className="hub-stat-ribbon">
            <span>OPERATIONS: <strong>{totalSolved} / {challenges.length} SOLVED</strong></span>
            <span style={{ color: 'var(--emerald)' }}>SCORE: <strong>{earnedPoints} / {totalPoints} PTS</strong></span>
            <span>STONES: <strong>{state.stones.length} / 6</strong></span>
            <span>SECTORS: <strong>{unlockedSectorsCount} / 3 ACTIVE</strong></span>
          </div>

          {isAdmin && (
            <div className="admin-overseer-banner">
              <div className="admin-overseer-info">
                <span className="admin-overseer-badge">👑 OVERSEER CONTROL ACTIVE</span>
                <span className="admin-overseer-text">
                  Logged in as <strong>{state.ctfdUser?.name.toUpperCase()}</strong>. Master administrative clearance enabled.
                </span>
              </div>
              <div className="admin-overseer-actions">
                <CommandButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  style={{
                    borderColor: 'var(--danger, #c73a32)',
                    background: 'rgba(199, 58, 50, 0.25)',
                    color: '#fff',
                  }}
                >
                  ⚡ LAUNCH ADMIN CONSOLE
                </CommandButton>
                <a
                  href="http://localhost:8000/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-ctfd-btn"
                >
                  🛠️ CTFd MASTER ↗
                </a>
              </div>
            </div>
          )}

          {/* Primary View Mode Switcher */}
          <div className="hub-view-switcher">
            <button
              type="button"
              className={`hub-tab-btn ${viewMode === 'sectors' ? 'active' : ''}`}
              onClick={() => setViewMode('sectors')}
            >
              🌐 3D SECTORS (DIFFICULTY TIERS)
            </button>
            <button
              type="button"
              className={`hub-tab-btn ${viewMode === 'categories' ? 'active' : ''}`}
              onClick={() => setViewMode('categories')}
            >
              🗂 BROWSE BY CATEGORY
            </button>
            <button
              type="button"
              className={`hub-tab-btn ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
            >
              ⚡ ALL OPERATIONS (SORT & FILTER)
            </button>
          </div>
        </header>

        {/* ── VIEW 1: 3D SECTORS MAP (DIFFICULTY TIERS) ── */}
        {viewMode === 'sectors' && (
          <div className="map-area">
            <svg className="svg-lines" preserveAspectRatio="none">
              <line x1="50%" y1="20%" x2="50%" y2="50%" className={`connection-line ${isUniverseUnlocked('webverse') ? 'unlocked' : 'locked'}`} />
              <line x1="25%" y1="75%" x2="50%" y2="50%" className={`connection-line ${isUniverseUnlocked('osintverse') ? 'unlocked' : 'locked'}`} />
              <line x1="75%" y1="75%" x2="50%" y2="50%" className={`connection-line ${isUniverseUnlocked('darknet') ? 'unlocked' : 'locked'}`} />
            </svg>

            <div className="core-container">
              <BattleworldCore stoneCount={state.stones.length} />
            </div>

            {universes.map((u) => {
              const unlocked = isUniverseUnlocked(u.id)
              const Icon = u.Icon
              
              return (
                <div key={u.id} className={`sector-node-wrapper node-${u.id}`}>
                  <div 
                    className={`sector-card ${unlocked ? 'unlocked' : 'locked'}`}
                    onMouseMove={unlocked ? handleMouseMove : undefined}
                    onMouseLeave={unlocked ? handleMouseLeave : undefined}
                    onClick={() => unlocked && navigate(`/universe/${u.id}`)}
                    data-sfx={unlocked ? "hover" : undefined}
                    style={{ color: u.color }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <Icon />
                    </div>
                    <div className="sector-tier-badge">{u.tier} TIER</div>
                    <h2 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.4rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                      {u.name}
                    </h2>
                    
                    <div style={{ fontFamily: 'var(--mono-font)', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', opacity: 0.85 }}>
                      <div>NODES: 0{u.challenges} | SECTOR: {u.tier}</div>
                      <div>STATUS: {unlocked ? 'ACCESSIBLE' : 'SEALED'}</div>
                    </div>

                    <div style={{ width: '100%', borderTop: '1px solid var(--s3)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--mono-font)', fontSize: '0.75rem' }}>
                        STATUS: <span style={{ color: unlocked ? 'var(--emerald)' : 'var(--danger)' }}>{unlocked ? 'ONLINE' : 'SEALED'}</span>
                      </span>
                      {unlocked && (
                        <CommandButton variant="primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>
                          ENTER SECTOR
                        </CommandButton>
                      )}
                    </div>

                    {!unlocked && (
                      <div className="locked-overlay">
                        <div className="scan-line"></div>
                        <h3 style={{ fontFamily: 'var(--heading-font)', color: 'var(--danger)', margin: '0 0 0.5rem 0', letterSpacing: '0.1em', zIndex: 3 }}>
                          SECTOR SEALED
                        </h3>
                        <div style={{ fontFamily: 'var(--mono-font)', fontSize: '0.7rem', color: 'var(--text-muted)', zIndex: 3, textAlign: 'center' }}>
                          <div>ACCESS LEVEL: RESTRICTED</div>
                          <div>REQUIRED: PREVIOUS SECTOR CLEAR</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── VIEW 2: BROWSE BY CATEGORY ── */}
        {viewMode === 'categories' && (
          <div className="categories-view-wrapper">
            {CATEGORIES.map((cat) => {
              const catChallenges = challenges.filter(c => c.category === cat.key).sort((a, b) => {
                const aRank = getDifficultyMeta(a.difficulty).rank
                const bRank = getDifficultyMeta(b.difficulty).rank
                return aRank - bRank || a.points - b.points
              })
              const solvedInCat = catChallenges.filter(c => isChallengeSolved(c.id)).length
              const catPoints = catChallenges.reduce((sum, c) => sum + c.points, 0)

              return (
                <section key={cat.key} className="category-section">
                  <div className="category-section-header" style={{ borderLeftColor: cat.color }}>
                    <div className="category-section-info">
                      <span className="category-section-icon">{cat.icon}</span>
                      <div>
                        <h2 className="category-section-title" style={{ color: cat.color }}>
                          {cat.label}
                        </h2>
                        <p className="category-section-desc">{cat.desc}</p>
                      </div>
                    </div>
                    <div className="category-section-stats">
                      <span className="cat-stat-badge">
                        {solvedInCat}/{catChallenges.length} SOLVED
                      </span>
                      <span className="cat-points-badge">
                        {catPoints} TOTAL PTS
                      </span>
                    </div>
                  </div>

                  <div className="challenge-cards-grid">
                    {catChallenges.map((ch) => {
                      const isSolved = isChallengeSolved(ch.id)
                      const diff = getDifficultyMeta(ch.difficulty)

                      return (
                        <div
                          key={ch.id}
                          className={`ch-card ${isSolved ? 'ch-card--solved' : ''}`}
                          onClick={() => navigate(`/challenge/${ch.id}`)}
                        >
                          <div className="ch-card-header">
                            <span className="ch-card-code">[{ch.code}]</span>
                            <span className={`ch-card-diff ${diff.badgeClass}`}>{diff.label}</span>
                            <span className="ch-card-pts">{ch.points} PTS</span>
                          </div>

                          <h3 className="ch-card-title">{ch.title}</h3>
                          <p className="ch-card-desc">{ch.description}</p>

                          <div className="ch-card-footer">
                            <span className="ch-card-stone">◆ {ch.stone.toUpperCase()} STONE</span>
                            <span className={`ch-card-status ${isSolved ? 'status-solved' : 'status-active'}`}>
                              {isSolved ? '◈ SYNCHRONIZED' : '◉ ACTIVE'}
                            </span>
                          </div>

                          <div className="ch-card-action">
                            <span>BREACH TERMINAL →</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* ── VIEW 3: ALL OPERATIONS MATRIX (SORT & FILTER) ── */}
        {viewMode === 'matrix' && (
          <div className="matrix-view-wrapper">
            <div className="matrix-control-panel">
              <div className="matrix-control-row">
                <span className="control-label">CATEGORY:</span>
                <div className="control-pills">
                  <button
                    type="button"
                    className={`pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    ALL [12]
                  </button>
                  {CATEGORIES.map(c => {
                    const count = challenges.filter(ch => ch.category === c.key).length
                    return (
                      <button
                        key={c.key}
                        type="button"
                        className={`pill-btn ${selectedCategory === c.key ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(c.key)}
                      >
                        {c.icon} {c.label} [{count}]
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="matrix-control-row">
                <span className="control-label">DIFFICULTY:</span>
                <div className="control-pills">
                  <button
                    type="button"
                    className={`pill-btn ${selectedDifficulty === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty('all')}
                  >
                    ALL TIERS
                  </button>
                  <button
                    type="button"
                    className={`pill-btn pill-btn--easy ${selectedDifficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty('easy')}
                  >
                    EASY (TIER 1)
                  </button>
                  <button
                    type="button"
                    className={`pill-btn pill-btn--medium ${selectedDifficulty === 'medium' ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty('medium')}
                  >
                    MEDIUM (TIER 2)
                  </button>
                  <button
                    type="button"
                    className={`pill-btn pill-btn--hard ${selectedDifficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty('hard')}
                  >
                    HARD (TIER 3)
                  </button>
                </div>

                <div className="matrix-sort-group">
                  <label htmlFor="matrix-sort" className="control-label">SORT ORDER:</label>
                  <select
                    id="matrix-sort"
                    className="matrix-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="diff-asc">Difficulty: Easy → Hard</option>
                    <option value="diff-desc">Difficulty: Hard → Easy</option>
                    <option value="pts-asc">Points: Low → High</option>
                    <option value="pts-desc">Points: High → Low</option>
                    <option value="category">Category (A → Z)</option>
                    <option value="code">Operation Code</option>
                  </select>
                </div>
              </div>

              <div className="matrix-control-row">
                <span className="control-label">STATUS:</span>
                <div className="control-pills">
                  <button
                    type="button"
                    className={`pill-btn ${selectedStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedStatus('all')}
                  >
                    ALL
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${selectedStatus === 'unsolved' ? 'active' : ''}`}
                    onClick={() => setSelectedStatus('unsolved')}
                  >
                    UNSOLVED ({challenges.filter(c => !isChallengeSolved(c.id)).length})
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${selectedStatus === 'solved' ? 'active' : ''}`}
                    onClick={() => setSelectedStatus('solved')}
                  >
                    SOLVED ({challenges.filter(c => isChallengeSolved(c.id)).length})
                  </button>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  MATCHING: <strong>{filteredChallenges.length} OF {challenges.length}</strong> OPERATIONS
                </div>
              </div>
            </div>

            <div className="challenge-cards-grid">
              {filteredChallenges.map((ch) => {
                const isSolved = isChallengeSolved(ch.id)
                const diff = getDifficultyMeta(ch.difficulty)
                const cat = CATEGORIES.find(c => c.key === ch.category)

                return (
                  <div
                    key={ch.id}
                    className={`ch-card ${isSolved ? 'ch-card--solved' : ''}`}
                    onClick={() => navigate(`/challenge/${ch.id}`)}
                  >
                    <div className="ch-card-header">
                      <span className="ch-card-code">[{ch.code}]</span>
                      <span className="ch-card-cat-badge" style={{ color: cat?.color, borderColor: cat?.color }}>
                        {cat?.icon} {cat?.label}
                      </span>
                      <span className={`ch-card-diff ${diff.badgeClass}`}>{diff.label}</span>
                      <span className="ch-card-pts">{ch.points} PTS</span>
                    </div>

                    <h3 className="ch-card-title">{ch.title}</h3>
                    <p className="ch-card-desc">{ch.description}</p>

                    <div className="ch-card-footer">
                      <span className="ch-card-stone">◆ {ch.stone.toUpperCase()} STONE</span>
                      <span className={`ch-card-status ${isSolved ? 'status-solved' : 'status-active'}`}>
                        {isSolved ? '◈ SYNCHRONIZED' : '◉ ACTIVE'}
                      </span>
                    </div>

                    <div className="ch-card-action">
                      <span>BREACH TERMINAL →</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <footer style={{
          textAlign: 'center', marginTop: '3rem', fontSize: '0.75rem',
          color: 'var(--text-muted)', fontFamily: 'var(--mono-font)', letterSpacing: '0.15em',
        }}>
          <p style={{ marginBottom: '0.5rem' }}>— DOCTOR DOOM'S BATTLEWORLD // AUTHORITY: CTFD 3.8.7 —</p>
        </footer>

        <style>{`
          .hub-container {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            padding: 1.5rem 1rem 3rem;
            max-width: 1400px;
            margin: 0 auto;
            overflow-x: hidden;
          }
          
          .hub-header {
            text-align: center;
            margin-bottom: 2rem;
          }

          .hub-stat-ribbon {
            display: inline-flex;
            gap: 1.5rem;
            justify-content: center;
            flex-wrap: wrap;
            font-family: var(--mono-font, 'Space Mono', monospace);
            font-size: 0.8rem;
            color: var(--text-primary);
            margin: 1.5rem 0 1rem;
            background: var(--s2, #101511);
            padding: 0.6rem 1.5rem;
            border-radius: 4px;
            border: 1px solid var(--deep-green, #173822);
            box-shadow: 0 0 15px rgba(11, 61, 34, 0.4);
          }

          .admin-overseer-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(199, 58, 50, 0.12);
            border: 1px solid var(--danger, #c73a32);
            border-radius: 6px;
            padding: 0.85rem 1.25rem;
            margin: 0.5rem auto 1.5rem;
            max-width: 900px;
            width: 100%;
            box-shadow: 0 0 20px rgba(199, 58, 50, 0.2);
            font-family: var(--mono-font, 'Space Mono', monospace);
            flex-wrap: wrap;
            gap: 1rem;
          }

          .admin-overseer-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            text-align: left;
          }

          .admin-overseer-badge {
            color: var(--danger, #c73a32);
            font-weight: bold;
            font-size: 0.8rem;
            letter-spacing: 0.1em;
          }

          .admin-overseer-text {
            color: var(--text-secondary, #aab8ae);
            font-size: 0.75rem;
          }

          .admin-overseer-actions {
            display: flex;
            gap: 0.75rem;
            align-items: center;
          }

          .admin-ctfd-btn {
            background: rgba(240, 185, 61, 0.15);
            border: 1px solid var(--signal, #f0b93d);
            color: var(--signal, #f0b93d);
            padding: 0.4rem 0.85rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.2s;
          }

          .admin-ctfd-btn:hover {
            background: var(--signal, #f0b93d);
            color: #050a06;
          }

          .hub-view-switcher {
            display: flex;
            justify-content: center;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 0.5rem;
          }

          .hub-tab-btn {
            background: rgba(16, 21, 16, 0.85);
            border: 1px solid rgba(43, 224, 102, 0.25);
            color: var(--text-secondary, #aab8ae);
            font-family: var(--mono-font, 'Space Mono', monospace);
            font-size: 0.8rem;
            font-weight: 700;
            padding: 0.6rem 1.25rem;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            letter-spacing: 0.05em;
          }

          .hub-tab-btn:hover {
            border-color: var(--emerald, #2be066);
            color: #fff;
            box-shadow: 0 0 12px rgba(43, 224, 102, 0.2);
          }

          .hub-tab-btn.active {
            background: rgba(43, 224, 102, 0.15);
            border-color: var(--emerald, #2be066);
            color: var(--emerald, #2be066);
            box-shadow: 0 0 15px rgba(43, 224, 102, 0.35);
          }

          /* ── 3D MAP AREA ── */
          .map-area {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 580px;
            margin: 0 auto;
            width: 100%;
            max-width: 1200px;
          }

          .core-container {
            width: 300px;
            height: 300px;
            z-index: 10;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .svg-lines {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
          }

          .sector-node-wrapper {
            position: absolute;
            z-index: 20;
            transform: translate(-50%, -50%);
            perspective: 1000px;
            width: 290px;
          }

          .node-webverse { top: 20%; left: 50%; }
          .node-osintverse { top: 75%; left: 24%; }
          .node-darknet { top: 75%; left: 76%; }
          
          .sector-card {
            background: rgba(10, 15, 12, 0.92);
            border: 1px solid var(--s3, #222);
            padding: 1.5rem;
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
            transition: transform 0.2s ease-out, border-color 0.3s;
            transform-style: preserve-3d;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            overflow: hidden;
          }

          .sector-tier-badge {
            font-family: var(--mono-font, 'Space Mono', monospace);
            font-size: 0.65rem;
            letter-spacing: 0.15em;
            padding: 2px 8px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.08);
            margin-bottom: 0.5rem;
            color: var(--text-muted);
          }
          
          .sector-card.unlocked {
            border-color: var(--emerald, #2be066);
            cursor: pointer;
          }
          .sector-card.unlocked:hover {
            box-shadow: 0 0 30px rgba(43, 224, 102, 0.25);
          }
          
          .sector-card.locked {
            border-color: var(--danger, #c73a32);
            pointer-events: none;
          }

          .locked-overlay {
            position: absolute;
            inset: 0;
            background: rgba(5,7,5,0.92);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2;
            padding: 1rem;
          }

          .scan-line {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--danger, #c73a32);
            opacity: 0.5;
            box-shadow: 0 0 10px var(--danger, #c73a32);
            animation: scan 3s infinite linear;
          }

          @keyframes scan {
            0% { top: 0; }
            100% { top: 100%; }
          }

          .connection-line {
            stroke-width: 2;
            fill: none;
          }
          .connection-line.locked {
            stroke: var(--s3);
            stroke-dasharray: 4 4;
            opacity: 0.5;
          }
          .connection-line.unlocked {
            stroke: var(--emerald, #2be066);
            filter: drop-shadow(0 0 5px var(--emerald));
            stroke-dasharray: 10 10;
            animation: energy-sweep 2s linear infinite;
          }
          
          @keyframes energy-sweep {
            to { stroke-dashoffset: -20; }
          }

          /* ── CATEGORIES VIEW ── */
          .categories-view-wrapper {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            margin-top: 1rem;
          }

          .category-section {
            background: rgba(12, 18, 14, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 1.5rem;
          }

          .category-section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            padding-left: 1rem;
            border-left: 4px solid var(--emerald);
            margin-bottom: 1.5rem;
          }

          .category-section-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .category-section-icon {
            font-size: 2rem;
          }

          .category-section-title {
            font-family: var(--heading-font, 'Barlow Condensed', sans-serif);
            font-size: 1.6rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            margin: 0;
          }

          .category-section-desc {
            font-family: var(--mono-font, 'Space Mono', monospace);
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin: 0.25rem 0 0 0;
          }

          .category-section-stats {
            display: flex;
            gap: 0.75rem;
            font-family: var(--mono-font, 'Space Mono', monospace);
            font-size: 0.75rem;
          }

          .cat-stat-badge {
            background: rgba(43, 224, 102, 0.1);
            border: 1px solid rgba(43, 224, 102, 0.3);
            color: var(--emerald);
            padding: 4px 10px;
            border-radius: 3px;
          }

          .cat-points-badge {
            background: rgba(240, 185, 61, 0.1);
            border: 1px solid rgba(240, 185, 61, 0.3);
            color: var(--signal);
            padding: 4px 10px;
            border-radius: 3px;
          }

          /* ── MATRIX VIEW CONTROLS ── */
          .matrix-view-wrapper {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-top: 1rem;
          }

          .matrix-control-panel {
            background: rgba(14, 20, 16, 0.85);
            border: 1px solid rgba(43, 224, 102, 0.2);
            border-radius: 6px;
            padding: 1.25rem 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            font-family: var(--mono-font, 'Space Mono', monospace);
          }

          .matrix-control-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .control-label {
            font-size: 0.75rem;
            color: var(--text-muted);
            letter-spacing: 0.1em;
            min-width: 90px;
          }

          .control-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .pill-btn {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: var(--text-secondary);
            font-family: inherit;
            font-size: 0.75rem;
            padding: 4px 10px;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .pill-btn:hover {
            border-color: rgba(255, 255, 255, 0.3);
            color: #fff;
          }

          .pill-btn.active {
            background: rgba(43, 224, 102, 0.15);
            border-color: var(--emerald);
            color: var(--emerald);
          }

          .pill-btn--easy.active {
            background: rgba(43, 224, 102, 0.15);
            border-color: var(--emerald);
            color: var(--emerald);
          }
          .pill-btn--medium.active {
            background: rgba(240, 185, 61, 0.15);
            border-color: var(--signal);
            color: var(--signal);
          }
          .pill-btn--hard.active {
            background: rgba(199, 58, 50, 0.15);
            border-color: var(--danger);
            color: var(--danger);
          }

          .matrix-sort-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: auto;
          }

          .matrix-select {
            background: #0d140e;
            border: 1px solid rgba(43, 224, 102, 0.3);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.75rem;
            padding: 5px 10px;
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          }

          /* ── CHALLENGE CARDS GRID ── */
          .challenge-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.25rem;
          }

          .ch-card {
            background: rgba(11, 16, 13, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
          }

          .ch-card:hover {
            border-color: var(--emerald, #2be066);
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(43, 224, 102, 0.2);
          }

          .ch-card--solved {
            border-color: rgba(43, 224, 102, 0.4);
            background: rgba(11, 24, 15, 0.75);
          }

          .ch-card-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            font-family: var(--mono-font, 'Space Mono', monospace);
            font-size: 0.75rem;
          }

          .ch-card-code {
            font-weight: 700;
            color: var(--emerald);
          }

          .ch-card-cat-badge {
            font-size: 0.65rem;
            padding: 1px 6px;
            border-radius: 2px;
            border: 1px solid;
            background: rgba(255, 255, 255, 0.03);
          }

          .ch-card-diff {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 2px;
          }
          .diff-easy {
            background: rgba(43, 224, 102, 0.12);
            color: var(--emerald);
            border: 1px solid rgba(43, 224, 102, 0.3);
          }
          .diff-medium {
            background: rgba(240, 185, 61, 0.12);
            color: var(--signal);
            border: 1px solid rgba(240, 185, 61, 0.3);
          }
          .diff-hard {
            background: rgba(199, 58, 50, 0.12);
            color: var(--danger);
            border: 1px solid rgba(199, 58, 50, 0.3);
          }

          .ch-card-pts {
            margin-left: auto;
            font-weight: 700;
            color: #fff;
          }

          .ch-card-title {
            font-family: var(--heading-font, 'Orbitron', 'Barlow Condensed', sans-serif);
            font-size: 1.15rem;
            font-weight: 700;
            color: #fff;
            margin: 0 0 0.5rem 0;
            letter-spacing: 0.04em;
          }

          .ch-card-desc {
            font-size: 0.8rem;
            color: var(--text-secondary);
            line-height: 1.45;
            margin: 0 0 1rem 0;
            flex: 1;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .ch-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 0.75rem;
            border-top: 1px dashed rgba(255, 255, 255, 0.1);
            font-family: var(--mono-font, 'Space Mono', monospace);
            font-size: 0.7rem;
            margin-bottom: 0.75rem;
          }

          .ch-card-stone {
            color: var(--text-muted);
          }

          .ch-card-status {
            font-weight: 700;
          }
          .status-solved {
            color: var(--emerald);
          }
          .status-active {
            color: var(--text-muted);
          }

          .ch-card-action {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(43, 224, 102, 0.08);
            border: 1px solid rgba(43, 224, 102, 0.25);
            color: var(--emerald);
            font-family: var(--mono-font, 'Space Mono', monospace);
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.5rem;
            border-radius: 3px;
            letter-spacing: 0.06em;
            transition: all 0.2s;
          }

          .ch-card:hover .ch-card-action {
            background: var(--emerald);
            color: #040805;
            box-shadow: 0 0 12px rgba(43, 224, 102, 0.4);
          }

          @media (max-width: 768px) {
            .map-area {
              flex-direction: column;
              height: auto;
              min-height: auto;
              padding: 2rem;
              gap: 2rem;
            }
            .svg-lines { display: none; }
            .core-container {
              position: relative;
              top: auto;
              left: auto;
              transform: none;
              width: 200px;
              height: 200px;
              margin: 0 auto;
            }
            .sector-node-wrapper {
              position: relative;
              top: auto !important;
              left: auto !important;
              transform: none !important;
              width: 100%;
              max-width: 350px;
              margin: 0 auto;
            }
            .matrix-sort-group {
              margin-left: 0;
              width: 100%;
              justify-content: space-between;
            }
          }

          @media (max-width: 480px) {
            .core-container { display: none; }
            .hub-stat-ribbon { gap: 0.75rem; font-size: 0.7rem; }
            .hub-tab-btn { font-size: 0.7rem; padding: 0.5rem 0.75rem; }
          }
        `}</style>
      </main>
    </PageTransition>
  )
}
