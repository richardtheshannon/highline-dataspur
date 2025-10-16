'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="header">
      <Link href="/" className="logo">
        <Image 
          src="/media/20Highline_Logomark_Blooms_RGB.png"
          alt="Highline Adventures Logo"
          width={140}
          height={50}
          style={{ 
            height: '40px',
            width: 'auto',
            objectFit: 'contain'
          }}
          priority
        />
        <span>DataSpur</span>
      </Link>
    </header>
  )
}