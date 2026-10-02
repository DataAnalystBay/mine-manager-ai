import { Container } from "@mui/material";
import SectionHeading from "../components/SectionHeading";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";
import { websiteTokens } from "../styles/websiteTokens";

function ContactPage() { const { t } = useWebsiteCopy(); return <Container maxWidth={false} sx={{ maxWidth: websiteTokens.layout.maxWidth, py: { xs: 8, md: 14 } }}><SectionHeading title={t("pages.contact.title")} body={t("pages.contact.body")} /></Container>; }
export default ContactPage;
