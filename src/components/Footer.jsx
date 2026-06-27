import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0b1107] px-6 md:px-12 py-10 text-[#edf1e6]">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">

        {/* Top */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 px-10 py-12 border-b border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-5">
              Earth Monitoring System
            </p>

            <h2 className="font-serif text-[clamp(3.5rem,8vw,7rem)] tracking-[-0.05em] leading-none">
              EcoWatch
            </h2>
          </div>

          <div className="max-w-sm">
            <p className="text-sm leading-relaxed text-white/45">
              AI-powered satellite surveillance platform for protecting forests,
              ecosystems, and communities.z
            </p>

            <Link
              href="/monitor"
              className="inline-flex mt-7 items-center gap-2 rounded-full bg-[#7db842] text-[#0b1107] px-6 py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:scale-[1.03] transition-transform"
            >
              Launch Platform →
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 px-10 py-10">
          {[
            ['Platform', ['Map', 'Alerts', 'Reports']],
            ['Company', ['About', 'Research', 'Partners']],
            ['Resources', ['API', 'Status', 'Support']],
            ['Contact', ['hello@ecowatch.io', 'Accra, Ghana']],
          ].map(([title, items]) => (
            <div key={title}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-5">
                {title}
              </p>

              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-white/60 hover:text-[#7db842] transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}