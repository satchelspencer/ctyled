import tinycolor, { ColorInput } from 'tinycolor2'
import _ from 'lodash'

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
  var res: ColorStop[] = []
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
  value = Math.min(Math.max(value, 0), 1)
  let color, i
  for (i = 0; i < scale.length; i++) {
    color = scale[i]
    if (color.pos <= value && (!scale[i + 1] || scale[i + 1].pos > value)) break
  }
  const nextColor = scale[i + 1]
  if (!nextColor) return color.color
  var dpos = nextColor.pos - color.pos
  var vald = value - color.pos
  var ratio = vald / dpos
  return tinycolor.mix(color.color, nextColor.color, ratio * 100).toHexString()
}

interface ColorPallette {
  fg: string
  bg: string
  fg2: string
  bg2: string
}
const colorCache: { [args: string]: ColorPallette } = {}

interface Serial {
  primary?: ColorOrStop[]
  secondary?: ColorOrStop[]
  lum?: number
  contrast?: number
  inverted?: boolean
  nudgecoeff?: number
  fgGradientContrast?: number
  bgGradientContrast?: number
}

function getColors(
  primary: ColorOrStop[],
  secondary: ColorOrStop[],
  primaryLum: number,
  secondaryLum: number,
  fgGradientContrast: number,
  bgGradientContrast: number
): ColorPallette {
  var x = JSON.stringify(arguments)
  if (colorCache[x]) return colorCache[x]

  const primaryStops = getPositions(primary)
  const secondaryStops = getPositions(secondary)

  var fg = interpolateColor(primaryStops, (primaryLum + 1) / 2)
  var bg = interpolateColor(secondaryStops, (secondaryLum + 1) / 2)
  var fg2 = fg
  var bg2 = bg

  if (fgGradientContrast) {
    var primaryLum2 = primaryLum + fgGradientContrast * (secondaryLum - primaryLum)
    var fgprimary = interpolateColor(primaryStops, (primaryLum2 + 1) / 2)
    var fgsecondary = interpolateColor(secondaryStops, (primaryLum2 + 1) / 2)
    fg2 = tinycolor.mix(fgprimary, fgsecondary, fgGradientContrast * 100).toHexString()
  }

  if (bgGradientContrast) {
    var secondaryLum2 = secondaryLum + bgGradientContrast * (primaryLum - secondaryLum)
    var bgprimary = interpolateColor(primaryStops, (secondaryLum2 + 1) / 2)
    var bgsecondary = interpolateColor(secondaryStops, (secondaryLum2 + 1) / 2)
    bg2 = tinycolor.mix(bgsecondary, bgprimary, bgGradientContrast * 100).toHexString()
  }

  colorCache[x] = { fg, bg, fg2, bg2 }
  return colorCache[x]
}

export default class Color {
  private primary?: ColorOrStop[]
  private secondary?: ColorOrStop[]
  private lum?: number
  private contrastVal?: number
  private inverted?: boolean
  private nudgecoeff?: number
  private fgGradientContrast?: number
  private bgGradientContrast?: number

  fg: string
  bg: string
  fg2: string
  bg2: string

