// ============================================================
// Avengers: Doomsday CTF — Challenge Registry (v2)
// ============================================================
// Sequential unlock flow. Each challenge declares its successor
// and the type of portal to render on wrong answer.
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
  /** Code/content shown in the portal to be decoded */
  clue: string
  /** The expected puzzle answer (text the user must type) */
  puzzleAnswer: string
  /** Optional context for the puzzle UI */
  data?: Record<string, string | number | string[]>
}

export interface ChallengeData {
  id: string
  title: string
  category: ChallengeCategory
  universe: Universe
  difficulty: 'moderate'
  description: string
  narrative: string
  flag: string
  /** Next challenge ID — defines the sequential chain */
  nextChallengeId: string | null
  /** Type of portal shown on wrong answer */
  portalType: PortalType
  /** The puzzle presented inside the portal page */
  portalPuzzle: PortalPuzzleData
  hints: string[]
  type: ChallengeCategory
  /** Per-challenge clue content (HTML-ish string, page source comment, etc.) */
  clueContent?: {
    label: string
    body: string
    /** If 'image' shows as a placeholder */
    format?: 'code' | 'image' | 'terminal' | 'metadata'
  }
  stone: Stone
  points: number
  author: string
}

// ── WEBVERSE ────────────────────────────────────────────────
const webverseChallenges: ChallengeData[] = [
  {
    id: 'wv-01',
    title: 'The Broken Multiverse',
    category: 'web',
    universe: 'webverse',
    difficulty: 'moderate',
    description: 'SYSTEM ACCESS — Enter the override code to escape the broken multiverse.',
    narrative: 'Thanos has locked you out of the multiverse gateway. Find the override code hidden in the page.',
    flag: 'DOOM{br0k3n_mult1v3rs3}',
    nextChallengeId: 'wv-02',
    portalType: 'hidden-pixel',
    portalPuzzle: {
      type: 'hidden-pixel',
      title: 'Hidden Pixel Portal',
      icon: '⚡',
      description: 'A single black pixel holds the truth. The page is dark — but the pixel is not what it seems.',
      clue: 'The pixel\'s RGB is (13, 37, 50). Convert to hex: 0D2532. That\'s the answer.',
      puzzleAnswer: '0D2532',
    },
    hints: [
      'Check the page source for a comment.',
      'The code format is DOOM-XXXX.',
      'The last four digits are 7342.',
    ],
    type: 'static',
    clueContent: {
      label: '<!-- SOURCE COMMENT -->',
      body: '<!-- DEBUG: override code = DOOM-7342. Don\'t share with anyone. — J.R. -->',
      format: 'code',
    },
    stone: 'mind',
    points: 100,
    author: 'Nick Fury',
  },
  {
    id: 'wv-02',
    title: 'Portal Chain',
    category: 'custom',
    universe: 'webverse',
    difficulty: 'moderate',
    description: 'Navigate the redirect chain to find the hidden return portal.',
    narrative: 'Each wrong turn sends you deeper into the multiverse. The exit is hidden in plain sight.',
    flag: 'DOOM{portal_chain_br0k3n}',
    nextChallengeId: 'wv-03',
    portalType: 'recursive-loop',
    portalPuzzle: {
      type: 'recursive-loop',
      title: 'Recursive Portal',
      icon: '🌀',
      description: 'You\'re caught in a loop. The portal says: "To return, solve the sequence."',
      clue: 'The numbers repeat: 1, 1, 2, 3, 5, 8, 13, 21... Fibonacci. The next number is 34. But you need the SUM of the first 6 terms: 1+1+2+3+5+8 = 20.',
      puzzleAnswer: '20',
    },
    hints: [
      'The portal hints at a number sequence.',
      'The sequence is Fibonacci.',
      'Sum the first 6 Fibonacci numbers.',
    ],
    type: 'custom',
    clueContent: {
      label: 'CHAIN LOG',
      body: '/portal → /portal2 → /portal3 → /portal — RECURSIVE\nSTATUS: 308 Permanent Redirect\nX-Multiverse-Warning: "The exit is the entry."',
      format: 'metadata',
    },
    stone: 'space',
    points: 150,
    author: 'Strange',
  },
  {
    id: 'wv-03',
    title: 'The Auth Matrix',
    category: 'web',
    universe: 'webverse',
    difficulty: 'moderate',
    description: 'Authenticate via a logic puzzle. The password is hidden in the HTTP headers.',
    narrative: 'The Multiverse Gate requires authentication. Decode the header to proceed.',
    flag: 'DOOM{auth_matrix_unlocked}',
    nextChallengeId: null,
    portalType: 'time-based',
    portalPuzzle: {
      type: 'time-based',
      title: 'Time-Based Portal',
      icon: '⏰',
      description: 'The clock ticks. The portal shows the time. The clue is what the time MEANS.',
      clue: 'The time is 18:42. That was the last transmission timestamp. Base64 encode "18:42" to find the answer. → "MTg6NDI="',
      puzzleAnswer: 'MTg6NDI=',
    },
    hints: [
      'Click "Check Response Headers" below.',
      'The X-Auth-Token is base64 encoded.',
      'Decode it to get the password.',
    ],
    type: 'interactive',
    clueContent: {
      label: 'HTTP RESPONSE HEADERS',
      body: 'Content-Type: application/json\nX-Auth-Token: bG9va19zZWNyZXQ=\nServer: Multiverse-Gateway/2.0\nWWW-Authenticate: Bearer realm="multiverse"',
      format: 'metadata',
    },
    stone: 'reality',
    points: 200,
    author: 'Romanoff',
  },
]

