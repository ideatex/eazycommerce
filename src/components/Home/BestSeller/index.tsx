import Link from "next/link";
import BestSellerSectionTitle from "./BestSellerSectionTitle";
import ProductCard from "@/components/Common/ProductCard";
import { getBestSellingProducts } from "@/get-api-data/product";

const BestSeller = async () => {
  const bestSellProducts = await getBestSellingProducts();

  return (
    <section className="overflow-hidden py-12">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <BestSellerSectionTitle />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bestSellProducts.slice(0, 8).map((item, key) => (
            <ProductCard product={item} key={key} sellerName="Velocity Tech Store" />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/shop-with-sidebar"
            className="inline-flex items-center gap-2 font-bold text-sm py-3 px-8 rounded-xl border border-gray-3 bg-white text-dark hover:bg-dark hover:text-white transition-all duration-200 shadow-xs"
          >
            Explore Complete Catalog →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
