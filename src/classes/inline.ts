import { getScalar, css, round } from '../util'
import { StyleClass } from '../types'
import { CoreProps } from './core'

export interface InlineProps extends CoreProps {}

const inline: StyleClass<InlineProps> = {
  inline: {
    padding: ({ padd, size }) =>
      padd
        ? `
          ${size / 4 * getScalar(padd)}px
          ${size / 2 * getScalar(padd)}px
        `
        : undefined,
  },
  //prettier-ignore
  styles: css`
    display: inline-flex;

    border: ${({ border, borderColor }) => {
      if (border) return `1px solid ${borderColor.fg}`
      else return 'none'
    }};

    ${({ gutter, column, size }) => gutter && `
			> :not(:first-child) {
        margin-${column ? 'top' : 'left'}:${round(size / 8 * getScalar(gutter))}px;
      }
      > :not(:last-child) {
        margin-${column ? 'bottom' : 'right'}:${round(size / 8 * getScalar(gutter))}px;
      }
    `}
  `,
  props: {
    bg: { default: true },
    rounded: { default: true },
  },
}

export default inline
