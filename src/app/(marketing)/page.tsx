import { SiteNav } from '@/components/marketing/SiteNav';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { Hero } from '@/components/marketing/sections/Hero';
import { Facts } from '@/components/marketing/sections/Facts';
import { Story } from '@/components/marketing/sections/Story';
import { Audiences } from '@/components/marketing/sections/Audiences';
import { ConsoleShowcase } from '@/components/marketing/sections/ConsoleShowcase';
import { Faq, FAQS, FinalCta, HowItWorks, Safety } from '@/components/marketing/sections/Closing';
import { SITE } from '@/lib/site';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: SITE.company, url: SITE.companyUrl, brand: { '@type': 'Brand', name: SITE.name } },
    {
      '@type': 'SoftwareApplication',
      name: SITE.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'iOS, Android, Web',
      description: SITE.description,
      publisher: { '@type': 'Organization', name: SITE.company },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav />
      <main>
        <Hero />
        <Facts />
        <HowItWorks />
        <Story />
        <Audiences />
        <ConsoleShowcase />
        <Safety />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
