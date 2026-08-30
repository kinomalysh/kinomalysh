export interface SpringOptions {
  damping?: number
  response?: number
}

export interface SpringTarget extends SpringOptions {
  velocity?: number
}

const DECELERATION = 0.998

export function projectMomentum(velocity: number, deceleration = DECELERATION): number {
  return ((velocity / 1000) * deceleration) / (1 - deceleration)
}

export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

export class Spring {
  private value: number
  private velocity = 0
  private target: number
  private damping: number
  private response: number
  private frame = 0
  private last = 0

  constructor(
    initial: number,
    private readonly onChange: (value: number) => void,
    options: SpringOptions = {},
  ) {
    this.value = initial
    this.target = initial
    this.damping = options.damping ?? 1
    this.response = options.response ?? 0.4
  }

  get current(): number {
    return this.value
  }

  get speed(): number {
    return this.velocity
  }

  get isAnimating(): boolean {
    return this.frame !== 0
  }

  set(value: number): void {
    this.stop()
    this.value = value
    this.target = value
    this.velocity = 0
    this.onChange(value)
  }

  // Перехват: продолжаем от текущего экранного значения и сохраняем набранную
  // скорость, иначе на смене цели виден рывок.
  animateTo(target: number, options: SpringTarget = {}): void {
    this.target = target
    if (options.velocity !== undefined) this.velocity = options.velocity
    if (options.damping !== undefined) this.damping = options.damping
    if (options.response !== undefined) this.response = options.response
    if (this.frame === 0) {
      this.last = performance.now()
      this.frame = requestAnimationFrame(this.tick)
    }
  }

  stop(): void {
    if (this.frame !== 0) {
      cancelAnimationFrame(this.frame)
      this.frame = 0
    }
  }

  private tick = (now: number): void => {
    const dt = Math.min((now - this.last) / 1000, 1 / 30)
    this.last = now

    const omega = (2 * Math.PI) / this.response
    const displacement = this.value - this.target
    const acceleration = -omega * omega * displacement - 2 * this.damping * omega * this.velocity

    this.velocity += acceleration * dt
    this.value += this.velocity * dt

    const settled = Math.abs(this.value - this.target) < 0.1 && Math.abs(this.velocity) < 0.1
    if (settled) {
      this.value = this.target
      this.velocity = 0
      this.frame = 0
      this.onChange(this.value)
      return
    }

    this.onChange(this.value)
    this.frame = requestAnimationFrame(this.tick)
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
