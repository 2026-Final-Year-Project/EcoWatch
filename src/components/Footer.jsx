import React from 'react'
import Image from 'next/image'

const Footer = () => {
  return (
    <footer className="w-full h-16 flex items-center px-10">
      <div className="flex-1">
        <Image src="/Logo1.png" alt="EcoWatch Logo" width={31.75} height={90} className="object-contain" priority/>
      </div>
      <div className="flex-1 flex justify-end text-sm" style={{ color: '#485C11' }}>
        &copy; {new Date().getFullYear()} EcoWatch. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer