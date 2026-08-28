import OpdClient from './opd-client';

export const metadata = {
  title: 'Dashboard OPD - Distrac',
  description: 'Antrean disposisi masalah dan tiket prioritas untuk inspeksi lapangan',
};

export default function OpdDashboardPage() {
  return <OpdClient />;
}
