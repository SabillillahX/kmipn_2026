import { requireStaff } from "@/app/lib/dal";
import ReportHandler from "./report-handler";

export default async function AdminReportPage({ params }: PageProps<"/dashboard/laporan/[code]">) {
  const { code } = await params;
  const user = await requireStaff();
  return <ReportHandler code={code} userRole={user.role} userId={user.id} />;
}
