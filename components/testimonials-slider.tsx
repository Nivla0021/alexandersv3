"use client";

import { useRef, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { SafeHTML } from "@/lib/safe-html";

interface Testimonial {
  customerName: string;
  message: string;
  rating?: number;
}

export default function TestimonialsSlider({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const list = testimonials.length < 1 ? [] : [...testimonials];

  // Duplicate first 2 items for smooth looping (3-at-a-time window)
  const looped = list.length > 3 ? [...list, ...list.slice(0, 2)] : list;

  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalTime = 5000; // Increased to 5 seconds (slower)
  const isSlider = testimonials.length > 3;

  useEffect(() => {
    if (!isSlider) return;

    const id = setInterval(() => {
      setIsAnimating(true);
      
      // Wait for fade out animation to complete
      setTimeout(() => {
        setIndex((prev) => {
          const next = prev + 1;
          return next >= list.length ? 0 : next;
        });
        
        // Trigger fade in after a small delay
        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      }, 500); // Wait for fade out to complete
    }, intervalTime);

    return () => clearInterval(id);
  }, [isSlider, list.length]);

  const visible = looped.slice(index, index + 3);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#436B48] mb-4">
            What Our Customers Say
          </h2>
        </div>

        {/* grid when <=3, slider when >3 */}
        {!isSlider && (
          <div className="grid md:grid-cols-3 gap-8">
            {list.map((t, i) => (
              <Card key={i} t={t} />
            ))}
          </div>
        )}

        {isSlider && (
          <div className="relative">
            <div 
              className={`grid md:grid-cols-3 gap-8 transition-all duration-700 ${
                isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              {visible.map((t, i) => (
                <Card key={i} t={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="p-6 bg-[#FCFFFB] shadow-[0.9px_1.8px_1.8px_-0.9px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-[1.02] flex flex-col h-full rounded-lg">
      <div className="flex mb-4">
        {[...Array(t.rating ?? 5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
        ))}
      </div>
      <div className="flex-grow text-[#535353] mb-4 italic">
        <SafeHTML 
          html={`${t.message}`} 
          className="text-sm prose prose-sm max-w-none"
        />
      </div>
      <div className="mt-auto pt-4">
        <p className="font-semibold ">- {t.customerName}</p>
      </div>
    </div>
  );
}