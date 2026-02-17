import { useState, useEffect, useRef, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════════
   FONT DATA — 30 fonts (system + Google Fonts)
   ═══════════════════════════════════════════════════════════════ */
const FONTS = [
  { name: 'Helvetica', css: 'Helvetica, Arial, sans-serif' },
  { name: 'Futura', css: 'Futura, "Century Gothic", sans-serif' },
  { name: 'Garamond', css: 'Garamond, "EB Garamond", serif' },
  { name: 'Times New Roman', css: '"Times New Roman", Times, serif' },
  { name: 'Comic Sans MS', css: '"Comic Sans MS", cursive' },
  { name: 'Papyrus', css: 'Papyrus, fantasy' },
  { name: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { name: 'Impact', css: 'Impact, "Arial Black", sans-serif' },
  { name: 'Roboto', css: '"Roboto", sans-serif' },
  { name: 'Inter', css: '"Inter", sans-serif' },
  { name: 'Poppins', css: '"Poppins", sans-serif' },
  { name: 'Lato', css: '"Lato", sans-serif' },
  { name: 'Open Sans', css: '"Open Sans", sans-serif' },
  { name: 'Playfair Display', css: '"Playfair Display", serif' },
  { name: 'Merriweather', css: '"Merriweather", serif' },
  { name: 'Oswald', css: '"Oswald", sans-serif' },
  { name: 'Bebas Neue', css: '"Bebas Neue", sans-serif' },
  { name: 'Georgia', css: 'Georgia, serif' },
  { name: 'Courier New', css: '"Courier New", Courier, monospace' },
  { name: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  { name: 'Baskerville', css: 'Baskerville, "Libre Baskerville", serif' },
  { name: 'Didot', css: 'Didot, "Playfair Display", serif' },
  { name: 'Rockwell', css: 'Rockwell, "Courier New", serif' },
  { name: 'Cooper Black', css: '"Cooper Black", "Cooper BT", serif' },
  { name: 'Brush Script', css: '"Brush Script MT", "Brush Script", cursive' },
  { name: 'Lobster', css: '"Lobster", cursive' },
  { name: 'Raleway', css: '"Raleway", sans-serif' },
  { name: 'Montserrat', css: '"Montserrat", sans-serif' },
  { name: 'Source Sans Pro', css: '"Source Sans 3", "Source Sans Pro", sans-serif' },
  { name: 'Libre Baskerville', css: '"Libre Baskerville", Baskerville, serif' },
]

/* ═══════════════════════════════════════════════════════════════
   PHRASE POOLS
   ═══════════════════════════════════════════════════════════════ */
const PHRASES_FULL = [
  'Less is more',
  'Form follows function',
  'Good design is invisible',
  'Design is thinking made visual',
  'Simplicity is the ultimate sophistication',
  'The quick brown fox jumps over the lazy dog',
  'Pack my box with five dozen liquor jugs',
  'Sphinx of black quartz judge my vow',
  'Is this Helvetica?',
  'Comic Sans walks into a bar',
  'Kerning matters',
  'Trust the process',
  'Futura looks like the future',
  'This might be Arial',
  'Don\'t use Papyrus',
  'Typography nerds only',
]

const PHRASES_WORD = [
  'Hamburger', 'Constellation', 'Midnight', 'Velocity',
  'Quantum', 'Silhouette', 'Effervescent', 'Wanderlust',
  'Archipelago', 'Kaleidoscope', 'Serendipity', 'Ephemeral',
  'Labyrinth', 'Nocturnal', 'Phosphorescent', 'Crystalline',
]

const PHRASES_LETTER = [
  'Q', 'R', 'g', 'a', 'G', 'M', 'W', 'e', 'S', 'k', 'B', 'f',
]

const TOTAL_ROUNDS = 10

/* ═══════════════════════════════════════════════════════════════
   ROUND TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */
const ROUND_TYPES = {
  normal: { label: null, options: 4, timeLimit: null, pointsMult: 1 },
  single: { label: 'SINGLE LETTER', options: 4, timeLimit: null, pointsMult: 1 },
  word:   { label: 'ONE WORD', options: 4, timeLimit: null, pointsMult: 1 },
  tiny:   { label: 'SMALL TEXT', options: 4, timeLimit: null, pointsMult: 1 },
  speed:  { label: 'SPEED ROUND — 3 SEC!', options: 4, timeLimit: 3, pointsMult: 1.5 },
  bonus:  { label: 'BONUS — 2X POINTS / 50-50', options: 2, timeLimit: null, pointsMult: 2 },
}

function buildRoundSchedule() {
  // Rounds 1-4: always non-speed types (no time pressure)
  const earlyPool = ['normal', 'word', 'single', 'tiny', 'bonus']
  const earlySlots = []
  for (let i = 0; i < 4; i++) {
    const pick = earlyPool[Math.floor(Math.random() * earlyPool.length)]
    earlySlots.push(pick)
  }

  // Rounds 5-9: speed rounds can randomly appear, mixed with other types
  const midPool = ['normal', 'word', 'single', 'tiny', 'speed', 'bonus']
  const midSlots = []
  let hasSpeed = false
  for (let i = 0; i < 5; i++) {
    const pick = midPool[Math.floor(Math.random() * midPool.length)]
    if (pick === 'speed') hasSpeed = true
    midSlots.push(pick)
  }
  // Guarantee at least one speed round in 5-9
  if (!hasSpeed) {
    const idx = Math.floor(Math.random() * 5)
    midSlots[idx] = 'speed'
  }

  // Round 10: always normal (let players finish without pressure)
  return [...earlySlots, ...midSlots, 'normal']
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateOptions(correctFont, count = 4) {
  const wrong = shuffle(FONTS.filter(f => f.name !== correctFont.name)).slice(0, count - 1)
  return shuffle([correctFont, ...wrong])
}

function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem('fontquiz_leaderboard') || '[]')
  } catch { return [] }
}

function saveToLeaderboard(score) {
  const board = getLeaderboard()
  board.push({
    score,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  })
  board.sort((a, b) => b.score - a.score)
  const top10 = board.slice(0, 10)
  localStorage.setItem('fontquiz_leaderboard', JSON.stringify(top10))
  return top10
}

/* ═══════════════════════════════════════════════════════════════
   FUN FACTS GENERATOR
   ═══════════════════════════════════════════════════════════════ */
function generateFunFacts(stats) {
  const facts = []

  const { rounds, correctCount, bestStreak, totalTime } = stats
  const times = rounds.filter(r => r.correct).map(r => r.time)
  const allTimes = rounds.map(r => r.time)
  const wrongFonts = {}
  rounds.filter(r => !r.correct).forEach(r => {
    wrongFonts[r.fontName] = (wrongFonts[r.fontName] || 0) + 1
  })
  const speedRounds = rounds.filter(r => r.roundType === 'speed')
  const speedCorrect = speedRounds.filter(r => r.correct).length
  const firstHalfTimes = rounds.slice(0, 5).filter(r => r.correct).map(r => r.time)
  const secondHalfTimes = rounds.slice(5).filter(r => r.correct).map(r => r.time)
  const lastSecondAnswers = allTimes.filter(t => t > 2 && t < 3).length
  const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100)
  const fastestTime = times.length > 0 ? Math.min(...times) : null
  const comicSansRound = rounds.find(r => r.fontName === 'Comic Sans MS' && r.correct)
  const papyrusRound = rounds.find(r => r.fontName === 'Papyrus' && r.correct)
  const allUnder2 = times.length > 0 && times.every(t => t <= 2)
  const avgTime = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0

  // Speed facts
  if (fastestTime !== null && fastestTime < 1.0) {
    facts.push(`You answered one round in ${fastestTime.toFixed(1)}s. Blink and you'd miss it.`)
  } else if (fastestTime !== null && fastestTime < 2.0) {
    facts.push(`Fastest answer: ${fastestTime.toFixed(1)}s. Your fingers are faster than your doubt.`)
  }

  // Streak facts
  if (bestStreak >= 8) {
    facts.push(`${bestStreak} in a row — are you a font? Because you're on type.`)
  } else if (bestStreak >= 6) {
    facts.push(`${bestStreak} in a row — that's typographic telepathy.`)
  } else if (bestStreak >= 4) {
    facts.push(`A ${bestStreak}-round streak. The fonts feared you.`)
  } else if (bestStreak >= 3) {
    facts.push(`${bestStreak} correct in a row. Momentum was building.`)
  }

  // Nemesis font
  const nemesisEntries = Object.entries(wrongFonts).sort((a, b) => b[1] - a[1])
  if (nemesisEntries.length > 0 && nemesisEntries[0][1] >= 2) {
    const [font, count] = nemesisEntries[0]
    facts.push(`${font} fooled you ${count} times. It's okay, ${font.includes('serif') || font === 'Garamond' || font === 'Georgia' ? 'serifs are sneaky' : 'that one tricks everyone'}.`)
  }

  // Speed round facts
  if (speedCorrect >= 2) {
    facts.push(`${speedCorrect} perfect speed rounds? Your reflexes are illegal.`)
  } else if (speedCorrect === 1) {
    facts.push(`Nailed a speed round. Cool under pressure.`)
  } else if (speedRounds.length > 0 && speedCorrect === 0) {
    facts.push(`Speed rounds got the best of you. They get the best of everyone.`)
  }

  // Consistency
  if (allUnder2) {
    facts.push(`Every correct answer under 2 seconds. You're a font-identifying machine.`)
  } else if (times.length >= 5 && times.every(t => t <= 3)) {
    facts.push(`You never dipped above 3 seconds on correct answers. Cool under pressure.`)
  }

  // Close calls
  if (lastSecondAnswers >= 3) {
    facts.push(`${lastSecondAnswers} answers right at the wire — you love the drama.`)
  }

  // Accuracy
  if (accuracy === 100) {
    facts.push(`100% accuracy. The font police would like to recruit you.`)
  } else if (accuracy >= 90) {
    facts.push(`${accuracy}% accuracy. The font police would be proud.`)
  } else if (accuracy >= 70) {
    facts.push(`${accuracy}% accuracy. Solid eye for type.`)
  } else if (accuracy < 40 && accuracy > 0) {
    facts.push(`${accuracy}% accuracy. Hey, at least you showed up.`)
  }

  // Comic Sans / Papyrus special
  if (comicSansRound) {
    facts.push(`You correctly identified Comic Sans. Respect.`)
  }
  if (papyrusRound) {
    facts.push(`You spotted Papyrus. Avatar's designers are shaking.`)
  }

  // Improvement
  if (firstHalfTimes.length >= 2 && secondHalfTimes.length >= 2) {
    const avgFirst = firstHalfTimes.reduce((a, b) => a + b, 0) / firstHalfTimes.length
    const avgSecond = secondHalfTimes.reduce((a, b) => a + b, 0) / secondHalfTimes.length
    if (avgSecond < avgFirst * 0.7) {
      const pct = Math.round((1 - avgSecond / avgFirst) * 100)
      facts.push(`Your second half was ${pct}% faster. You warmed up nicely.`)
    } else if (avgFirst < avgSecond * 0.7) {
      facts.push(`Started hot, cooled down. The pressure got real.`)
    }
  }

  // Perfect game
  if (correctCount === TOTAL_ROUNDS && avgTime < 2) {
    facts.push(`Perfect score AND fast. You might actually be a font.`)
  }

  // Zero score consolation
  if (correctCount === 0) {
    facts.push(`Zero correct, but you played all 10 rounds. That's commitment.`)
  }

  // Pick 2 unique facts, shuffled
  const shuffled = shuffle(facts)
  return shuffled.slice(0, 2)
}

