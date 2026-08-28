import { requireAdmin } from "@/app/lib/dal";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  await requireAdmin();
  return <DashboardClient />;
}
