"use client";

import { Children, type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/**
 * Horizontal carousel for product cards. Server-rendered <ProductCard />
 * elements are passed in as children and wrapped in SwiperSlides here.
 */
export function ProductsSlider({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);

  return (
    <div className="products-slider">
      <Swiper
        className="products-slider__track"
        modules={[Navigation, Pagination, A11y]}
        navigation
        pagination={{ el: ".products-slider__dots", clickable: true }}
        grabCursor
        spaceBetween={18}
        slidesPerView={1.15}
        breakpoints={{
          560: { slidesPerView: 2, spaceBetween: 18 },
          900: { slidesPerView: 3, spaceBetween: 20 },
          1200: { slidesPerView: 4, spaceBetween: 22 },
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>{slide}</SwiperSlide>
        ))}
      </Swiper>
      {/* Pagination rendered outside the track so dots never overlap cards */}
      <div className="products-slider__dots" />
    </div>
  );
}
