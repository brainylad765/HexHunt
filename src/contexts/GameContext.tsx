import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { challenges, type ChallengeData, type Stone, type Universe } from '../data/challenges'

// ── State shape ─────────────────────────────────────────────
interface Participant {
  name: string
  email: string
}

interface ChallengeProgress {
  solved: boolean
  attempts: number
  wrongPathVisited: string[]
  hintsUsed: number
}

interface GameState {
  participant: Participant | null
  progress: Record<string, ChallengeProgress>
  stones: Stone[]
  startedAt: number | null
  /** Tracks which challenge ID is currently "active" per universe */
  currentChallengeId: Record<Universe, string | null>
  /** Tracks which universes are unlocked */
  universeUnlocked: Record<Universe, boolean>
}

type Action =
  | { type: 'START'; payload: Participant }
  | { type: 'SOLVE'; payload: { challengeId: string; stone: Stone; nextChallengeId: string | null } }
  | { type: 'RECORD_WRONG'; payload: { challengeId: string; portalId: string } }
  | { type: 'USE_HINT'; payload: { challengeId: string } }
  | { type: 'SET_CURRENT'; payload: { universe: Universe; challengeId: string | null } }
  | { type: 'RESET' }

// ── Reducer ─────────────────────────────────────────────────
const initialState: GameState = {
  participant: null,
  progress: {},
  stones: [],
  startedAt: null,
  currentChallengeId: {
    webverse: null,
    osintverse: null,
    darknet: null,
  },
  universeUnlocked: {
    webverse: true,   // Always unlocked first
    osintverse: false,
    darknet: false,
  },
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        participant: action.payload,
        startedAt: Date.now(),
        currentChallengeId: {
          webverse: 'wv-01',
          osintverse: null,
          darknet: null,
        },
        universeUnlocked: {
          webverse: true,
          osintverse: false,
          darknet: false,
        },
      }

    case 'SOLVE': {
      const { challengeId, stone, nextChallengeId } = action.payload
      const existing = state.progress[challengeId]

      // Advance current challenge in the universe
      const challenge = challenges.find((c) => c.id === challengeId)
      const universe = challenge?.universe ?? 'webverse'

      const newCurrent = {
        ...state.currentChallengeId,
        [universe]: nextChallengeId,
      }

      // Unlock next universe if applicable
      const allWebverseSolved = ['wv-01', 'wv-02', 'wv-03'].every(
        (id) => id === challengeId || state.progress[id]?.solved || id === nextChallengeId
      )
      const allOsintverseSolved = ['os-01', 'os-02', 'os-03'].every(
        (id) => id === challengeId || state.progress[id]?.solved || id === nextChallengeId
      )

      let universeUnlocked = { ...state.universeUnlocked }
      // If completing the last webverse challenge, unlock osintverse
      if (universe === 'webverse' && !nextChallengeId && allWebverseSolved) {
        universeUnlocked.osintverse = true
        newCurrent.osintverse = 'os-01'
      }
      // If completing the last osintverse challenge, unlock darknet
      if (universe === 'osintverse' && !nextChallengeId && allOsintverseSolved) {
        universeUnlocked.darknet = true
        newCurrent.darknet = 'dn-01'
      }

      return {
        ...state,
        progress: {
          ...state.progress,
          [challengeId]: { ...existing, solved: true },
        },
        stones: state.stones.includes(stone) ? state.stones : [...state.stones, stone],
        currentChallengeId: newCurrent,
        universeUnlocked,
      }
    }

    case 'RECORD_WRONG': {
      const { challengeId, portalId } = action.payload
      const existing = state.progress[challengeId]
      return {
        ...state,
        progress: {
          ...state.progress,
          [challengeId]: {
            ...existing,
            attempts: (existing?.attempts ?? 0) + 1,
            wrongPathVisited: [...(existing?.wrongPathVisited ?? []), portalId],
          },
        },
      }
    }

    case 'USE_HINT': {
      const { challengeId } = action.payload
      const existing = state.progress[challengeId]
      return {
        ...state,
        progress: {
          ...state.progress,
          [challengeId]: {
            ...existing,
            hintsUsed: (existing?.hintsUsed ?? 0) + 1,
          },
        },
      }
    }

    case 'SET_CURRENT':
      return {
        ...state,
        currentChallengeId: {
          ...state.currentChallengeId,
          [action.payload.universe]: action.payload.challengeId,
        },
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ── Context ─────────────────────────────────────────────────
interface GameContextValue {
  state: GameState
  startGame: (name: string, email: string) => void
  solveChallenge: (challengeId: string) => void
  recordWrong: (challengeId: string, portalId: string) => void
  useHint: (challengeId: string) => void
  setCurrentChallenge: (universe: Universe, challengeId: string | null) => void
  resetGame: () => void
  getChallenge: (id: string) => ChallengeData | undefined
  getProgress: (id: string) => ChallengeProgress | undefined
  isStoneCollected: (s: Stone) => boolean
  isUniverseUnlocked: (u: Universe) => boolean
  isChallengeUnlocked: (challengeId: string) => boolean
  isChallengeSolved: (id: string) => boolean
  getNextChallenge: (id: string) => ChallengeData | undefined
}

const GameContext = createContext<GameContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────
const STORAGE_KEY = 'doomsday_ctf_save'

function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GameState>
    return {
      participant: parsed.participant ?? null,
      progress: parsed.progress ?? {},
      stones: Array.isArray(parsed.stones) ? parsed.stones : [],
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      currentChallengeId: {
        webverse: parsed.currentChallengeId?.webverse ?? null,
        osintverse: parsed.currentChallengeId?.osintverse ?? null,
        darknet: parsed.currentChallengeId?.darknet ?? null,
      },
      universeUnlocked: {
        webverse: parsed.universeUnlocked?.webverse ?? true,
        osintverse: parsed.universeUnlocked?.osintverse ?? false,
        darknet: parsed.universeUnlocked?.darknet ?? false,
      },
    }
  } catch {
    return null
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState, () => loadSaved() ?? initialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const startGame = (name: string, email: string) =>
    dispatch({ type: 'START', payload: { name, email } })

  const solveChallenge = (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId)
    if (!ch) return
    dispatch({ type: 'SOLVE', payload: { challengeId, stone: ch.stone, nextChallengeId: ch.nextChallengeId } })
  }

  const recordWrong = (challengeId: string, portalId: string) =>
    dispatch({ type: 'RECORD_WRONG', payload: { challengeId, portalId } })

  const useHint = (challengeId: string) =>
    dispatch({ type: 'USE_HINT', payload: { challengeId } })

  const setCurrentChallenge = (universe: Universe, challengeId: string | null) =>
    dispatch({ type: 'SET_CURRENT', payload: { universe, challengeId } })

  const resetGame = () => dispatch({ type: 'RESET' })

  const getChallenge = (id: string) => challenges.find((c) => c.id === id)
  const getProgress = (id: string) => state.progress[id]

  const isStoneCollected = (s: Stone) => state.stones.includes(s)

  const isUniverseUnlocked = (u: Universe) => state.universeUnlocked[u]

  // A challenge is unlocked if its universe is unlocked AND the previous challenge in the chain is solved
  const isChallengeUnlocked = (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId)
    if (!ch) return false
    if (!state.universeUnlocked[ch.universe]) return false
    if (!ch.nextChallengeId) return true // First challenge in universe
    return state.progress[ch.nextChallengeId]?.solved === true
  }

  const isChallengeSolved = (id: string) => state.progress[id]?.solved === true

  const getNextChallenge = (id: string) => {
    const ch = challenges.find((c) => c.id === id)
    if (!ch || !ch.nextChallengeId) return undefined
    return challenges.find((c) => c.id === ch.nextChallengeId)
  }

  // Count solved per universe
  const universeStats = useMemo(() => {
    const count = (ids: string[]) => ids.filter((id) => state.progress[id]?.solved).length
    return {
      webverse: { solved: count(['wv-01', 'wv-02', 'wv-03']), total: 3 },
      osintverse: { solved: count(['os-01', 'os-02', 'os-03']), total: 3 },
      darknet: { solved: count(['dn-01', 'dn-02', 'dn-03', 'dn-04', 'dn-05', 'dn-06']), total: 6 },
    }
  }, [state.progress])

  const value: GameContextValue = {
    state,
    startGame,
    solveChallenge,
    recordWrong,
    useHint,
    setCurrentChallenge,
    resetGame,
    getChallenge,
    getProgress,
    isStoneCollected,
    isUniverseUnlocked,
    isChallengeUnlocked,
    isChallengeSolved,
    getNextChallenge,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
