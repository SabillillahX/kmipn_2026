import "server-only";
import { randomUUID } from "crypto";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export type ReportStatus = "baru" | "diverifikasi" | "diproses" | "selesai" | "ditolak";
export type ReportHistory = { status: ReportStatus; note: string; at: string; actor: string };
export type LocalReport = {
  id: string; code: string; category: string; severity: string; description: string;
  contactPhone: string; latitude: number; longitude: number; priority: string;
  status: ReportStatus; assignedTo: string | null; createdAt: string;
  resolvedAt: string | null; history: ReportHistory[]; imageUrls: string[];
};

const dataPath = path.join(process.cwd(), "data", "local-reports.json");

export async function getLocalReports() {
  const raw = await readFile(dataPath, "utf8");
  return JSON.parse(raw) as LocalReport[];
}

async function saveLocalReports(reports: LocalReport[]) {
  await writeFile(dataPath, `${JSON.stringify(reports, null, 2)}\n`, "utf8");
}

export async function getLocalReport(code: string) {
  return (await getLocalReports()).find((report) => report.code.toUpperCase() === code.toUpperCase()) ?? null;
}

export async function createLocalReport(input: Pick<LocalReport, "category" | "severity" | "description" | "contactPhone" | "latitude" | "longitude" | "priority">) {
  const reports = await getLocalReports();
  const now = new Date().toISOString();
  const code = `SPLIK-${new Date().getFullYear().toString().slice(-2)}${String(Date.now()).slice(-6)}`;
  const report: LocalReport = { id: randomUUID(), code, ...input, status: "baru", assignedTo: null, createdAt: now, resolvedAt: null, imageUrls: [], history: [{ status: "baru", note: "Laporan diterima oleh sistem SPLIK.", at: now, actor: "Sistem" }] };
  reports.unshift(report); await saveLocalReports(reports); return report;
}

export async function addLocalReportImages(code: string, imageUrls: string[]) {
  const reports = await getLocalReports();
  const index = reports.findIndex((report) => report.code.toUpperCase() === code.toUpperCase());
  if (index < 0) return null;
  reports[index] = { ...reports[index], imageUrls: [...(reports[index].imageUrls ?? []), ...imageUrls] };
  await saveLocalReports(reports);
  return reports[index];
}

export async function updateLocalReport(code: string, input: { status: ReportStatus; note: string; assignedTo?: string }) {
  const reports = await getLocalReports();
  const index = reports.findIndex((report) => report.code.toUpperCase() === code.toUpperCase());
  if (index < 0) return null;
  const now = new Date().toISOString();
  reports[index] = { ...reports[index], status: input.status, assignedTo: input.assignedTo?.trim() || reports[index].assignedTo, resolvedAt: input.status === "selesai" ? now : null, history: [...reports[index].history, { status: input.status, note: input.note.trim() || `Status diperbarui menjadi ${input.status}.`, at: now, actor: "Admin SPLIK" }] };
  await saveLocalReports(reports); return reports[index];
}
