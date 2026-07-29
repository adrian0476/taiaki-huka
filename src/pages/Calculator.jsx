import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, AlertTriangle, TrendingDown } from "lucide-react";
import { Stepper } from "./components/ui/Stepper";
import { SettingsSheet } from "./components/SettingsSheet";
import { Koru, NihoRow } from "./components/motifs";
import { autoDetectToD, calculateDose, loadSettings, saveSettings } from "./lib/insulin";

const ToDToggle = ({ tod, setTod, auto, onAutoReset }) => (
  <div className="inline-flex items-center border border-neutral-800 p-1 bg-neutral-950" data-testid="tod-toggle">
    {["AM", "PM"].map((v) => {
      const active = tod === v;
      return (
        <button key={v} type="button" onClick={() => setTod(v)}
          className={`px-4 py-1.5 font-display text-xs tracking-[0.25em] font-bold transition-colors ${active ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"}`}
          data-testid={`tod-${v.toLowerCase()}-btn`}>{v}</button>
      );
    })}
    {!auto && (
      <button type="button" onClick={onAutoReset}
        className="ml-2 px-2 py-1 font-body text-[10px] tracking-widest uppercase text-neutral-500 hover:text-red-500"
        data-testid="tod-auto-reset" title="Reset to auto">auto</button>
    )}
  </div>
);

const StatusBadge = ({ result, settings }) => {
  if (result.isLow) return (
    <div className="inline-flex items-center gap-2 border border-amber-500/60 text-amber-300 bg-amber-500/10 px-3 py-1.5 font-body text-[10px] tracking-[0.2em] uppercase font-bold" data-testid="badge-low">
      <TrendingDown className="w-3.5 h-3.5" /> Low BG · Carbs reduced by {result.carbCorrection.toFixed(1)}g
    </div>
  );
  if (result.isHigh) return (
    <div className="inline-flex items-center gap-2 border border-red-600 text-white bg-red-600 px-3 py-1.5 font-body text-[10px] tracking-[0.2em] uppercase font-bold" data-testid="badge-high">
      <AlertTriangle className="w-3.5 h-3.5" /> High BG · +{result.doseCorrection.toFixed(2)} correction
    </div>
  );
  return (
    <div className="inline-flex items-center gap-2 border border-neutral-800 text-neutral-400 px-3 py-1.5 font-body text-[10px] tracking-[0.2em] uppercase font-bold" data-testid="badge-inrange">
      In range · {settings.lowThreshold}–{settings.highThreshold} mmol/L
    </div>
  );
};

export default function CalculatorPage() {
  const [settings, setSettingsState] = useState(() => loadSettings());
  const [bg, setBg] = useState(6);
  const [carbs, setCarbs] = useState(30);
  const [manualTod, setManualTod] = useState(null);
  const [autoTod, setAutoTod] = useState(autoDetectToD());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => {
    const id = setInterval(() => setAutoTod(autoDetectToD()), 60_000);
    return () => clearInterval(id);
  }, []);

  const tod = manualTod ?? autoTod;
  const result = useMemo(() => calculateDose({ bg, carbs, tod, settings }), [bg, carbs, tod, settings]);
  const timeLabel = new Date().toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-16 text-red-600/[0.06]"><Koru size={420} strokeWidth={1.5} /></div>
      <div className="pointer-events-none absolute -left-24 bottom-8 text-white/[0.03]"><Koru size={340} strokeWidth={1.5} /></div>
      <div className="niho-band" />
      <div className="max-w-xl mx-auto px-5 sm:px-8 pt-8 sm:pt-10 pb-14 relative">
        <header className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 bg-red-600 animate-pulse" />
              <span className="font-body text-[10px] tracking-[0.3em] uppercase font-bold text-neutral-500">Aotearoa · {timeLabel}</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter leading-none" data-testid="app-title">
              Taiaki<br /><span className="text-red-600">Huka.</span>
            </h1>
            <p className="font-body text-xs text-neutral-500 mt-2 tracking-wide">Kaitiaki o te huka toto — insulin bolus calculator.</p>
          </div>
          <button type="button" onClick={() => setSettingsOpen(true)}
            className="border border-neutral-800 hover:border-red-600 p-3 text-neutral-300 hover:text-red-500 transition-colors"
            aria-label="Open settings" data-testid="open-settings-btn">
            <Settings2 className="w-5 h-5" />
          </button>
        </header>

        <div className="mb-6 flex items-center justify-between">
          <ToDToggle tod={tod} setTod={setManualTod} auto={manualTod === null} onAutoReset={() => setManualTod(null)} />
          <span className="font-body text-[10px] tracking-[0.25em] uppercase text-neutral-500" data-testid="tod-source">
            {manualTod === null ? "auto-detected" : "manual override"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <Stepper label="Blood Glucose" unit="mmol / L" value={bg} onChange={setBg} step={0.5} precision={1} min={0} max={40} testIdPrefix="bg" />
          <Stepper label="Carbohydrates" unit="grams" value={carbs} onChange={setCarbs} step={1} precision={0} min={0} max={500} testIdPrefix="carbs" />
        </div>

        <div className="mb-4"><StatusBadge result={result} settings={settings} /></div>

        <div className="relative border border-neutral-800 bg-black">
          <NihoRow className="w-full h-3" />
          <div className="p-6 sm:p-8">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-body text-[10px] tracking-[0.3em] uppercase font-bold text-neutral-400">Insulin Dose</span>
              <span className="font-body text-[10px] tracking-[0.25em] uppercase text-neutral-500">{tod} · ratio {result.ratio.toFixed(1)}</span>
            </div>
            <div className="flex items-end gap-3 mb-4 min-h-[6rem]">
              <AnimatePresence mode="popLayout">
                <motion.span key={result.dose}
                  initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className="font-display tabular text-7xl sm:text-8xl font-black leading-none text-white"
                  data-testid="final-dose">{result.dose}</motion.span>
              </AnimatePresence>
              <span className="font-display text-xl sm:text-2xl font-bold text-red-600 pb-2">units</span>
            </div>
            <div className="grid grid-cols-3 border-t border-neutral-800 divide-x divide-neutral-800">
              <BreakdownCell label="Final Carbs" value={`${result.finalCarbs.toFixed(0)}g`} testId="breakdown-final-carbs" />
              <BreakdownCell label="Meal Dose" value={(result.ratio > 0 ? result.finalCarbs / result.ratio : 0).toFixed(2)} testId="breakdown-meal-dose" />
              <BreakdownCell label="Correction" value={result.doseCorrection.toFixed(2)} testId="breakdown-correction" />
            </div>
          </div>
        </div>

        <footer className="mt-8 flex items-center justify-between">
          <p className="font-body text-[10px] tracking-widest uppercase text-neutral-600 max-w-[70%] leading-relaxed">
            Not medical advice. Always cross-check with your care team.
          </p>
          <Koru size={28} strokeWidth={1.8} className="text-red-600/70" />
        </footer>
      </div>
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} setSettings={setSettingsState} />
    </div>
  );
}

const BreakdownCell = ({ label, value, testId }) => (
  <div className="px-3 py-3 first:pl-0 last:pr-0">
    <div className="font-body text-[9px] tracking-[0.25em] uppercase font-bold text-neutral-500 mb-1">{label}</div>
    <div className="font-display tabular text-lg font-bold text-white" data-testid={testId}>{value}</div>
  </div>
);
