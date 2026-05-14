"use client"
import Link from 'next/link'
 
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-space-black px-4">
      <div className="text-center max-w-md">
        <div className="font-mono text-primary text-3xl tracking-[0.3em] uppercase mb-4">404</div>
        <h1 className="font-display text-6xl font-black text-white mb-4">Lost in Space</h1>
        <p className="text-white/50 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" prefetch={false}>
           
          <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded' >Reture to Earth</button>
        </Link>
      </div>
    </div>
  )
}


