import React, { useState, useMemo, useCallback, useEffect } from "react";

/* ---------------------------------------------------------------
   LOCAL STORAGE PERSISTENCE
---------------------------------------------------------------- */
const LS_RECORDS_KEY = "punch:records";
const LS_SETTINGS_KEY = "punch:settings";

function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Clock, Calendar as CalendarIcon, Settings as SettingsIcon, LayoutDashboard, DollarSign,
  ChevronLeft, ChevronRight, X, Sun, Umbrella, Home, Star, Ban, Coffee,
} from "lucide-react";

/* ---------------------------------------------------------------
   TOKENS
---------------------------------------------------------------- */
const STATUS = {
  present: { label: "Present", color: "#4ED9C5", glow: "rgba(78,217,197,.35)", icon: Clock, deducts: false },
  half: { label: "Half Day", color: "#F2A93B", glow: "rgba(242,169,59,.35)", icon: Coffee, deducts: true },
  leave: { label: "Full Day Leave", color: "#F2677A", glow: "rgba(242,103,122,.35)", icon: Umbrella, deducts: true },
  paid: { label: "Paid Leave", color: "#8FD19E", glow: "rgba(143,209,158,.35)", icon: Umbrella, deducts: false },
  unpaid: { label: "Unpaid Leave", color: "#E14C63", glow: "rgba(225,76,99,.35)", icon: Ban, deducts: true },
  sunday: { label: "Sunday", color: "#6FA8FF", glow: "rgba(111,168,255,.35)", icon: Sun, deducts: false },
  holiday: { label: "Govt. Holiday", color: "#A99BFF", glow: "rgba(169,155,255,.35)", icon: Star, deducts: false },
  wfh: { label: "Work From Home", color: "#7FD1E8", glow: "rgba(127,209,232,.35)", icon: Home, deducts: false },
};
const STATUS_ORDER = ["present", "half", "leave", "paid", "unpaid", "sunday", "holiday", "wfh"];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const rnd = (n) => Math.round(n * 100) / 100;
const UI_TEXT = {
  en: {
    dashboard: "Dashboard",
    attendance: "Attendance",
    salary: "Salary",
    settings: "Settings",
    appSubtitle: "ATTENDANCE & PAYROLL",
    finalSalary: "Final Salary",
    deduction: "Deduction",
    overtime: "Overtime",
    monthlySalaryStatus: "Monthly Salary Status",
    salaryPaid: "Salary paid",
    salaryNotPaid: "Salary not paid yet",
    markPaid: "Mark Paid",
    markUnpaid: "Mark Unpaid",
    monthlySalary: "Monthly Salary",
    salaryDeduction: "Salary Deduction",
    overtimeEarnings: "Overtime Earnings",
    presentDays: "Present Days",
    halfDays: "Half Days",
    unpaidLeaves: "Unpaid Leaves",
    paidLeaves: "Paid Leaves",
    govtHolidays: "Govt. Holidays",
    salaryTrend: "Salary Trend",
    thisMonthsMix: "This Month's Mix",
    attendanceLeaveTrend: "Attendance & Leave Trend",
    overtimeDeductionTrend: "Overtime & Deduction Trend",
    present: "Present",
    leave: "Leave",
    halfDay: "Half Day",
    amountWeGet: "Amount We Get",
    totalPaidSalary: "Total Paid Salary",
    totalUnpaidSalary: "Total Unpaid Salary",
    monthWiseSalaryList: "Month-wise Salary List",
    monthRowSubtitle: "Each month shows salary, deductions, attendance, and a paid/unpaid toggle.",
    paid: "Paid",
    unpaid: "Unpaid",
    workingDays: "Working Days",
    status: "Status",
    checkIn: "Check-in",
    checkOut: "Check-out",
    overtimeHours: "Overtime Hours",
    reason: "Reason",
    remarks: "Remarks",
    deductionLabel: "Deduction",
    offSunday: "Off (Sunday)",
    appNameTitle: "App Name",
    websiteName: "Website Name",
    salaryTitle: "Salary",
    fixedMonthlySalary: "Fixed Monthly Salary (₹)",
    salaryCalculationMethod: "Salary Calculation Method",
    actualWorkingDays: "Actual working days in month",
    fixed30Days: "Fixed 30-day month",
    workingSchedule: "Working Schedule",
    saturdaysWorking: "Saturdays are working days",
    workingHoursPerDay: "Working Hours per Day",
    halfDayRule: "Half Day Rule",
    halfDayDeduction: "Half Day Deduction (%) — currently",
    defaultHalfDay: "Default is 50% of daily salary.",
    overtimeRate: "Overtime Rate",
    overtimeMultiplier: "Overtime Multiplier",
    dataStorage: "Data & Storage",
    storageText: "Attendance records and settings are saved to this browser's local storage, so they'll still be here next time you open the app on this device. They aren't synced anywhere else.",
    resetAllData: "Reset all attendance data",
    languageSettings: "Language",
    hindiToggleLabel: "Show website in Hindi",
    appNameNote: "This name will appear in the header and browser tab.",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    attendance: "उपस्थिति",
    salary: "वेतन",
    settings: "सेटिंग्स",
    appSubtitle: "उपस्थिति और वेतन",
    finalSalary: "अंतिम वेतन",
    deduction: "कटौती",
    overtime: "ओवरटाइम",
    monthlySalaryStatus: "मासिक वेतन स्थिति",
    salaryPaid: "वेतन दिया गया",
    salaryNotPaid: "वेतन अभी तक नहीं दिया गया",
    markPaid: "भुगतान किया",
    markUnpaid: "अभुगतान किया",
    monthlySalary: "मासिक वेतन",
    salaryDeduction: "वेतन कटौती",
    overtimeEarnings: "ओवरटाइम कमाई",
    presentDays: "उपस्थित दिन",
    halfDays: "आधे दिन",
    unpaidLeaves: "बिना भुगतान छुट्टियाँ",
    paidLeaves: "भुगतान वाली छुट्टियाँ",
    govtHolidays: "सरकारी अवकाश",
    salaryTrend: "वेतन रुझान",
    thisMonthsMix: "इस महीने का मिश्रण",
    attendanceLeaveTrend: "उपस्थिति और छुट्टी रुझान",
    overtimeDeductionTrend: "ओवरटाइम और कटौती रुझान",
    present: "उपस्थित",
    leave: "छुट्टी",
    halfDay: "आधा दिन",
    amountWeGet: "हम जो प्राप्त करते हैं",
    totalPaidSalary: "कुल भुगतान किया गया वेतन",
    totalUnpaidSalary: "कुल अप्रदत्त वेतन",
    monthWiseSalaryList: "मासिक वेतन सूची",
    monthRowSubtitle: "प्रत्येक महीने में वेतन, कटौती, उपस्थिति और भुगतान/अप्रदत्त विकल्प दिखाए जाते हैं।",
    paid: "भुगतान किया",
    unpaid: "अभुगतान",
    workingDays: "कार्य दिवस",
    status: "स्थिति",
    checkIn: "चेक-इन",
    checkOut: "चेक-आउट",
    overtimeHours: "ओवरटाइम घंटे",
    reason: "कारण",
    remarks: "टिप्पणियाँ",
    deductionLabel: "कटौती",
    offSunday: "रविवार की छुट्टी",
    appNameTitle: "ऐप का नाम",
    websiteName: "वेबसाइट का नाम",
    salaryTitle: "वेतन",
    fixedMonthlySalary: "निश्चित मासिक वेतन (₹)",
    salaryCalculationMethod: "वेतन गणना विधि",
    actualWorkingDays: "मास के वास्तविक कार्य दिवस",
    fixed30Days: "निश्चित 30-दिवसीय माह",
    workingSchedule: "कार्य अनुसूची",
    saturdaysWorking: "शनिवार कार्य दिवस हैं",
    workingHoursPerDay: "प्रति दिन कार्य घंटे",
    halfDayRule: "आधा दिन नियम",
    halfDayDeduction: "आधा दिन कटौती (%) — वर्तमान",
    defaultHalfDay: "डिफ़ॉल्ट दैनिक वेतन का 50% है।",
    overtimeRate: "ओवरटाइम दर",
    overtimeMultiplier: "ओवरटाइम गुणक",
    dataStorage: "डेटा और संग्रहण",
    storageText: "उपस्थिति रिकॉर्ड और सेटिंग्स इस ब्राउज़र की स्थानीय संग्रहण में सहेजे जाते हैं, इसलिए वे इस डिवाइस पर फिर से खोलने पर फिर से दिखाई देंगे। वे कहीं और सिंक नहीं होते।",
    resetAllData: "सभी उपस्थिति डेटा रीसेट करें",
    languageSettings: "भाषा",
    hindiToggleLabel: "वेबसाइट हिंदी में दिखाएँ",
    appNameNote: "यह नाम हेडर और ब्राउज़र टैब में दिखाई देगा।",
  },
};
const getUiText = (language, key) => (language === "hi" ? UI_TEXT.hi[key] ?? UI_TEXT.en[key] : UI_TEXT.en[key]);
const getStatusLabel = (status, language) => {
  if (language === "hi") {
    const map = { present: "उपस्थित", half: "आधा दिन", leave: "पूरा दिन की छुट्टी", paid: "भुगतान वाली छुट्टी", unpaid: "बिना भुगतान वाली छुट्टी", sunday: "रविवार", holiday: "सरकारी अवकाश", wfh: "घर से काम" };
    return map[status] || STATUS[status].label;
  }
  return STATUS[status].label;
};
const getDefaultStatus = (y, m, d, rec, settings) => {
  if (rec?.status) return rec.status;
  const dow = new Date(y, m, d).getDay();
  if (dow === 0) return "sunday";
  if (dow === 6 && !settings.saturdayWorking) return "sunday";
  return "present";
};

