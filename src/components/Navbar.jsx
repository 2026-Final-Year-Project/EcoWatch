'use client'

import Image from 'next/image'
import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className="w-full h-16 flex items-center px-10">

      <div className="flex-1">
            <Link 
             href="/" className="flex items-center hover:opacity-80 transition" aria-label="Go to homepage">
                <Image src="/Area.png" alt="EcoWatch Logo" width={90} height={40} className="object-contain" priority/>
            </Link>
      </div>

      {/* CENTER - Nav Links */}
      <div className="flex-1 flex justify-center items-center space-x-8">
        <Link href="/about" className="text-sm font-medium text-black-700">
          Problem
        </Link>
        <Link href="/solution" className="text-sm font-medium text-black-700">
          Solution
        </Link>
      </div>

      {/* RIGHT - CTA */}
      <div className="flex-1 flex justify-end">
        <Link 
          href="/get-started" className="mt-8 inline-block px-8 py-3 text-white text-base font-medium rounded-md" style={{ backgroundColor: '#485C11' }}>
          Get Started
        </Link>
      </div>

    </nav>
  )
}

export default Navbar