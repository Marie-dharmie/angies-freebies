import { content, type FriendDef } from '../content'

export class Hud {
  private intro = document.getElementById('intro-screen')!
  private title = document.getElementById('title-screen')!
  private finale = document.getElementById('finale-screen')!
  private hud = document.getElementById('hud')!
  private scoreEl = document.getElementById('score')!
  private streakEl = document.getElementById('streak')!
  private statusEl = document.getElementById('status-chip')!
  private toastEl = document.getElementById('toast')!
  private planetLabel = document.getElementById('planet-label')!
  private messageEl = document.getElementById('finale-message')!
  private lootEl = document.getElementById('finale-loot')!
  private forgottenList = document.getElementById('forgotten-list')!
  private finaleHeading = document.getElementById('finale-heading')!
  private muteBtn = document.getElementById('mute-btn')!
  private introVideo = document.getElementById('intro-video') as HTMLVideoElement
  private introVideoBg = document.getElementById('intro-video-bg') as HTMLVideoElement | null
  private incoming = document.getElementById('incoming')!
  private incomingName = document.getElementById('incoming-name')!
  private bigCalloutEl = document.getElementById('big-callout')!
  private roster = document.getElementById('roster')!
  private flashEl = document.getElementById('screen-flash')!
  private toastTimer = 0
  private planetTimer = 0
  private calloutTimer = 0
  private totalFriends = content.friends.length

  constructor(
    onContinueFromIntro: () => void,
    onStart: () => void,
    onReplay: () => void,
    onMuteToggle: () => boolean,
  ) {
    const playBtn = document.getElementById('intro-play-btn')!

    playBtn.addEventListener('click', () => {
      void this.playIntroVideo()
    })

    this.introVideo.addEventListener('ended', () => {
      playBtn.textContent = 'Replay transmission'
      this.introVideoBg?.pause()
    })
    this.introVideo.addEventListener('play', () => {
      if (!this.introVideoBg) return
      this.introVideoBg.currentTime = this.introVideo.currentTime
      void this.introVideoBg.play().catch(() => {})
    })
    this.introVideo.addEventListener('pause', () => this.introVideoBg?.pause())

    document.getElementById('intro-continue-btn')!.addEventListener('click', () => {
      this.introVideo.pause()
      this.introVideoBg?.pause()
      onContinueFromIntro()
      this.showTitle()
    })
    document.getElementById('start-btn')!.addEventListener('click', onStart)
    document.getElementById('replay-btn')!.addEventListener('click', onReplay)
    this.muteBtn.addEventListener('click', () => {
      const muted = onMuteToggle()
      this.muteBtn.textContent = muted ? 'Muted' : 'Sound'
    })
    this.messageEl.textContent = content.birthdayMessage
    this.showIntro()
  }

  private async playIntroVideo() {
    const playBtn = document.getElementById('intro-play-btn')!
    try {
      this.introVideo.muted = false
      this.introVideo.controls = true
      await this.introVideo.play()
      playBtn.textContent = 'Playing…'
    } catch {
      try {
        this.introVideo.muted = true
        await this.introVideo.play()
        playBtn.textContent = 'Playing (tap video to unmute)'
      } catch {
        playBtn.textContent = 'Use video controls below'
        this.introVideo.controls = true
      }
    }
  }

  showIntro() {
    this.intro.classList.remove('hidden')
    this.title.classList.add('hidden')
    this.finale.classList.add('hidden')
    this.hud.classList.add('hidden')
    const playBtn = document.getElementById('intro-play-btn')!
    playBtn.textContent = 'Play transmission'
    this.introVideo.pause()
    this.introVideo.currentTime = 0
    this.introVideo.controls = true
    if (this.introVideoBg) {
      this.introVideoBg.pause()
      this.introVideoBg.currentTime = 0
    }
  }

