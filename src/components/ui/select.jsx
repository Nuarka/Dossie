import React, { useState } from 'react'

export function Select({ value, onValueChange, children }){
  const [open, setOpen] = useState(false)
  return <div data-open={open} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)}>{React.Children.map(children, c => React.cloneElement(c, { value, onValueChange }))}</div>
}
export function SelectTrigger({ className = '', children, ...props }){
  return <button type="button" className={`h-10 px-3 rounded-xl border border-gray-300 bg-white text-left w-full ${className}`} {...props}>{children}</button>
}
export function SelectValue({ placeholder }){ return <span>{placeholder}</span> }
export function SelectContent({ className = '', children }){ return <div className={`mt-1 bg-white border rounded-xl p-1 ${className}`}>{children}</div> }
export function SelectItem({ value, children, onClick }){
  return <div onMouseDown={(e)=>e.preventDefault()} onClick={(e)=>onClick?.(e)} data-value={value} className="px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">{children}</div>
}