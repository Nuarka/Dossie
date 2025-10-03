import React from 'react'

export const Button = React.forwardRef(({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-black text-white hover:opacity-90',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  }
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6',
    icon: 'h-9 w-9 p-0 inline-flex items-center justify-center'
  }
  return (
    <button ref={ref} className={`rounded-xl transition ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.default} ${className}`} {...props} />
  )
})
Button.displayName = 'Button'