import React from 'react'
export function Switch({ checked, onCheckedChange, id }){
  return (
    <label htmlFor={id} className="inline-flex items-center cursor-pointer select-none">
      <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e)=>onCheckedChange?.(e.target.checked)} />
      <span className={`w-10 h-6 rounded-full transition ${checked ? 'bg-black' : 'bg-gray-300'} relative`}>
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition ${checked ? 'translate-x-4' : ''}`}></span>
      </span>
    </label>
  )
}