import React from 'react'

export function Button({ asChild, className = '', children, ...props }){
  const Comp = asChild ? 'span' : 'button'
  return <Comp className={`inline-flex items-center justify-center rounded-xl px-3 h-10 text-sm font-medium bg-black text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`} {...props}>{children}</Comp>
}
export default Button