import { css, getScalar, round } from '../util'
import { StyleClass, scalar } from '../types'
import { CoreProps } from './core'

export interface ActiveProps extends CoreProps {
  hover?: scalar
  active?: boolean
}

const active: StyleClass<ActiveProps> = {
  inline: {
    outlineColor: ({ color }) => color.bg,
    cursor: ({ disabled }) => (disabled ? 'inherit' : 'pointer'),
    outlineWidth: ({ size }) => round(size / 5) + 'px',
  },
  //prettier-ignore
  styles: css`
    user-select: none;
    outline-offset: -2px;

    ${({ hover, bg, bgColor }) =>  hover && bg && `
			&:hover{
				background:${bgColor.nudge(-0.15 * getScalar(hover)).bg} !important;
			}
    `} 

    ${({ active, hover, bg, bgColor }) =>  active && bg && `
      background:${bgColor.nudge(-0.15 * getScalar(hover)).bg} !important;
    `} 

    ${({ hover, color, bg }) => hover && `
			&:hover{
				color:${color.nudge((bg?-0.2:0.8) * getScalar(hover)).fg} !important;
			}
    `}
    
    ${({ active, hover, bg, color }) =>  active && `
      color:${color.nudge((bg?-0.2:0.8) * getScalar(hover)).fg} !important;
    `} 
  `,
  props: {
    hover: { default: true },
    active: { default: false },
  },
}

export default active
