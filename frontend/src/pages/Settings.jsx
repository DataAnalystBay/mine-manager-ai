import React, { useEffect, useState } from "react";

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
import { API_BASE_URL } from "../config/apiConfig";

import {
  updateCompany,
  updateMine,
  updateShiftPattern,
  updateKpiTarget,
  updateAlertThreshold,
  uploadLogo,
} from "../api/configApi";


const themePresets = [
  { name: "Green Theme", primary: "#16A34A", secondary: "#1E293B" },
  { name: "Blue Theme", primary: "#2563EB", secondary: "#0F172A" },
  { name: "Orange Theme", primary: "#F97316", secondary: "#1C1917" },
  { name: "Purple Theme", primary: "#7C3AED", secondary: "#1E1B4B" },
  { name: "Dark Theme", primary: "#0F172A", secondary: "#020617" },
];

function Settings() {
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
        logo_url: finalLogoUrl,
        primary_color: companyForm.primary_color,
        secondary_color: companyForm.secondary_color,
        timezone: companyForm.timezone,
        language: companyForm.language,
      });

      await updateMine({
        mine_name: mineForm.mine_name,
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
      alert("Unable to save configuration.");
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
        Configuration Center
      </Typography>

      <Typography sx={{ color: "#64748b", mb: 4 }}>
        Configure branding, mine setup, KPI targets, shifts, and alert thresholds.
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <SummaryCard title="Company" value={companyForm.company_name || "-"} subtitle="Organization" status="Configured" />
        <SummaryCard title="Mine" value={mineForm.mine_name || "-"} subtitle={mineForm.location || "Site location"} status="Active" />
        <SummaryCard title="Theme" value={companyForm.primary_color || "-"} subtitle="White label color" status="Live" />
        <SummaryCard title="Alerts" value={`${alertForms.length || 0} configured`} subtitle="Warning and critical limits" status="Live" />
      </Grid>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
          Configuration saved successfully.
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
          <Tab label="Company" />
          <Tab label="Mine" />
          <Tab label="Theme" />
          <Tab label="Shifts" />
          <Tab label="KPI Targets" />
          <Tab label="Alert Thresholds" />
        </Tabs>
      </Card>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1 }}>
                  Company Information
                </Typography>

                <Typography sx={{ color: "#64748b", mb: 3 }}>
                  Configure organization identity, logo, language, and timezone.
                </Typography>

                <Stack spacing={2.4}>
                  <TextField
                    label="Company Name"
                    name="company_name"
                    value={companyForm.company_name || ""}
                    onChange={handleCompanyChange}
                    fullWidth
                  />

                  <Box>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>
                      Company Logo
                    </Typography>

                    <Button variant="outlined" component="label" sx={{ borderRadius: 3, fontWeight: 800 }}>
                      Upload Logo
                      <input hidden type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleLogoChange} />
                    </Button>

                    <Box sx={{ mt: 2, p: 2, borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "#fff", display: "flex", alignItems: "center", gap: 2 }}>
                      <Box component="img" src={getLogoSrc()} alt="Company logo preview" sx={{ width: 86, height: 86, objectFit: "contain", borderRadius: 2, border: "1px solid #e5e7eb", p: 1, bgcolor: "#fff" }} />

                      <Box>
                        <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                          {selectedLogo ? selectedLogo.name : "Current Logo"}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5 }}>
                          {companyForm.logo_url || "/images/logo.png"}
                        </Typography>
                        {selectedLogo && (
                          <Chip label="New logo selected" size="small" sx={{ mt: 1, bgcolor: "#dcfce7", color: "#166534", fontWeight: 800 }} />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <TextField
                    select
                    SelectProps={{ native: true }}
                    label="Timezone"
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
                    label="Language"
                    name="language"
                    value={companyForm.language || "English"}
                    onChange={handleCompanyChange}
                    fullWidth
                  >
                    <option value="English">English</option>
                    <option value="Монгол">Монгол</option>
                    <option value="中文">中文</option>
                  </TextField>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <PreviewCard companyForm={companyForm} mineForm={mineForm} logoSrc={getLogoSrc()} />
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1 }}>
                  Mine Information
                </Typography>

                <Typography sx={{ color: "#64748b", mb: 3 }}>
                  Configure mine-specific operating details.
                </Typography>

                <Stack spacing={2.4}>
                  {[
                    ["Mine Name", "mine_name"],
                    ["Site Code", "site_code"],
                    ["Location", "location"],
                    ["Mine Type", "mine_type"],
                    ["Shift Pattern", "shift_pattern"],
                    ["Operating Hours", "operating_hours"],
                    ["Calendar Type", "calendar_type"],
                  ].map(([label, name]) => (
                    <TextField
                      key={name}
                      label={label}
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
            <PreviewCard companyForm={companyForm} mineForm={mineForm} logoSrc={getLogoSrc()} />
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1 }}>
              Theme & White Label
            </Typography>

            <Typography sx={{ color: "#64748b", mb: 3 }}>
              Select a ready-made theme or fine-tune brand colors visually.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Typography sx={{ fontWeight: 900, mb: 1.5 }}>
                  Theme Presets
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {themePresets.map((preset) => (
                    <Grid item xs={12} sm={6} key={preset.name}>
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
                        {preset.name}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                <Stack spacing={2.4}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Primary Color"
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
                      label="Secondary Color"
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
                <BrandPreview companyForm={companyForm} mineForm={mineForm} logoSrc={getLogoSrc()} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <ConfigurationCards title="Shift Configuration" description="Manage shift names, start times, end times, and active status.">
          {shiftForms.map((shift, index) => (
            <Grid item xs={12} md={6} key={shift.id}>
              <Card sx={{ borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{shift.shift_name || "Shift"}</Typography>
                    <Chip label={shift.is_active ? "Active" : "Inactive"} sx={{ bgcolor: shift.is_active ? "#dcfce7" : "#fee2e2", color: shift.is_active ? "#166534" : "#991b1b", fontWeight: 800 }} />
                  </Stack>

                  <Stack spacing={2.2}>
                    <TextField label="Shift Name" value={shift.shift_name || ""} onChange={(e) => handleShiftChange(index, "shift_name", e.target.value)} fullWidth />
                    <TextField label="Start Time" type="time" value={(shift.start_time || "").slice(0, 5)} onChange={(e) => handleShiftChange(index, "start_time", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                    <TextField label="End Time" type="time" value={(shift.end_time || "").slice(0, 5)} onChange={(e) => handleShiftChange(index, "end_time", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                    <TextField label="Shift Type" value={shift.shift_type || ""} onChange={(e) => handleShiftChange(index, "shift_type", e.target.value)} fullWidth />
                    <FormControlLabel control={<Switch checked={Boolean(shift.is_active)} onChange={(e) => handleShiftChange(index, "is_active", e.target.checked)} />} label="Active Shift" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </ConfigurationCards>
      )}

      {tab === 4 && (
        <ConfigurationCards title="KPI Target Management" description="Configure operational KPI targets, warning thresholds, and critical thresholds.">
          {kpiForms.map((kpi, index) => (
            <Grid item xs={12} md={6} key={kpi.id}>
              <Card sx={{ borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{kpi.kpi_name || "KPI"}</Typography>
                  <Typography sx={{ fontSize: 13, color: "#64748b", mb: 2 }}>{kpi.kpi_category || "Category"}</Typography>

                  <Stack spacing={2.2}>
                    <TextField label="KPI Name" value={kpi.kpi_name || ""} onChange={(e) => handleKpiChange(index, "kpi_name", e.target.value)} fullWidth />
                    <TextField label="Category" value={kpi.kpi_category || ""} onChange={(e) => handleKpiChange(index, "kpi_category", e.target.value)} fullWidth />
                    <TextField label="Target Value" type="number" value={kpi.target_value || ""} onChange={(e) => handleKpiChange(index, "target_value", e.target.value)} fullWidth />
                    <TextField label="Unit" value={kpi.unit || ""} onChange={(e) => handleKpiChange(index, "unit", e.target.value)} fullWidth />
                    <TextField label="Warning Threshold" type="number" value={kpi.warning_threshold || ""} onChange={(e) => handleKpiChange(index, "warning_threshold", e.target.value)} fullWidth />
                    <TextField label="Critical Threshold" type="number" value={kpi.critical_threshold || ""} onChange={(e) => handleKpiChange(index, "critical_threshold", e.target.value)} fullWidth />
                    <TextField label="Direction" value={kpi.direction || ""} onChange={(e) => handleKpiChange(index, "direction", e.target.value)} fullWidth />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </ConfigurationCards>
      )}

      {tab === 5 && (
        <ConfigurationCards title="Alert Threshold Management" description="Configure warning and critical limits used by the risk engine.">
          {alertForms.map((alert, index) => (
            <Grid item xs={12} md={6} key={alert.id}>
              <Card sx={{ borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{alert.alert_name || "Alert"}</Typography>
                  <Typography sx={{ fontSize: 13, color: "#64748b", mb: 2 }}>{alert.kpi_name || "KPI"}</Typography>

                  <Stack spacing={2.2}>
                    <TextField label="Alert Name" value={alert.alert_name || ""} onChange={(e) => handleAlertChange(index, "alert_name", e.target.value)} fullWidth />
                    <TextField label="KPI Name" value={alert.kpi_name || ""} onChange={(e) => handleAlertChange(index, "kpi_name", e.target.value)} fullWidth />
                    <TextField label="Warning Value" type="number" value={alert.warning_value || ""} onChange={(e) => handleAlertChange(index, "warning_value", e.target.value)} fullWidth />
                    <TextField label="Critical Value" type="number" value={alert.critical_value || ""} onChange={(e) => handleAlertChange(index, "critical_value", e.target.value)} fullWidth />
                    <TextField label="Unit" value={alert.unit || ""} onChange={(e) => handleAlertChange(index, "unit", e.target.value)} fullWidth />
                    <TextField label="Alert Level" value={alert.alert_level || ""} onChange={(e) => handleAlertChange(index, "alert_level", e.target.value)} fullWidth />
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
          Reset
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
          {saving ? "Saving..." : "Save Changes"}
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

function PreviewCard({ companyForm, mineForm, logoSrc }) {
  return (
    <Card sx={{ borderRadius: 4, bgcolor: "#020f1f", color: "#ffffff", height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography sx={{ fontSize: 14, color: "#94a3b8", mb: 2 }}>Live Configuration Preview</Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Box component="img" src={logoSrc} alt="Logo preview" sx={{ width: 52, height: 52, bgcolor: "#ffffff", borderRadius: 3, p: 0.7, objectFit: "contain" }} />

          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{companyForm.company_name || "Company Name"}</Typography>
            <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>{mineForm.mine_name || "Mine Name"}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 2 }} />

        <Stack spacing={1.3}>
          <Chip label={`Timezone: ${companyForm.timezone || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#ffffff" }} />
          <Chip label={`Language: ${companyForm.language || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#ffffff" }} />
          <Chip label={`Location: ${mineForm.location || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#ffffff" }} />
          <Chip label={`Mine Type: ${mineForm.mine_type || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#ffffff" }} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function BrandPreview({ companyForm, mineForm, logoSrc }) {
  const primary = companyForm.primary_color || "#16A34A";
  const secondary = companyForm.secondary_color || "#1E293B";

  return (
    <Card sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <Box sx={{ bgcolor: secondary, p: 3, color: "#ffffff" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box component="img" src={logoSrc} alt="Brand preview logo" sx={{ width: 56, height: 56, bgcolor: "#ffffff", borderRadius: 3, p: 0.8, objectFit: "contain" }} />
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{companyForm.company_name || "Company"}</Typography>
            <Typography sx={{ fontSize: 13, color: "#cbd5e1" }}>{mineForm.mine_name || "Mine"}</Typography>
          </Box>
        </Stack>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 900, mb: 2 }}>This is how users will see your product</Typography>

        <Button fullWidth variant="contained" sx={{ bgcolor: primary, borderRadius: 3, fontWeight: 900, "&:hover": { bgcolor: primary } }}>
          Primary Action
        </Button>

        <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: `${primary}18`, color: primary, fontWeight: 900 }}>
          Active navigation / KPI highlight
        </Box>
      </CardContent>
    </Card>
  );
}

export default Settings;