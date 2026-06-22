"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

export type HeroSlide = {
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  href: Route;
  /** CSS background applied behind the 3D graphic. */
  gradient: string;
};

/**
 * Auto-playing hero carousel for offers, sales, and featured highlights.
 * Edit the slides array passed from the home page (src/app/page.tsx) to
 * change the promos shown here.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  return (
    <Swiper
      className="hero-slider"
      modules={[Autoplay, Pagination, EffectFade]}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      loop
      autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
      pagination={{ clickable: true }}
      a11y={{ enabled: true }}
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={`${slide.title}-${index}`}>
          <Link
            href={slide.href}
            className="hero-slide"
            style={{ background: slide.gradient }}
          >
            <div className="hero-slide__art">
              <Image
                src={slide.image}
                alt={slide.title}
                width={256}
                height={256}
                priority={index === 0}
                sizes="(max-width: 900px) 60vw, 30vw"
                className="hero-slide__graphic"
              />
            </div>
            <div className="hero-slide__overlay">
              {slide.badge ? (
                <span className="hero-slide__badge">{slide.badge}</span>
              ) : null}
              <h3>{slide.title}</h3>
              {slide.subtitle ? <p>{slide.subtitle}</p> : null}
            </div>
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
