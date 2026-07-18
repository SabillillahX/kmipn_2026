import { DashboardLayout } from '@/src/features/dashboard/components/DashboardLayout';

export const metadata = {
  title: 'Dashboard OPD - Distrac',
  description: 'Antrean disposisi masalah dan tiket prioritas untuk inspeksi lapangan',
};

export default function OpdDashboardPage() {
  return <DashboardLayout page="opd" />;
}
