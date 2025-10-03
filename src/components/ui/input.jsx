import React from 'react'
export const Input = React.forwardRef(({ className = '', ...props }, ref) => {
  return <input ref={ref} className={`h-10 px-3 rounded-xl border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-black/10 ${className}`} {...props} />
})
Input.displayName = 'Input'