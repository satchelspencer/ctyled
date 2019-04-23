import { CSSProperties } from 'react'
import _ from 'lodash'

export { injectGlobal } from 'react-emotion'

import { interp, CssTemplate, StyleClass, RawTemplate } from './types'

export const css = <P>(
  strings: TemplateStringsArray,
  ...interps: interp<P>[]
): CssTemplate<P> => {
  return [[...strings], interps]
}

export const cssToInline = (css: string): CSSProperties => {
  if (typeof css !== 'string') return {}
  const rules = css.replace(/\s+/g, ' ').split(/;/)
  rules.pop()

  return rules.reduce((styles, rule) => {
    const [name, value] = rule.split(':')
    return { ...styles, [_.camelCase(name)]: (value || '').trim() }
  }, {})
}

export function round(value: number) {
  return Math.round(value * 10) / 10
}

export function getScalar(value) {
  if (value === true) return 1
  else if (value === false) return 0
  else return round(parseFloat(value))
}

export function joinTemplates<P, NP>(
  A: CssTemplate<P>,
  B: CssTemplate<NP>
): CssTemplate<P & NP> {
  const ABody = A[0].slice(0, A[0].length - 1),
    AEnd = A[0][A[0].length - 1] === undefined ? '' : A[0][A[0].length - 1],
    BStart = B[0][0] === undefined ? '' : B[0][0],
    BBody = B[0].slice(1)

  return [[...ABody, AEnd + BStart, ...BBody], [...A[1], ...B[1]]]
}

export function interpolateTemplate(rawTemplate: RawTemplate): string {
  const [strings, values] = rawTemplate
  return strings
    .map((chunk, i) => {
      return values[i - 1] ? values[i - 1] + chunk : chunk
    })
    .join('')
}

export function mergeClasses<T, NT>(
  A: StyleClass<T>,
  B: StyleClass<NT>
): StyleClass<T & NT> {
  return {
    styles: joinTemplates(A.styles, B.styles),
    props: Object.assign({}, A.props, B.props),
    inline: Object.assign({}, A.inline || {}, B.inline || {}),
  } as StyleClass<T & NT>
}
