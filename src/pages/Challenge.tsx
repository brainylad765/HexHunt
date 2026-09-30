import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import FlagInput from '../components/FlagInput'
import HintsPanel from '../components/HintsPanel'
import NarrativePanel from '../components/NarrativePanel'
import GlitchOverlay from '../components/GlitchOverlay'
import PageTransition from '../components/PageTransition'
import BattleworldBg from '../components/BattleworldBg'
import CommandButton from '../components/CommandButton'

const UNIVERSE_COLOR: Record<string, string> = {
  webverse: 'var(--wv-primary)',
  osintverse: 'var(--os-primary)',
  darknet: 'var(--dn-primary)',
}

const generateTelemetry = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const getPercent = (offset: number) => {
    return Math.abs((hash * offset) % 60) + 30; // 30-90 range
  }
  
  return {
    targetSignal: getPercent(1),
    memoryIntegrity: getPercent(2),
    traceLevel: getPercent(3),
    scanDepth: getPercent(4),
  }
}

const ADMIN_FLAGS: Record<number, string> = {
  1: 'DOOM{last_transmission_o9k8oxu63wvc3sksjil21oqf}',
  2: 'DOOM{dust_in_lens_txydxk7pk4xqb6d52weevylm}',
  3: 'DOOM{ashfall_archive_1tcjy06eq4eqtf78l51eaoq3}',
  4: 'DOOM{protocol_primer_1bp29ipvjf6xsml0z0040eph}',
  5: 'DOOM{rift_capture_2aojmk18bjvjwfzgrfky2a6s}',
  6: 'DOOM{quarantine_cipher_cujthgybvpfrpfgqkcffqknd}',
  7: 'DOOM{frozen_build_z28q6xuirowjr7v5lm0dp2s3}',
  8: 'DOOM{containment_console_qvb08mba2j13e8x8mxhab118}',
  9: 'DOOM{memory_ledger_0uexmmhstk43sn691h0w769l}',
  10: 'DOOM{entropy_collapse_5zm1mfit0gedpccphedzt0pq}',
  11: 'DOOM{ghost_compiler_r2gtlopvw0nd4hv75q6c0n7v}',
  12: 'DOOM{redline_relay_0mj83hzfjb5jcgxqzsra8d2g}',
}

