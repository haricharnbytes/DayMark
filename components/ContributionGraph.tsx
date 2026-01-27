
import React, { useMemo } from 'react';

interface ContributionGraphProps {
  noteDates: string[];
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ noteDates }) => {
  const days = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    // Show last 26 weeks (approx 6 months) starting from the beginning of the week
    start.setDate(today.getDate() - (25 * 7) - today.getDay()); 
    
    const result = [];
    const current = new Date(start);
    
    while (current <= today) {
      const dateStr = current.getFullYear() + '-' + 
                      String(current.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(current.getDate()).padStart(2, '0');
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
        // Pad the last week if it's incomplete
        if (i === days.length - 1 && currentWeek.length < 7) {
          const padding = Array(7 - currentWeek.length).fill(null);
          currentWeek = [...currentWeek, ...padding];
        }
        w.push(currentWeek);
        currentWeek = [];
      }
    });
    return w;
  }, [days]);

  // Find the first week index for each month
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, i) => {
      const firstValidDay = week.find(d => d !== null);
      if (firstValidDay && firstValidDay.month !== lastMonth) {
        labels.push({
          label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2000, firstValidDay.month)),
          weekIndex: i
        });
        lastMonth = firstValidDay.month;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="w-full max-w-5xl mx-auto mb-20 px-4 fade-in">
      <div className="bg-white dark:bg-stone-900/40 backdrop-blur-md p-8 md:p-12 rounded-[3rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden group/graph transition-all duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#a31621] font-bold block">Resilience Timeline</span>
            <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 uppercase tracking-tight">Consistency Path</h2>
          </div>
          <div className="flex items-center gap-6 bg-stone-50/50 dark:bg-stone-800/20 px-5 py-2.5 rounded-2xl border border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-sm bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"></div>
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-black">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-sm bg-[#a31621] shadow-lg shadow-[#a31621]/20"></div>
              <span className="text-[9px] uppercase tracking-widest text-[#a31621] font-black">Marked</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Day of Week Labels */}
          <div className="flex flex-col justify-between pt-[22px] pb-[1px] text-[8px] uppercase tracking-widest text-stone-300 dark:text-stone-700 font-black h-[100px] select-none">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar">
            {/* Month Labels Grid - Synchronized with Week Grid */}
            <div className="relative mb-3 h-4 min-w-max">
              {monthLabels.map((m, i) => (
                <div 
                  key={i} 
                  className="absolute text-[9px] uppercase tracking-[0.2em] text-stone-400 font-black whitespace-nowrap transition-colors duration-500 group-hover/graph:text-stone-600 dark:group-hover/graph:text-stone-400"
                  style={{ left: `${m.weekIndex * 15}px` }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* The Grid */}
            <div className="flex gap-[4px] min-w-max">
              {weeks.map((week, weekIdx) => (
                <div 
                  key={weekIdx} 
                  className="flex flex-col gap-[4px] shrink-0"
                  style={{ animationDelay: `${weekIdx * 0.02}s` }}
                >
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`w-[11px] h-[11px] rounded-[2px] transition-all duration-300 relative group/tile
                        ${!day ? 'opacity-0 scale-0' : (
                          day.hasNote 
                          ? 'bg-[#a31621] hover:scale-[1.4] hover:shadow-xl hover:shadow-[#a31621]/30 z-10' 
                          : 'bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700/50 hover:bg-stone-200 dark:hover:bg-stone-700 hover:border-stone-300'
                        )}
                      `}
                    >
                      {day && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[9px] font-bold uppercase tracking-widest rounded-lg pointer-events-none opacity-0 group-hover/tile:opacity-100 transition-all scale-95 group-hover/tile:scale-100 whitespace-nowrap z-50 shadow-2xl border border-white/10 dark:border-black/10">
                          {day.label} {day.hasNote ? '• Marked' : ''}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-stone-900 dark:border-t-stone-100"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center text-stone-400 text-[8px] uppercase tracking-[0.4em] font-black opacity-50">
          <span>{weeks.length} Weeks Recorded</span>
          <span>Last Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
