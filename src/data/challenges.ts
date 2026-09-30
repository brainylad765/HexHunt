// ============================================================
// HEXHUNT 1.0 — DOOMSDAY PROTOCOL // CHALLENGE REGISTRY
// ============================================================
// Real 12-challenge Battleworld mapping backed by CTFd 3.8.7.
// Zero hardcoded flags in frontend — validated solely by authority.
// ============================================================

export type ChallengeCategory =
  | 'web'
  | 'osint'
  | 'forensics'
  | 'crypto'
  | 'steganography'
  | 'pcap'
  | 'reverse'
  | 'pwn'
  | 'static'
  | 'custom'
  | 'decoder'
  | 'interactive'
  | 'misc'

export type Universe = 'webverse' | 'osintverse' | 'darknet'
export type Stone = 'space' | 'mind' | 'reality' | 'power' | 'time' | 'soul'

export type PortalType =
  | 'hidden-pixel'
  | 'recursive-loop'
  | 'time-based'
  | 'rabbit-hole'
  | 'signal'
  | 'cipher-loop'
  | 'packet'
  | 'reverse-loop'
  | 'pwn-terminal'
  | 'osint-redirect'
  | 'document-rabbit'

export interface PortalPuzzleData {
  type: PortalType
  title: string
  icon: string
  description: string
  clue: string
  puzzleAnswer: string
  data?: Record<string, string | number | string[]>
}

export interface ChallengeData {
  id: string
  ctfdId: number
  code: string
  title: string
  category: ChallengeCategory
  universe: Universe
  difficulty: 'easy' | 'moderate' | 'hard'
  description: string
  narrative: string
  flag?: string
  nextChallengeId: string | null
  portalType: PortalType
  portalPuzzle: PortalPuzzleData
  hints: string[]
  type: 'hex' | 'forensics' | 'decoder' | 'pcap' | 'reverse' | 'pwn' | 'interactive' | 'web'
  clueContent?: {
    label: string
    body: string
    format: 'code' | 'hex' | 'image' | 'terminal'
    imageSrc?: string
  }
  stone: Stone
  points: number
  author: string
  artifactFilename?: string
  artifactUrl?: string
  connectionInfo?: string
}

