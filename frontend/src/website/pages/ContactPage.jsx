import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import { Box, Button, Container, Link, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";
import { websiteTokens } from "../styles/websiteTokens";

const BACKGROUND_PATH = "/website-v2/contact/contact-hero-mine.png";
const PHONE_DISPLAY = "+976 9910 5308";
const PHONE_HREF = "tel:+97699105308";
const INITIAL_VALUES = { name: "", company: "", role: "", contact: "", operation: "", improve: "" };

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 50,
    borderRadius: `${websiteTokens.radius.small}px`,
    bgcolor: "#fff",
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontWeight: 650, color: "text.primary" },
  "& .MuiFormHelperText-root": { mx: 0 },
};

function ContactField({ id, label, value, onChange, error, required = false, multiline = false }) {
  return (
    <TextField
      id={id}
      name={id}
      label={`${label}${required ? " *" : ""}`}
      value={value}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error || " "}
      required={required}
      fullWidth
      multiline={multiline}
      minRows={multiline ? 4 : undefined}
      autoComplete={id === "name" ? "name" : id === "company" ? "organization" : id === "contact" ? "email" : "off"}
      slotProps={{ htmlInput: { "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-helper-text` : undefined } }}
      sx={fieldSx}
    />
  );
}

function ReassuranceItem({ title, body }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 1.25 }}>
      <CheckIcon aria-hidden="true" sx={{ mt: 0.15, color: "primary.main", fontSize: 20 }} />
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 750, lineHeight: 1.35 }}>{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.35, fontSize: 14, lineHeight: 1.55 }}>{body}</Typography>
      </Box>
    </Box>
  );
}

function SectionIntro({ eyebrow, title, id }) {
  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em" }}>{eyebrow}</Typography>
      <Typography id={id} component="h2" sx={{ mt: 1.5, fontSize: { xs: 30, sm: 38, md: 44 }, fontWeight: 750, lineHeight: 1.12, letterSpacing: "-0.035em" }}>{title}</Typography>
    </Box>
  );
}

