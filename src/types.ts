import { CoreProps } from './classes/core'

export type scalar = boolean | number

export type interp<P> = string | number | ((styles: P, props?: any) => string | number)

export type CssTemplate<P> = [string[], interp<P>[]]

export type RawTemplate = [string[], (string | number)[]]

export type InlineCSS<P> = {
  [I in keyof React.CSSProperties]:
    | React.CSSProperties[I]
    | ((styles: P) => React.CSSProperties[I] | null)
    | InlineCSS<P>
}

export interface StyleClass<P extends Partial<CoreProps>> {
  inline?: InlineCSS<P>
  styles: CssTemplate<P>
  props: {
    [I in keyof Partial<P>]: {
      default?: any
      inherit?: boolean
      extends?: any
      map?: (value: P[I]) => any
    }
  }
}

export type ThemeArgs<T, P> = {
  [TP in keyof T]?: T[TP] | ((prev: T[TP], props?: P) => T[TP])
}

export interface CtyledProps<T, P> {
  styles?: ThemeArgs<T, P>
  inRef?: any
  style?: React.CSSProperties
  className?: string
}

interface CtyledAPI<T, P> {
  styles(newThemeStyles: ThemeArgs<T, P>): CtyledComponent<T, P>
  extend(strings: TemplateStringsArray, ...interps: interp<T>[]): CtyledComponent<T, P>
  extendSheet(
    strings: TemplateStringsArray,
    ...interps: interp<T>[]
  ): CtyledComponent<T, P>
  class<NT>(newclass: StyleClass<NT>): CtyledComponent<T & NT, P>
  attrs<NP>(props: NP): CtyledComponent<T, P & NP>
  displayName: string
}

export type CtyledComponentProps<T, P> = P & CtyledProps<T, P>

export type CtyledComponent<T, P> = ((props: CtyledComponentProps<T, P>) => any) &
  CtyledAPI<T, P>

export type ClassType<P> = new (...args: any[]) => React.Component<P>

export interface Constructor {
  <P, T>(
    Element: React.ComponentType<P>,
    classDef: StyleClass<T>,
    themeProps?: any,
    inlineStyle?: any,
    sheetStyle?: any,
    defaultAttrs?: P
  ): CtyledComponent<T, P>
  <P, T>(
    Element: ClassType<P>,
    classDef: StyleClass<T>,
    themeProps?: any,
    inlineStyle?: any,
    sheetStyle?: any,
    defaultAttrs?: P
  ): CtyledComponent<T, P>
  <P, TTag extends keyof JSX.IntrinsicElements, T>(
    Element: TTag | string,
    classDef: StyleClass<T>,
    themeProps?: any,
    inlineStyle?: any,
    sheetStyle?: any,
    defaultAttrs?: P
  ): CtyledComponent<T, P & JSX.IntrinsicElements[TTag]>
}

export type Constructeds = {
  [TTag in keyof JSX.IntrinsicElements]: CtyledComponent<
    CoreProps,
    JSX.IntrinsicElements[TTag]
  >
}

export interface ConstructorWithCore extends Constructeds {
  <P>(Element: React.ComponentType<P>): CtyledComponent<CoreProps, P>
  <P>(Element: ClassType<P>): CtyledComponent<CoreProps, P>
  <P, TTag extends keyof JSX.IntrinsicElements>(Element: TTag | string): CtyledComponent<
    CoreProps,
    P & JSX.IntrinsicElements[TTag]
  >
}
