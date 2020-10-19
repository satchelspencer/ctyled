import tinycolor, { ColorInput } from 'tinycolor2'
import memoizeOne from 'memoize-one'

type ColorStop = {
  color: ColorInput
  pos: number
}
type ColorOrStop = ColorStop | ColorInput

function isStop(stop: ColorOrStop): stop is ColorStop {
  return (<ColorStop>stop).color !== undefined
}

/* infer color positions, equally spaced on order */
export function getPositions(colorScale: ColorOrStop[]): ColorStop[] {
  let lastLow = 0,
    lowIndex = 0

  const res: ColorStop[] = []

  for (let i = 0; i < colorScale.length; i++) {
    let highIndex = colorScale.length - 1,
      nextHigh = 1
    let stop = colorScale[i]

    if (isStop(stop)) {
      lastLow = stop.pos
      lowIndex = i
      res.push(stop)
    } else {
      for (let j = i + 1; j < colorScale.length; j++) {
        const nextColor = colorScale[j]
        if (isStop(nextColor)) {
          nextHigh = nextColor.pos
          highIndex = j
          break
        }
      }
      const slope = (nextHigh - lastLow) / (highIndex - lowIndex)
      res.push({
        color: stop,
        pos: lastLow + slope * (i - lowIndex),
      })
    }
  }
  return res
}

function interpolateColor(scale: ColorStop[], value: number): string {
  value = Math.min(Math.max(value, 0), 1) //clip value
  /* find which two colors [color, nextColor] the value is between */
  let color, i
  for (i = 0; i < scale.length; i++) {
    color = scale[i]
    if (color.pos <= value && (!scale[i + 1] || scale[i + 1].pos > value)) break
  }
  const nextColor = scale[i + 1]
  if (!nextColor) return color.color

  const dpos = nextColor.pos - color.pos,
    vald = value - color.pos,
    ratio = vald / dpos

  return tinycolor.mix(color.color, nextColor.color, ratio * 100).toHexString()
}

type Interpolator = (v: number, secondary?: boolean) => string

interface ColorPallette {
  fg: string
  bg: string
  bq: string
  interp: Interpolator
}

interface Serial {
  primary?: ColorOrStop[]
  secondary?: ColorOrStop[]
  lum?: number
  contrast?: number
  inverted?: boolean
  nudgecoeff?: number
}

function getColors(
  primary: ColorOrStop[],
  secondary: ColorOrStop[],
  primaryLum: number,
  secondaryLum: number
): ColorPallette {
  const primaryStops = getPositions(primary),
    secondaryStops = getPositions(secondary),
    ffrac = (primaryLum + 1) / 2,
    bfrac = (secondaryLum + 1) / 2,
    diff = bfrac - ffrac,
    bqContrast = diff * diff * diff * diff * diff //diff^3

  /* try and overshoot bwfrac unless it overflows pass [-.2, 1.2] */
  let bqfrac = bfrac + bqContrast
  /* if overshoot has too little contrast or diff > 0 (d on l) dont do overshoot */
  if (diff > 0 || bqfrac < -0.2 || bqfrac > 1.2) {
    bqfrac = bfrac - bqContrast
  }

  return {
    fg: interpolateColor(primaryStops, ffrac),
    bg: interpolateColor(secondaryStops, bfrac),
    bq: interpolateColor(primaryStops, bqfrac),
    interp: (v, secondary) =>
      interpolateColor(secondary ? secondaryStops : primaryStops, ffrac + (1 - v) * diff),
  }
}

export default class Color {
  private primary?: ColorOrStop[]
  private secondary?: ColorOrStop[]
  private lum?: number
  private contrastVal?: number
  private inverted?: boolean

  fg: string
  bg: string
  bq: string
  interp: Interpolator
  wtf: number

  constructor(
    primary?: ColorOrStop[],
    secondary?: ColorOrStop[],
    lum?: number,
    contrast?: number,
    inverted?: boolean
  ) {
    this.primary = primary || ['black', 'white']
    this.secondary = secondary || this.primary
    this.lum = lum || 0
    this.contrastVal = contrast === undefined ? 0.5 : contrast
    this.inverted = inverted
    this.wtf = 666

    const invcoeff = inverted ? -1 : 1,
      range = this.contrastVal * 2,
      normLum = (this.lum * invcoeff + 1) / 2,
      base = (2 - range) * normLum,
      primaryLum = (-1 + base) * invcoeff,
      secondaryLum = (-1 + base + range) * invcoeff,
      { fg, bq, bg, interp } = getColors(
        this.primary,
        this.secondary,
        primaryLum,
        secondaryLum
      )
    this.fg = fg
    this.bg = bg
    this.bq = bq
    this.interp = interp
  }
  nudge = memoizeOne((diff) => {
    const invcoeff = this.inverted ? -1 : 1,
      scaledDiff = diff * (1 + this.contrastVal * 3)
    let newlum = this.lum + scaledDiff * invcoeff
    if (newlum > 1 || newlum < -1) newlum = this.lum - scaledDiff * invcoeff
    return new Color(
      this.primary,
      this.secondary,
      newlum,
      this.contrastVal,
      this.inverted
    )
  })
  contrast = memoizeOne((diff) => {
    var newcontrast = Math.max(Math.min(this.contrastVal + diff, 1), 0)
    return new Color(this.primary, this.secondary, this.lum, newcontrast, this.inverted)
  })
  invert = memoizeOne(() => {
    return new Color(
      this.primary,
      this.secondary,
      this.lum,
      this.contrastVal,
      !this.inverted
    )
  })
  as = memoizeOne((newPrimary, newSecondary?) => {
    return new Color(newPrimary, newSecondary, this.lum, this.contrastVal, this.inverted)
  })
  toString = memoizeOne(() => {
    return `${this.fg}, ${this.bg}`
  })
  serial = memoizeOne(
    (): Serial => {
      return {
        secondary: this.secondary,
        primary: this.primary,
        lum: this.lum,
        contrast: this.contrastVal,
        inverted: this.inverted,
      }
    }
  )
  unserial = (serial: Serial) => {
    const { secondary, primary, lum, contrast, inverted, nudgecoeff } = serial
    return new Color(secondary, primary, lum, contrast, inverted)
  }
  absLum = memoizeOne((newLum) => {
    return new Color(
      this.secondary,
      this.primary,
      newLum,
      this.contrastVal,
      this.inverted
    )
  })
  absContrast = memoizeOne((newContrast) => {
    return new Color(this.secondary, this.primary, this.lum, newContrast, this.inverted)
  })
}
