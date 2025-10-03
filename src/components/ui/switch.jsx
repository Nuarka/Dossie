import React from 'react'
export function Switch({ checked=false, onCheckedChange=()=>{} }){
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={()=>onCheckedChange(!checked)}
      className={`w-10 h-6 rounded-full transition relative ${checked?'bg-black':'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 ${checked?'left-5':'left-0.5'} w-5 h-5 rounded-full bg-white transition`} />
    </button>
  )
}
export default Switch