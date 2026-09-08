import { Metadata } from "next";
import FinanceView from "@/components/Admin/FinanceView";

export const metadata: Metadata = {
  title: "Commissions & Payouts | VANIGAM Platform",
  description: "Platform commission rules, seller settlements, and escrow payouts.",
};

export default function FinanceAdminPage() {
  return <FinanceView />;
}
