import React from 'react'
import { storiesOf } from '@storybook/react'

import ctyled from '../src'

const Button = ctyled.button.styles({
  bg: true,
  color: c => c.invert()
})

storiesOf('Simple', module).add('Button', () => <Button>ahhhhh</Button>)
