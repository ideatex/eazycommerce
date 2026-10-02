"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export interface HeroImage {
  /** Already sanitised on the server (`safeImage`). */
  url: string;
  alt: string;
}

const isLocal = (src: string) => src.startsWith("/");

/**
 * Image-only slider for the hero. The headline, copy and buttons live outside
 * this component and stay put while the pictures change. A single image renders
 * without controls.
 */
export default function HeroCarousel({ images, contain }: { images: HeroImage[]; contain: boolean }) {
  const multiple = images.length > 1;

  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination, A11y]}
      slidesPerView={1}
      loop={multiple}
      allowTouchMove={multiple}
      autoplay={multiple ? { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
      pagination={multiple ? { clickable: true } : false}
      navigation={multiple}
      a11y={{ prevSlideMessage: "Previous image", nextSlideMessage: "Next image" }}
      className="hero-carousel h-full w-full"
      style={{ ["--swiper-theme-color" as string]: "var(--color-blue)", ["--swiper-navigation-size" as string]: "18px" }}
    >
      {images.map((img, i) => (
        <SwiperSlide key={`${img.url}-${i}`}>
          <div className="relative h-[260px] sm:h-[320px] lg:h-[420px]">
            <Image
              src={img.url}
              alt={img.alt}
              fill
              priority={i === 0}
              unoptimized={!isLocal(img.url)}
              className={contain ? "object-contain p-6 sm:p-10" : "object-cover"}
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
