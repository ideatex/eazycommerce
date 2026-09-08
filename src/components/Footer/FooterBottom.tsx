import Image from "next/image";

const paymentsData = [
  {
    id: 1,
    image: "/images/payment/payment-01.svg",
    alt: "visa card",
    width: 66,
    height: 22,
  },
  {
    id: 2,
    image: "/images/payment/payment-02.svg",
    alt: "paypal",
    width: 18,
    height: 21,
  },
  {
    id: 3,
    image: "/images/payment/payment-03.svg",
    alt: "master card",
    width: 33,
    height: 24,
  },
  {
    id: 4,
    image: "/images/payment/payment-04.svg",
    alt: "apple pay",
    width: 52.94,
    height: 22,
  },
  {
    id: 5,
    image: "/images/payment/payment-05.svg",
    alt: "google pay",
    width: 56,
    height: 22,
  },
];

export default function FooterBottom() {
  const year = new Date().getFullYear();

  return (
    <div className="py-5 xl:py-7.5 bg-gray-1">
      <div className="px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs sm:text-sm font-medium text-dark">
            &copy; {year} Vanigam Commerce. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <p className="text-xs font-semibold text-gray-500">We Accept:</p>

            <div className="flex flex-wrap items-center gap-5">
              {paymentsData.map((payment) => (
                <Image
                  className="h-5"
                  key={payment?.id}
                  src={payment.image}
                  alt={payment.alt}
                  width={payment.width}
                  height={payment.height}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
