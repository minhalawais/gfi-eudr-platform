import React, { useMemo, useState } from "react";
import { Card, Tag } from "@/components/ui";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import clsx from "clsx";

// reuse same palette as export map for visual parity
const PIE_COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444", "#6366f1"];

function parseAnnualVolume(value: string | number): number {
  if (typeof value === "number") return value;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

export function ExportProductVolumeCard({ products }: { products: any[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  const data = useMemo(() => {
    const arr = products
      .map((p, idx) => {
        const value = parseAnnualVolume(p.annualVolume);
        return {
          label: p.name ?? p.label ?? `Product ${idx + 1}`,
          value,
          color: PIE_COLORS[idx % PIE_COLORS.length],
        };
      })
      .filter((d) => d.value > 0);

    return arr;
  }, [products]);

  const visibleData = useMemo(() => data.filter((item) => !hiddenItems.has(item.label)), [data, hiddenItems]);
  const total = useMemo(() => visibleData.reduce((sum, item) => sum + item.value, 0), [visibleData]);

  const handleLegendClick = (label: string) => {
    const newHidden = new Set(hiddenItems);
    if (newHidden.has(label)) {
      newHidden.delete(label);
    } else if (newHidden.size < data.length - 1) {
      newHidden.add(label);
    }
    setHiddenItems(newHidden);
  };

  const onPieEnter = (_: any, index: number) => setActiveIndex(index);
  const onMouseLeave = () => setActiveIndex(null);

  return (
    <Card className="relative flex h-full flex-col gap-2 overflow-hidden border border-border-soft bg-bg-surface p-4 shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold leading-snug text-brand-primary">Export Volume Share</h3>
        <Tag tone="neutral" className="shrink-0 text-[10px] font-bold">{data.length} products</Tag>
      </div>

      <div className="border-b border-border-soft/60" />

      <div className="flex-1 flex items-center justify-between min-h-0 gap-6 mt-2">
        {/* Chart */}
        <div className="flex-1 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={visibleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={activeIndex !== null ? 100 : 90}
                paddingAngle={2}
                dataKey="value"
                nameKey="label"
                onMouseEnter={onPieEnter}
                onMouseLeave={onMouseLeave}
                animationDuration={300}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-(midAngle || 0) * RADIAN);
                  const y = cy + radius * Math.sin(-(midAngle || 0) * RADIAN);
                  return (percent || 0) > 0.08 ? (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight="bold">
                      {`${((percent || 0) * 100).toFixed(0)}%`}
                    </text>
                  ) : null;
                }}
                labelLine={false}
              >
                {visibleData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.label}`}
                    fill={entry.color}
                    stroke="none"
                    style={{
                      filter: activeIndex === index ? "brightness(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.2))" : "brightness(1)",
                      transform: activeIndex === index ? "scale(1.05)" : "scale(1)",
                      transformOrigin: "center",
                      transition: "all 0.2s ease",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const pct = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border border-border-soft rounded-xl px-3 py-2 shadow-xl">
                        <p className="text-xs font-bold text-brand-primary">{item.label}</p>
                        <p className="text-[10px] text-text-secondary">
                          {item.value.toLocaleString()} tons ({pct}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <div className="w-28 flex flex-col gap-1.5 pl-2 select-none max-h-[220px] overflow-y-auto">
          {data.map((item, idx) => {
            const isHidden = hiddenItems.has(item.label);
            return (
              <button
                key={idx}
                onClick={() => handleLegendClick(item.label)}
                onMouseEnter={() => !isHidden && setActiveIndex(visibleData.findIndex((d) => d.label === item.label))}
                onMouseLeave={() => setActiveIndex(null)}
                className={clsx(
                  "flex items-center gap-1.5 text-left transition-all duration-200",
                  isHidden ? "opacity-40" : "opacity-100 hover:scale-105"
                )}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isHidden ? "#ccc" : item.color }}
                />
                <span className={clsx(
                  "text-[9px] font-medium leading-tight truncate max-w-[80px]",
                  isHidden ? "text-text-muted line-through" : "text-text-primary"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default ExportProductVolumeCard;