/* ═══════════════════════════════════════════════════════════════
   SHARE HELPERS
   ═══════════════════════════════════════════════════════════════ */
const SHARE_URL = 'https://guess-the-font-game.vercel.app/'

function getShareText(score, accuracy, bestStreak) {
  const pct = Math.round((accuracy / TOTAL_ROUNDS) * 100)
  const streakStr = bestStreak >= 3 ? ` (${bestStreak}x streak!)` : ''
  return `I scored ${score} points on Guess the Font!${streakStr} ${pct}% accuracy. Can you beat me?\n\n${SHARE_URL}`
}

function shareToTwitter(text) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'width=550,height=420')
}

function shareToLinkedIn(text) {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}&summary=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'width=550,height=500')
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  }
}

/* ═══════════════════════════════════════════════════════════════
   SOUND ENGINE — Web Audio API synthesized retro sounds
   ═══════════════════════════════════════════════════════════════ */
class SoundEngine {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
  }

  _osc(type, freq, start, dur, vol = 0.15) {
    if (!this.ctx || !this.enabled) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(vol, start)
    g.gain.exponentialRampToValueAtTime(0.001, start + dur)
    o.connect(g).connect(this.ctx.destination)
    o.start(start)
    o.stop(start + dur)
  }

  _noise(start, dur, vol = 0.03) {
    if (!this.ctx || !this.enabled) return
    const bufSize = this.ctx.sampleRate * dur
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    const g = this.ctx.createGain()
    src.buffer = buf
    g.gain.setValueAtTime(vol, start)
    g.gain.exponentialRampToValueAtTime(0.001, start + dur)
    src.connect(g).connect(this.ctx.destination)
    src.start(start)
    src.stop(start + dur)
  }

  correct() {
    this.init()
    const t = this.ctx.currentTime
    this._osc('square', 880, t, 0.08, 0.12)
    this._osc('square', 1108, t + 0.08, 0.08, 0.12)
    this._osc('square', 1320, t + 0.16, 0.15, 0.12)
    this._osc('square', 1760, t + 0.24, 0.25, 0.10)
  }

  wrong() {
    this.init()
    const t = this.ctx.currentTime
    this._osc('sawtooth', 180, t, 0.15, 0.12)
    this._osc('sawtooth', 140, t + 0.12, 0.25, 0.12)
    this._noise(t, 0.25, 0.06)
  }

  hover() {
    this.init()
    const t = this.ctx.currentTime
    this._osc('square', 1200, t, 0.03, 0.04)
  }

  select() {
    this.init()
    const t = this.ctx.currentTime
    this._osc('square', 660, t, 0.05, 0.08)
  }

  gameStart() {
    this.init()
    const t = this.ctx.currentTime
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => {
      this._osc('square', f, t + i * 0.1, 0.12, 0.10)
    })
    this._osc('square', 1047, t + 0.4, 0.3, 0.08)
  }

  gameOver() {
    this.init()
    const t = this.ctx.currentTime
    const notes = [523, 659, 784, 659, 784, 1047]
    notes.forEach((f, i) => {
      this._osc('square', f, t + i * 0.12, 0.14, 0.09)
    })
    this._osc('triangle', 1047, t + 0.72, 0.5, 0.07)
  }

  speedWarning() {
    this.init()
    const t = this.ctx.currentTime
    this._osc('square', 440, t, 0.06, 0.10)
    this._osc('square', 440, t + 0.1, 0.06, 0.10)
    this._osc('square', 660, t + 0.2, 0.12, 0.10)
  }

  tick() {
    this.init()
    const t = this.ctx.currentTime
    this._osc('square', 1000, t, 0.02, 0.05)
  }

  timeUp() {
    this.init()
    const t = this.ctx.currentTime
    this._osc('sawtooth', 300, t, 0.1, 0.12)
    this._osc('sawtooth', 200, t + 0.1, 0.3, 0.12)
  }
}

