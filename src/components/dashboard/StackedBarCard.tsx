import React, { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from "recharts";
import { motion } from "framer-motion";
import clsx from "clsx";

export function StackedBarCard({
  data,
  title,
  icon: Icon,
  className,
}: {
  data: { name: string; value: number; color: string }[];
  title: string;
  icon: any;
  className?: string;
}) {
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Filter visible data
  const visibleData = data.filter((item) => !hiddenItems.has(item.name));
  const total = visibleData.reduce((sum, item) => sum + item.value, 0);

  // Transform data for stacked bar - single row with all values
  const stackedData = [
    {
      name: "Total",
      ...visibleData.reduce((acc, item) => ({ ...acc, [item.name]: item.value }), {}),
    },
  ];

  // Toggle legend item
  const handleLegendClick = (name: string) => {
    const newHidden = new Set(hiddenItems);
    if (newHidden.has(name)) {
      newHidden.delete(name);
    } else {
      // Don't allow hiding all items
      if (newHidden.size < data.length - 1) {
        newHidden.add(name);
      }
    }
    setHiddenItems(newHidden);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={clsx(
        "bg-bg-surface rounded-2xl border border-border-soft/80 shadow-glow",
        "hover:shadow-lg hover:border-brand-primary/10 transition-all duration-300",
        "overflow-hidden group flex flex-col p-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bg-surface-alt border border-border-soft/60 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-primary leading-tight">{title}</h3>
            <p className="text-[10px] text-text-secondary mt-0.5">{total.toLocaleString()} Total Cases</p>
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="h-14 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stackedData}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barSize={hoveredBar ? 48 : 40}
          >
            <XAxis type="number" domain={[0, total]} hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  const pct = ((Number(item.value) / total) * 100).toFixed(1);
                  return (
                    <div className="bg-white/95 backdrop-blur-sm border border-border-soft rounded-xl px-3 py-2 shadow-xl">
                      <p className="text-xs font-bold text-brand-primary">
                        {typeof item.dataKey === "string" || typeof item.dataKey === "number" ? item.dataKey : ""}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {Number(item.value).toLocaleString()} ({pct}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {visibleData.map((item, idx) => {
              const pct = (item.value / total) * 100;
              const isHovered = hoveredBar === item.name;
              return (
                <Bar
                  key={idx}
                  dataKey={item.name}
                  stackId="a"
                  fill={item.color}
                  radius={
                    visibleData.length === 1
                      ? [20, 20, 20, 20]
                      : idx === 0
                      ? [20, 0, 0, 20]
                      : idx === visibleData.length - 1
                      ? [0, 20, 20, 0]
                      : [0, 0, 0, 0]
                  }
                  animationDuration={500}
                  animationBegin={idx * 30}
                  style={{
                    filter: isHovered ? "brightness(1.15)" : "brightness(1)",
                    transition: "filter 0.2s ease",
                  }}
                  onMouseEnter={() => setHoveredBar(item.name)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {pct > 8 && (
                    <LabelList
                      dataKey={item.name}
                      position="center"
                      fill="white"
                      fontSize={9}
                      fontWeight="bold"
                      formatter={() => `${pct.toFixed(0)}%`}
                    />
                  )}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend - Center Aligned & Clickable */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-auto">
        {data.map((item, idx) => {
          const isHidden = hiddenItems.has(item.name);
          return (
            <button
              key={idx}
              onClick={() => handleLegendClick(item.name)}
              className={clsx(
                "flex items-center gap-1.5 cursor-pointer transition-all duration-200 select-none",
                isHidden ? "opacity-40 line-through" : "opacity-100 hover:scale-105"
              )}
            >
              <div
                className={clsx(
                  "w-2.5 h-2.5 rounded-full transition-transform",
                  !isHidden && "hover:scale-125"
                )}
                style={{ backgroundColor: isHidden ? "#ccc" : item.color }}
              />
              <span className={clsx(
                "text-[10px] font-medium transition-colors",
                isHidden ? "text-text-muted" : "text-text-primary hover:text-brand-primary"
              )}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default StackedBarCard;