// ── SECTOR 1: WEBVERSE (Easy / Initiation Protocol) ───────────
const webverseChallenges: ChallengeData[] = [
  {
    id: 'wv-01',
    ctfdId: 1,
    code: 'E-01',
    title: 'Last Transmission',
    category: 'crypto',
    universe: 'webverse',
    difficulty: 'easy',
    description: 'Recover the authenticated response from the supplied emergency radio log and submit it in the event flag format.',
    narrative: 'A distress beacon broadcasts from Sector 616 perimeter. The emergency frequency is locked in an obsolete cipher format.',
    nextChallengeId: 'wv-02',
    portalType: 'cipher-loop',
    portalPuzzle: {
      type: 'cipher-loop',
      title: 'Emergency Frequency Lock',
      icon: '🔐',
      description: 'The receiver caught a frequency shift. Extract the carrier offset.',
      clue: 'EMERGENCY BEACON LOG: CARRIER 144.200 MHz // OFFSET +0.85 // KEY: ALPHA',
      puzzleAnswer: 'ALPHA',
    },
    hints: [
      'Inspect the format of the radio log timestamps and character shifts.',
      'Common historical radio ciphers rely on rotational or substitution tables.',
    ],
    type: 'decoder',
    clueContent: {
      label: 'TRANSMISSION LOG',
      body: 'TRANSMISSION LOG RECOVERED FROM RELAY #04\nSTATUS: ENCRYPTED CARRIER\nCheck downloaded artifact last_transmission.txt for full authenticated record.',
      format: 'code',
    },
    stone: 'space',
    points: 125,
    author: 'Doomsday Command',
    artifactFilename: 'last_transmission.txt',
    artifactUrl: '/files/a6f93fe5d64f379ae0a581099b7c36fd/last_transmission.txt',
  },
  {
    id: 'wv-02',
    ctfdId: 2,
    code: 'E-02',
    title: 'Dust in the Lens',
    category: 'forensics',
    universe: 'webverse',
    difficulty: 'easy',
    description: 'Inspect the recovered field-camera frame and recover the relay response preserved by the acquisition process.',
    narrative: 'Surveillance cameras over the breach caught an anomalous optical artifact. Hidden data lies embedded in the raster structure.',
    nextChallengeId: 'wv-03',
    portalType: 'hidden-pixel',
    portalPuzzle: {
      type: 'hidden-pixel',
      title: 'Raster Artifact Analysis',
      icon: '👁️',
      description: 'An optical anomaly was detected in Sector 02. Locate the channel anomaly.',
      clue: 'Field sensor confirms: Least significant bits in alpha or color planes preserve metadata.',
      puzzleAnswer: 'PIXEL',
    },
    hints: [
      'Inspect image metadata, chunks, and hidden channels.',
      'Check for embedded strings or zlib-compressed chunks in dust_in_lens.png.',
    ],
    type: 'forensics',
    clueContent: {
      label: 'OPTICAL FRAME BUFFER',
      body: 'ACQUISITION METADATA:\nResolution: Sensor capture\nFormat: PNG\nEmbedded payload detected in carrier plane.',
      format: 'image',
    },
    stone: 'mind',
    points: 125,
    author: 'Surveillance Ops',
    artifactFilename: 'dust_in_lens.png',
    artifactUrl: '/files/f71237e5a7c7265923bc236962792163/dust_in_lens.png',
  },
  {
    id: 'wv-03',
    ctfdId: 3,
    code: 'E-03',
    title: 'Ashfall Archive',
    category: 'osint',
    universe: 'webverse',
    difficulty: 'easy',
    description: 'Correlate the supplied offline incident records to identify the final response left by the emergency coordinator.',
    narrative: 'A collection of declassified logs, dispatch transcripts, and personnel filings survived the atmospheric burn.',
    nextChallengeId: 'wv-04',
    portalType: 'document-rabbit',
    portalPuzzle: {
      type: 'document-rabbit',
      title: 'Incident Correlation',
      icon: '📂',
      description: 'Correlate timestamp entries to identify the active operative callsign.',
      clue: 'DISPATCH REF: INCIDENT ASHFALL-19 // LEAD OFFICER: VANGUARD',
      puzzleAnswer: 'VANGUARD',
    },
    hints: [
      'Unpack ashfall_archive.zip and examine document metadata and cross-references.',
      'Look for coordinator notes and anomalies across the timeline.',
    ],
    type: 'decoder',
    clueContent: {
      label: 'ARCHIVE MANIFEST',
      body: 'ASHFALL ARCHIVE (ZIP):\n├── incident_report_01.txt\n├── dispatch_log_aug.txt\n├── personnel_records.csv\n└── final_note.txt',
      format: 'code',
    },
    stone: 'reality',
    points: 150,
    author: 'Archives Division',
    artifactFilename: 'ashfall_archive.zip',
    artifactUrl: '/files/6967bf64bdeed19790c25d8b0a78e6d1/ashfall_archive.zip',
  },
  {
    id: 'wv-04',
    ctfdId: 4,
    code: 'E-04',
    title: 'Protocol Primer',
    category: 'misc',
    universe: 'webverse',
    difficulty: 'easy',
    description: 'Decode the supplied transport-format check and submit the recovered response in the event flag format.',
    narrative: 'A raw data packet from the Doomsday Gateway was captured before complete synchronization.',
    nextChallengeId: null,
    portalType: 'signal',
    portalPuzzle: {
      type: 'signal',
      title: 'Transport Layer Decode',
      icon: '📡',
      description: 'A multi-layer encoding stream detected. Identify the base encoding.',
      clue: 'STREAM: BASE64 -> HEX -> ASCII. PROTOCOL: PRIMER',
      puzzleAnswer: 'PRIMER',
    },
    hints: [
      'Identify encoding layers: Base64, Hexadecimal, Rotational.',
      'Inspect and reverse each encoding layer sequentially with standard decoding utilities.',
    ],
    type: 'decoder',
    clueContent: {
      label: 'ENCODED STREAM',
      body: 'Download protocol_primer.txt to view the raw transport-format payload.',
      format: 'code',
    },
    stone: 'power',
    points: 150,
    author: 'Gateway Control',
    artifactFilename: 'protocol_primer.txt',
    artifactUrl: '/files/942acad1082ce0fd550b24cd39e88f9d/protocol_primer.txt',
  },
]