/* ---------------------------------------------------------------
   FONT / GLOBAL STYLE
---------------------------------------------------------------- */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      .punch-root {
        --bg: #10131A;
        --surface: #1A1F29;
        --surface-2: #212836;
        --border: rgba(255,255,255,.08);
        --ink: #EDEFF4;
        --ink-dim: #8B93A7;
        --teal: #4ED9C5;
        --amber: #F2A93B;
        --rose: #F2677A;
        font-family: 'Inter', sans-serif;
        color: var(--ink);
        background: var(--bg);
        background-image: radial-gradient(circle at 15% 0%, rgba(78,217,197,.08), transparent 40%),
                           radial-gradient(circle at 90% 10%, rgba(169,155,255,.06), transparent 35%);
        min-height: 100%;
        padding: 0;
      }
      .punch-root * { box-sizing: border-box; }
      .disp { font-family: 'Space Grotesk', sans-serif; }
      .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
      .punch-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; }
      .punch-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .punch-brand-meta { min-width: 0; }
      .punch-header-nav { display: flex; gap: 6px; background: var(--surface); padding: 5px; border-radius: 12px; border: 1px solid var(--border); flex-wrap: wrap; }
      .punch-tab-btn { justify-content: center; }
      .punch-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
      .punch-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
      .punch-btn { transition: transform .15s ease, box-shadow .15s ease, background .15s ease; }
      .punch-btn:hover { transform: translateY(-1px); }
      .punch-btn:active { transform: translateY(0px) scale(.98); }
      .day-cell { transition: box-shadow .15s ease, border-color .15s ease, transform .1s ease; }
      .day-cell:hover { border-color: rgba(255,255,255,.25) !important; transform: translateY(-1px); }
      .ticket-card { position: relative; }
      .ticket-card::before, .ticket-card::after {
        content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%;
        background: var(--bg); top: 50%; transform: translateY(-50%);
      }
      .ticket-card::before { left: -7px; }
      .ticket-card::after { right: -7px; }
      @keyframes pulseGlow { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
      .led { text-shadow: 0 0 12px currentColor, 0 0 28px currentColor; }
      input[type=range] { accent-color: var(--teal); }
      input, select { font-family: inherit; }
      .fade-in { animation: fadeIn .25s ease; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

      /* ---- responsive grids ---- */
      .grid-dash-main { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-bottom: 16px; }
      .grid-dash-sec { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .grid-settings { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 820px; }
      .grid-attendance { display: grid; grid-template-columns: 1fr; gap: 18px; }
      .grid-attendance.has-panel { grid-template-columns: 1fr 300px; }
      .led-readout { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
      .led-num { font-size: clamp(26px, 6vw, 40px); }

      @media (max-width: 860px) {
        .grid-dash-main, .grid-dash-sec, .grid-settings { grid-template-columns: 1fr; }
        .grid-attendance.has-panel { grid-template-columns: 1fr; }
        .punch-header { align-items: flex-start; }
        .punch-header-nav { width: 100%; }
        .punch-tab-btn { flex: 1 1 calc(50% - 6px); }
        .led-readout { flex-direction: column; align-items: flex-start; }
      }
      @media (max-width: 520px) {
        .punch-root { font-size: 14px; }
        .punch-header { margin-bottom: 20px; }
        .punch-header-nav { gap: 4px; padding: 4px; }
        .punch-tab-btn { flex: 1 1 100%; padding: 10px 12px; }
        .punch-brand .disp { font-size: 17px; }
        .punch-brand .mono { font-size: 9.5px; }
      }
    `}</style>
  );
}

/* ---------------------------------------------------------------
   MAIN APP
---------------------------------------------------------------- */
export default function PunchSalaryApp() {
  const today = new Date();
  const [tab, setTab] = useState("dashboard");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [records, setRecords] = useState(() => loadFromStorage(LS_RECORDS_KEY, {}));
  const [selectedDay, setSelectedDay] = useState(null);

  const [settings, setSettings] = useState(() => loadFromStorage(LS_SETTINGS_KEY, {
    appName: "SHINU.",
    monthlySalary: 5000,
    workingDaysPerWeek: 6,
    saturdayWorking: true,
    workingHoursPerDay: 8,
    halfDayPercent: 50,
    overtimeMultiplier: 1.5,
    calcMethod: "calendar", // calendar | fixed30 | actualWorking
    salaryPaidMonths: {},
    language: "en",
  }));

  // persist to localStorage whenever data changes
  useEffect(() => {
    try { window.localStorage.setItem(LS_RECORDS_KEY, JSON.stringify(records)); } catch {}
  }, [records]);

  useEffect(() => {
    try { window.localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  /* ---------- derived: working-day calendar logic ---------- */
  const isWorkingDay = useCallback((y, m, d) => {
    const dow = new Date(y, m, d).getDay(); // 0 Sun .. 6 Sat
    if (dow === 0) return false;
    if (dow === 6) return settings.saturdayWorking;
    return true;
  }, [settings.saturdayWorking]);

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const totalWorkingDays = useMemo(() => {
    if (settings.calcMethod === "fixed30") return 30;
    const dim = daysInMonth(viewYear, viewMonth);
    let count = 0;
    for (let d = 1; d <= dim; d++) if (isWorkingDay(viewYear, viewMonth, d)) count++;
    return count;
  }, [viewYear, viewMonth, settings.calcMethod, isWorkingDay]);

  const dailySalary = settings.monthlySalary / 30;
  const hourlySalary = dailySalary / (settings.workingHoursPerDay || 8);
  const halfDaySalary = dailySalary * (settings.halfDayPercent / 100);

  /* ---------- month summary ---------- */
  const summary = useMemo(() => {
    const dim = daysInMonth(viewYear, viewMonth);
    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
    let overtimeHours = 0;
    let deduction = 0;
    let overtimeBonus = 0;

    for (let d = 1; d <= dim; d++) {
      const k = keyOf(viewYear, viewMonth, d);
      const rec = records[k];
      const status = getDefaultStatus(viewYear, viewMonth, d, rec, settings);
      if (status && counts[status] !== undefined) counts[status]++;

      if (status === "half") deduction += halfDaySalary;
      if (status === "leave" || status === "unpaid") deduction += dailySalary;

      const ot = Number(rec?.overtimeHours || 0);
      if (ot > 0) {
        overtimeHours += ot;
        overtimeBonus += ot * hourlySalary * settings.overtimeMultiplier;
      }
    }

    const finalSalary = settings.monthlySalary - deduction + overtimeBonus;
    const attendedUnits = counts.present + counts.wfh + counts.paid + counts.half * 0.5;
    const attendancePct = totalWorkingDays > 0 ? (attendedUnits / totalWorkingDays) * 100 : 0;

    return { counts, deduction, overtimeHours, overtimeBonus, finalSalary, attendancePct };
  }, [records, viewYear, viewMonth, dailySalary, halfDaySalary, hourlySalary, settings, totalWorkingDays]);

  /* ---------- multi-month trend data (from whatever has records) ---------- */
  const trendData = useMemo(() => {
    const months = new Set();
    Object.keys(records).forEach((k) => months.add(k.slice(0, 7)));
    months.add(monthKey(viewYear, viewMonth));
    const sorted = Array.from(months).sort().slice(-6);

    return sorted.map((mk) => {
      const [y, m] = mk.split("-").map(Number);
      const dim = daysInMonth(y, m - 1);
      let present = 0, half = 0, leave = 0, unpaid = 0, paidL = 0, ot = 0, ded = 0, otBonus = 0;
      const dSal = settings.monthlySalary / 30;
      const hSal = dSal / (settings.workingHoursPerDay || 8);
      for (let d = 1; d <= dim; d++) {
        const rec = records[keyOf(y, m - 1, d)];
        const status = getDefaultStatus(y, m - 1, d, rec, settings);
        if (status === "present") present++;
        if (status === "half") { half++; ded += dSal * (settings.halfDayPercent / 100); }
        if (status === "leave") { leave++; ded += dSal; }
        if (status === "unpaid") { unpaid++; ded += dSal; }
        if (status === "paid") paidL++;
        if (rec?.overtimeHours) { ot += Number(rec.overtimeHours); otBonus += Number(rec.overtimeHours) * hSal * settings.overtimeMultiplier; }
      }
      const finalSal = settings.monthlySalary - ded + otBonus;
      return {
        month: `${MONTHS[m - 1].slice(0, 3)} ${String(y).slice(2)}`,
        monthKey: `${y}-${pad(m)}`,
        salary: rnd(finalSal), present, half, leave: leave + unpaid, overtime: rnd(ot), deduction: rnd(ded),
      };
    });
  }, [records, viewYear, viewMonth, settings, isWorkingDay]);

  const pieData = STATUS_ORDER.map((s) => ({ name: STATUS[s].label, value: summary.counts[s], color: STATUS[s].color })).filter((d) => d.value > 0);

  /* ---------- day update ---------- */
  const updateDay = (key, patch) => {
    setRecords((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  return (
    <div className="punch-root" style={{ width: "100%" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 60px" }}>
        <Header tab={tab} setTab={setTab} appName={settings.appName || "PUNCH."} language={settings.language} />
        {tab === "dashboard" && (
          <Dashboard
            settings={settings} summary={summary} trendData={trendData} pieData={pieData}
            viewYear={viewYear} viewMonth={viewMonth}
            setSettings={setSettings}
          />
        )}
        {tab === "attendance" && (
          <AttendancePage
            viewYear={viewYear} viewMonth={viewMonth} setViewYear={setViewYear} setViewMonth={setViewMonth}
            records={records} isWorkingDay={isWorkingDay} daysInMonth={daysInMonth}
            selectedDay={selectedDay} setSelectedDay={setSelectedDay} updateDay={updateDay}
            settings={settings} summary={summary} dailySalary={dailySalary} halfDaySalary={halfDaySalary}
          />
        )}
        {tab === "salary" && (
          <SalaryPage
            settings={settings} summary={summary}
            setSettings={setSettings}
            viewYear={viewYear} viewMonth={viewMonth}
            trendData={trendData}
          />
        )}
        {tab === "settings" && <SettingsPage settings={settings} setSettings={setSettings} setRecords={setRecords} />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   HEADER / NAV
---------------------------------------------------------------- */
function Header({ tab, setTab, appName, language }) {
  const ui = language === "hi" ? UI_TEXT.hi : UI_TEXT.en;
  const tabs = [
    { id: "dashboard", label: ui.dashboard, icon: LayoutDashboard },
    { id: "attendance", label: ui.attendance, icon: CalendarIcon },
    { id: "salary", label: ui.salary, icon: DollarSign },
    { id: "settings", label: ui.settings, icon: SettingsIcon },
  ];
  return (
    <div className="punch-header">
      <div className="punch-brand">
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#4ED9C5,#7FD1E8)",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(78,217,197,.35)", flexShrink: 0,
        }}>
          <Clock size={20} color="#10131A" strokeWidth={2.5} />
        </div>
        <div className="punch-brand-meta">
          <div className="disp" style={{ fontSize: 19, fontWeight: 700, letterSpacing: .3 }}>{appName}</div>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-dim)", letterSpacing: 1.5 }}>{ui.appSubtitle}</div>
        </div>
      </div>
      <div className="punch-header-nav">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} className="punch-btn punch-tab-btn" onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "'Inter',sans-serif",
              background: active ? "var(--teal)" : "transparent", color: active ? "#0B0E13" : "var(--ink-dim)",
            }}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   DASHBOARD
---------------------------------------------------------------- */
function KpiTicket({ label, value, sub, color }) {
  return (
    <div className="ticket-card" style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
      padding: "16px 18px", minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 600, letterSpacing: .6, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div className="disp mono" style={{ fontSize: 22, fontWeight: 700, color: color || "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Dashboard({ settings, summary, trendData, pieData, viewYear, viewMonth, setSettings }) {
  const ui = settings.language === "hi" ? UI_TEXT.hi : UI_TEXT.en;
  const monthKeyValue = monthKey(viewYear, viewMonth);
  const isSalaryPaid = Boolean(settings.salaryPaidMonths?.[monthKeyValue]);

  const toggleSalaryPaid = (paid) => {
    setSettings((prev) => ({
      ...prev,
      salaryPaidMonths: {
        ...(prev.salaryPaidMonths || {}),
        [monthKeyValue]: paid,
      },
    }));
  };

  return (
    <div className="fade-in">
      {/* LED readout */}
      <div className="led-readout" style={{
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 26px",
        marginBottom: 22,
      }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 1.5, marginBottom: 6 }}>
            {MONTHS[viewMonth].toUpperCase()} {viewYear} · {ui.finalSalary.toUpperCase()}
          </div>
          <div className="mono led led-num" style={{ fontWeight: 600, color: "#4ED9C5" }}>{inr(summary.finalSalary)}</div>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          <MiniStat label={ui.deduction} value={`-${inr(summary.deduction)}`} color="#F2677A" />
          <MiniStat label={ui.overtime} value={`+${inr(summary.overtimeBonus)}`} color="#F2A93B" />
          <MiniStat label={ui.attendance} value={`${rnd(summary.attendancePct)}%`} color="#4ED9C5" />
        </div>
      </div>


      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 22 }}>
        <KpiTicket label={ui.monthlySalary} value={inr(settings.monthlySalary)} />
        <KpiTicket label={ui.salaryDeduction} value={inr(summary.deduction)} color="#F2677A" />
        <KpiTicket label={ui.overtimeEarnings} value={inr(summary.overtimeBonus)} color="#F2A93B" />
        <KpiTicket label={ui.presentDays} value={summary.counts.present} color="#4ED9C5" />
        <KpiTicket label={ui.halfDays} value={summary.counts.half} color="#F2A93B" />
        <KpiTicket label={ui.unpaidLeaves} value={summary.counts.unpaid} color="#E14C63" />
        <KpiTicket label={ui.paidLeaves} value={summary.counts.paid} color="#8FD19E" />
        <KpiTicket label={ui.govtHolidays} value={summary.counts.holiday} color="#A99BFF" />
      </div>

      {/* charts */}
      <div className="grid-dash-main">
        <ChartCard title={ui.salaryTrend}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="month" stroke="#8B93A7" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B93A7" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1A1F29", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="salary" stroke="#4ED9C5" strokeWidth={2.5} dot={{ r: 3, fill: "#4ED9C5" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={ui.thisMonthsMix}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={2}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="var(--surface)" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1A1F29", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid-dash-sec">
        <ChartCard title={ui.attendanceLeaveTrend}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="month" stroke="#8B93A7" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B93A7" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1A1F29", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="present" name={ui.present} fill="#4ED9C5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="leave" name={ui.leave} fill="#F2677A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="half" name={ui.halfDay} fill="#F2A93B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={ui.overtimeDeductionTrend}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="month" stroke="#8B93A7" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B93A7" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1A1F29", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="overtime" name={ui.overtimeHours} stroke="#F2A93B" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="deduction" name={`${ui.deduction} ₹`} stroke="#F2677A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--ink-dim)", fontWeight: 600, letterSpacing: .5, textTransform: "uppercase" }}>{label}</div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 16px 6px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-dim)", marginBottom: 4, letterSpacing: .3 }}>{title}</div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------
   SALARY PAGE
---------------------------------------------------------------- */
function SalaryPage({ settings, summary, setSettings, viewYear, viewMonth, trendData }) {
  const ui = settings.language === "hi" ? UI_TEXT.hi : UI_TEXT.en;
  const monthRows = trendData?.length
    ? trendData.map((item) => ({
        month: item.month,
        monthKey: item.monthKey,
        salary: item.salary,
        deduction: item.deduction,
        present: item.present,
        half: item.half,
        leave: item.leave,
      }))
    : [{
        month: `${MONTHS[viewMonth].slice(0, 3)} ${String(viewYear).slice(2)}`,
        monthKey: monthKey(viewYear, viewMonth),
        salary: summary.finalSalary,
        deduction: summary.deduction,
        present: summary.counts.present,
        half: summary.counts.half,
        leave: summary.counts.leave + summary.counts.unpaid,
      }];

  const togglePaid = (monthKeyValue, paid) => {
    setSettings((prev) => ({
      ...prev,
      salaryPaidMonths: {
        ...(prev.salaryPaidMonths || {}),
        [monthKeyValue]: paid,
      },
    }));
  };

  const totalPaidSalary = monthRows.reduce((sum, item) => sum + (Boolean(settings.salaryPaidMonths?.[item.monthKey]) ? item.salary : 0), 0);
  const totalUnpaidSalary = monthRows.reduce((sum, item) => sum + (!Boolean(settings.salaryPaidMonths?.[item.monthKey]) ? item.salary : 0), 0);

  return (
    <div className="fade-in" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 20, boxShadow: "0 18px 45px rgba(0,0,0,.2)" }}>
      <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg, rgba(78,217,197,.16), rgba(127,209,232,.08))", border: "1px solid rgba(78,217,197,.16)" }}>
        <div className="disp" style={{ fontSize: 18, fontWeight: 700 }}>{ui.monthWiseSalaryList}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-dim)", marginTop: 4 }}>{ui.monthRowSubtitle}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: 0.6 }}>{ui.totalPaidSalary}</div>
          <div className="disp mono" style={{ fontSize: 18, fontWeight: 700, color: "#4ED9C5", marginTop: 6 }}>{inr(totalPaidSalary)}</div>
        </div>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: 0.6 }}>{ui.totalUnpaidSalary}</div>
          <div className="disp mono" style={{ fontSize: 18, fontWeight: 700, color: "#F2A93B", marginTop: 6 }}>{inr(totalUnpaidSalary)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {monthRows.map((item, index) => {
          const paid = Boolean(settings.salaryPaidMonths?.[item.monthKey]);
          return (
            <div key={`${item.month}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "13px 14px" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{item.month}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 3 }}>
                  {ui.present} {item.present || 0} • {ui.halfDay} {item.half || 0} • {ui.leave} {item.leave || 0}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div className="disp mono" style={{ fontSize: 15.5, fontWeight: 700, color: "#4ED9C5" }}>{inr(item.salary)}</div>
                  <div style={{ fontSize: 11.5, color: "#F2677A", marginTop: 2 }}>Ded {inr(item.deduction)}</div>
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <button className="punch-btn" onClick={() => togglePaid(item.monthKey, true)} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${paid ? "#4ED9C5" : "var(--border)"}`, background: paid ? "#4ED9C522" : "var(--surface)", color: paid ? "#4ED9C5" : "var(--ink-dim)", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                    {ui.paid}
                  </button>
                  <button className="punch-btn" onClick={() => togglePaid(item.monthKey, false)} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${!paid ? "#F2A93B" : "var(--border)"}`, background: !paid ? "#F2A93B22" : "var(--surface)", color: !paid ? "#F2A93B" : "var(--ink-dim)", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                    {ui.unpaid}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ATTENDANCE PAGE
---------------------------------------------------------------- */
function AttendancePage({
  viewYear, viewMonth, setViewYear, setViewMonth, records, isWorkingDay, daysInMonth,
  selectedDay, setSelectedDay, updateDay, settings, summary, dailySalary, halfDaySalary,
}) {
  const dim = daysInMonth(viewYear, viewMonth);
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  const shiftMonth = (dir) => {
    let m = viewMonth + dir, y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y);
  };

  const selKey = selectedDay ? keyOf(viewYear, viewMonth, selectedDay) : null;
  const selRec = selKey ? records[selKey] : null;

  return (
    <div className={`fade-in grid-attendance${selectedDay ? " has-panel" : ""}`}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="punch-btn" onClick={() => shiftMonth(-1)} style={navBtnStyle}><ChevronLeft size={16} /></button>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, minWidth: 150, textAlign: "center" }}>{MONTHS[viewMonth]} {viewYear}</div>
            <button className="punch-btn" onClick={() => shiftMonth(1)} style={navBtnStyle}><ChevronRight size={16} /></button>
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>
            {getUiText(settings.language, "workingDays")}: <span style={{ color: "var(--ink)" }}>{summary && Object.values(summary.counts).length ? null : null}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="mono" style={{ textAlign: "center", fontSize: 11, color: "var(--ink-dim)", padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = keyOf(viewYear, viewMonth, d);
            const rec = records[k];
            const status = getDefaultStatus(viewYear, viewMonth, d, rec, settings);
            const meta = status ? STATUS[status] : null;
            const isToday = new Date().toDateString() === new Date(viewYear, viewMonth, d).toDateString();
            const isSelected = selectedDay === d;
            return (
              <button
                key={i}
                className="day-cell"
                onClick={() => setSelectedDay(d)}
                style={{
                  aspectRatio: "1", borderRadius: 9, cursor: "pointer", position: "relative",
                  background: meta ? meta.color + "22" : "var(--surface-2)",
                  border: isSelected ? "1.5px solid #4ED9C5" : `1px solid ${meta ? meta.color + "55" : "var(--border)"}`,
                  boxShadow: isToday ? "0 0 0 2px rgba(78,217,197,.4) inset" : "none",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                }}
              >
                <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: meta ? meta.color : "var(--ink-dim)" }}>{d}</span>
                {rec?.overtimeHours > 0 && <Star size={8} color="#F2A93B" fill="#F2A93B" style={{ position: "absolute", top: 3, right: 3 }} />}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          {STATUS_ORDER.map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ink-dim)" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS[s].color, display: "inline-block" }} />
              {getStatusLabel(s, settings.language)}
            </div>
          ))}
        </div>
      </div>

      {selectedDay && (
        <DayPanel
          day={selectedDay} month={viewMonth} year={viewYear} rec={selRec}
          onChange={(patch) => updateDay(selKey, patch)}
          onClose={() => setSelectedDay(null)}
          dailySalary={dailySalary} halfDaySalary={halfDaySalary}
          settings={settings}
        />
      )}
    </div>
  );
}

