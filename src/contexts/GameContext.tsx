import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { challenges, type ChallengeData, type Stone, type Universe } from '../data/challenges'
import {
  getCurrentUser,
  getCurrentTeam,
  getChallenges,
  logoutFromCtfd,
  getNotifications,
  getConfigs,
  type CTFdUser,
  type CTFdTeam,
  type CTFdNotification,
} from '../services/ctfd'

// ── State shape ─────────────────────────────────────────────
export interface Participant {
  name: string
  email: string
  teamName?: string
  score?: number
}

export interface ChallengeProgress {
  solved: boolean
  attempts: number
  wrongPathVisited: string[]
  hintsUsed: number
}

export interface GameState {
  participant: Participant | null
  progress: Record<string, ChallengeProgress>
  stones: Stone[]
  startedAt: number | null
  currentChallengeId: Record<Universe, string | null>
  universeUnlocked: Record<Universe, boolean>
  ctfdUser: CTFdUser | null
  ctfdTeam: CTFdTeam | null
}

type Action =
  | { type: 'START'; payload: Participant }
  | { type: 'SYNC_CTFD'; payload: { user: CTFdUser | null; team: CTFdTeam | null; solvedCtfdIds: number[] } }
  | { type: 'SOLVE'; payload: { challengeId: string; stone: Stone; nextChallengeId: string | null } }
  | { type: 'RECORD_WRONG'; payload: { challengeId: string; portalId: string } }
  | { type: 'USE_HINT'; payload: { challengeId: string } }
  | { type: 'SET_CURRENT'; payload: { universe: Universe; challengeId: string | null } }
  | { type: 'RESET' }

const defaultParticipant: Participant = {
  name: 'OPERATIVE',
  email: 'player1@hexhunt.local',
  teamName: 'TEAM ALPHA',
  score: 0,
}

