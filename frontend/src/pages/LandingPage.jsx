import React, { useEffect } from 'react';
import './../components/landing/LandingPage.css';

import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import FeatureStrip from '../components/landing/FeatureStrip';
import HowItWorks from '../components/landing/HowItWorks';
import BenefitSection from '../components/landing/BenefitSection';
import PrivacySection from '../components/landing/PrivacySection';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';

export const LandingPage = () => {
  useEffect(() => {
    document.title = 'PhotoDay — Private Photo Discovery For Every Event';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="photoday-landing">
      <Navbar />
      <main>
        <Hero />
        <FeatureStrip />
        <HowItWorks />
        <BenefitSection />
        <PrivacySection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
