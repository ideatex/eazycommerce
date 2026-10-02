"use client";

import React from "react";
import ProductCard from "./ProductCard";
import type { StoreProduct } from "@/types/storefront";

type Props = {
  bgClr?: string;
  item: StoreProduct;
  className?: string;
};

const ProductItem: React.FC<Props> = ({ item, className = "" }) => {
  return <ProductCard product={item} className={className} />;
};

export default ProductItem;
