import React from 'react'
export function Textarea({ className = '', ...props }){
  return <textarea className={`w-full rounded-xl border p-3 outline-none focus:ring-2 ring-black/20 ${className}`} {...props}/>
}
export default Textarea