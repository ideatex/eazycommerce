"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import SingleItem from "./SingleItem";
import testimonialsData from "./testimonialsData";
import TestimonialsHeader from "./TestimonialsHeader";
import { useTestimonialSwiper } from "./useTestimonialSwiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

const BREAKPOINTS = {
  0: { slidesPerView: 1 },
  768: { slidesPerView: 2 },
  1200: { slidesPerView: 3 },
} as const;

const Testimonials = () => {
  const { sliderRef, handlePrev, handleNext, onSlideChange, currentIndex } =
    useTestimonialSwiper();

  return (
    <section className="py-12 bg-gray-1/60">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="swiper testimonial-carousel common-carousel p-4">
          <TestimonialsHeader
            onPrev={handlePrev}
            onNext={handleNext}
            isPrevDisabled={currentIndex === 0}
            isNextDisabled={currentIndex === testimonialsData.length - 1}
          />

          <Swiper
            className="testimonial-swiper"
            ref={sliderRef}
            slidesPerView={3}
            spaceBetween={24}
            breakpoints={BREAKPOINTS}
            onSlideChange={onSlideChange}
          >
            {testimonialsData.map((item, key) => (
              <SwiperSlide key={key}>
                <SingleItem testimonial={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