const initialState: GameState = {
  participant: defaultParticipant,
  progress: {},
  stones: [],
  startedAt: Date.now(),
  currentChallengeId: {
    webverse: 'wv-01',
    osintverse: 'os-01',
    darknet: 'dn-01',
  },
  universeUnlocked: {
    webverse: true,
    osintverse: true, // All 3 sectors accessible in CTF
    darknet: true,
  },
  ctfdUser: null,
  ctfdTeam: null,
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
          osintverse: 'os-01',
          darknet: 'dn-01',
        },
        universeUnlocked: {
          webverse: true,
          osintverse: true,
          darknet: true,
        },
      }

    case 'SYNC_CTFD': {
      const { user, team, solvedCtfdIds } = action.payload
      const newProgress = { ...state.progress }
      const newStones = [...state.stones]

      challenges.forEach((ch) => {
        if (solvedCtfdIds.includes(ch.ctfdId)) {
          newProgress[ch.id] = {
            ...(newProgress[ch.id] || { attempts: 0, wrongPathVisited: [], hintsUsed: 0 }),
            solved: true,
          }
          if (!newStones.includes(ch.stone)) {
            newStones.push(ch.stone)
          }
        }
      })

      const participant = user
        ? {
            name: user.name,
            email: user.email,
            teamName: team?.name || 'SOLO',
            score: team?.score ?? user.score ?? 0,
          }
        : state.participant

      return {
        ...state,
        participant,
        progress: newProgress,
        stones: newStones,
        ctfdUser: user,
        ctfdTeam: team,
      }
    }

    case 'SOLVE': {
      const { challengeId, stone, nextChallengeId } = action.payload
      const existing = state.progress[challengeId]
      const challenge = challenges.find((c) => c.id === challengeId)
      const universe = challenge?.universe ?? 'webverse'

      const newCurrent = {
        ...state.currentChallengeId,
        [universe]: nextChallengeId,
      }

      return {
        ...state,
        progress: {
          ...state.progress,
          [challengeId]: { ...existing, solved: true },
        },
        stones: state.stones.includes(stone) ? state.stones : [...state.stones, stone],
        currentChallengeId: newCurrent,
        participant: state.participant
          ? { ...state.participant, score: (state.participant.score || 0) + (challenge?.points || 0) }
          : null,
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
  isAdmin: boolean
  notifications: CTFdNotification[]
  dismissedNotificationIds: number[]
  dismissNotification: (id: number) => void
  isScoreboardFrozen: boolean
  startGame: (name: string, email: string) => void
  solveChallenge: (challengeId: string) => void
  recordWrong: (challengeId: string, portalId: string) => void
  useHint: (challengeId: string) => void
  setCurrentChallenge: (universe: Universe, challengeId: string | null) => void
  resetGame: () => void
  logoutUser: () => Promise<void>
  refreshFromCtfd: () => Promise<void>
  getChallenge: (id: string) => ChallengeData | undefined
  getProgress: (id: string) => ChallengeProgress | undefined
  isStoneCollected: (s: Stone) => boolean
  isUniverseUnlocked: (u: Universe) => boolean
  isChallengeUnlocked: (challengeId: string) => boolean
  isChallengeSolved: (id: string) => boolean
  getNextChallenge: (id: string) => ChallengeData | undefined
}

const GameContext = createContext<GameContextValue | null>(null)
const STORAGE_KEY = 'hexhunt_doomsday_save'

function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GameState>
    return {
      participant: parsed.participant || defaultParticipant,
      progress: parsed.progress ?? {},
      stones: Array.isArray(parsed.stones) ? parsed.stones : [],
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      currentChallengeId: {
        webverse: parsed.currentChallengeId?.webverse ?? 'wv-01',
        osintverse: parsed.currentChallengeId?.osintverse ?? 'os-01',
        darknet: parsed.currentChallengeId?.darknet ?? 'dn-01',
      },
      universeUnlocked: {
        webverse: true,
        osintverse: true,
        darknet: true,
      },
      ctfdUser: parsed.ctfdUser ?? null,
      ctfdTeam: parsed.ctfdTeam ?? null,
    }
  } catch {
    return null
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState, () => loadSaved() ?? initialState)
  const [notifications, setNotifications] = useState<CTFdNotification[]>([])
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<number[]>([])
  const [isScoreboardFrozen, setIsScoreboardFrozen] = useState(false)

  const isAdmin = useMemo(() => {
    return state.ctfdUser?.type === 'admin' || state.ctfdUser?.name?.toLowerCase() === 'admin'
  }, [state.ctfdUser])

  const dismissNotification = (id: number) => {
    setDismissedNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const refreshFromCtfd = async () => {
    try {
      const [user, team, chals, notifs, cfgs] = await Promise.all([
        getCurrentUser(),
        getCurrentTeam(),
        getChallenges(),
        getNotifications(),
        getConfigs(),
      ])

      if (Array.isArray(notifs)) {
        setNotifications(notifs)
      }

      if (cfgs && (cfgs.freeze === 'true' || cfgs.freeze === '1')) {
        setIsScoreboardFrozen(true)
      } else {
        setIsScoreboardFrozen(false)
      }

      const solvedCtfdIds: number[] = []
      chals.forEach((c) => {
        // If solved by user's team in CTFd
        if (c.solved_by_me) {
          solvedCtfdIds.push(c.id)
        }
      })

      dispatch({
        type: 'SYNC_CTFD',
        payload: { user, team, solvedCtfdIds },
      })
    } catch (err) {
      console.warn('Could not sync with CTFd backend:', err)
    }
  }

  // Auto-sync with CTFd on mount
  useEffect(() => {
    refreshFromCtfd()
    const interval = setInterval(refreshFromCtfd, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const startGame = (name: string, email: string) =>
    dispatch({ type: 'START', payload: { name, email } })

  const solveChallenge = (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId)
    if (!ch) return
    dispatch({ type: 'SOLVE', payload: { challengeId, stone: ch.stone, nextChallengeId: ch.nextChallengeId } })
    refreshFromCtfd()
  }

  const recordWrong = (challengeId: string, portalId: string) =>
    dispatch({ type: 'RECORD_WRONG', payload: { challengeId, portalId } })

  const useHint = (challengeId: string) =>
    dispatch({ type: 'USE_HINT', payload: { challengeId } })

  const setCurrentChallenge = (universe: Universe, challengeId: string | null) =>
    dispatch({ type: 'SET_CURRENT', payload: { universe, challengeId } })

  const resetGame = () => dispatch({ type: 'RESET' })

  const logoutUser = async () => {
    try {
      await logoutFromCtfd()
      localStorage.removeItem(STORAGE_KEY)
      dispatch({
        type: 'SYNC_CTFD',
        payload: { user: null, team: null, solvedCtfdIds: [] },
      })
      dispatch({ type: 'RESET' })
      await refreshFromCtfd()
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  const getChallenge = (id: string) => challenges.find((c) => c.id === id)
  const getProgress = (id: string) => state.progress[id]
  const isStoneCollected = (s: Stone) => state.stones.includes(s)
  const isUniverseUnlocked = (u: Universe) => state.universeUnlocked[u]

  // Allow playing all unlocked challenges in the universe
  const isChallengeUnlocked = (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId)
    if (!ch) return false
    return state.universeUnlocked[ch.universe] === true
  }

  const isChallengeSolved = (id: string) => state.progress[id]?.solved === true

  const getNextChallenge = (id: string) => {
    const ch = challenges.find((c) => c.id === id)
    if (!ch || !ch.nextChallengeId) return undefined
    return challenges.find((c) => c.id === ch.nextChallengeId)
  }

  const value: GameContextValue = {
    state,
    isAdmin,
    notifications,
    dismissedNotificationIds,
    dismissNotification,
    isScoreboardFrozen,
    startGame,
    solveChallenge,
    recordWrong,
    useHint,
    setCurrentChallenge,
    resetGame,
    logoutUser,
    refreshFromCtfd,
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
