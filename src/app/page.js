import React from 'react'
import Navbar from "@/components/Navbar";
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';

const page = () => {
  return (
     <main className="flex flex-col min-h-screen">
      <Navbar />

      <Hero />

      <Footer />
      
      </main>
  )
}

export default page