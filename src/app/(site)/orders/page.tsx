import { redirect } from "next/navigation";

// "My Orders" lives in the account hub; keep the old URL working.
export default function CustomerOrdersPage() {
  redirect("/account?tab=orders");
}
