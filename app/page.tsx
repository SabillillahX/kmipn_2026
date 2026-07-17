import HeroSection from "./components/hero-section";
import ImpactSection from "./components/impact-section";
import ProcessSection from "./components/process-section";
import ReportExperience from "./components/report-experience";
import SignalBand from "./components/signal-band";
import SiteFooter from "./components/site-footer";
import SiteHeader from "./components/site-header";
import ScrollProgress from "./components/scroll-progress";
import AmbientCursor from "./components/ambient-cursor";
import SectionPortal from "./components/section-portal";

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
