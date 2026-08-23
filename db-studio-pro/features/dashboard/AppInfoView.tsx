import React from 'react';
import { HeroSection } from './info/HeroSection';
import { ComparisonSection } from './info/ComparisonSection';
import { FeaturesGrid } from './info/FeaturesGrid';
import { DesktopBuildsSection } from './info/DesktopBuildsSection';
import { AiAndAutomationSection } from './info/AiAndAutomationSection';
import { LiveCollaborationSection } from './info/LiveCollaborationSection';
import { FaqSection } from './info/FaqSection';
import { SupportedTechSection } from './info/SupportedTechSection';
import { FooterCTA } from './info/FooterCTA';

interface AppInfoViewProps {
  onNavigate: (view: string) => void;
}

export const AppInfoView: React.FC<AppInfoViewProps> = ({ onNavigate }) => {
  return (
    <div className="h-full bg-slate-50 overflow-y-auto" id="app-info-view-root">
      <HeroSection onNavigate={onNavigate} />
      <ComparisonSection />
      <FeaturesGrid />
      <DesktopBuildsSection />
      <AiAndAutomationSection />
      <LiveCollaborationSection />
      <FaqSection />
      <SupportedTechSection />
      <FooterCTA onNavigate={onNavigate} />
    </div>
  );
};
