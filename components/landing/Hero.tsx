'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0a0a]">
      {/* Elegant Dark Background */}
      <div className="absolute inset-0 -z-10">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        {/* Subtle radial gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-zinc-900/50 via-[#0a0a0a] to-[#0a0a0a]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Premium Headline - Clean, Confident */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-white"
          >
            Automate Your LinkedIn
            <br />
            <span className="text-zinc-400">Growth on Autopilot</span>
          </motion.h1>

          {/* Refined Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl text-zinc-400 mb-16 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Professional AI-powered engagement that builds your presence, generates leads, 
            and grows your network—while you focus on what matters.
          </motion.p>

          {/* Premium CTA Buttons - Solid & Confident */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link href="/login">
              <button className="group px-10 py-4 bg-white hover:bg-zinc-100 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2">
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="px-10 py-4 bg-zinc-800/50 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all duration-200 border border-zinc-700/50">
              Watch Demo
            </button>
          </motion.div>

          {/* Refined Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap justify-center gap-8 text-sm"
          >
            {[
              { text: 'No credit card required' },
              { text: 'Setup in 2 minutes' },
              { text: 'Cancel anytime' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-500 font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Refined Stats - Minimal & Professional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-24 pt-12 border-t border-zinc-800/50"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { value: '10K+', label: 'Comments Posted' },
                { value: '500+', label: 'Active Users' },
                { value: '2M+', label: 'Reach Generated' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-zinc-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