// ── OSINTVERSE ──────────────────────────────────────────────
const osintverseChallenges: ChallengeData[] = [
  {
    id: 'os-01',
    title: 'Where Did He Go?',
    category: 'osint',
    universe: 'osintverse',
    difficulty: 'moderate',
    description: 'A signal was intercepted. Coordinates and a timestamp point to a location.',
    narrative: 'An Avenger went dark. Track the last transmission.',
    flag: 'DOOM{where_did_he_go}',
    nextChallengeId: 'os-02',
    portalType: 'osint-redirect',
    portalPuzzle: {
      type: 'osint-redirect',
      title: 'OSINT Redirect',
      icon: '🔍',
      description: 'You\'re redirected through fake social profiles. Find the real one.',
      clue: 'The username on the fake profile is "w1dow_gh0st_1995". The real one drops the suffix. Just "w1dow_gh0st" — but in the format DOOM{...}.',
      puzzleAnswer: 'w1dow_gh0st',
    },
    hints: [
      'The coordinates are 28.6129° N, 77.2295° E.',
      'The timestamp is 18:42.',
      'Search for a monument near those coordinates.',
    ],
    type: 'decoder',
    clueContent: {
      label: 'INTERCEPTED SIGNAL',
      body: 'LAT: 28.6129° N\nLON: 77.2295° E\nTIME: 18:42\nTRANSMISSION: "I was here."\nTARGET: Unknown monument, New Delhi region',
      format: 'code',
    },
    stone: 'power',
    points: 120,
    author: 'Fury',
  },
  {
    id: 'os-02',
    title: 'Social Ghost',
    category: 'osint',
    universe: 'osintverse',
    difficulty: 'moderate',
    description: 'Investigate a fake social media artifact for hidden clues.',
    narrative: 'A post was left behind. Something in the metadata betrays the truth.',
    flag: 'DOOM{s0cial_g0st}',
    nextChallengeId: 'os-03',
    portalType: 'document-rabbit',
    portalPuzzle: {
      type: 'document-rabbit',
      title: 'Document Rabbit Hole',
      icon: '📄',
      description: 'A fake classified document is in front of you. It\'s not the real one.',
      clue: 'The document is redacted with black bars. The hidden text is "AVENGER DOWN". The codename is "s0cial_g0st".',
      puzzleAnswer: 'AVENGER DOWN',
    },
    hints: [
      'Check the post metadata.',
      'Look at the username.',
      'The flag format is DOOM{...}.',
    ],
    type: 'static',
    clueContent: {
      label: 'SOCIAL POST METADATA',
      body: 'USERNAME: @n4t4sh4_r0m4n0ff\nTIMESTAMP: 2026-09-05 03:42:17 UTC\nEXIF: camera=Canon EOS R5, location=REDACTED\nPOST: "Miss you, sis. — N.R."\nHIDDEN FLAG: Look in the EXIF location field.',
      format: 'code',
    },
    stone: 'soul',
    points: 130,
    author: 'Widow',
  },
  {
    id: 'os-03',
    title: 'The Paper Trail',
    category: 'forensics',
    universe: 'osintverse',
    difficulty: 'moderate',
    description: 'A document was recovered. Hidden pixels in the image reveal the answer.',
    narrative: 'An agent left a message inside an image. The pixels say more than they show.',
    flag: 'DOOM{p4per_tr4il}',
    nextChallengeId: null,
    portalType: 'rabbit-hole',
    portalPuzzle: {
      type: 'rabbit-hole',
      title: 'Rabbit Hole',
      icon: '🕳️',
      description: 'You find a fake classified document. "Congratulations!" it says. But the flag is invalid.',
      clue: 'The fake flag is DOOM{f4k3_d0c}. The REAL flag is hidden in the fake document\'s text: "Look at the paper trail — p4per_tr4il".',
      puzzleAnswer: 'p4per_tr4il',
    },
    hints: [
      'The image has been altered.',
      'Look at the least significant bits.',
      'RGB to hex to ASCII.',
    ],
    type: 'forensics',
    clueContent: {
      label: 'IMAGE PIXEL ANALYSIS',
      body: 'IMG: classified-doc.png (1024x1024)\nLSB PLANE:\n  Row 0: 0x44 0x4F 0x4F 0x4D 0x7B 0x70 0x34 0x70\n  Row 1: 0x65 0x72 0x5F 0x74 0x72 0x34 0x69 0x6C\n  Row 2: 0x7D\n\nDecoded: DOOM{p4per_tr4il}',
      format: 'code',
    },
    stone: 'time',
    points: 140,
    author: 'Banner',
  },
]

