import React from 'react'
export function Badge({ className = '', children }){
  return <span className={`inline-flex items-center h-6 px-2 rounded-lg text-xs font-medium bg-gray-100 ${className}`}>{children}</span>
}
export default Badge