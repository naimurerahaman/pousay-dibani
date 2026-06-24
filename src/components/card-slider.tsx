"use client";

import { Children, useState, type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper/modules";
import type { SwiperOptions } from "swiper/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type CardSliderProps = {
  children: ReactNode;
  /** Slides visible at the smallest width (peek of the next card looks nice). */
  slidesPerView?: number;
  spaceBetween?: number;
  breakpoints?: SwiperOptions["breakpoints"];
  label?: string;
};

/**
 * Reusable horizontal carousel for card-style content. Server-rendered
 * children are passed in and wrapped in SwiperSlides. Navigation and
 * pagination use per-instance refs so multiple sliders on one page never
 * control each other.
 */
export function CardSlider({
  children,
  slidesPerView = 1.15,
  spaceBetween = 18,
  breakpoints,
  label = "items",
}: CardSliderProps) {
  const slides = Children.toArray(children);
  // Callback-ref state so Swiper binds to these exact elements (per instance)
  // without reading refs during render or spawning default arrows.
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const [dotsEl, setDotsEl] = useState<HTMLDivElement | null>(null);

  return (
    <div className="card-slider">
      <Swiper
        className="card-slider__track"
        modules={[Navigation, Pagination, A11y]}
        grabCursor
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        breakpoints={breakpoints}
        navigation={{ prevEl, nextEl }}
        pagination={{ el: dotsEl, clickable: true }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>{slide}</SwiperSlide>
        ))}
      </Swiper>

      {/* Controls live under the track so nothing overlaps the cards */}
      <div className="card-slider__controls">
        <button
          ref={setPrevEl}
          type="button"
          className="card-slider__nav card-slider__nav--prev"
          aria-label={`Previous ${label}`}
        >
          <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <div ref={setDotsEl} className="card-slider__dots" />
        <button
          ref={setNextEl}
          type="button"
          className="card-slider__nav card-slider__nav--next"
          aria-label={`Next ${label}`}
        >
          <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