const navBtnStyle = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)",
  color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

function DayPanel({ day, month, year, rec, onChange, onClose, dailySalary, halfDaySalary, settings }) {
  const dateStr = `${MONTHS[month]} ${day}, ${year}`;
  const status = getDefaultStatus(year, month, day, rec, settings);
  const isSunday = new Date(year, month, day).getDay() === 0;
  return (
    <div className="fade-in" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, height: "fit-content" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="disp" style={{ fontWeight: 700, fontSize: 15 }}>{dateStr}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-dim)", cursor: "pointer" }}><X size={17} /></button>
      </div>

      <FieldLabel>{getUiText(settings.language, "status")}</FieldLabel>
      {isSunday ? (
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          <button
            className="punch-btn"
            onClick={() => onChange({ status: "sunday" })}
            style={{
              fontSize: 12, padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 600,
              border: `1px solid ${status === "sunday" ? STATUS.sunday.color : "var(--border)"}`,
              background: status === "sunday" ? STATUS.sunday.color + "22" : "var(--surface-2)",
              color: status === "sunday" ? STATUS.sunday.color : "var(--ink-dim)",
            }}
          >
            {getUiText(settings.language, "offSunday")}
          </button>
          <button
            className="punch-btn"
            onClick={() => onChange({ status: "leave" })}
            style={{
              fontSize: 12, padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 600,
              border: `1px solid ${status === "leave" ? STATUS.leave.color : "var(--border)"}`,
              background: status === "leave" ? STATUS.leave.color + "22" : "var(--surface-2)",
              color: status === "leave" ? STATUS.leave.color : "var(--ink-dim)",
            }}
          >
            {getUiText(settings.language, "leave")}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              className="punch-btn"
              onClick={() => onChange({ status: s })}
              style={{
                fontSize: 11.5, padding: "7px 6px", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                border: `1px solid ${status === s ? STATUS[s].color : "var(--border)"}`,
                background: status === s ? STATUS[s].color + "22" : "var(--surface-2)",
                color: status === s ? STATUS[s].color : "var(--ink-dim)",
              }}
            >
              {getStatusLabel(s, settings.language)}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <FieldLabel>{getUiText(settings.language, "checkIn")}</FieldLabel>
          <input type="time" value={rec?.checkIn || ""} onChange={(e) => onChange({ checkIn: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>{getUiText(settings.language, "checkOut")}</FieldLabel>
          <input type="time" value={rec?.checkOut || ""} onChange={(e) => onChange({ checkOut: e.target.value })} style={inputStyle} />
        </div>
      </div>

      <FieldLabel>{getUiText(settings.language, "overtimeHours")}</FieldLabel>
      <input
        type="number" min="0" step="0.5" placeholder="0"
        value={rec?.overtimeHours || ""} onChange={(e) => onChange({ overtimeHours: e.target.value })}
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      <FieldLabel>{getUiText(settings.language, "reason")}</FieldLabel>
      <input
        type="text" placeholder="e.g. Fever, family event"
        value={rec?.reason || ""} onChange={(e) => onChange({ reason: e.target.value })}
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      <FieldLabel>{getUiText(settings.language, "remarks")}</FieldLabel>
      <textarea
        placeholder="Any additional notes"
        value={rec?.remarks || ""} onChange={(e) => onChange({ remarks: e.target.value })}
        rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }}
      />

      {(status === "half" || status === "leave" || status === "unpaid") && (
        <div className="mono" style={{ fontSize: 11.5, color: "#F2677A", background: "#F2677A18", padding: "8px 10px", borderRadius: 8 }}>
          {getUiText(settings.language, "deductionLabel")}: -{inr(status === "half" ? halfDaySalary : dailySalary)}
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-dim)", letterSpacing: .5, textTransform: "uppercase", marginBottom: 5 }}>{children}</div>;
}

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 13, outline: "none",
};

/* ---------------------------------------------------------------
   SETTINGS PAGE
---------------------------------------------------------------- */
function SettingsPage({ settings, setSettings, setRecords }) {
  const ui = settings.language === "hi" ? UI_TEXT.hi : UI_TEXT.en;
  const set = (patch) => setSettings((prev) => ({ ...prev, ...patch }));

  const handleReset = () => {
    if (!window.confirm("This clears all attendance records stored on this device. Continue?")) return;
    setRecords({});
    try {
      window.localStorage.removeItem(LS_RECORDS_KEY);
    } catch {}
  };

  return (
    <div className="fade-in grid-settings">
      <SettingsCard title={ui.appNameTitle}>
        <FieldLabel>{ui.websiteName}</FieldLabel>
        <input type="text" value={settings.appName || ""} onChange={(e) => set({ appName: e.target.value })} placeholder="PUNCH." style={{ ...inputStyle, marginBottom: 14 }} />
        <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{ui.appNameNote}</div>
      </SettingsCard>

      <SettingsCard title={ui.salaryTitle}>
        <FieldLabel>{ui.fixedMonthlySalary}</FieldLabel>
        <input type="number" value={settings.monthlySalary} onChange={(e) => set({ monthlySalary: Number(e.target.value) })} style={{ ...inputStyle, marginBottom: 14 }} />
        <FieldLabel>{ui.salaryCalculationMethod}</FieldLabel>
        <select value={settings.calcMethod} onChange={(e) => set({ calcMethod: e.target.value })} style={inputStyle}>
          <option value="calendar">{ui.actualWorkingDays}</option>
          <option value="fixed30">{ui.fixed30Days}</option>
        </select>
      </SettingsCard>

      <SettingsCard title={ui.workingSchedule}>
        <ToggleRow label={ui.saturdaysWorking} checked={settings.saturdayWorking} onChange={(v) => set({ saturdayWorking: v, workingDaysPerWeek: v ? 6 : 5 })} />
        <ToggleRow label={ui.hindiToggleLabel} checked={settings.language === "hi"} onChange={(v) => set({ language: v ? "hi" : "en" })} />
        <FieldLabel>{ui.workingHoursPerDay}</FieldLabel>
        <input type="number" min="1" max="24" value={settings.workingHoursPerDay} onChange={(e) => set({ workingHoursPerDay: Number(e.target.value) })} style={inputStyle} />
      </SettingsCard>

      <SettingsCard title={ui.halfDayRule}>
        <FieldLabel>{ui.halfDayDeduction.replace("%", `${settings.halfDayPercent}%`)}</FieldLabel>
        <input type="range" min="10" max="100" step="5" value={settings.halfDayPercent} onChange={(e) => set({ halfDayPercent: Number(e.target.value) })} style={{ width: "100%" }} />
        <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 6 }}>{ui.defaultHalfDay}</div>
      </SettingsCard>

      <SettingsCard title={ui.overtimeRate}>
        <FieldLabel>{ui.overtimeMultiplier}</FieldLabel>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 1.5, 2].map((m) => (
            <button key={m} className="punch-btn" onClick={() => set({ overtimeMultiplier: m })}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                border: `1px solid ${settings.overtimeMultiplier === m ? "#F2A93B" : "var(--border)"}`,
                background: settings.overtimeMultiplier === m ? "#F2A93B22" : "var(--surface-2)",
                color: settings.overtimeMultiplier === m ? "#F2A93B" : "var(--ink-dim)",
              }}>
              {m}×
            </button>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title={ui.dataStorage}>
        <div style={{ fontSize: 12.5, color: "var(--ink-dim)", lineHeight: 1.5, marginBottom: 14 }}>
          {ui.storageText}
        </div>
        <button
          className="punch-btn"
          onClick={handleReset}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
            border: "1px solid #F2677A55", background: "#F2677A18", color: "#F2677A",
          }}
        >
          {ui.resetAllData}
        </button>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
      <div className="disp" style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: "var(--ink)" }}>{label}</div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 20, border: "none", cursor: "pointer", position: "relative",
          background: checked ? "#4ED9C5" : "var(--surface-2)", transition: "background .15s",
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: "50%",
          background: "#0B0E13", transition: "left .15s",
        }} />
      </button>
    </div>
  );
}
