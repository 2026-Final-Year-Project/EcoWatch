'use client'

import Image from 'next/image'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

const Navbar = () => {
  return (
    <nav className="w-full h-16 flex items-center px-4 sm:px-10 bg-[var(--background)] text-[var(--foreground)]">

      <div className="flex-1">
            <Link 
             href="/" className="flex items-center hover:opacity-80 transition" aria-label="Go to homepage">
                <Image src="/Area.png" alt="EcoWatch Logo" width={90} height={40} className="object-contain" priority/>
            </Link>
      </div>

      {/* CENTER - Nav Links */}
      <div className="hidden sm:flex flex-1 justify-center items-center space-x-8">
        <Link href="/#problem" className="text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)]">
          Problem
        </Link>
        <Link href="/#solution" className="text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)]">
          Solution
        </Link>
      </div>

      {/* RIGHT - CTA */}
      <div className="flex-1 flex justify-end items-center gap-3">
        <ThemeToggle />
        <Link 
          href="/monitor" className="hidden sm:inline-block px-6 py-3 text-white text-base font-medium rounded-md" style={{ backgroundColor: '#485C11' }}>
          Get Started
        </Link>
      </div>

    </nav>
  )
}

export default Navbar
