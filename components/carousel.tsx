"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface CarouselProps {
  slides: string[];
  width?: number;
  height?: number;
  autoSlideInterval?: number;
}

export default function Carousel({
  slides,
  width = 1200,
  height = 600,
  autoSlideInterval = 30000,
}: CarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slidesWithClone = [...slides, slides[0]]; // clone first slide for smooth loop
  const totalSlides = slides.length;

  const showSlide = (i: number, withTransition = true) => {
    if (!carouselRef.current) return;
    carouselRef.current.style.transition = withTransition
      ? "transform 0.5s ease-in-out"
      : "none";
    carouselRef.current.style.transform = `translateX(-${i * 100}%)`;
  };

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const newIndex = index + 1;
    setIndex(newIndex);
    showSlide(newIndex);

    // Reset instantly if we're at the clone
    if (newIndex === totalSlides) {
      setTimeout(() => {
        setIsTransitioning(false);
        setIndex(0);
        showSlide(0, false);
      }, 500); // match transition duration
    } else {
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    let newIndex = index - 1;
    if (newIndex < 0) {
      // jump to last clone instantly
      newIndex = totalSlides - 1;
      setIndex(totalSlides);
      showSlide(totalSlides, false);

      setTimeout(() => {
        showSlide(newIndex);
        setIndex(newIndex);
        setTimeout(() => setIsTransitioning(false), 500);
      }, 20);
      return;
    }

    setIndex(newIndex);
    showSlide(newIndex);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(interval);
  });

  return (
    <div className="w-full h-auto relative overflow-hidden rounded-lg">
      {/* Slides */}
      <div ref={carouselRef} className="flex w-full rounded-lg">
        {slidesWithClone.map((src, i) => (
          <div key={i} className="min-w-full rounded-lg">
            <Image
              src={src}
              alt={`Slide ${i + 1}`}
              width={width}
              height={height}
              className="w-full h-auto rounded-lg"
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white text-5xl z-10"
      >
        <Icon icon="iconamoon:arrow-left-2" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white text-5xl z-10"
      >
        <Icon icon="iconamoon:arrow-right-2" />
      </button>
    </div>
  );
}