// ── SECTOR 2: OSINTVERSE (Medium / Breach Protocol) ───────────
const osintverseChallenges: ChallengeData[] = [
  {
    id: 'os-01',
    ctfdId: 5,
    code: 'M-01',
    title: 'Rift Capture',
    category: 'forensics',
    universe: 'osintverse',
    difficulty: 'moderate',
    description: 'Reconstruct the final response from ordered synthetic DNS requests in the supplied packet capture.',
    narrative: 'A deep space network capture intercepted covert exfiltration across DNS query channels.',
    nextChallengeId: 'os-02',
    portalType: 'packet',
    portalPuzzle: {
      type: 'packet',
      title: 'DNS Tunnel Inspector',
      icon: '🌐',
      description: 'Identify the exfiltration domain queried in the capture.',
      clue: 'PCAP FILTER: dns.flags.response == 0 // DOMAIN: rift.multiverse.void',
      puzzleAnswer: 'rift',
    },
    hints: [
      'Filter for DNS requests in Wireshark or tshark.',
      'Order queries by transaction ID or sequence and reconstruct subdomains.',
    ],
    type: 'pcap',
    clueContent: {
      label: 'PACKET CAPTURE STATS',
      body: 'PCAP: rift_capture.pcap\nProtocols: Ethernet -> IP -> UDP -> DNS\nPayload: Synthetic serialized query stream',
      format: 'code',
    },
    stone: 'time',
    points: 225,
    author: 'Network Intel',
    artifactFilename: 'rift_capture.pcap',
    artifactUrl: '/files/72103b402db92a94b3a6e04100476010/rift_capture.pcap',
  },
  {
    id: 'os-02',
    ctfdId: 6,
    code: 'M-02',
    title: 'Quarantine Cipher',
    category: 'crypto',
    universe: 'osintverse',
    difficulty: 'moderate',
    description: 'Recover the station key from the supplied directives, undo the stated cipher, and decode the response.',
    narrative: 'Containment Zone 4 locked down under biological quarantine. The override cipher key was fragmented across directives.',
    nextChallengeId: 'os-03',
    portalType: 'cipher-loop',
    portalPuzzle: {
      type: 'cipher-loop',
      title: 'Quarantine Station Key',
      icon: '☣️',
      description: 'Enter the station identifier mentioned in quarantine protocols.',
      clue: 'STATION IDENTIFIER: OUTPOST-4',
      puzzleAnswer: 'OUTPOST-4',
    },
    hints: [
      'Read quarantine_cipher.txt carefully for mathematical directives and key derivation rules.',
      'Undo the modular or Vigenere transformation using the recovered key.',
    ],
    type: 'decoder',
    clueContent: {
      label: 'QUARANTINE DIRECTIVE',
      body: 'Check downloaded artifact quarantine_cipher.txt for mathematical constraints.',
      format: 'code',
    },
    stone: 'soul',
    points: 225,
    author: 'Quarantine Authority',
    artifactFilename: 'quarantine_cipher.txt',
    artifactUrl: '/files/783ca331a93b791f4b32ec462e3b3aa2/quarantine_cipher.txt',
  },
  {
    id: 'os-03',
    ctfdId: 7,
    code: 'M-03',
    title: 'Frozen Build',
    category: 'reverse',
    universe: 'osintverse',
    difficulty: 'moderate',
    description: 'Analyze the surviving console build, recover its intended access phrase, and submit the response it reveals.',
    narrative: 'A cryogenic terminal binary was recovered from the sub-zero server room. Reverse its validation logic.',
    nextChallengeId: 'os-04',
    portalType: 'reverse-loop',
    portalPuzzle: {
      type: 'reverse-loop',
      title: 'Decompilation Check',
      icon: '❄️',
      description: 'Locate the entry subroutine in the PE32 binary.',
      clue: 'ENTRYPOINT: main() -> check_passphrase()',
      puzzleAnswer: 'check_passphrase',
    },
    hints: [
      'Use Ghidra, IDA, or strings to analyze frozen_build.exe.',
      'Check string comparisons or XOR loops against the user passphrase.',
    ],
    type: 'reverse',
    clueContent: {
      label: 'BINARY HEADER',
      body: 'FILE: frozen_build.exe\nFORMAT: PE32 executable (console) Intel 80386\nSTRIPPED: partial',
      format: 'terminal',
    },
    stone: 'space',
    points: 250,
    author: 'Cryo Security',
    artifactFilename: 'frozen_build.exe',
    artifactUrl: '/files/eb73e15a165311836b17a2b0a1646412/frozen_build.exe',
  },
  {
    id: 'os-04',
    ctfdId: 8,
    code: 'M-04',
    title: 'Containment Console',
    category: 'web',
    universe: 'osintverse',
    difficulty: 'moderate',
    description: 'Analyze the authorized functionality of the assigned synthetic containment console and recover the incident response code.',
    narrative: 'A containment-console incident has sealed a synthetic research zone. Access the live target, probe its API, and recover the sealed response.',
    nextChallengeId: 'os-05',
    portalType: 'pwn-terminal',
    portalPuzzle: {
      type: 'pwn-terminal',
      title: 'Target Endpoint Discovery',
      icon: '🚨',
      description: 'Which endpoint lists all active public incident records?',
      clue: 'TARGET API ROOT: /api/incidents',
      puzzleAnswer: '/api/incidents',
    },
    hints: [
      'Visit http://localhost:8081/api/incidents to view public incident reports.',
      'Inspect incident #7 (containment-core) and test legacy export formatting options.',
    ],
    type: 'web',
    clueContent: {
      label: 'LIVE TARGET STATUS',
      body: 'LIVE TARGET SERVICE: ACTIVE\nURL: http://localhost:8081/api/incidents\nEndpoints:\n  /healthz\n  /api/incidents\n  /api/incidents/<id>',
      format: 'terminal',
    },
    stone: 'mind',
    points: 275,
    author: 'Core Containment Team',
    connectionInfo: 'http://localhost:8081/api/incidents',
  },
  {
    id: 'os-05',
    ctfdId: 9,
    code: 'M-05',
    title: 'Memory Ledger',
    category: 'forensics',
    universe: 'osintverse',
    difficulty: 'moderate',
    description: 'Reconstruct committed records from the supplied synthetic ledger and decode the sealed response.',
    narrative: 'A transaction ledger recorded state transitions during core meltdown. Some transactions were rolled back; find the authentic commit.',
    nextChallengeId: null,
    portalType: 'rabbit-hole',
    portalPuzzle: {
      type: 'rabbit-hole',
      title: 'Ledger Audit Chain',
      icon: '📜',
      description: 'Identify the state classification of the sealed ledger record.',
      clue: 'RECORDS: jsonl log entries // TARGET STATE: committed',
      puzzleAnswer: 'committed',
    },
    hints: [
      'Parse memory_ledger.jsonl with a Python script or jq.',
      'Filter for valid cryptographically signed state records.',
    ],
    type: 'hex',
    clueContent: {
      label: 'LEDGER STREAM',
      body: 'FILE: memory_ledger.jsonl\nTotal records: 500+\nFormat: JSON-Lines append-only stream',
      format: 'code',
    },
    stone: 'reality',
    points: 225,
    author: 'Ledger Audit Group',
    artifactFilename: 'memory_ledger.jsonl',
    artifactUrl: '/files/eeb48cf52b4dd019d72c38522df16362/memory_ledger.jsonl',
  },
]