  constructor(
    primary?: ColorOrStop[],
    secondary?: ColorOrStop[],
    lum?: number,
    contrast?: number,
    inverted?: boolean,
    nudgecoeff?: number,
    fgGradientContrast?: number,
    bgGradientContrast?: number
  ) {
    this.primary = primary || ['black', 'white']
    this.secondary = secondary || this.primary
    this.lum = lum || 0
    this.contrastVal = contrast === undefined ? 0.5 : contrast
    this.inverted = inverted
    this.nudgecoeff = nudgecoeff || 1
    this.fgGradientContrast = fgGradientContrast || 0
    this.bgGradientContrast = bgGradientContrast || 0

    const invcoeff = inverted ? -1 : 1
    // var primaryLum = Math.min(contrast + lum * invcoeff, 1) * invcoeff
    // var secondaryLum = Math.max(-contrast + lum * invcoeff, -1) * invcoeff

    const range = this.contrastVal * 2
    const normLum = (this.lum * invcoeff + 1) / 2
    const base = (2 - range) * normLum
    const primaryLum = (-1 + base) * invcoeff
    const secondaryLum = (-1 + base + range) * invcoeff

    var { fg, bg, fg2, bg2 } = getColors(
      this.primary,
      this.secondary,
      primaryLum,
      secondaryLum,
      this.fgGradientContrast,
      this.bgGradientContrast
    )

    if (inverted) {
      var t = fg2
      fg2 = fg
      fg = t
      t = bg2
      bg2 = bg
      bg = t
    }

    this.fg = fg
    this.bg = bg
    this.fg2 = fg2
    this.bg2 = bg2
  }
  nudge = _.memoize(diff => {
    const invcoeff = 1
    const scaledDiff = diff * (1 + this.contrastVal * 3)
    let newlum = this.lum + scaledDiff * this.nudgecoeff * invcoeff
    if (newlum > 1 || newlum < -1)
      newlum = this.lum - scaledDiff * this.nudgecoeff * invcoeff
    return new Color(
      this.primary,
      this.secondary,
      newlum,
      this.contrastVal,
      this.inverted,
      diff >= 0 ? -this.nudgecoeff : this.nudgecoeff,
      this.fgGradientContrast,
      this.bgGradientContrast
    )
  })
  contrast = _.memoize(diff => {
    var newcontrast = Math.max(Math.min(this.contrastVal + diff, 1), 0)
    return new Color(
      this.primary,
      this.secondary,
      this.lum,
      newcontrast,
      this.inverted,
      this.nudgecoeff,
      this.fgGradientContrast,
      this.bgGradientContrast
    )
  })
  invert = _.memoize(() => {
    return new Color(
      this.primary,
      this.secondary,
      this.lum,
      this.contrastVal,
      !this.inverted,
      this.nudgecoeff,
      this.fgGradientContrast,
      this.bgGradientContrast
    )
  })
  as = _.memoize((newPrimary, newSecondary?) => {
    return new Color(
      newPrimary,
      newSecondary,
      this.lum,
      this.contrastVal,
      this.inverted,
      this.nudgecoeff,
      this.fgGradientContrast,
      this.bgGradientContrast
    )
  })
  fgGrad = _.memoize(newfgGradientContrast => {
    return new Color(
      this.secondary,
      this.primary,
      this.lum,
      this.contrastVal,
      this.inverted,
      this.nudgecoeff,
      newfgGradientContrast,
      this.bgGradientContrast
    )
  })
  grad = _.memoize(newbgGradientContrast => {
    return new Color(
      this.secondary,
      this.primary,
      this.lum,
      this.contrastVal,
      this.inverted,
      this.nudgecoeff,
      this.fgGradientContrast,
      newbgGradientContrast
    )
  })
  toString = _.memoize(() => {
    return `${this.fg}, ${this.bg}`
  })
  serialize = _.memoize(
    (): Serial => {
      return {
        secondary: this.secondary,
        primary: this.primary,
        lum: this.lum,
        contrast: this.contrastVal,
        inverted: this.inverted,
        nudgecoeff: this.nudgecoeff,
        fgGradientContrast: this.fgGradientContrast,
        bgGradientContrast: this.bgGradientContrast,
      }
    }
  )
  unserialize(serial: Serial) {
    const {
      secondary,
      primary,
      lum,
      contrast,
      inverted,
      nudgecoeff,
      fgGradientContrast,
      bgGradientContrast,
    } = serial
    return new Color(
      secondary,
      primary,
      lum,
      contrast,
      inverted,
      nudgecoeff,
      fgGradientContrast,
      bgGradientContrast
    )
  }
  absLum = _.memoize(newLum => {
    return new Color(
      this.secondary,
      this.primary,
      newLum,
      this.contrastVal,
      this.inverted,
      this.nudgecoeff,
      this.fgGradientContrast,
      this.bgGradientContrast
    )
  })
  absContrast = _.memoize(newContrast => {
    return new Color(
      this.secondary,
      this.primary,
      this.lum,
      newContrast,
      this.inverted,
      this.nudgecoeff,
      this.fgGradientContrast,
      this.bgGradientContrast
    )
  })
}
