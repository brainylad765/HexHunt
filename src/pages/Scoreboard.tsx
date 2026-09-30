import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScoreboard, type ScoreboardEntry } from '../services/ctfd'
import PageTransition from '../components/PageTransition'
import BattleworldBg from '../components/BattleworldBg'
import CommandButton from '../components/CommandButton'

export default function Scoreboard() {
  const navigate = useNavigate()
  const [standings, setStandings] = useState<ScoreboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchScores = async () => {
    setLoading(true)
    try {
      const data = await getScoreboard()
      setStandings(data)
      const now = new Date()
      setLastUpdated(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      )
    } catch (err) {
      console.error('Failed to fetch scoreboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScores()
    const interval = setInterval(fetchScores, 15000)
    return () => clearInterval(interval)
  }, [])

  const top3 = standings.slice(0, 3)

  return (
    <PageTransition>
      <BattleworldBg variant="hub" />
      
      <main className="scoreboard-container">
        <div style={{ marginBottom: '1.5rem' }}>
          <CommandButton variant="ghost" onClick={() => navigate('/hub')}>
            ← RETURN TO COMMAND
          </CommandButton>
        </div>

        <header className="scoreboard-header">
          <p className="scoreboard-eyebrow">BATTLEWORLD // SQUAD RANKINGS</p>
          <h1 className="scoreboard-title">TACTICAL SCOREBOARD</h1>
          <p className="scoreboard-sub">
            Real-time standings synchronized with CTFd authority. Updated at {lastUpdated || 'SYNCING...'}
          </p>

          <div className="scoreboard-actions">
            <CommandButton variant="primary" size="sm" onClick={fetchScores} disabled={loading}>
              {loading ? 'SYNCHRONIZING...' : '⟳ REFRESH STANDINGS'}
            </CommandButton>
            <span className="scoreboard-live-indicator">
              <span className="live-dot" /> LIVE TELEMETRY
            </span>
          </div>
        </header>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="podium-grid">
            {top3.map((entry, idx) => {
              const rankClass = idx === 0 ? 'podium-first' : idx === 1 ? 'podium-second' : 'podium-third'
              const medal = idx === 0 ? '🏆 CHAMPION' : idx === 1 ? '🥈 RUNNER UP' : '🥉 THIRD PLACE'

              return (
                <div key={entry.account_id} className={`podium-card ${rankClass}`}>
                  <div className="podium-medal">{medal}</div>
                  <div className="podium-rank">#{entry.pos || idx + 1}</div>
                  <h2 className="podium-name">{entry.name.toUpperCase()}</h2>
                  <div className="podium-score">{entry.score} PTS</div>

                  {entry.members && entry.members.length > 0 && (
                    <div className="podium-members">
                      <span className="podium-members-label">OPERATIVES:</span>
                      <div className="podium-members-list">
                        {entry.members.map((m) => (
                          <span key={m.id} className="podium-member-chip">
                            {m.name} ({m.score ?? 0} pts)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Full Standings Table */}
        <div className="standings-table-wrapper">
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>RANK</th>
                <th>SQUAD / TEAM CALLSIGN</th>
                <th>OPERATIVE ROSTER</th>
                <th style={{ width: '150px', textAlign: 'right' }}>TOTAL SCORE</th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {loading ? 'DOWNLOADING LEADERBOARD TELEMETRY...' : 'NO TEAMS REGISTERED YET'}
                  </td>
                </tr>
              ) : (
                standings.map((entry, idx) => {
                  const rank = entry.pos || idx + 1
                  const isTop = rank <= 3

                  return (
                    <tr key={entry.account_id} className={isTop ? 'row-top' : ''}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        <span className={`rank-badge ${rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''}`}>
                          #{rank}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
                        <span className="squad-name">{entry.name.toUpperCase()}</span>
                      </td>
                      <td>
                        <div className="table-members">
                          {entry.members && entry.members.length > 0 ? (
                            entry.members.map((m) => (
                              <span key={m.id} className="table-member-tag">
                                {m.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Solo operative</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1rem', color: 'var(--emerald, #2be066)' }}>
                        {entry.score} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PTS</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      <style>{`
        .scoreboard-container {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          font-family: var(--mono-font, 'Space Mono', monospace);
        }

        .scoreboard-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .scoreboard-eyebrow {
          font-size: 0.8rem;
          color: var(--bronze, #8a6238);
          letter-spacing: 0.2em;
          margin-bottom: 0.5rem;
        }

        .scoreboard-title {
          font-family: var(--heading-font, 'Orbitron', 'Barlow Condensed', sans-serif);
          font-size: 2.8rem;
          font-weight: 800;
          color: var(--emerald-bright, #38d66b);
          text-shadow: 0 0 25px var(--emerald-glow, rgba(43, 224, 102, 0.4));
          margin: 0 0 0.5rem 0;
          letter-spacing: 0.08em;
        }

        .scoreboard-sub {
          font-size: 0.85rem;
          color: var(--text-secondary, #aab8ae);
          margin-bottom: 1.5rem;
        }

        .scoreboard-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
        }

        .scoreboard-live-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--emerald, #2be066);
          letter-spacing: 0.1em;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--emerald, #2be066);
          box-shadow: 0 0 10px var(--emerald, #2be066);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        /* ── PODIUM ── */
        .podium-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .podium-card {
          background: rgba(12, 18, 14, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .podium-first {
          border-color: #ffd700;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.25), inset 0 0 15px rgba(255, 215, 0, 0.08);
          order: 1;
        }
        .podium-second {
          border-color: #c0c0c0;
          box-shadow: 0 0 20px rgba(192, 192, 192, 0.15);
          order: 0;
        }
        .podium-third {
          border-color: #cd7f32;
          box-shadow: 0 0 20px rgba(205, 127, 50, 0.15);
          order: 2;
        }

        @media (max-width: 900px) {
          .podium-first, .podium-second, .podium-third { order: unset; }
        }

        .podium-medal {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          margin-bottom: 0.5rem;
          color: var(--text-muted);
        }

        .podium-first .podium-medal { color: #ffd700; }
        .podium-second .podium-medal { color: #c0c0c0; }
        .podium-third .podium-medal { color: #cd7f32; }

        .podium-rank {
          font-family: var(--heading-font, 'Orbitron', sans-serif);
          font-size: 2.2rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .podium-name {
          font-family: var(--heading-font, 'Orbitron', 'Barlow Condensed', sans-serif);
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.5rem 0;
          letter-spacing: 0.05em;
        }

        .podium-score {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--emerald, #2be066);
          margin-bottom: 1rem;
          text-shadow: 0 0 10px rgba(43, 224, 102, 0.4);
        }

        .podium-members {
          width: 100%;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
          padding-top: 1rem;
        }

        .podium-members-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 0.5rem;
        }

        .podium-members-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.4rem;
        }

        .podium-member-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 2px;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        /* ── TABLE ── */
        .standings-table-wrapper {
          background: rgba(10, 15, 12, 0.9);
          border: 1px solid rgba(43, 224, 102, 0.25);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 0 25px rgba(0, 0, 0, 0.8);
        }

        .standings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .standings-table th {
          background: rgba(43, 224, 102, 0.08);
          color: var(--emerald, #2be066);
          padding: 1rem 1.25rem;
          text-align: left;
          letter-spacing: 0.1em;
          border-bottom: 1px solid rgba(43, 224, 102, 0.25);
          font-size: 0.75rem;
        }

        .standings-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
        }

        .standings-table tr:hover {
          background: rgba(43, 224, 102, 0.04);
        }

        .rank-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .rank-1 { color: #ffd700; font-weight: bold; background: rgba(255, 215, 0, 0.1); }
        .rank-2 { color: #c0c0c0; font-weight: bold; background: rgba(192, 192, 192, 0.1); }
        .rank-3 { color: #cd7f32; font-weight: bold; background: rgba(205, 127, 50, 0.1); }

        .squad-name {
          color: #fff;
          font-size: 0.95rem;
        }

        .table-members {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .table-member-tag {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
      `}</style>
    </PageTransition>
  )
}
