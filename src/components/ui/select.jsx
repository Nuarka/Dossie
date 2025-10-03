import React, { useEffect, useRef, useState } from 'react'

export function Select({ value, onValueChange, children }){
  return React.Children.map(children, c => c && React.cloneElement(c, { value, onValueChange }))
}
export function SelectTrigger({ className = '', children, ...props }){
  return <button type="button" className={`h-10 px-3 rounded-xl border inline-flex items-center justify-between w-full ${className}`} {...props}>{children}</button>
}
export function SelectValue({ placeholder }){
  return <span className="text-gray-500">{placeholder}</span>
}
export function SelectContent({ className = '', children }){
  return <div className={`mt-2 rounded-xl border bg-white p-1 shadow ${className}`}>{children}</div>
}
export function SelectItem({ value, children, onClick, onValueChange }){
  function handleClick(){
    onValueChange && onValueChange(value)
    onClick && onClick()
  }
  return <div className="px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer" onMouseDown={e=>e.preventDefault()} onClick={handleClick}>{children}</div>
}