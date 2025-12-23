"use client";

import React from 'react';
import { Zap, Layers, Sparkles, Wand2, MonitorSmartphone, Share2 } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: "Ultra-Fast Rendering",
    description: "Generate high-quality images in seconds with our optimized AI models."
  },
  {
    icon: Layers,
    title: "High-Resolution Upscaling",
    description: "Upscale your creations to 4K resolution without losing detail or clarity."
  },
  {
    icon: Wand2,
    title: "Smart Style Presets",
    description: "Choose from dozens of artistic styles or create your own custom presets."
  },
  {
    icon: Sparkles,
    title: "Advanced Prompt Control",
    description: "Fine-tune your images with negative prompts, seeds, and weight adjustments."
  },
  {
    icon: MonitorSmartphone,
    title: "Responsive Interface",
    description: "Create on the go with our fully responsive mobile and tablet interface."
  },
  {
    icon: Share2,
    title: "Instant Sharing",
    description: "Share your masterpieces directly to social media or download them instantly."
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-black relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Unleash Your <span className="text-blue-500">Creative Potential</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to create professional-grade AI art, right at your fingertips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
