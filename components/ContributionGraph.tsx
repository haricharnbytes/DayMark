
import React, { useMemo } from 'react';

interface ContributionGraphProps {
  noteDates: string[];
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ noteDates }) => {
  const days = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    // Show approximately last 6 months for a clean desktop layout
    start.setDate(today.getDate() - (26 * 7) + (6 - today.getDay())); 
    
    const result = [];
    const current = new Date(start);
    
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        hasNote: noteDates.includes(dateStr),
        dayOfWeek: current.getDay(),
        month: current.getMonth(),
        label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [noteDates]);

  // Group days into weeks (columns)
  const weeks = useMemo(() => {
    const w = [];
    let currentWeek: any[] = [];
    
    days.forEach((day, i) => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6 || i === days.length - 1) {
        // Fill start of first week if necessary
        if (w.length === 0 && currentWeek.length < 7) {
          const blanks = Array(7 - currentWeek.length).fill(null);
          currentWeek = [...blanks, ...currentWeek];
        }
        w.push(currentWeek);
        currentWeek = [];
      }
    });
    return w;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstValidDay = week.find(d => d !== null);
      if (firstValidDay && firstValidDay.month !== lastMonth) {
        labels.push({
          label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2000, firstValidDay.month)),
          index: i
        });
        lastMonth = firstValidDay.month;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="w-full max-w-5xl mx-auto mb-20 px-4 fade-in">
      <div className="bg-white dark:bg-stone-900/40 backdrop-blur-md p-8 md:p-10 rounded-[3rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#a31621] font-bold block mb-2">Consistency Path</span>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 uppercase tracking-tight">Daily Mark History</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"></div>
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#a31621] shadow-sm shadow-[#a31621]/40"></div>
              <span className="text-[9px] uppercase tracking-widest text-[#a31621] font-bold">Marked</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Month Labels */}
          <div className="flex mb-2 text-[8px] uppercase tracking-widest text-stone-400 font-bold ml-8">
            {monthLabels.map((m, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? `${m.index * 14}px` : `${(m.index - monthLabels[i-1].index) * 14 - 24}px` }} className="w-6">
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day Labels */}
            <div className="flex flex-col gap-1 pr-2 text-[8px] uppercase tracking-widest text-stone-300 dark:text-stone-700 font-bold pt-1">
              <div className="h-2.5"></div>
              <div className="h-2.5">Mon</div>
              <div className="h-2.5"></div>
              <div className="h-2.5">Wed</div>
              <div className="h-2.5"></div>
              <div className="h-2.5">Fri</div>
              <div className="h-2.5"></div>
            </div>

            {/* Grid */}
            <div className="flex gap-1 overflow-x-auto pb-4 custom-scrollbar">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1 shrink-0">
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`w-2.5 h-2.5 rounded-[2px] transition-all duration-500 relative group/tile
                        ${!day ? 'bg-transparent' : (day.hasNote ? 'bg-[#a31621] hover:scale-125 hover:shadow-lg hover:shadow-[#a31621]/40 z-10' : 'bg-stone-100 dark:bg-stone-800 border border-stone-50 dark:border-stone-700/50 hover:border-stone-300 dark:hover:border-stone-500')}
                      `}
                    >
                      {day && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[8px] font-bold uppercase tracking-widest rounded pointer-events-none opacity-0 group-hover/tile:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10 dark:border-black/10">
                          {day.label} {day.hasNote ? '• Marked' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
