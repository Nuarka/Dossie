import React from 'react'
export function Input({ className = '', ...props }){
  return <input className={`h-10 w-full rounded-xl border px-3 outline-none focus:ring-2 ring-black/20 ${className}`} {...props}/>
}
export default Input