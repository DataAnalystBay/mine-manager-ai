import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Tabs,
  Tab,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";

import { useConfig } from "../context/ConfigContext";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../config/apiConfig";
import {
  resolveCompanyDisplayName,
  resolveMineDisplayName,
} from "../utils/customerIdentity";

import {
  updateCompany,
  updateMine,
  updateShiftPattern,
  updateKpiTarget,
  updateAlertThreshold,
  uploadLogo,
} from "../api/configApi";


const themePresets = [
  { key: "greenTheme", primary: "#16A34A", secondary: "#1E293B" },
  { key: "blueTheme", primary: "#2563EB", secondary: "#0F172A" },
  { key: "orangeTheme", primary: "#F97316", secondary: "#1C1917" },
  { key: "purpleTheme", primary: "#7C3AED", secondary: "#1E1B4B" },
  { key: "darkTheme", primary: "#0F172A", secondary: "#020617" },
];

function Settings() {
  const { language, t } = useLanguage();
  const {
    company,
    mine,
    shift_patterns,
    kpi_targets,
    alert_thresholds,
    reloadConfiguration,
  } = useConfig();

  const [tab, setTab] = useState(0);
  const [companyForm, setCompanyForm] = useState({});
  const [mineForm, setMineForm] = useState({});
  const [shiftForms, setShiftForms] = useState([]);
  const [kpiForms, setKpiForms] = useState([]);
  const [alertForms, setAlertForms] = useState([]);

  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // These editable forms intentionally mirror each completed config reload.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (company) setCompanyForm(company);
    if (mine) setMineForm(mine);
    if (shift_patterns) setShiftForms(shift_patterns);
    if (kpi_targets) setKpiForms(kpi_targets);
    if (alert_thresholds) setAlertForms(alert_thresholds);
  }, [company, mine, shift_patterns, kpi_targets, alert_thresholds]);

  const handleCompanyChange = (event) => {
    setCompanyForm({ ...companyForm, [event.target.name]: event.target.value });
  };

  const handleMineChange = (event) => {
    setMineForm({ ...mineForm, [event.target.name]: event.target.value });
  };

  const handleShiftChange = (index, field, value) => {
    const updated = [...shiftForms];
    updated[index] = { ...updated[index], [field]: value };
    setShiftForms(updated);
  };

  const handleKpiChange = (index, field, value) => {
    const updated = [...kpiForms];
    updated[index] = { ...updated[index], [field]: value };
    setKpiForms(updated);
  };

  const handleAlertChange = (index, field, value) => {
    const updated = [...alertForms];
    updated[index] = { ...updated[index], [field]: value };
    setAlertForms(updated);
  };

  const applyThemePreset = (preset) => {
    setCompanyForm({
      ...companyForm,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
    });
    setSuccess(false);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    setSuccess(false);
  };

  const getLogoSrc = () => {
    if (logoPreview) return logoPreview;
    if (companyForm.logo_url?.startsWith("/static")) {
      return `${API_BASE_URL}${companyForm.logo_url}`;
    }
    return companyForm.logo_url || "/images/logo.png";
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(false);

      let finalLogoUrl = companyForm.logo_url;

      if (selectedLogo) {
        const result = await uploadLogo(selectedLogo);
        finalLogoUrl = result.logo_url;
      }

      await updateCompany({
        company_name: companyForm.company_name,
        company_name_en: companyForm.company_name_en,
        company_name_mn: companyForm.company_name_mn,
        logo_url: finalLogoUrl,
        primary_color: companyForm.primary_color,
        secondary_color: companyForm.secondary_color,
        timezone: companyForm.timezone,
        language: companyForm.language,
      });

      await updateMine({
        mine_name: mineForm.mine_name,
        mine_name_en: mineForm.mine_name_en,
        mine_name_mn: mineForm.mine_name_mn,
        site_code: mineForm.site_code,
        location: mineForm.location,
        mine_type: mineForm.mine_type,
        shift_pattern: mineForm.shift_pattern,
        operating_hours: mineForm.operating_hours,
        calendar_type: mineForm.calendar_type,
      });

      for (const shift of shiftForms) {
        await updateShiftPattern(shift.id, {
          shift_name: shift.shift_name,
          start_time: shift.start_time,
          end_time: shift.end_time,
          shift_type: shift.shift_type,
          is_active: shift.is_active,
        });
      }

      for (const kpi of kpiForms) {
        await updateKpiTarget(kpi.id, {
          kpi_name: kpi.kpi_name,
          kpi_category: kpi.kpi_category,
          target_value: Number(kpi.target_value),
          warning_threshold: Number(kpi.warning_threshold),
          critical_threshold: Number(kpi.critical_threshold),
          unit: kpi.unit,
          direction: kpi.direction,
        });
      }

      for (const alert of alertForms) {
        await updateAlertThreshold(alert.id, {
          alert_name: alert.alert_name,
          kpi_name: alert.kpi_name,
          warning_value: Number(alert.warning_value),
          critical_value: Number(alert.critical_value),
          unit: alert.unit,
          alert_level: alert.alert_level,
        });
      }

      await reloadConfiguration();

      setSelectedLogo(null);
      setLogoPreview(null);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert(t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (company) setCompanyForm(company);
    if (mine) setMineForm(mine);
    if (shift_patterns) setShiftForms(shift_patterns);
    if (kpi_targets) setKpiForms(kpi_targets);
    if (alert_thresholds) setAlertForms(alert_thresholds);

    setSelectedLogo(null);
    setLogoPreview(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ p: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Typography sx={{ fontSize: 30, fontWeight: 900, mb: 1 }}>
        {t("settings.configurationCenter")}
      </Typography>

      <Typography sx={{ color: "#64748b", mb: 4 }}>
        {t("settings.pageDescription")}
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <SummaryCard title={t("settings.company")} value={resolveCompanyDisplayName(companyForm, language, "-")} subtitle={t("settings.organization")} status={t("settings.configured")} />
        <SummaryCard title={t("settings.mine")} value={resolveMineDisplayName(mineForm, language, "-")} subtitle={mineForm.location || t("settings.siteLocation")} status={t("settings.active")} />
        <SummaryCard title={t("settings.theme")} value={companyForm.primary_color || "-"} subtitle={t("settings.whiteLabelColor")} status={t("settings.live")} />
        <SummaryCard title={t("settings.alerts")} value={t("settings.configuredCount").replace("{count}", alertForms.length || 0)} subtitle={t("settings.warningCriticalLimits")} status={t("settings.live")} />
      </Grid>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
          {t("settings.saveSuccess")}
        </Alert>
      )}

      <Card sx={{ borderRadius: 4, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 800,
              minHeight: 62,
            },
          }}
        >
          <Tab label={t("settings.company")} />
          <Tab label={t("settings.mine")} />
          <Tab label={t("settings.theme")} />
          <Tab label={t("settings.shifts")} />
          <Tab label={t("settings.kpiTargets")} />
          <Tab label={t("settings.alertThresholds")} />
        </Tabs>
      </Card>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1 }}>
                  {t("settings.companyInformation")}
                </Typography>

                <Typography sx={{ color: "#64748b", mb: 3 }}>
                  {t("settings.companyDescription")}
                </Typography>

                <Stack spacing={2.4}>
                  <TextField
                    label={t("settings.companyName")}
                    name="company_name"
                    value={companyForm.company_name || ""}
                    onChange={handleCompanyChange}
                    fullWidth
                  />

                  <TextField
                    label={t("settings.englishDisplayName")}
                    name="company_name_en"
                    value={companyForm.company_name_en || ""}
                    onChange={handleCompanyChange}
                    helperText={t("settings.companyEnglishDisplayHelp")}
                    fullWidth
                  />

                  <TextField
                    label={t("settings.mongolianDisplayName")}
                    name="company_name_mn"
                    value={companyForm.company_name_mn || ""}
                    onChange={handleCompanyChange}
                    helperText={t("settings.companyMongolianDisplayHelp")}
                    fullWidth
                  />

                  <Box>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>
                      {t("settings.companyLogo")}
                    </Typography>

                    <Button variant="outlined" component="label" sx={{ borderRadius: 3, fontWeight: 800 }}>
                      {t("settings.uploadLogo")}
                      <input hidden type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleLogoChange} />
                    </Button>

                    <Box sx={{ mt: 2, p: 2, borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "#fff", display: "flex", alignItems: "center", gap: 2 }}>
                      <Box component="img" src={getLogoSrc()} alt={t("settings.companyLogoPreview")} sx={{ width: 86, height: 86, objectFit: "contain", borderRadius: 2, border: "1px solid #e5e7eb", p: 1, bgcolor: "#fff" }} />

                      <Box>
                        <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                          {selectedLogo ? selectedLogo.name : t("settings.currentLogo")}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5 }}>
                          {companyForm.logo_url || "/images/logo.png"}
                        </Typography>
                        {selectedLogo && (
                          <Chip label={t("settings.newLogoSelected")} size="small" sx={{ mt: 1, bgcolor: "#dcfce7", color: "#166534", fontWeight: 800 }} />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <TextField
                    select
                    SelectProps={{ native: true }}
                    label={t("settings.timezone")}
                    name="timezone"
                    value={companyForm.timezone || "Asia/Ulaanbaatar"}
                    onChange={handleCompanyChange}
                    fullWidth
                  >
                    <option value="Asia/Ulaanbaatar">Asia/Ulaanbaatar</option>
                    <option value="Australia/Perth">Australia/Perth</option>
                    <option value="UTC">UTC</option>
                    <option value="America/Phoenix">America/Phoenix</option>
                  </TextField>

                  <TextField
                    select
                    SelectProps={{ native: true }}
                    label={t("settings.language")}
                    name="language"
                    value={
                      companyForm.language === "English"
                        ? "en"
                        : companyForm.language === "Монгол"
                        ? "mn"
                        : companyForm.language === "中文"
                        ? "zh"
                        : companyForm.language || "en"
                    }
                    onChange={handleCompanyChange}
                    fullWidth
                  >
                    <option value="en">English</option>
                    <option value="mn">Монгол</option>
                    <option value="zh">中文</option>
                  </TextField>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <PreviewCard companyForm={companyForm} mineForm={mineForm} logoSrc={getLogoSrc()} language={language} t={t} />
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1 }}>
                  {t("settings.mineInformation")}
                </Typography>

                <Typography sx={{ color: "#64748b", mb: 3 }}>
                  {t("settings.mineDescription")}
                </Typography>

                <Stack spacing={2.4}>
                  <TextField
                    label={t("settings.mineName")}
                    name="mine_name"
                    value={mineForm.mine_name || ""}
                    onChange={handleMineChange}
                    fullWidth
                  />

                  <TextField
                    label={t("settings.englishDisplayName")}
                    name="mine_name_en"
                    value={mineForm.mine_name_en || ""}
                    onChange={handleMineChange}
                    helperText={t("settings.mineEnglishDisplayHelp")}
                    fullWidth
                  />

                  <TextField
                    label={t("settings.mongolianDisplayName")}
                    name="mine_name_mn"
                    value={mineForm.mine_name_mn || ""}
                    onChange={handleMineChange}
                    helperText={t("settings.mineMongolianDisplayHelp")}
                    fullWidth
                  />

                  {[
                    ["siteCode", "site_code"],
                    ["location", "location"],
                    ["mineType", "mine_type"],
                    ["shiftPattern", "shift_pattern"],
                    ["operatingHours", "operating_hours"],
                    ["calendarType", "calendar_type"],
                  ].map(([labelKey, name]) => (
                    <TextField
                      key={name}
                      label={t(`settings.${labelKey}`)}
                      name={name}
                      value={mineForm[name] || ""}
                      onChange={handleMineChange}
                      fullWidth
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <PreviewCard companyForm={companyForm} mineForm={mineForm} logoSrc={getLogoSrc()} language={language} t={t} />
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1 }}>
              {t("settings.themeWhiteLabel")}
            </Typography>

            <Typography sx={{ color: "#64748b", mb: 3 }}>
              {t("settings.themeDescription")}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Typography sx={{ fontWeight: 900, mb: 1.5 }}>
                  {t("settings.themePresets")}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {themePresets.map((preset) => (
                    <Grid item xs={12} sm={6} key={preset.key}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => applyThemePreset(preset)}
                        sx={{
                          justifyContent: "flex-start",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 3,
                          fontWeight: 900,
                          borderColor:
                            companyForm.primary_color === preset.primary
                              ? preset.primary
                              : "#e5e7eb",
                          color: "#0f172a",
                        }}
                      >
                        <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: preset.primary }} />
                        {t(`settings.${preset.key}`)}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                <Stack spacing={2.4}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("settings.primaryColor")}
                      name="primary_color"
                      type="color"
                      value={companyForm.primary_color || "#16A34A"}
                      onChange={handleCompanyChange}
                      fullWidth
                    />
                    <ColorBox color={companyForm.primary_color || "#16A34A"} />
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("settings.secondaryColor")}
                      name="secondary_color"
                      type="color"
                      value={companyForm.secondary_color || "#1E293B"}
                      onChange={handleCompanyChange}
                      fullWidth
                    />
                    <ColorBox color={companyForm.secondary_color || "#1E293B"} />
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} md={5}>
                <BrandPreview companyForm={companyForm} mineForm={mineForm} logoSrc={getLogoSrc()} language={language} t={t} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <ConfigurationCards title={t("settings.shiftConfiguration")} description={t("settings.shiftConfigurationDescription")}>
          {shiftForms.map((shift, index) => (
            <Grid item xs={12} md={6} key={shift.id}>
              <Card sx={{ borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{shift.shift_name || t("settings.shift")}</Typography>
                    <Chip label={shift.is_active ? t("settings.active") : t("settings.inactive")} sx={{ bgcolor: shift.is_active ? "#dcfce7" : "#fee2e2", color: shift.is_active ? "#166534" : "#991b1b", fontWeight: 800 }} />
                  </Stack>

                  <Stack spacing={2.2}>
                    <TextField label={t("settings.shiftName")} value={shift.shift_name || ""} onChange={(e) => handleShiftChange(index, "shift_name", e.target.value)} fullWidth />
                    <TextField label={t("settings.startTime")} type="time" value={(shift.start_time || "").slice(0, 5)} onChange={(e) => handleShiftChange(index, "start_time", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                    <TextField label={t("settings.endTime")} type="time" value={(shift.end_time || "").slice(0, 5)} onChange={(e) => handleShiftChange(index, "end_time", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                    <TextField label={t("settings.shiftType")} value={shift.shift_type || ""} onChange={(e) => handleShiftChange(index, "shift_type", e.target.value)} fullWidth />
                    <FormControlLabel control={<Switch checked={Boolean(shift.is_active)} onChange={(e) => handleShiftChange(index, "is_active", e.target.checked)} />} label={t("settings.activeShift")} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </ConfigurationCards>
      )}

      {tab === 4 && (
        <ConfigurationCards title={t("settings.kpiTargetManagement")} description={t("settings.kpiTargetDescription")}>
          {kpiForms.map((kpi, index) => (
            <Grid item xs={12} md={6} key={kpi.id}>
              <Card sx={{ borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{kpi.kpi_name || "KPI"}</Typography>
                  <Typography sx={{ fontSize: 13, color: "#64748b", mb: 2 }}>{kpi.kpi_category || t("settings.category")}</Typography>

                  <Stack spacing={2.2}>
                    <TextField label={t("settings.kpiName")} value={kpi.kpi_name || ""} onChange={(e) => handleKpiChange(index, "kpi_name", e.target.value)} fullWidth />
                    <TextField label={t("settings.category")} value={kpi.kpi_category || ""} onChange={(e) => handleKpiChange(index, "kpi_category", e.target.value)} fullWidth />
                    <TextField label={t("settings.targetValue")} type="number" value={kpi.target_value || ""} onChange={(e) => handleKpiChange(index, "target_value", e.target.value)} fullWidth />
                    <TextField label={t("settings.unit")} value={kpi.unit || ""} onChange={(e) => handleKpiChange(index, "unit", e.target.value)} fullWidth />
                    <TextField label={t("settings.warningThreshold")} type="number" value={kpi.warning_threshold || ""} onChange={(e) => handleKpiChange(index, "warning_threshold", e.target.value)} fullWidth />
                    <TextField label={t("settings.criticalThreshold")} type="number" value={kpi.critical_threshold || ""} onChange={(e) => handleKpiChange(index, "critical_threshold", e.target.value)} fullWidth />
                    <TextField label={t("settings.direction")} value={kpi.direction || ""} onChange={(e) => handleKpiChange(index, "direction", e.target.value)} fullWidth />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </ConfigurationCards>
      )}

      {tab === 5 && (
        <ConfigurationCards title={t("settings.alertThresholdManagement")} description={t("settings.alertThresholdDescription")}>
          {alertForms.map((alert, index) => (
            <Grid item xs={12} md={6} key={alert.id}>
              <Card sx={{ borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{alert.alert_name || t("settings.alert")}</Typography>
                  <Typography sx={{ fontSize: 13, color: "#64748b", mb: 2 }}>{alert.kpi_name || "KPI"}</Typography>

                  <Stack spacing={2.2}>
                    <TextField label={t("settings.alertName")} value={alert.alert_name || ""} onChange={(e) => handleAlertChange(index, "alert_name", e.target.value)} fullWidth />
                    <TextField label={t("settings.kpiName")} value={alert.kpi_name || ""} onChange={(e) => handleAlertChange(index, "kpi_name", e.target.value)} fullWidth />
                    <TextField label={t("settings.warningValue")} type="number" value={alert.warning_value || ""} onChange={(e) => handleAlertChange(index, "warning_value", e.target.value)} fullWidth />
                    <TextField label={t("settings.criticalValue")} type="number" value={alert.critical_value || ""} onChange={(e) => handleAlertChange(index, "critical_value", e.target.value)} fullWidth />
                    <TextField label={t("settings.unit")} value={alert.unit || ""} onChange={(e) => handleAlertChange(index, "unit", e.target.value)} fullWidth />
                    <TextField label={t("settings.alertLevel")} value={alert.alert_level || ""} onChange={(e) => handleAlertChange(index, "alert_level", e.target.value)} fullWidth />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </ConfigurationCards>
      )}

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 800 }}>
          {t("settings.reset")}
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.2,
            fontWeight: 900,
            bgcolor: companyForm.primary_color || "#16A34A",
            "&:hover": { bgcolor: companyForm.primary_color || "#16A34A" },
          }}
        >
          {saving ? t("settings.saving") : t("settings.saveChanges")}
        </Button>
      </Box>
    </Box>
  );
}

function ConfigurationCards({ title, description, children }) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1 }}>{title}</Typography>
        <Typography sx={{ color: "#64748b", mb: 3 }}>{description}</Typography>
        <Grid container spacing={3}>{children}</Grid>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ title, value, subtitle, status }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ borderRadius: 4, border: "1px solid #e5e7eb" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontSize: 13, color: "#64748b", fontWeight: 800 }}>{title}</Typography>
            <Chip label={status} size="small" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 800 }} />
          </Stack>
          <Typography sx={{ fontSize: 20, fontWeight: 900, mt: 1.3 }}>{value}</Typography>
          <Typography sx={{ fontSize: 13, color: "#64748b", mt: 1 }}>{subtitle}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

function ColorBox({ color }) {
  return <Box sx={{ width: 58, height: 58, borderRadius: 3, bgcolor: color, border: "1px solid #e5e7eb" }} />;
}

function PreviewCard({ companyForm, mineForm, logoSrc, language, t }) {
  const companyName = resolveCompanyDisplayName(companyForm, language, t("settings.companyNameFallback"));
  const mineName = resolveMineDisplayName(mineForm, language, t("settings.mineNameFallback"));

  return (
    <Card sx={{ borderRadius: 4, bgcolor: "#020f1f", color: "#ffffff", height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography sx={{ fontSize: 14, color: "#94a3b8", mb: 2 }}>{t("settings.liveConfigurationPreview")}</Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Box component="img" src={logoSrc} alt={t("settings.logoPreview")} sx={{ width: 52, height: 52, bgcolor: "#ffffff", borderRadius: 3, p: 0.7, objectFit: "contain" }} />

          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{companyName}</Typography>
            <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>{mineName}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 2 }} />

        <Stack spacing={1.3}>
          <Chip label={`${t("settings.timezone")}: ${companyForm.timezone || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#ffffff" }} />
          <Chip
            label={`${t("settings.language")}: ${
              companyForm.language === "mn" || companyForm.language === "Монгол"
                ? "Монгол"
                : companyForm.language === "zh" || companyForm.language === "中文"
                ? "中文"
                : companyForm.language === "en" || companyForm.language === "English"
                ? "English"
                : "-"
            }`}
            sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              color: "#ffffff",
            }}
          />
          <Chip label={`${t("settings.location")}: ${mineForm.location || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#ffffff" }} />
          <Chip label={`${t("settings.mineType")}: ${mineForm.mine_type || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#ffffff" }} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function BrandPreview({ companyForm, mineForm, logoSrc, language, t }) {
  const primary = companyForm.primary_color || "#16A34A";
  const secondary = companyForm.secondary_color || "#1E293B";
  const companyName = resolveCompanyDisplayName(companyForm, language, t("settings.companyNameFallback"));
  const mineName = resolveMineDisplayName(mineForm, language, t("settings.mineNameFallback"));

  return (
    <Card sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <Box sx={{ bgcolor: secondary, p: 3, color: "#ffffff" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box component="img" src={logoSrc} alt={t("settings.brandPreviewLogo")} sx={{ width: 56, height: 56, bgcolor: "#ffffff", borderRadius: 3, p: 0.8, objectFit: "contain" }} />
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{companyName}</Typography>
            <Typography sx={{ fontSize: 13, color: "#cbd5e1" }}>{mineName}</Typography>
          </Box>
        </Stack>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 900, mb: 2 }}>{t("settings.previewDescription")}</Typography>

        <Button fullWidth variant="contained" sx={{ bgcolor: primary, borderRadius: 3, fontWeight: 900, "&:hover": { bgcolor: primary } }}>
          {t("settings.primaryAction")}
        </Button>

        <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: `${primary}18`, color: primary, fontWeight: 900 }}>
          {t("settings.activeNavigationHighlight")}
        </Box>
      </CardContent>
    </Card>
  );
}

export default Settings;
