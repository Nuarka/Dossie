import React from 'react'
export function Label({ className = '', ...props }){
  return <label className={`block font-medium ${className}`} {...props} />
}