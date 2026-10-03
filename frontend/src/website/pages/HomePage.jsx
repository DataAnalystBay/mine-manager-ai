import ChallengeSection from "../sections/home/ChallengeSection";
import StoryProgressRail from "../components/StoryProgressRail";
import FinalDemoCtaSection from "../sections/home/FinalDemoCtaSection";
import HeroSection from "../sections/home/HeroSection";
import InsightWorkflowSection from "../sections/home/InsightWorkflowSection";
import IntegrationSection from "../sections/home/IntegrationSection";
import LeadershipLevelsSection from "../sections/home/LeadershipLevelsSection";
import MorningMeetingSection from "../sections/home/MorningMeetingSection";
import TrustRail from "../sections/home/TrustRail";

function HomePage() {
  return <>
    <StoryProgressRail />
    <HeroSection />
    <TrustRail />
    <ChallengeSection />
    <InsightWorkflowSection />
    <MorningMeetingSection />
    <LeadershipLevelsSection />
    <IntegrationSection />
    <FinalDemoCtaSection />
  </>;
}
export default HomePage;
