// Store currency is INR; amounts are whole rupees with paise when present.
export const formatPrice = (price: number) => {
  const hasDecimals = Math.round(price * 100) % 100 !== 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(price);
};
