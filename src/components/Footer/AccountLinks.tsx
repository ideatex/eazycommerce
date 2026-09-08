import Link from "next/link";

const accountLinks = [
  {
    id: 1,
    label: "My Account & Orders",
    href: "/account",
  },
  {
    id: 2,
    label: "Track Shipments",
    href: "/account?tab=orders",
  },
  {
    id: 3,
    label: "Returns & Refunds",
    href: "/account?tab=returns",
  },
  {
    id: 4,
    label: "Wishlist",
    href: "/wishlist",
  },
  {
    id: 5,
    label: "Verified Stores",
    href: "/stores",
  },
];

export default function AccountLinks() {
  return (
    <div className="w-full sm:w-auto">
      <h2 className="mb-7.5 text-xl font-semibold text-dark">Customer Account</h2>

      <ul className="flex flex-col gap-3.5">
        {accountLinks.map((link) => (
          <li key={link.id}>
            <Link
              className="text-base text-gray-600 duration-200 ease-out hover:text-blue"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
