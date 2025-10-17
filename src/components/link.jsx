/**
 * Updated to use React Router's Link component for client-side navigation
 */

import * as Headless from '@headlessui/react'
import React, { forwardRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'

export const Link = forwardRef(function Link(props, ref) {
  const { href, to, ...otherProps } = props
  
  // Use 'to' prop if provided, otherwise use 'href'
  const destination = to || href
  
  // If it's an external link (starts with http/https) or has no destination, use regular anchor
  if (!destination || destination.startsWith('http://') || destination.startsWith('https://') || destination.startsWith('mailto:')) {
    return (
      <Headless.DataInteractive>
        <a {...otherProps} href={destination} ref={ref} />
      </Headless.DataInteractive>
    )
  }
  
  // Use React Router Link for internal navigation
  return (
    <Headless.DataInteractive>
      <RouterLink {...otherProps} to={destination} ref={ref} />
    </Headless.DataInteractive>
  )
})
