import Image from "next/image";
import Link from "next/link";
import LargePromoBanner from "./LargePromoBanner";
import SmallPromoBanner from "./SmallPromoBanner";

const PromoBanner = () => {
  return (
    <section className="py-12 overflow-hidden">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <LargePromoBanner
          imageUrl="/images/promo/promo-01.png"
          subtitle="Featured Deal of the Week"
          title="PREMIUM AUDIO & GAMING"
          description="High-precision audio controllers and ergonomic gear direct from authorized marketplace distributors."
          link="/products/havit-hv-g69-usb-gamepad"
          buttonText="Shop This Offer"
        />

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
          <SmallPromoBanner
            imageUrl="/images/promo/promo-02.png"
            subtitle="Fitness & Health Tech"
            title="Workout At Home"
            discount="Special 20% off"
            link="/products/asus-rt-dual-band-wi-fi-6-router"
            buttonText="View Deals"
          />

          <SmallPromoBanner
            imageUrl="/images/promo/promo-03.png"
            subtitle="Wearable Biometrics"
            title="Apex SmartWear & Watches"
            description="Aerospace-grade titanium designs with 24-hour dispatch from verified sellers."
            link="/products/apple-watch-ultra"
            buttonText="Explore Watches"
          />
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
