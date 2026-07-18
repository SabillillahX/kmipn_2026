import { DashboardLayout } from '@/src/features/dashboard/components/DashboardLayout';

export const metadata = {
  title: 'Dashboard Eksekutif - Distrac',
  description: 'Ringkasan pemantauan isu regional dan manajemen penanganan',
};

export default function DashboardPage() {
  return <DashboardLayout page="eksekutif" />;
}
