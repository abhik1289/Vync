import type { Metadata } from "next";
import { Dashboard } from "@/app/components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Vync",
};

export default function DashboardPage() {
  return <Dashboard />;
}
