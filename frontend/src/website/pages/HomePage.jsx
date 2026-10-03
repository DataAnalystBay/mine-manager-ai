import ChallengeSection from "../sections/home/ChallengeSection";
import StoryProgressRail from "../components/StoryProgressRail";
import HeroSection from "../sections/home/HeroSection";
import InsightWorkflowSection from "../sections/home/InsightWorkflowSection";
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
  </>;
}
export default HomePage;