function ContactPage() {
  const { t } = useWebsiteCopy();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const isDemoIntent = searchParams.get("intent") === "demo";

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setStatus("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "required";
    if (!values.company.trim()) nextErrors.company = "required";
    const contact = values.contact.trim();
    if (!contact) {
      nextErrors.contact = "required";
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      const digits = contact.replace(/\D/g, "");
      const isPhone = /^[+\d\s().-]+$/.test(contact) && digits.length >= 7;
      if (!isEmail && !isPhone) nextErrors.contact = "invalidContact";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus("");
    if (!validate()) return;
    setStatus("unavailable");
  };

  const reassuranceKeys = ["duration", "data", "commitment"];
  const coverageKeys = ["kpi", "platform", "workflow"];
  const stepKeys = ["request", "call", "demo"];

  return (
    <Box>
      <Box
        component="section"
        aria-labelledby="contact-hero-title"
        sx={{
          position: "relative",
          overflow: "hidden",
          backgroundImage: {
            xs: "linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.98)), url(\"/website-v2/contact/contact-hero-mine.png\")",
            md: "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.96) 31%, rgba(255,255,255,0.68) 55%, rgba(255,255,255,0.08) 100%), url(\"/website-v2/contact/contact-hero-mine.png\")",
          },
          backgroundSize: "cover",
          backgroundPosition: { xs: "66% center", md: "center right" },
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box component="img" src={BACKGROUND_PATH} alt="" aria-hidden="true" sx={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
        <Container
          maxWidth={false}
          sx={{
            maxWidth: websiteTokens.layout.maxWidth,
            position: "relative",
            py: { xs: 6, sm: 8, md: 9 },
            display: "grid",
            gridTemplateColumns: "1fr",
            "@media (min-width:1000px)": { gridTemplateColumns: "minmax(0, 0.94fr) minmax(460px, 0.86fr)" },
            gap: { xs: 5, md: 6, lg: 9 },
            alignItems: "center",
          }}
        >
          <Box sx={{ maxWidth: 570 }}>
            <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em" }}>
              {t(isDemoIntent ? "pages.contact.demoEyebrow" : "pages.contact.eyebrow")}
            </Typography>
            <Typography id="contact-hero-title" component="h1" sx={{ mt: 2, whiteSpace: "pre-line", fontSize: { xs: 38, sm: 48, md: 50 }, fontWeight: 760, lineHeight: 1.08, letterSpacing: "-0.045em" }}>
              {t("pages.contact.title")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2.5, maxWidth: 520, fontSize: { xs: 17, md: 18 }, lineHeight: 1.65 }}>
              {t("pages.contact.body")}
            </Typography>
            <Stack spacing={2.25} sx={{ mt: 4, maxWidth: 510 }}>
              {reassuranceKeys.map((key) => <ReassuranceItem key={key} title={t(`pages.contact.reassurance.${key}.title`)} body={t(`pages.contact.reassurance.${key}.body`)} />)}
            </Stack>
          </Box>

          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: `${websiteTokens.radius.medium}px`, bgcolor: "#fff", boxShadow: "0 20px 54px rgba(16, 29, 42, 0.12)", p: { xs: 2.5, sm: 4 } }}>
            <Typography component="h2" sx={{ fontSize: { xs: 25, sm: 29 }, fontWeight: 750, letterSpacing: "-0.025em" }}>{t("pages.contact.form.title")}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, mb: 3, fontSize: 15 }}>{t("pages.contact.form.intro")}</Typography>
            <Box component="form" noValidate onSubmit={handleSubmit} aria-describedby="contact-form-note">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2 }}>
                <ContactField id="name" label={t("pages.contact.form.name")} value={values.name} onChange={updateField} error={errors.name ? t(`pages.contact.form.${errors.name}`) : undefined} required />
                <ContactField id="company" label={t("pages.contact.form.company")} value={values.company} onChange={updateField} error={errors.company ? t(`pages.contact.form.${errors.company}`) : undefined} required />
                <ContactField id="role" label={t("pages.contact.form.role")} value={values.role} onChange={updateField} />
                <ContactField id="contact" label={t("pages.contact.form.contact")} value={values.contact} onChange={updateField} error={errors.contact ? t(`pages.contact.form.${errors.contact}`) : undefined} required />
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}><ContactField id="operation" label={t("pages.contact.form.operation")} value={values.operation} onChange={updateField} /></Box>
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}><ContactField id="improve" label={t("pages.contact.form.improve")} value={values.improve} onChange={updateField} multiline /></Box>
              </Box>
              <Button type="submit" variant="contained" size="large" fullWidth sx={{ minHeight: 52, mt: 0.5 }}>{t("pages.contact.form.submit")}</Button>
              <Stack spacing={0.25} sx={{ mt: 2.5, alignItems: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>{t("pages.contact.form.direct")}</Typography>
                <Link href={PHONE_HREF} color="primary.main" underline="hover" sx={{ fontSize: 18, fontWeight: 800 }}>{PHONE_DISPLAY}</Link>
              </Stack>
              {status && <Typography role="status" aria-live="polite" sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: "#f7f3e8", color: "#6e5620", fontSize: 13.5, lineHeight: 1.5 }}>{t(`pages.contact.form.${status}`)}</Typography>}
              <Typography id="contact-form-note" color="text.secondary" sx={{ mt: 2, fontSize: 12.5, lineHeight: 1.55 }}>{t("pages.contact.form.microcopy")}</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box component="section" aria-labelledby="demo-coverage-title" sx={{ bgcolor: "background.paper" }}>
        <Container maxWidth={false} sx={{ maxWidth: websiteTokens.layout.maxWidth, py: { xs: 7, md: 12 } }}>
          <SectionIntro eyebrow={t("pages.contact.coverage.eyebrow")} title={t("pages.contact.coverage.title")} id="demo-coverage-title" />
          <Box sx={{ mt: { xs: 4, md: 6 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: { xs: 4, md: 0 } }}>
            {coverageKeys.map((key, index) => (
              <Box key={key} sx={{ pr: { md: 5 }, pl: { md: index ? 5 : 0 }, borderLeft: { md: index ? "1px solid" : "none" }, borderColor: "divider" }}>
                <Typography sx={{ fontSize: 19, fontWeight: 750 }}>{t(`pages.contact.coverage.items.${key}.title`)}</Typography>
                <Stack component="ul" spacing={1.1} sx={{ m: 0, mt: 2, pl: 2.25, color: "text.secondary" }}>
                  {t(`pages.contact.coverage.items.${key}.points`).map((point) => <Typography component="li" key={point} sx={{ fontSize: 15, lineHeight: 1.55 }}>{point}</Typography>)}
                </Stack>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" aria-labelledby="demo-steps-title" sx={{ borderBlock: "1px solid", borderColor: "divider", bgcolor: "#f4f7f5" }}>
        <Container maxWidth={false} sx={{ maxWidth: websiteTokens.layout.maxWidth, py: { xs: 7, md: 12 } }}>
          <SectionIntro eyebrow={t("pages.contact.steps.eyebrow")} title={t("pages.contact.steps.title")} id="demo-steps-title" />
          <Box sx={{ mt: { xs: 4, md: 6 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr auto 1fr" }, gap: { xs: 3, md: 3 }, alignItems: "center" }}>
            {stepKeys.flatMap((key, index) => {
              const parts = [
                <Box key={key} sx={{ minHeight: { md: 140 }, borderTop: "2px solid", borderColor: "primary.main", pt: 2.5 }}>
                  <Typography color="primary.main" sx={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em" }}>0{index + 1}</Typography>
                  <Typography sx={{ mt: 1.5, fontSize: 19, fontWeight: 750 }}>{t(`pages.contact.steps.items.${key}.title`)}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 15, lineHeight: 1.55 }}>{t(`pages.contact.steps.items.${key}.body`)}</Typography>
                </Box>,
              ];
              if (index < stepKeys.length - 1) parts.push(<ArrowForwardIcon key={`${key}-arrow`} aria-hidden="true" sx={{ display: { xs: "none", md: "block" }, color: "primary.main" }} />);
              return parts;
            })}
          </Box>
        </Container>
      </Box>

      <Box component="section" aria-labelledby="contact-closing-title" sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
        <Container maxWidth={false} sx={{ maxWidth: websiteTokens.layout.maxWidth, py: { xs: 7, md: 9 }, textAlign: "center" }}>
          <Typography id="contact-closing-title" component="h2" sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 750, lineHeight: 1.15, letterSpacing: "-0.035em" }}>{t("pages.contact.closing.title")}</Typography>
          <Typography sx={{ maxWidth: 720, mx: "auto", mt: 2, color: "rgba(255,255,255,0.78)", fontSize: { xs: 16, md: 18 }, lineHeight: 1.65 }}>{t("pages.contact.closing.body")}</Typography>
          <Typography sx={{ mt: 3, fontSize: { xs: 14, sm: 16 }, fontWeight: 750, letterSpacing: { xs: "0.02em", sm: "0.06em" } }}>{t("pages.contact.closing.systems")}</Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default ContactPage;