export default function Challenge() {
  const { challengeId } = useParams<{ challengeId: string }>()
  const navigate = useNavigate()
  const {
    state,
    isAdmin,
    getChallenge,
    solveChallenge,
    recordWrong,
    isChallengeUnlocked,
  } = useGame()

  const [copied, setCopied] = useState(false)

  const challenge = getChallenge(challengeId ?? '')
  const [wrong, setWrong] = useState(false)
  const [showGlitch, setShowGlitch] = useState(false)
  const [collapsePhase, setCollapsePhase] = useState(-1)

  useEffect(() => {
    if (!challenge) {
      navigate('/hub')
      return
    }
    if (!isChallengeUnlocked(challenge.id)) {
      navigate(`/universe/${challenge.universe}`)
    }
  }, [challenge, navigate, isChallengeUnlocked])

  const telemetry = useMemo(() => challenge ? generateTelemetry(challenge.id) : null, [challenge?.id])

  if (!challenge || !telemetry) return null

  const color = UNIVERSE_COLOR[challenge.universe]

  const handleCorrect = () => {
    solveChallenge(challenge.id)
    setTimeout(() => {
      // If this is the last challenge in a universe, return to hub to show new universe
      if (!challenge.nextChallengeId) {
        navigate('/hub')
      } else {
        navigate(`/universe/${challenge.universe}`)
      }
    }, 800)
  }

  const handleWrong = () => {
    setWrong(true)
    recordWrong(challenge.id, challenge.portalType)
    setCollapsePhase(1)
    setTimeout(() => {
      setShowGlitch(true)
      setTimeout(() => setShowGlitch(false), 500)
      setWrong(false)
      setCollapsePhase(0)
    }, 1000)
  }

  const bgVariant = ['webverse', 'osintverse', 'darknet'].includes(challenge.universe) 
    ? challenge.universe as any 
    : 'challenge'

  return (
    <PageTransition>
      <BattleworldBg variant={bgVariant} />
      <main
        className={`challenge ${wrong ? 'challenge--shake' : ''}`}
        style={{ ['--ch-color' as any]: color } as any}
      >
        <GlitchOverlay visible={showGlitch} phase={Math.max(0, collapsePhase)} />

        {collapsePhase >= 1 && collapsePhase < 3 && (
          <div className="collapse-msg">SIGNATURE REJECTED</div>
        )}
        {collapsePhase === 3 && (
          <div className="collapse-msg">REALITY ANCHOR LOST</div>
        )}
        {collapsePhase >= 4 && (
          <div className="collapse-msg">DIMENSIONAL BREACH DETECTED</div>
        )}

        <div style={{ marginBottom: '1rem', position: 'relative', zIndex: 10 }}>
          <CommandButton
            variant="ghost"
            onClick={() => navigate(`/universe/${challenge.universe}`)}
          >
            ← RETURN TO SECTOR
          </CommandButton>
        </div>

        <div className="terminal-wrapper">
          <div className="terminal-header">
            <div className="terminal-header-left">
              <span>┌───</span>
              <span className="terminal-title">BREACH TERMINAL</span>
              <span>────</span>
            </div>
            <div className="terminal-header-right">
              <span>────</span>
              <span className="terminal-status">{wrong ? 'SYSTEM: CRITICAL' : 'SYSTEM: ACTIVE'}</span>
              <span className={`terminal-indicator ${wrong ? 'terminal-indicator--error' : ''}`}></span>
              <span>────┐</span>
            </div>
          </div>
          
          <div className="terminal-body">
            <div className="terminal-meta-bar">
              <span className="challenge__id" style={{ fontWeight: 'bold', color: 'var(--emerald)' }}>[{challenge.code}]</span>
              <span style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                {challenge.category.toUpperCase()}
              </span>
              <span className="challenge__stone" style={{ color }}>
                ◆ {challenge.stone.toUpperCase()} STONE
              </span>
              <span className="challenge__id" style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
                {challenge.points} PTS
              </span>
            </div>

            <div className="challenge-content-area">
              <div className="challenge-main">
                <h1 className="challenge__title">{challenge.title}</h1>
                <p className="challenge__narrative">{challenge.narrative}</p>

                <NarrativePanel label="OPERATIONAL BRIEFING">{challenge.description}</NarrativePanel>

                <HintsPanel challengeId={challenge.id} hints={challenge.hints} />
              </div>

              <aside className="telemetry-panel">
                <div className="telemetry-title">◆ SYSTEM TELEMETRY</div>
                
                <div className="telemetry-row">
                  <span className="telemetry-label">TARGET SIGNAL</span>
                  <div className="telemetry-bar-bg">
                    <div className="telemetry-bar" style={{ 
                      width: `${wrong ? 99 : telemetry.targetSignal}%`, 
                      background: wrong ? 'var(--danger, #c73a32)' : 'var(--emerald, #2BE066)' 
                    }}></div>
                  </div>
                  <span className="telemetry-val" style={{ color: wrong ? 'var(--danger)' : 'var(--emerald)' }}>
                    {wrong ? '99%' : `${telemetry.targetSignal}%`}
                  </span>
                </div>
                
                <div className="telemetry-row">
                  <span className="telemetry-label">MEMORY INTG</span>
                  <div className="telemetry-bar-bg">
                    <div className="telemetry-bar" style={{ 
                      width: `${wrong ? 99 : telemetry.memoryIntegrity}%`, 
                      background: wrong ? 'var(--danger, #c73a32)' : 'var(--emerald, #2BE066)' 
                    }}></div>
                  </div>
                  <span className="telemetry-val" style={{ color: wrong ? 'var(--danger)' : 'var(--emerald)' }}>
                    {wrong ? 'CRITICAL' : `${telemetry.memoryIntegrity}%`}
                  </span>
                </div>
                
                <div className="telemetry-row">
                  <span className="telemetry-label">ENCRYPTION</span>
                  <span className="telemetry-val" style={{ width: 'auto', flex: 1, textAlign: 'right', color: wrong ? 'var(--danger)' : 'var(--emerald)' }}>
                    {wrong ? 'FAILED' : 'ACTIVE'}
                  </span>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">TRACE LEVEL</span>
                  <div className="telemetry-bar-bg">
                    <div className="telemetry-bar" style={{ 
                      width: `${wrong ? 99 : telemetry.traceLevel}%`, 
                      background: wrong ? 'var(--danger, #c73a32)' : 'var(--signal, #f0b93d)' 
                    }}></div>
                  </div>
                  <span className="telemetry-val" style={{ color: wrong ? 'var(--danger)' : 'var(--signal)' }}>
                    {wrong ? 'HIGH' : `${telemetry.traceLevel}%`}
                  </span>
                </div>
                
                <div className="telemetry-row">
                  <span className="telemetry-label">SCAN DEPTH</span>
                  <div className="telemetry-bar-bg">
                    <div className="telemetry-bar" style={{ 
                      width: `${wrong ? 99 : telemetry.scanDepth}%`, 
                      background: wrong ? 'var(--danger, #c73a32)' : 'var(--emerald, #2BE066)' 
                    }}></div>
                  </div>
                  <span className="telemetry-val" style={{ color: wrong ? 'var(--danger)' : 'var(--emerald)' }}>
                    {wrong ? 'MAX' : `${telemetry.scanDepth}%`}
                  </span>
                </div>
              </aside>
            </div>

            {challenge.artifactUrl && (
              <div style={{ margin: '0.5rem 0' }}>
                <a
                  href={challenge.artifactUrl}
                  download={challenge.artifactFilename}
                  className="btn-artifact-download"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 20px',
                    background: 'rgba(43, 224, 102, 0.12)',
                    border: '1px solid var(--emerald, #2BE066)',
                    color: 'var(--emerald, #2BE066)',
                    fontFamily: 'var(--mono-font, "Space Mono", monospace)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                    boxShadow: '0 0 15px rgba(43, 224, 102, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>⬇</span> DOWNLOAD PARTICIPANT ARTIFACT // {challenge.artifactFilename?.toUpperCase()}
                </a>
              </div>
            )}

            {challenge.connectionInfo && (
              <div style={{ margin: '0.5rem 0' }}>
                <a
                  href={challenge.connectionInfo}
                  className="btn-target-connect"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 20px',
                    background: 'rgba(240, 185, 61, 0.15)',
                    border: '1px solid var(--signal, #f0b93d)',
                    color: 'var(--signal, #f0b93d)',
                    fontFamily: 'var(--mono-font, "Space Mono", monospace)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                    boxShadow: '0 0 15px rgba(240, 185, 61, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>⚡</span> CONNECT TO LIVE TARGET // {challenge.connectionInfo}
                </a>
              </div>
            )}

            {isAdmin && (
              <div
                style={{
                  margin: '1.25rem 0',
                  padding: '1rem 1.25rem',
                  background: 'rgba(199, 58, 50, 0.12)',
                  border: '1px solid var(--danger, #c73a32)',
                  borderRadius: '4px',
                  fontFamily: 'var(--mono-font, "Space Mono", monospace)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--danger, #c73a32)', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                    👑 OVERSEER INTELLIGENCE OVERRIDE // ADMIN PRIVILEGES
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    CTFd ID: #{challenge.ctfdId}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OFFICIAL FLAG:</span>
                  <code style={{ background: '#070c08', border: '1px solid rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: '3px', color: 'var(--emerald, #2be066)', fontSize: '0.85rem' }}>
                    {ADMIN_FLAGS[challenge.ctfdId] || 'DOOM{...}'}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(ADMIN_FLAGS[challenge.ctfdId] || '')
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: copied ? 'var(--emerald)' : '#fff',
                      padding: '4px 10px',
                      borderRadius: '3px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? '✓ COPIED' : '📋 COPY FLAG'}
                  </button>
                  <a
                    href={`http://localhost:8000/admin/challenges/${challenge.ctfdId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--signal, #f0b93d)',
                      textDecoration: 'none',
                      marginLeft: 'auto',
                    }}
                  >
                    🛠️ EDIT IN CTFd ADMIN ↗
                  </a>
                </div>
              </div>
            )}

            <div className="terminal-divider">
              <span>──</span>
              <span>EXECUTE FLAG SUBMISSION // CTFD SECURE VALIDATOR</span>
              <span className="terminal-divider-line"></span>
            </div>

            <FlagInput
              ctfdId={challenge.ctfdId}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              color={color}
            />
          </div>
          
          <div className="terminal-footer">
            <span>└──────────────────</span>
            <span>──────────────────┘</span>
          </div>
        </div>

        <style>{`
          .collapse-msg { 
            position: fixed; inset: 0; display: flex; align-items: center;
            justify-content: center; z-index: 1000; font-family: var(--heading-font, "Orbitron", sans-serif);
            font-size: 2rem; color: var(--danger, #c73a32); text-shadow: 0 0 20px var(--danger-glow, rgba(199,58,50,0.8));
            animation: fadeSlideUp 0.3s ease-out; pointer-events: none; text-align: center;
          }
          
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .terminal-wrapper {
            border: 1px solid var(--ch-color, var(--emerald));
            background: rgba(10, 10, 10, 0.8);
            backdrop-filter: blur(4px);
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          .terminal-header, .terminal-footer {
            display: flex; justifyContent: space-between; align-items: center;
            font-family: var(--mono-font, "Space Mono", monospace); font-size: 0.8rem;
            color: var(--ch-color, var(--emerald)); padding: 0.5rem 1rem;
          }
          
          .terminal-header { border-bottom: 1px solid var(--ch-color, var(--emerald)); }
          .terminal-header-left, .terminal-header-right { display: flex; align-items: center; gap: 0.5rem; }
          .terminal-title { letter-spacing: 0.1em; }
          .terminal-status { letter-spacing: 0.1em; }
          
          .terminal-indicator {
            width: 8px; height: 8px; background: var(--ch-color, var(--emerald)); 
            border-radius: 50%; display: inline-block; animation: blink 1s infinite;
          }
          .terminal-indicator--error { background: var(--danger, #c73a32); animation: blink 0.2s infinite; }
          
          .terminal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
          
          .terminal-meta-bar {
            display: flex; align-items: center; gap: 1rem;
            padding-bottom: 1rem; border-bottom: 1px dashed rgba(255,255,255,0.1);
          }
          
          .challenge-content-area {
            display: flex; gap: 2rem;
            flex-direction: column;
          }
          
          @media (min-width: 768px) {
            .challenge-content-area { flex-direction: row; }
            .challenge-main { flex: 1; min-width: 0; }
            .telemetry-panel { width: 250px; flex-shrink: 0; }
          }
          
          .telemetry-panel {
            border: 1px solid rgba(255,255,255,0.1);
            background: var(--s0, #050505);
            padding: 1rem;
            border-radius: 4px;
            font-family: var(--mono-font, "Space Mono", monospace);
            font-size: 0.75rem;
            height: fit-content;
          }
          
          .telemetry-title {
            color: var(--text-muted, #888);
            margin-bottom: 1rem;
            letter-spacing: 0.1em;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 0.5rem;
          }
          
          .telemetry-row {
            display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;
          }
          
          .telemetry-label {
            width: 90px; color: var(--text-secondary, #AAB8AE);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          
          .telemetry-bar-bg {
            flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;
          }
          
          .telemetry-bar {
            height: 100%; border-radius: 3px;
            transition: width 0.3s ease, background-color 0.3s ease;
            background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite linear;
          }
          
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          .telemetry-val {
            width: 45px; text-align: right; font-weight: bold;
          }
          
          .terminal-divider {
            display: flex; align-items: center; gap: 1rem; 
            font-family: var(--mono-font, "Space Mono", monospace); fontSize: 0.85rem; 
            color: var(--text-secondary, #AAB8AE); letter-spacing: 0.1em;
          }
          .terminal-divider-line {
            flex: 1; height: 1px; background: var(--text-secondary, #AAB8AE); opacity: 0.3;
          }
          
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          
          @media (prefers-reduced-motion: reduce) {
            .telemetry-bar, .terminal-indicator { animation: none !important; }
          }
        `}</style>
      </main>
    </PageTransition>
  )
}
