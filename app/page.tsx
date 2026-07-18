import HeroSection from "../src/components/hero-section";
import ImpactSection from "../src/components/impact-section";
import ProcessSection from "../src/components/process-section";
import ReportExperience from "../src/components/report-experience";
import SignalBand from "../src/components/signal-band";
import SiteFooter from "../src/components/site-footer";
import SiteHeader from "../src/components/site-header";
import ScrollProgress from "../src/components/scroll-progress";
import AmbientCursor from "../src/components/ambient-cursor";
import SectionPortal from "../src/components/section-portal";

export default function Home() {
  return (
    <main id="beranda">
      <ScrollProgress />
      <AmbientCursor />
      <SiteHeader />
      <HeroSection />
      <SignalBand />
      <ImpactSection />
      <SectionPortal />
      <ProcessSection />
      <ReportExperience />
      <SiteFooter />
    </main>
  );
}