// ── SECTOR 3: DARKNET (Hard / Doomsday Protocol) ──────────────
const darknetChallenges: ChallengeData[] = [
  {
    id: 'dn-01',
    ctfdId: 10,
    code: 'H-01',
    title: 'Entropy Collapse',
    category: 'crypto',
    universe: 'darknet',
    difficulty: 'hard',
    description: 'Use the documented shared-fault condition in the supplied public values to recover the sealed response.',
    narrative: 'A faulty hardware RNG generated compromised cryptographic keys in the core generator.',
    nextChallengeId: 'dn-02',
    portalType: 'signal',
    portalPuzzle: {
      type: 'signal',
      title: 'Fault Analysis',
      icon: '⚡',
      description: 'What mathematical vulnerability occurs when two RSA moduli share a prime factor?',
      clue: 'VULNERABILITY: Common Modulus / Shared Factor GCD',
      puzzleAnswer: 'GCD',
    },
    hints: [
      'Read entropy_collapse.txt for public moduli and ciphertexts.',
      'Check if pairs of moduli share a common factor using greatest common divisor (GCD).',
    ],
    type: 'decoder',
    clueContent: {
      label: 'PUBLIC PARAMETERS',
      body: 'Check entropy_collapse.txt for public key parameters N, e, and ciphertext C.',
      format: 'code',
    },
    stone: 'power',
    points: 400,
    author: 'Darknet Cryptographers',
    artifactFilename: 'entropy_collapse.txt',
    artifactUrl: '/files/e82f8f0997435817ba222033f795ae97/entropy_collapse.txt',
  },
  {
    id: 'dn-02',
    ctfdId: 11,
    code: 'H-02',
    title: 'Ghost Compiler',
    category: 'reverse',
    universe: 'darknet',
    difficulty: 'hard',
    description: 'Reverse the stripped command-line build or reproduce its validation pipeline to recover the response.',
    narrative: 'A stripped binary compiled with custom optimization flags guards the final security portal.',
    nextChallengeId: 'dn-03',
    portalType: 'reverse-loop',
    portalPuzzle: {
      type: 'reverse-loop',
      title: 'Stripped Binary Decompilation',
      icon: '👻',
      description: 'Identify the hashing algorithm used in the verification check.',
      clue: 'ALGORITHM: Custom Bitwise Pipeline',
      puzzleAnswer: 'PIPELINE',
    },
    hints: [
      'Analyze ghost_compiler.exe using x64dbg, Ghidra, or Radare2.',
      'Locate where input is validated against precomputed hash tables.',
    ],
    type: 'reverse',
    clueContent: {
      label: 'GHOST COMPILER',
      body: 'FILE: ghost_compiler.exe\nSTRIPPED: Yes\nSymbol Table: Null',
      format: 'terminal',
    },
    stone: 'time',
    points: 350,
    author: 'Void Compiler Ops',
    artifactFilename: 'ghost_compiler.exe',
    artifactUrl: '/files/a2cec46d214f6a7c04e5626fe5ddb3c2/ghost_compiler.exe',
  },
  {
    id: 'dn-03',
    ctfdId: 12,
    code: 'H-03',
    title: 'Redline Relay',
    category: 'web',
    universe: 'darknet',
    difficulty: 'hard',
    description: 'Use the supplied source snapshot and sanitized captures to reproduce the relay sealing logic offline.',
    narrative: 'The final redline relay communication service. Reconstruct the signing protocol to seal Doctor Doom\'s defeat.',
    nextChallengeId: null,
    portalType: 'pwn-terminal',
    portalPuzzle: {
      type: 'pwn-terminal',
      title: 'Relay Protocol Signing',
      icon: '🔥',
      description: 'Enter the master relay protocol version.',
      clue: 'REDLINE RELAY V1.0 // HMAC SIGNING PROTOCOL',
      puzzleAnswer: 'HMAC',
    },
    hints: [
      'Unpack redline_relay.zip and examine server source code and network captures.',
      'Identify how relay auth tokens are signed and forged.',
    ],
    type: 'web',
    clueContent: {
      label: 'REDLINE RELAY ARCHIVE',
      body: 'ARCHIVE: redline_relay.zip\nContents: Source code, sanitized traffic captures, signing specifications',
      format: 'code',
    },
    stone: 'soul',
    points: 450,
    author: 'Doctor Doom',
    artifactFilename: 'redline_relay.zip',
    artifactUrl: '/files/155df117dbc61aa25b39367cd8d511db/redline_relay.zip',
  },
]

export const challenges: ChallengeData[] = [
  ...webverseChallenges,
  ...osintverseChallenges,
  ...darknetChallenges,
]
