import { CallIcon, EmailIcon, MapIcon } from "@/assets/icons";
import Link from "next/link";
import Image from "next/image";
import AccountLinks from "./AccountLinks";
import FooterBottom from "./FooterBottom";
import { getBusinessProfile } from "@/lib/storefront";
import QuickLinks from "./QuickLinks";

const Footer = async () => {
  // Contact details come from Admin → Settings; nothing is shown for fields left empty.
  const business = await getBusinessProfile().catch(() => null);
  const address = [business?.address, business?.city, business?.state, business?.postalCode].filter(Boolean).join(", ");

  return (
    <footer className="overflow-hidden border-t border-gray-3">
      <div className="px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        {/* <!-- footer menu start --> */}
        <div className="flex flex-wrap xl:flex-nowrap gap-10 xl:gap-19 xl:justify-between pt-17.5 xl:pt-22.5 pb-10 xl:pb-20">
          <div className="max-w-[330px] w-full">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/logo/logo.svg"
                alt="Vanigam Commerce"
                width={210}
                height={52}
                className="h-11 sm:h-13 w-auto object-contain"
              />
            </Link>

            <h2 className="mb-4 text-base font-bold text-dark">
              Help & Support
            </h2>

            <ul className="flex flex-col gap-3">
              {address && (
                <li className="flex gap-4.5 text-base">
                  <span className="shrink-0">
                    <MapIcon className="fill-blue" width={24} height={24} />
                  </span>
                  {address}
                </li>
              )}

              {business?.phone && (
                <li>
                  <Link href={`tel:${business.phone.replace(/[^+0-9]/g, "")}`} className="flex items-center gap-4.5 text-base">
                    <CallIcon className="fill-blue" width={24} height={24} />
                    {business.phone}
                  </Link>
                </li>
              )}

              {business?.email && (
                <li>
                  <Link href={`mailto:${business.email}`} className="flex items-center gap-4.5 text-base">
                    <EmailIcon className="fill-blue" width={24} height={24} />
                    {business.email}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <AccountLinks />

          <QuickLinks />
        </div>
        {/* <!-- footer menu end --> */}
      </div>

      <FooterBottom />
    </footer>
  );
};

export default Footer;