  showTitle() {
    this.intro.classList.add('hidden')
    this.title.classList.remove('hidden')
    this.finale.classList.add('hidden')
    this.hud.classList.add('hidden')
  }

  showPlaying() {
    this.intro.classList.add('hidden')
    this.title.classList.add('hidden')
    this.finale.classList.add('hidden')
    this.hud.classList.remove('hidden')
  }

  showFinale(collected: number, forgotten: FriendDef[]) {
    this.intro.classList.add('hidden')
    this.title.classList.add('hidden')
    this.hud.classList.add('hidden')
    this.finale.classList.remove('hidden')

    this.forgottenList.innerHTML = ''
    if (forgotten.length === 0) {
      this.finaleHeading.textContent = 'You got everyone'
      this.lootEl.textContent = `${collected} / ${this.totalFriends} friends, the whole crew.`
    } else {
      this.finaleHeading.textContent = 'Happy birthday, Angelina'
      this.lootEl.textContent = `You picked up ${collected} / ${this.totalFriends}`
      for (const friend of forgotten) {
        const li = document.createElement('li')
        li.textContent = `You forgot to pick ${friend.name}`
        this.forgottenList.append(li)
      }
    }
  }

  setScore(collected: number) {
    this.scoreEl.textContent = `${collected} / ${this.totalFriends}`
  }

  setStreak(n: number) {
    this.streakEl.textContent = String(n)
    const chip = document.getElementById('streak-chip')!
    chip.classList.toggle('hot', n >= 3)
  }

  setStatus(shield: boolean, boosted: boolean) {
    const bits = [`Shield: ${shield ? 'ON' : 'OFF'}`, boosted ? 'Boost' : null].filter(Boolean)
    this.statusEl.textContent = bits.join(' · ')
  }

  showIncoming(name: string) {
    this.incomingName.textContent = name
    this.incoming.classList.remove('hidden')
    this.incoming.style.animation = 'none'
    void this.incoming.offsetWidth
    this.incoming.style.animation = ''
  }

  hideIncoming() {
    this.incoming.classList.add('hidden')
  }

  showBigCallout(name: string) {
    this.bigCalloutEl.textContent = name
    this.bigCalloutEl.classList.remove('hidden')
    this.bigCalloutEl.style.animation = 'none'
    void this.bigCalloutEl.offsetWidth
    this.bigCalloutEl.style.animation = ''
    this.calloutTimer = 1.1
  }

  addToRoster(name: string) {
    const chip = document.createElement('span')
    chip.className = 'roster-chip'
    chip.dataset.name = name
    chip.textContent = name
    this.roster.append(chip)
    this.roster.scrollLeft = this.roster.scrollWidth
  }

  removeFromRoster(name: string) {
    const chip = this.roster.querySelector(`[data-name="${CSS.escape(name)}"]`)
    chip?.remove()
  }

  clearRoster() {
    this.roster.innerHTML = ''
  }

  setFlash(amount: number) {
    this.flashEl.style.opacity = String(Math.min(0.55, amount))
  }

  toast(text: string, ms = 2200) {
    this.toastEl.textContent = text
    this.toastEl.classList.remove('hidden')
    this.toastEl.style.animation = 'none'
    void this.toastEl.offsetWidth
    this.toastEl.style.animation = ''
    this.toastTimer = ms / 1000
  }

  showPlanet(name: string) {
    this.planetLabel.textContent = name
    this.planetLabel.classList.remove('hidden')
    this.planetTimer = 2.2
  }

  update(dt: number) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt
      if (this.toastTimer <= 0) this.toastEl.classList.add('hidden')
    }
    if (this.planetTimer > 0) {
      this.planetTimer -= dt
      if (this.planetTimer <= 0) this.planetLabel.classList.add('hidden')
    }
    if (this.calloutTimer > 0) {
      this.calloutTimer -= dt
      if (this.calloutTimer <= 0) this.bigCalloutEl.classList.add('hidden')
    }
  }
}
