"use client";

import React from 'react';
import Link from 'next/link';
import { Sparkles, Twitter, Instagram, Github, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">1magen</span>
            </Link>
            <p className="text-gray-400 text-sm mb-6">
              Empowering creators with next-generation AI image generation tools.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">Features</Link></li>
              <li><Link href="#gallery" className="text-gray-400 hover:text-white text-sm transition-colors">Gallery</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</Link></li>
              <li><Link href="/generate" className="text-gray-400 hover:text-white text-sm transition-colors">Generator</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Community</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} 1magen. All rights reserved.
          </p>
          <div className="flex space-x-6">
             {/* Additional bottom links if needed */}
          </div>
        </div>
      </div>
    </footer>
  );
}
