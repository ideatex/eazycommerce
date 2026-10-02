"use client";

import { useEffect, useState } from "react";

function remaining(end: number) {
  const diff = Math.max(0, end - Date.now());
  return {
    done: diff === 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

/** Live countdown to `endDate`. Renders nothing once the deal has ended. */
export default function DealCountdown({ endDate }: { endDate: string }) {
  const end = new Date(endDate).getTime();
  const [t, setT] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    if (Number.isNaN(end)) return;
    setT(remaining(end));
    const id = setInterval(() => setT(remaining(end)), 1000);
    return () => clearInterval(id);
  }, [end]);

  // Server render and first paint show placeholders so markup matches during hydration.
  const cells = [
    { label: "Days", value: t?.days },
    { label: "Hours", value: t?.hours },
    { label: "Minutes", value: t?.minutes },
    { label: "Seconds", value: t?.seconds },
  ];
  if (t?.done) return <p className="text-sm font-semibold text-white/80">This deal has ended.</p>;

  return (
    <div className="flex gap-3" role="timer" aria-label="Time left on this deal">
      {cells.map((c) => (
        <div key={c.label} className="min-w-[64px] rounded-xl bg-white/10 px-3 py-2.5 text-center">
          <div className="text-xl font-bold text-white tabular-nums">
            {c.value === undefined ? "--" : String(c.value).padStart(2, "0")}
          </div>
          <div className="text-[11px] text-white/70">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
