"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import ModernImagen from '@/components/ModernImagen';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-5 duration-700">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-300">Next-Gen AI Image Generation</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Turn Your Imagination <br className="hidden md:block" />
          into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Visual Reality</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          Create stunning, high-quality images in seconds with our advanced AI. 
          From photorealistic portraits to abstract art, the only limit is your creativity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
          <Link
            href="/generate"
            className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 flex items-center space-x-2"
          >
            <span>Start Generating</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 rounded-full ring-2 ring-white/50 group-hover:ring-white/80 animate-pulse" />
          </Link>
          <Link
            href="#gallery"
            className="px-8 py-4 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 border border-white/10 transition-colors backdrop-blur-sm"
          >
            View Gallery
          </Link>
        </div>

        {/* Floating UI Elements for Visual Interest - Replaced with Live Component */}
        <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500 text-left">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl p-4 sm:p-8">
                 {/* 
                    We embed the ModernImagen component here to serve as a live preview. 
                    This creates a powerful "Try it now" feel directly on the homepage.
                 */}
                 <ModernImagen />
                 
                 {/* Optional: Add an overlay if you want it to be non-interactive until clicked, 
                     but the user asked for it to be the "Interactive AI interface", so leaving it interactive is better.
                 */}
            </div>
        </div>
      </div>
    </section>
  );
}
