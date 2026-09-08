import Newsletter from "../Common/Newsletter";
import BestSeller from "./BestSeller";
import Categories from "./Categories";
import CountDown from "./Countdown";
import Hero from "./Hero";
import NewArrival from "./NewArrivals";
import PromoBanner from "./PromoBanner";
import Testimonials from "./Testimonials";
import VerifiedStoresSpotlight from "./VerifiedStores";
import { TrustFeaturesBar } from "@/components/ui/TrustFeaturesBar";

const Home = () => {
  return (
    <main>
      {/* 1. Hero / Primary Value Proposition */}
      <Hero />

      {/* 2. Platform Trust & Buyer Protection */}
      <TrustFeaturesBar />

      {/* 3. Primary Catalog Categories */}
      <Categories />

      {/* 4. Trending New Arrivals */}
      <NewArrival />

      {/* 5. Verified Marketplace Stores & Brands */}
      <VerifiedStoresSpotlight />

      {/* 6. Promotional Campaigns */}
      <PromoBanner />

      {/* 7. Best Selling Gear */}
      <BestSeller />

      {/* 8. Limited Time Flash Deal */}
      <CountDown />

      {/* 9. Verified Customer Reviews */}
      <Testimonials />

      {/* 10. Newsletter & Community */}
      <Newsletter />
    </main>
  );
};

export default Home;
