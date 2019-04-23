import Color from '../color'
import { getScalar, css, injectGlobal, round } from '../util'

injectGlobal`
	body{
		position:absolute;
		width:100%;
		height:100%;
		margin:0;
		font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
		font-weight:400;
		color:#424242;
		font-size:14px;
  }
  a {
    text-decoration:none;
    color:inherit;
  }
`

import { scalar, StyleClass } from '../types'

type AlignValue = 'stretch' | 'center' | 'flex-start' | 'flex-end'

export interface CoreProps {
  color: Color
  borderColor: Color
  bgColor: Color
  size: number
  width: any
  height: any
  bg: boolean
  border: scalar
  padd: scalar
  column: boolean
  reverse: boolean
  justify:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'stretch'
  flex: string | number
  alignSelf: AlignValue
  align: AlignValue
  gutter: scalar
  lined: scalar
  endLine: boolean
  scroll: boolean
  disabled: boolean
  rounded: scalar
  flatLeft: boolean
  flatRight: boolean
  flatTop: boolean
  flatBottom: boolean
  noselect: boolean
}

const core: StyleClass<CoreProps> = {
  inline: {
    background: ({ bg, bgColor }) => {
      if (bg) {
        if (bgColor.bg === bgColor.bg2) return bgColor.bg
        else return `linear-gradient(${bgColor.bg}, ${bgColor.bg2})`
      } else return undefined
    },
    color: ({ color }) => color.fg,
    fontSize: ({ size }) => round(size) + 'px',
    padding: ({ padd, size }) =>
      padd ? round(size / 2 * getScalar(padd)) + 'px' : undefined,
    flexDirection: ({ column, reverse }) =>
      ((column ? 'column' : 'row') + (reverse ? '-reverse' : '')) as any,
    alignItems: ({ align }) => align,
    justifyContent: ({ justify }) => justify,
    flex: ({ flex }) => flex,
    alignSelf: ({ alignSelf }) => alignSelf,
    overflowX: ({ scroll, column }) => (scroll && !column ? 'scroll' : undefined),
    overflowY: ({ scroll, column }) => (scroll && column ? 'scroll' : undefined),
    pointerEvents: ({ disabled }) => (disabled ? 'none' : undefined),
    opacity: ({ disabled }) => (disabled ? 0.7 : undefined),
    borderRadius: ({ rounded, flatTop, flatLeft, flatRight, flatBottom, size }) => {
      const radius = round(size / 6 * getScalar(rounded))
      return rounded
        ? `
				${flatTop || flatLeft ? 0 : radius}px ${flatTop || flatRight ? 0 : radius}px ${
            flatRight || flatBottom ? 0 : radius
          }px ${flatLeft || flatBottom ? 0 : radius}px
			`
        : 'none'
    },
    width: ({ width, size }) =>
      width && (typeof width === 'string' ? width : round(width * size) + 'px'),
    height: ({ height, size }) =>
      height && (typeof height === 'string' ? height : round(height * size) + 'px'),
    userSelect: ({ noselect }) => (noselect ? 'none' : undefined),
  },
  //prettier-ignore
  styles: css`
    position: relative;
    box-sizing: border-box;
    display: flex;
    background-clip: border-box;

    border: ${({ border, borderColor }) => {
      if (border) return `${getScalar(border)}px solid ${borderColor.fg}`
      else return 'none'
    }};

    ${({ size, gutter, column, reverse, lined }) =>
      gutter &&
      `
			 > :not(:${reverse?'last':'first'}-child) {
        ${
          lined
            ? `padding-${column ? 'top' : 'left'}:${round(size /
                4 *
                getScalar(gutter))}px;`
            : `margin-${column ? 'top' : 'left'}:${round(size /
                4 *
                getScalar(gutter))}px;`
        }
      }
       > :not(:${reverse?'first':'last'}-child) {
        margin-${column ? 'bottom' : 'right'}:${round(size / 4 * getScalar(gutter))}px;
      }
    `} 
    ${({ lined, column, reverse, borderColor }) => lined && `
      > :not(:${reverse?'last':'first'}-child) {
        border-${column ? 'top' : 'left'}:${getScalar(lined)}px solid ${borderColor.fg} !important;
      }
    `}
    
    ${({ lined, endLine, reverse, column, borderColor }) => lined && endLine && `
      > :${!reverse?'last':'first'}-child{
        border-${column ? 'bottom' : 'right'}:${getScalar(lined)}px solid ${borderColor.fg} !important;
      }
    `}
  `,
  props: {
    color: { default: new Color(), inherit: true },
    borderColor: {
      extends: 'color',
      default: color => color.invert().nudge(0.3),
    },
    bgColor: { extends: 'color', default: color => color },
    size: {
      default: 14,
      inherit: true,
    },
    width: {
      default: undefined,
    },
    height: {
      default: undefined,
    },
    bg: { default: false },
    border: { default: undefined },
    padd: { default: undefined },
    column: { default: undefined },
    reverse: { default: undefined },
    justify: { default: 'flex-start' },
    flex: { default: 'none' },
    alignSelf: { default: '' },
    align: { default: 'stretch' },
    gutter: { default: false },
    lined: { default: undefined },
    endLine: { default: undefined },
    scroll: { default: undefined },
    disabled: { default: undefined },
    rounded: { default: undefined },
    flatLeft: { default: undefined },
    flatRight: { default: undefined },
    flatTop: { default: undefined },
    flatBottom: { default: undefined },
    noselect: { default: undefined },
  },
}

export default core
