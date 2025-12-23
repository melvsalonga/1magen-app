"use client";

import React from 'react';

// Using placeholder images for the gallery
const galleryImages = [
  {
    src: "https://placehold.co/600x800/2a2a2a/white?text=Cyberpunk+City",
    alt: "Cyberpunk City",
    span: "row-span-2"
  },
  {
    src: "https://placehold.co/600x400/2a2a2a/white?text=Abstract+Art",
    alt: "Abstract Art",
    span: "row-span-1"
  },
  {
    src: "https://placehold.co/600x600/2a2a2a/white?text=Portrait",
    alt: "Portrait",
    span: "row-span-1"
  },
  {
    src: "https://placehold.co/600x400/2a2a2a/white?text=Landscape",
    alt: "Landscape",
    span: "row-span-1"
  },
  {
    src: "https://placehold.co/600x800/2a2a2a/white?text=Fantasy+Creature",
    alt: "Fantasy Creature",
    span: "row-span-2"
  },
  {
    src: "https://placehold.co/600x600/2a2a2a/white?text=Sci-Fi+Concept",
    alt: "Sci-Fi Concept",
    span: "row-span-1"
  }
];

export default function Gallery() {
  return (
    <section id="gallery" className="py-20 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Made with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">1magen</span>
            </h2>
            <p className="text-gray-400">Discover what&apos;s possible with our AI engine.</p>
          </div>
          <button className="mt-4 md:mt-0 px-6 py-2 border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className={`relative group overflow-hidden rounded-2xl ${image.span}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {image.alt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