const sound = new SoundEngine()

/* ═══════════════════════════════════════════════════════════════
   CRT EFFECTS COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function CRTOverlay() {
  return (
    <>
      <div className="crt-scanlines" />
      <div className="crt-vignette" />
      <div className="crt-flicker" />
    </>
  )
}

function MonitorBezel({ children }) {
  return (
    <div className="monitor-outer">
      <div className="monitor-bezel">
        <div className="monitor-label">
          <span className="monitor-brand">FONTRON</span>
          <span className="monitor-model">FQ-2000</span>
        </div>
        <div className="monitor-screen">
          <CRTOverlay />
          {children}
        </div>
        <div className="monitor-footer">
          <span className="monitor-credit">
            Made by{' '}
            <a href="https://samakshigoel.com/" target="_blank" rel="noopener noreferrer">
              Sam
            </a>
          </span>
          <div className="monitor-controls">
            <div className="monitor-knob" />
            <div className="monitor-knob" />
            <div className="monitor-led" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   START SCREEN
   ═══════════════════════════════════════════════════════════════ */
function StartScreen({ onStart }) {
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const i = setInterval(() => setBlink(b => !b), 600)
    return () => clearInterval(i)
  }, [])

  const handleStart = () => {
    sound.gameStart()
    setTimeout(onStart, 500)
  }

  return (
    <div className="screen start-screen">
      <div className="crt-title-block">
        <div className="crt-title-line">GUESS</div>
        <div className="crt-title-line accent">THE FONT</div>
      </div>

      <div className="crt-divider" />

      <p className="crt-subtitle">IDENTIFY THE TYPEFACE</p>

      <div className="start-info-block">
        <p>10 ROUNDS / SCORE POINTS / BUILD STREAKS</p>
        <p className="dim">SPEED ROUNDS / BONUS ROUNDS / SINGLE LETTERS</p>
      </div>

      <button
        className="crt-btn crt-btn-primary"
        onClick={handleStart}
        onMouseEnter={() => sound.hover()}
      >
        {blink ? '>' : ' '} START GAME {blink ? '<' : ' '}
      </button>

      <p className="crt-footer dim">
        PRESS START TO BEGIN_<span className={`cursor-blink ${blink ? 'on' : ''}`}>|</span>
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   GAME SCREEN
   ═══════════════════════════════════════════════════════════════ */
function GameScreen({ onFinish }) {
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [currentFont, setCurrentFont] = useState(null)
  const [options, setOptions] = useState([])
  const [phrase, setPhrase] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [showPoints, setShowPoints] = useState(false)
  const [shake, setShake] = useState(false)
  const [roundStartTime, setRoundStartTime] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [roundType, setRoundType] = useState('normal')
  const [speedCountdown, setSpeedCountdown] = useState(null)

  const timerRef = useRef(null)
  const speedTimerRef = useRef(null)
  const usedFonts = useRef([])
  const scoreRef = useRef(0)
  const scheduleRef = useRef(buildRoundSchedule())
  const roundStatsRef = useRef([])
  const bestStreakRef = useRef(0)
  const currentStreakRef = useRef(0)

  const getFontSize = useCallback((type) => {
    switch (type) {
      case 'single': return 'clamp(5rem, 15vw, 10rem)'
      case 'tiny': return 'clamp(0.9rem, 2vw, 1.2rem)'
      default: return null
    }
  }, [])

  const getPhrase = useCallback((type) => {
    switch (type) {
      case 'single': return pickRandom(PHRASES_LETTER)
      case 'word': return pickRandom(PHRASES_WORD)
      default: return pickRandom(PHRASES_FULL)
    }
  }, [])

  const startNewRound = useCallback((roundNum) => {
    const type = scheduleRef.current[roundNum - 1] || 'normal'
    const typeConfig = ROUND_TYPES[type]

    let available = FONTS.filter(f => !usedFonts.current.includes(f.name))
    if (available.length < 4) {
      usedFonts.current = []
      available = [...FONTS]
    }
    const font = pickRandom(available)
    usedFonts.current.push(font.name)

    setRoundType(type)
    setCurrentFont(font)
    setOptions(generateOptions(font, typeConfig.options))
    setPhrase(getPhrase(type))
    setFeedback(null)
    setSelectedAnswer(null)
    setPointsEarned(0)
    setShowPoints(false)
    setShake(false)
    setSpeedCountdown(typeConfig.timeLimit)
    setRoundStartTime(Date.now())
    setTimeElapsed(0)

    if (type === 'speed') {
      sound.speedWarning()
    }
  }, [getPhrase])

  useEffect(() => {
    startNewRound(1)
  }, [startNewRound])

  const finishGame = useCallback(() => {
    const correctCount = roundStatsRef.current.filter(r => r.correct).length
    const totalTime = roundStatsRef.current.reduce((s, r) => s + r.time, 0)
    onFinish({
      score: scoreRef.current,
      rounds: roundStatsRef.current,
      correctCount,
      bestStreak: bestStreakRef.current,
      totalTime,
    })
  }, [onFinish])

  // General timer
  useEffect(() => {
    if (feedback) return
    timerRef.current = setInterval(() => {
      if (roundStartTime) {
        setTimeElapsed(((Date.now() - roundStartTime) / 1000).toFixed(1))
      }
    }, 100)
    return () => clearInterval(timerRef.current)
  }, [roundStartTime, feedback])

  // Speed round countdown
  useEffect(() => {
    if (roundType !== 'speed' || feedback || speedCountdown === null) return
    if (speedCountdown <= 0) {
      // Time's up — record as wrong
      const elapsed = (Date.now() - roundStartTime) / 1000
      roundStatsRef.current.push({
        roundNum: round,
        fontName: currentFont?.name,
        correct: false,
        time: elapsed,
        roundType,
        timedOut: true,
      })
      currentStreakRef.current = 0
      setFeedback('timeout')
      setStreak(0)
      sound.timeUp()
      clearInterval(timerRef.current)

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          finishGame()
        } else {
          setRound(r => r + 1)
          startNewRound(round + 1)
        }
      }, 1800)
      return
    }

    speedTimerRef.current = setTimeout(() => {
      setSpeedCountdown(prev => {
        if (prev <= 1) {
          sound.tick()
          return 0
        }
        sound.tick()
        return prev - 1
      })
    }, 1000)

    return () => clearTimeout(speedTimerRef.current)
  }, [speedCountdown, roundType, feedback, round, startNewRound, currentFont, roundStartTime, finishGame])

  const handleAnswer = (font) => {
    if (feedback) return
    sound.select()
    clearInterval(timerRef.current)
    clearTimeout(speedTimerRef.current)
    const elapsed = (Date.now() - roundStartTime) / 1000
    const typeConfig = ROUND_TYPES[roundType]
    setSelectedAnswer(font.name)

    const isCorrect = font.name === currentFont.name

    // Record round stats
    roundStatsRef.current.push({
      roundNum: round,
      fontName: currentFont.name,
      correct: isCorrect,
      time: elapsed,
      roundType,
      timedOut: false,
    })

    if (isCorrect) {
      let pts = 100
      if (elapsed <= 2) pts += 50
      else if (elapsed <= 5) pts += 25
      const newStreak = streak + 1
      currentStreakRef.current = newStreak
      if (newStreak > bestStreakRef.current) bestStreakRef.current = newStreak
      const multiplier = Math.max(1, newStreak)
      pts = Math.floor(pts * multiplier * typeConfig.pointsMult)
      setStreak(newStreak)
      scoreRef.current += pts
      setScore(scoreRef.current)
      setPointsEarned(pts)
      setShowPoints(true)
      setFeedback('correct')
      sound.correct()
      setTimeout(() => setShowPoints(false), 1400)
    } else {
      currentStreakRef.current = 0
      setStreak(0)
      setFeedback('wrong')
      setShake(true)
      sound.wrong()
      setTimeout(() => setShake(false), 500)
    }

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        finishGame()
      } else {
        setRound(r => r + 1)
        startNewRound(round + 1)
      }
    }, 1800)
  }

  if (!currentFont) return null
  const typeConfig = ROUND_TYPES[roundType]

  return (
    <div className={`screen game-screen ${shake ? 'shake' : ''} ${feedback === 'correct' ? 'flash-correct' : ''} ${feedback === 'wrong' || feedback === 'timeout' ? 'flash-wrong' : ''}`}>

      {showPoints && (
        <div className="floating-points" key={`pts-${round}-${pointsEarned}`}>
          +{pointsEarned}
        </div>
      )}

      {/* HUD */}
      <div className="hud">
        <div className="hud-cell">
          <span className="hud-label">RND</span>
          <span className="hud-value">{round}/{TOTAL_ROUNDS}</span>
        </div>
        <div className="hud-cell">
          <span className="hud-label">SCORE</span>
          <span className="hud-value accent">{score}</span>
        </div>
        <div className={`hud-cell ${streak >= 2 ? 'streak-glow' : ''}`}>
          <span className="hud-label">STREAK</span>
          <span className="hud-value">{streak > 0 ? `${streak}x` : '--'}</span>
        </div>
        <div className="hud-cell">
          <span className="hud-label">TIME</span>
          <span className="hud-value">{timeElapsed}s</span>
        </div>
      </div>

      {/* Round type label */}
      {typeConfig.label && (
        <div className={`round-type-label ${roundType === 'speed' ? 'speed-label' : ''} ${roundType === 'bonus' ? 'bonus-label' : ''}`}>
          [ {typeConfig.label} ]
        </div>
      )}

      {/* Speed countdown */}
      {roundType === 'speed' && speedCountdown !== null && speedCountdown > 0 && !feedback && (
        <div className={`speed-timer ${speedCountdown <= 1 ? 'danger' : ''}`}>
          {speedCountdown}
        </div>
      )}

      {/* Font display */}
      <div className="font-display-area">
        <div className="font-display-label">/// IDENTIFY THIS FONT ///</div>
        <div
          className="font-display"
          style={{
            fontFamily: currentFont.css,
            fontSize: getFontSize(roundType) || undefined,
          }}
        >
          {phrase}
        </div>
      </div>

      {/* Options */}
      <div className={`options-grid ${typeConfig.options === 2 ? 'two-col' : ''}`}>
        {options.map((font, i) => {
          let cls = 'crt-btn option-btn'
          if (feedback) {
            if (font.name === currentFont.name) cls += ' correct-opt'
            else if (font.name === selectedAnswer && feedback === 'wrong') cls += ' wrong-opt'
            else cls += ' dim-opt'
          }
          return (
            <button
              key={`${round}-${i}`}
              className={cls}
              onClick={() => handleAnswer(font)}
              onMouseEnter={() => { if (!feedback) sound.hover() }}
              disabled={!!feedback}
            >
              <span className="opt-key">{String.fromCharCode(65 + i)}</span>
              <span className="opt-name">{font.name}</span>
            </button>
          )
        })}
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <div className={`feedback-overlay ${feedback}`}>
          <div className="feedback-text">
            {feedback === 'correct' ? '>>> CORRECT <<<' : feedback === 'timeout' ? '>>> TIME UP <<<' : '>>> WRONG <<<'}
          </div>
          {(feedback === 'wrong' || feedback === 'timeout') && (
            <div className="feedback-answer">
              ANSWER: {currentFont.name}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCORE SCREEN
   ═══════════════════════════════════════════════════════════════ */
function ScoreScreen({ gameStats, onPlayAgain }) {
  const { score: finalScore, correctCount, bestStreak } = gameStats
  const [displayScore, setDisplayScore] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [currentRank, setCurrentRank] = useState(null)
  const [showBoard, setShowBoard] = useState(false)
  const [showFacts, setShowFacts] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [blink, setBlink] = useState(true)

  const funFacts = useRef(generateFunFacts(gameStats))
  const shareText = useRef(getShareText(finalScore, correctCount, bestStreak))

  useEffect(() => {
    const i = setInterval(() => setBlink(b => !b), 600)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    sound.gameOver()
    const board = saveToLeaderboard(finalScore)
    setLeaderboard(board)
    const rank = board.findIndex(e => e.score === finalScore) + 1
    setCurrentRank(rank)

    if (finalScore === 0) {
      setDisplayScore(0)
      setTimeout(() => setShowFacts(true), 400)
      setTimeout(() => setShowBoard(true), 900)
      setTimeout(() => setShowShare(true), 1300)
      return
    }

    const duration = 2200
    const start = Date.now()
    const step = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.floor(eased * finalScore))
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayScore(finalScore)
        setTimeout(() => setShowFacts(true), 400)
        setTimeout(() => setShowBoard(true), 1200)
        setTimeout(() => setShowShare(true), 1600)
      }
    }
    requestAnimationFrame(step)
  }, [finalScore])

  const handlePlayAgain = () => {
    sound.gameStart()
    setTimeout(onPlayAgain, 500)
  }

  const handleCopy = async () => {
    sound.select()
    await copyToClipboard(shareText.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="screen score-screen">
      <div className="score-header">
        <div className="crt-divider" />
        <p className="game-over-text">GAME OVER</p>
        <div className="crt-divider" />
      </div>

      <div className="final-score-block">
        <p className="final-score-label">FINAL SCORE</p>
        <p className="final-score-number">{displayScore}</p>
        {currentRank && currentRank <= 10 && (
          <p className="rank-tag">[ #{currentRank} ALL-TIME ]</p>
        )}
      </div>

      {/* Fun facts */}
      {showFacts && funFacts.current.length > 0 && (
        <div className="fun-facts-block">
          {funFacts.current.map((fact, i) => (
            <p key={i} className="fun-fact">&gt; {fact}</p>
          ))}
        </div>
      )}

      {/* Share buttons */}
      {showShare && (
        <div className="share-block">
          <p className="share-label">--- SHARE YOUR SCORE ---</p>
          <div className="share-buttons">
            <button
              className="crt-btn share-btn"
              onClick={() => { sound.select(); shareToTwitter(shareText.current) }}
              onMouseEnter={() => sound.hover()}
            >
              X / TWITTER
            </button>
            <button
              className="crt-btn share-btn"
              onClick={() => { sound.select(); shareToLinkedIn(shareText.current) }}
              onMouseEnter={() => sound.hover()}
            >
              LINKEDIN
            </button>
            <button
              className={`crt-btn share-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              onMouseEnter={() => sound.hover()}
            >
              {copied ? 'COPIED!' : 'COPY TEXT'}
            </button>
          </div>
        </div>
      )}

      {showBoard && (
        <div className="leaderboard-block">
          <p className="lb-title">--- HIGH SCORES ---</p>
          <div className="lb-header-row">
            <span className="lb-col-rank">#</span>
            <span className="lb-col-score">SCORE</span>
            <span className="lb-col-date">DATE</span>
          </div>
          {leaderboard.map((entry, i) => (
            <div
              key={i}
              className={`lb-row ${entry.score === finalScore && i === currentRank - 1 ? 'lb-current' : ''}`}
            >
              <span className="lb-col-rank">
                {i === 0 ? '*1' : i === 1 ? '*2' : i === 2 ? '*3' : ` ${i + 1}`}
              </span>
              <span className="lb-col-score">{String(entry.score).padStart(6, '.')}</span>
              <span className="lb-col-date">{entry.date}</span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="dim">NO SCORES YET</p>
          )}
        </div>
      )}

      <button
        className="crt-btn crt-btn-primary"
        onClick={handlePlayAgain}
        onMouseEnter={() => sound.hover()}
      >
        {blink ? '>' : ' '} PLAY AGAIN {blink ? '<' : ' '}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState('start')
  const [gameStats, setGameStats] = useState(null)

  const handleStart = () => setScreen('game')
  const handleFinish = (stats) => {
    setGameStats(stats)
    setScreen('score')
  }
  const handlePlayAgain = () => setScreen('game')

  return (
    <MonitorBezel>
      {screen === 'start' && <StartScreen onStart={handleStart} />}
      {screen === 'game' && <GameScreen key={Date.now()} onFinish={handleFinish} />}
      {screen === 'score' && gameStats && <ScoreScreen gameStats={gameStats} onPlayAgain={handlePlayAgain} />}
    </MonitorBezel>
  )
}
