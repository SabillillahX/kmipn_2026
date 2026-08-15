import ReportHandler from "./report-handler";

export default async function AdminReportPage({ params }: PageProps<"/dashboard/laporan/[code]">) {
  const { code } = await params;
  return <ReportHandler code={code} />;
}
