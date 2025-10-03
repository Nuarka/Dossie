import React from 'react'
export function Badge({ className = '', variant = 'default', ...props }){
  const variants = {
    default: 'bg-gray-900 text-white',
    secondary: 'bg-gray-200 text-gray-900',
    outline: 'border border-gray-300',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${variants[variant] ?? variants.default} ${className}`} {...props} />
}