import React from 'react'
export function Textarea({ className = '', ...props }){
  return <textarea className={`w-full px-3 py-2 rounded-xl border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-black/10 ${className}`} {...props} />
}