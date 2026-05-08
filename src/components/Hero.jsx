'use client'
import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Hero = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Hero — letters drop in one by one
      gsap.from('.hero-title', {
        y: 120,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
      })

      gsap.from('.hero-subtitle', {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: 'power3.out',
      })

      gsap.from('.hero-btn', {
        scale: 0.8,
        opacity: 0,
        duration: 0.7,
        delay: 0.5,
        ease: 'back.out(1.7)',
      })

      // Laptop image — slides up from below
      gsap.from('.laptop-section', {
        y: 100,
        opacity: 0,
        duration: 1.4,
        delay: 0.6,
        ease: 'expo.out',
      })

      // Benefits label — slides in from left on scroll
      gsap.from('.benefits-label', {
        x: -80,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.benefits-label',
          start: 'top 85%',
        },
      })

      // Benefit cards — stagger up on scroll
      gsap.from('.benefit-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.benefit-card',
          start: 'top 85%',
        },
      })

      // Section images — scale in from slightly zoomed
      gsap.utils.toArray('.section-image').forEach((el) => {
        gsap.from(el, {
          scale: 1.08,
          opacity: 0,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
          },
        })
      })

      // Step numbers — count up feel via stagger
      gsap.from('.step-card', {
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.step-card',
          start: 'top 80%',
        },
      })

      // CTA — scale and fade
      gsap.from('.cta-section', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top 85%',
        },
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="w-full min-h-screen flex flex-col items-center justify-start pt-20">

      <h1 className="hero-title text-center font-serif font-light text-[clamp(3rem,10vw,10rem)] leading-none">
        Protect the planet.
      </h1>

      <p className="hero-subtitle text-center text-lg mt-6 max-w-2xl px-3 text-gray-600">
        EcoWatch provides real-time environmental monitoring through satellite imagery and AI, empowering
        NGOs and governments to track illegal mining activities, deforestation, and locate wildfires
      </p>

      <div className="hero-btn mt-8">
        <Link href="/monitor" className="inline-block px-8 py-3 text-white text-base font-medium rounded-md" style={{ backgroundColor: '#4a5e1a' }}>
          Start Monitoring
        </Link>
      </div>

      <div className="laptop-section mt-16 w-full flex justify-center px-4">
        <div className="relative w-full max-w-5xl">
          <div className="absolute bottom-0 rounded-3xl" style={{ backgroundColor: '#8a9e6e', height: '75%', left: '-5%', right: '-5%' }} />
          <div className="relative flex justify-center">
            <Image src="/lpadImage1.png" alt="Eco monitoring dashboard on laptop" width={900} height={560} className="object-contain w-full max-w-3xl drop-shadow-2xl" priority />
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div id="problem" className="w-full max-w-6xl px-6 mt-24 scroll-mt-24">
        <p className="benefits-label text-sm font-mono tracking-widest mb-10" style={{ color: '#4a5e1a' }}>Benefits</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: '/Cable-icon.png', title: 'Satellite Intelligence', desc: 'Sub 5-meter resolution imagery updated every five days from open source satellites.' },
            { icon: '/Earth-icon.png', title: 'Nation-wide coverage', desc: 'Monitoring every square meter of the country, including remote forests and regions.' },
            { icon: '/Account-icon.png', title: 'Automated Alerts', desc: 'Notification system triggers illegal mining, deforestation or wildfires are detected' },
            { icon: '/Chart-icon.png', title: 'Real-time analytics', desc: 'Live data processing provides actionable insights within seconds of satellite transmission' },
          ].map((item, i) => (
            <div key={i} className="benefit-card flex flex-col gap-4">
              <div className="w-full border-t border-gray-200" />
              <div className="mt-2">
                <Image src={item.icon} alt={item.title} width={24} height={24} className="object-contain" />
              </div>
              <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="section-image mt-16 w-full rounded-3xl overflow-hidden" style={{ height: '480px' }}>
          <Image src="/HeroImage.png" alt="Aerial landscape view" width={1200} height={480} className="object-cover w-full h-full" />
        </div>
      </div>

      {/* How it works */}
      <div id="solution" className="w-full max-w-6xl px-6 mt-32 scroll-mt-24">
        <h2 className="text-4xl font-serif font-light text-gray-900 mb-16">How it works</h2>
        <div className="w-full border-t border-gray-200 mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          {[
            { number: '01', title: 'Setup', desc: "With our intuitive setup, you're up and running in minutes." },
            { number: '02', title: 'Monitor', desc: 'Receive continuous orbital updates and AI-processed intelligence 24/7' },
            { number: '03', title: 'Act', desc: 'Deploy resources with precision based on verified, real-time ground intelligence' },
          ].map((step, i) => (
            <div key={i} className="step-card flex flex-col gap-6">
              <span className="text-7xl font-light leading-none" style={{ color: '#c8c8c8' }}>{step.number}</span>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="section-image mt-16 w-full rounded-3xl overflow-hidden" style={{ height: '480px' }}>
          <Image src="/image.png" alt="Aerial landscape view" width={1200} height={480} className="object-cover w-full h-full" />
        </div>
      </div>

      {/* CTA */}
      <div id="get-started" className="cta-section w-full mt-32 border-t border-b border-gray-200 py-20 flex flex-col items-center gap-8 scroll-mt-24">
        <h2 className="text-5xl font-serif font-light text-gray-900">Get started here</h2>
        <Link href="/monitor" className="w-full max-w-xl text-center py-4 text-white text-sm font-medium rounded-full" style={{ backgroundColor: '#4a5e1a' }}>
          Get started ↗
        </Link>
      </div>

    </div>
  )
}

export default Hero