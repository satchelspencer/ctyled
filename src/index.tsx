import React, { memo, createContext, useContext, useMemo, SFC, useCallback } from 'react'
import _ from 'lodash'
import { css } from 'react-emotion'
import values from 'object.values'

import { domels, inheritedProps } from './constants'
import * as Types from './types'
import {
  joinTemplates,
  mergeClasses,
  interpolateTemplate,
  cssToInline,
  round,
} from './util'
import Color, { getPositions } from './color'

import core, { CoreProps } from './classes/core'
import active from './classes/active'
import inline from './classes/inline'

const CtyledContext = createContext<{
  theme: { [prop: string]: any }
  pstyle: { [prop: string]: any }
}>({ theme: {}, pstyle: {} })
CtyledContext.displayName = 'CtyledContext'

const ThemeProvider: SFC<{ theme: any }> = ({ theme, ...props }) => (
  <CtyledContext.Provider
    value={{
      theme: theme,
      pstyle: {},
    }}
    {...props}
  />
)

const emptyObj = {},
  emptyArr = [],
  emptySinterp = [[], []]

const constructor: Types.Constructor = <P, T>(
  Element,
  classDef: Types.StyleClass<T>,
  themeProps = emptyObj,
  inlineStyle,
  sheetStyle,
  defaultAttrs: P
) => {
  inlineStyle = inlineStyle || emptySinterp
  sheetStyle = sheetStyle || emptySinterp
  const attrsProps = defaultAttrs ? Object.keys(defaultAttrs || {}) : emptyArr

  const CtyledComponent = memo((props: Types.CtyledComponentProps<T, P>) => {
    const context = useContext(CtyledContext),
      { theme, pstyle } = context,
      { style, styles = emptyObj, inRef, className, ...childProps } = props,
      attrProps = useMemo(
        () => _.pick(props, ...attrsProps),
        attrsProps.map((name) => props[name])
      )

    const getValue = useCallback(
      (propName: string) => {
        const propConfig = classDef.props[propName]
        let defaultFromConfig = propConfig.default

        if (propConfig.extends) {
          const superValue = getValue(propConfig.extends)
          defaultFromConfig = _.isFunction(defaultFromConfig)
            ? defaultFromConfig(superValue)
            : superValue
        }

        const themeValue = propConfig.inherit
            ? theme[propName] || defaultFromConfig
            : defaultFromConfig,
          compValue = styles[propName] || themeProps[propName]

        let finalValue
        if (compValue === undefined) finalValue = themeValue
        else if (compValue === 'inherit')
          finalValue = theme[propName] || defaultFromConfig
        else if (_.isFunction(compValue)) finalValue = compValue(themeValue, attrProps)
        else finalValue = compValue
        return propConfig.map ? propConfig.map(finalValue) : finalValue
      },
      [theme, styles, attrProps]
    )

    const { computedThemeProps, lastChildTheme } = useMemo(() => {
      const computedProps = _.mapValues(classDef.props, (propConfig, propName) =>
        getValue(propName)
      )
      return {
        computedThemeProps: computedProps,
        lastChildTheme: { ...theme, ...computedProps },
      }
    }, [styles, theme, attrProps])

    /* refProps computation */
    const refProps: { ref?: any; inRef?: any } = {}
    if (inRef) {
      if (typeof Element === 'string') refProps.ref = inRef
      else refProps.inRef = inRef
    }

    /* stylesheet computation */
    const stylesClassName = useMemo(() => {
      const [sheetCss, sheetInterpolations] = joinTemplates(classDef.styles, sheetStyle),
        sheetInterpValues = sheetInterpolations.map((interp) => {
          if (typeof interp === 'function')
            return interp(computedThemeProps as T, attrProps)
          else return interp
        }),
        sheetString = interpolateTemplate([sheetCss, sheetInterpValues])
      return css([sheetString, []])
    }, [computedThemeProps, attrProps])

    /* inline style computation */
    const inline = useMemo(() => {
      const classInlineStyles = _.mapValues(classDef.inline, (value) => {
          if (_.isFunction(value)) return value(computedThemeProps as T)
          else return value
        }),
        [inlineCss, interpolations] = inlineStyle,
        interpValues = interpolations.map((interp) => {
          if (_.isFunction(interp)) return interp(computedThemeProps, attrProps)
          else return interp
        }),
        extendedInlineStyles = cssToInline(interpolateTemplate([inlineCss, interpValues]))

      return _.pickBy(
        {
          ...classInlineStyles,
          ...extendedInlineStyles,
          ...((style as object) || {}),
        },
        (val, prop) => !inheritedProps.includes(prop) || pstyle[prop] !== val
      )
    }, [computedThemeProps, attrProps, style, pstyle])

    const childContextValue = useMemo(() => {
      return {
        theme: lastChildTheme,
        pstyle: {
          ...pstyle,
          ..._.pick(inline, inheritedProps),
        },
      }
    }, [lastChildTheme, inline, pstyle])

    const passThoughProps = useMemo(() => _.omit(childProps, ...attrsProps), [
      ...values(childProps),
    ])

    const child = useMemo(() => {
      return (
        <Element
          className={stylesClassName + ' ' + (className || '')}
          style={inline}
          {...passThoughProps}
          {...refProps}
        />
      )
    }, [passThoughProps, stylesClassName, className, inline, refProps])

    return _.isEqual(childContextValue, context) ? (
      child
    ) : (
      <CtyledContext.Provider value={childContextValue}>{child}</CtyledContext.Provider>
    )
  })

  return Object.assign(CtyledComponent, {
    styles: (newThemeProps) =>
      constructor<P, T>(
        Element,
        classDef,
        Object.assign({}, themeProps, newThemeProps),
        inlineStyle,
        sheetStyle,
        defaultAttrs
      ),

    extend: (strings: TemplateStringsArray, ...interps: Types.interp<T>[]) =>
      constructor<P, T>(
        Element,
        classDef,
        themeProps,
        joinTemplates(inlineStyle, [[...strings], interps]),
        sheetStyle,
        defaultAttrs
      ),

    extendInline: (strings: TemplateStringsArray, ...interps: Types.interp<T>[]) =>
      constructor<P, T>(
        Element,
        classDef,
        themeProps,
        joinTemplates(inlineStyle, [[...strings], interps]),
        sheetStyle,
        defaultAttrs
      ),

    extendSheet: (strings: TemplateStringsArray, ...interps: Types.interp<T>[]) =>
      constructor<P, T>(
        Element,
        classDef,
        themeProps,
        inlineStyle,
        joinTemplates([[...strings], interps], sheetStyle),
        defaultAttrs
      ),

    class: <NT extends {}>(newClass: Types.StyleClass<NT>) =>
      constructor<P, T & NT>(
        Element,
        mergeClasses(classDef, newClass),
        themeProps,
        inlineStyle,
        sheetStyle,
        defaultAttrs
      ),

    attrs: <NP extends {}>(newAttrs: NP) =>
      constructor<P & NP, T>(
        Element,
        classDef,
        themeProps,
        inlineStyle,
        sheetStyle,
        Object.assign({}, defaultAttrs, newAttrs)
      ),
    displayName: `Ctyled(${Element.name || Element})`,
  })
}

const coreConstructor = <P extends {}>(el) => {
  return constructor<P, CoreProps>(el, core)
}
domels.forEach((el) => {
  coreConstructor[el] = coreConstructor(el)
  coreConstructor[el].displayName = el
})

export { core, inline, active, ThemeProvider, round, CtyledContext, Color, getPositions }
export default coreConstructor as Types.ConstructorWithCore
