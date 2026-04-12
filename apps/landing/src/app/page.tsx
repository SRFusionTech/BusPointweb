import Nav          from '@/components/nav';
import Hero         from '@/components/hero';
import Stats        from '@/components/stats';
import HowItWorks   from '@/components/how-it-works';
import Features     from '@/components/features';
import ForWhom      from '@/components/for-whom';
import Pricing      from '@/components/pricing';
import RequestAccess from '@/components/request-access';
import Footer       from '@/components/footer';

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Nav />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <ForWhom />
      <Pricing />
      <RequestAccess />
      <Footer />
    </main>
  );
}
