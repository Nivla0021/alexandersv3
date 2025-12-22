// components/Carousel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface CarouselProps {
  slides: string[]; // array of image URLs
  width?: number; // optional width for images
  height?: number; // optional height for images
  autoSlideInterval?: number; // optional auto-slide interval in ms
}

export default function Carousel({
  slides,
  width = 1200,
  height = 600,
  autoSlideInterval = 4000,
}: CarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const showSlide = (i: number) => {
    if (carouselRef.current) {
      carouselRef.current.style.transition = "transform 0.5s ease-in-out";
      carouselRef.current.style.transform = `translateX(-${i * 100}%)`;
    }
  };

  const nextSlide = () => {
    let newIndex = index + 1;
    if (newIndex >= slides.length) newIndex = 0;
    setIndex(newIndex);
    showSlide(newIndex);
  };

  const prevSlide = () => {
    let newIndex = index - 1;
    if (newIndex < 0) newIndex = slides.length - 1;
    setIndex(newIndex);
    showSlide(newIndex);
  };

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(interval);
  });

  return (
    <div className="w-full h-auto relative overflow-hidden">
      {/* Slides */}
      <div ref={carouselRef} className="flex w-full">
        {slides.map((src, i) => (
          <div key={i} className="min-w-full">
            <Image
              src={src}
              alt={`Slide ${i + 1}`}
              width={width}
              height={height}
              className="w-full h-auto"
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white text-5xl"
      >
        <Icon icon="iconamoon:arrow-left-2" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white text-5xl"
      >
        <Icon icon="iconamoon:arrow-right-2" />
      </button>
    </div>
  );
}