// ── DARKNET ─────────────────────────────────────────────────
const darknetChallenges: ChallengeData[] = [
  {
    id: 'dn-01',
    title: 'Pixel Whisper',
    category: 'forensics',
    universe: 'darknet',
    difficulty: 'moderate',
    description: 'An image holds a secret. Extract the hidden pixel data.',
    narrative: 'Thanos left a message in the pixels. Look closer.',
    flag: 'DOOM{p1x3l_whist1}',
    nextChallengeId: 'dn-02',
    portalType: 'signal',
    portalPuzzle: {
      type: 'signal',
      title: 'Signal Portal',
      icon: '📡',
      description: 'A waveform pulses before you. Decode the binary signal.',
      clue: 'The signal reads: 01000100 01001111 01001111 01001101 01111011 01110000 00110001 01111000 00110011 01101100 01111111\nThat\'s "DOOM{p1x3l}". Wait — the full flag is "p1x3l_whist1" but you only see the first part here.',
      puzzleAnswer: 'p1x3l',
    },
    hints: [
      'The image is 100x100.',
      'Only a few pixels differ.',
      'Check RGB values.',
    ],
    type: 'forensics',
    clueContent: {
      label: 'PIXEL DATA',
      body: 'IMG: whisper.png (100x100)\nNOTABLE PIXELS:\n  [23,45]  RGB(0, 255, 0)   #00FF00  ← hidden\n  [67,89]  RGB(255, 0, 0)   #FF0000  ← hidden\n  [12,34]  RGB(0, 0, 255)   #0000FF  ← hidden\n\nSEQUENCE: green, red, blue, green, red, blue...\n(Decoding: P1X3L_WH1ST1)',
      format: 'code',
    },
    stone: 'space',
    points: 150,
    author: 'Strange',
  },
  {
    id: 'dn-02',
    title: 'The Cipher Lab',
    category: 'crypto',
    universe: 'darknet',
    difficulty: 'moderate',
    description: 'A multi-step cipher must be decoded: hex → binary → base64.',
    narrative: 'The lab has encoded a message. You must reverse the process.',
    flag: 'DOOM{c1ph3r_l4b}',
    nextChallengeId: 'dn-03',
    portalType: 'cipher-loop',
    portalPuzzle: {
      type: 'cipher-loop',
      title: 'Cipher Loop',
      icon: '🔐',
      description: 'A cipher wheel spins. The encoded text is shown — decode it.',
      clue: 'HEX: 444F4F4D 7B63 3170 6833 725F 6C34 627D\nThat decodes directly to ASCII: DOOM{c1ph3r_l4b}',
      puzzleAnswer: 'DOOM{c1ph3r_l4b}',
    },
    hints: [
      'Start with the hex.',
      'Convert to binary.',
      'Then base64.',
    ],
    type: 'decoder',
    clueContent: {
      label: 'ENCODED MESSAGE',
      body: 'STEP 1: HEX = 444F4F4D7B6331370685F6C345F6C34227D\nSTEP 2: BINARY = 01000100 01001111 01001111 01001101 01111011 01100011 00110001 01110000 01101000 00110011 01110010 01011111 01101100 00110100 01100010 01111101\nSTEP 3: BASE64 = RE9PTXtjMXBoM3JfbDRifQ==\nFINAL: ???',
      format: 'code',
    },
    stone: 'mind',
    points: 160,
    author: 'Banner',
  },
  {
    id: 'dn-03',
    title: 'Hidden Signal',
    category: 'steganography',
    universe: 'darknet',
    difficulty: 'moderate',
    description: 'A steganographic image hides a message in its LSB plane.',
    narrative: 'The signal is buried. Extract the least significant bits.',
    flag: 'DOOM{h1dd3n_s1gn4l}',
    nextChallengeId: 'dn-04',
    portalType: 'signal',
    portalPuzzle: {
      type: 'signal',
      title: 'Signal Portal',
      icon: '📡',
      description: 'A waveform pulses before you. Decode the binary signal.',
      clue: 'The signal reads: 01001000 01001001 01000100 01000100 01000101 01001110 01011111 01010011 01001001 01000111 01001110 01000001 01001100\nThat spells "HIDDEN_SIGNAL".',
      puzzleAnswer: 'HIDDEN_SIGNAL',
    },
    hints: [
      'LSB extraction is needed.',
      'The image has a blue tint.',
      'Use a tool or script.',
    ],
    type: 'forensics',
    clueContent: {
      label: 'LSB EXTRACTION',
      body: 'IMG: signal.png\nLSB EXTRACTED:\n  Channel R, bit 0:\n  01001000 01001001 01000100 01000100 01000101 01001110 01011111 01010011 01001001 01000111 01001110 01000001 01001100\n\nDecoded: HIDDEN_SIGNAL\nFull flag: DOOM{h1dd3n_s1gn4l}',
      format: 'code',
    },
    stone: 'reality',
    points: 170,
    author: 'Romanoff',
  },
  {
    id: 'dn-04',
    title: 'Packet Capture',
    category: 'pcap',
    universe: 'darknet',
    difficulty: 'moderate',
    description: 'Analyze a PCAP file for the hidden flag.',
    narrative: 'The network spoke. Find the packet that contains the truth.',
    flag: 'DOOM{p4ck3t_c4ptur3}',
    nextChallengeId: 'dn-05',
    portalType: 'packet',
    portalPuzzle: {
      type: 'packet',
      title: 'Packet Portal',
      icon: '🌐',
      description: 'A scrolling packet table. One packet holds the answer.',
      clue: 'Packet #42 contains: "GET /flag HTTP/1.1\\nHost: multiverse.darknet\\n\\nDOOM{p4ck3t_c4ptur3}". The packet number is 42.',
      puzzleAnswer: '42',
    },
    hints: [
      'The flag is in an HTTP response.',
      'Look at packet #42.',
      'Check the body.',
    ],
    type: 'pcap',
    clueContent: {
      label: 'PCAP PACKET LIST',
      body: '#  TIMESTAMP       SRC                DST                PROTO  INFO\n1  0.000000        10.0.0.1           10.0.0.42          TCP    SYN\n...\n42 12.345678       10.0.0.42          10.0.0.1           HTTP   GET /flag\n43 12.350000       10.0.0.1           10.0.0.42          HTTP   200 OK\n...\nPACKET #42 BODY: DOOM{p4ck3t_c4ptur3}',
      format: 'code',
    },
    stone: 'power',
    points: 180,
    author: 'Romanoff',
  },
  {
    id: 'dn-05',
    title: 'Android Core',
    category: 'reverse',
    universe: 'darknet',
    difficulty: 'moderate',
    description: 'Reverse engineer a binary to find the secret key.',
    narrative: 'A binary was recovered. It holds a key to the multiverse.',
    flag: 'DOOM{4ndr01d_c0r3}',
    nextChallengeId: 'dn-06',
    portalType: 'reverse-loop',
    portalPuzzle: {
      type: 'reverse-loop',
      title: 'Reverse Loop',
      icon: '⚙️',
      description: 'Disassembly scrolls. Find the function with the key.',
      clue: 'Look for "android_key" in the .rodata section. The key is "4ndr01d_c0r3".',
      puzzleAnswer: '4ndr01d_c0r3',
    },
    hints: [
      'Strings reveal clues.',
      'Look for the flag format.',
      'The key is near the end.',
    ],
    type: 'reverse',
    clueContent: {
      label: 'DISASSEMBLY (.rodata)',
      body: '0x00001234: "multiverse_init_v2"\n0x00001248: "android_core_v3"\n0x00001260: "4ndr01d_c0r3"  ← THE KEY\n0x00001280: "MIND_STONE = ACTIVATED"\n0x000012a0: "doom@multiverse.net"',
      format: 'code',
    },
    stone: 'soul',
    points: 190,
    author: 'Banner',
  },
  {
    id: 'dn-06',
    title: 'Buffer Overflow',
    category: 'pwn',
    universe: 'darknet',
    difficulty: 'moderate',
    description: 'Exploit a format string vulnerability to extract the flag.',
    narrative: 'The system is vulnerable. Overflow it to reveal the truth.',
    flag: 'DOOM{buff3r_0v3rfl0w}',
    nextChallengeId: null,
    portalType: 'pwn-terminal',
    portalPuzzle: {
      type: 'pwn-terminal',
      title: 'Pwn Terminal',
      icon: '💻',
      description: 'A vulnerable terminal. Exploit the format string to leak the flag.',
      clue: 'Type: %x.%x.%x.%x — the output is 0x42 0x4F 0x46 0x46. That\'s "BOFF" in ASCII. The full flag starts with "buff3r_0v3rfl0w".',
      puzzleAnswer: 'BOFF',
    },
    hints: [
      'The program uses printf.',
      'Pass a format string.',
      'Check %x and %s.',
    ],
    type: 'pwn',
    clueContent: {
      label: 'VULNERABLE PROGRAM',
      body: '#include <stdio.h>\nint main(int argc, char *argv[]) {\n  printf(argv[1]);  // VULNERABLE!\n  return 0;\n}\n\nLEAKED MEMORY: 0x42 0x4F 0x46 0x46 = "BOFF"\nFLAG: DOOM{buff3r_0v3rfl0w}',
      format: 'terminal',
    },
    stone: 'time',
    points: 200,
    author: 'Romanoff',
  },
]

export const challenges: ChallengeData[] = [
  ...webverseChallenges,
  ...osintverseChallenges,
  ...darknetChallenges,
]
