"use client";

import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Flag, 
  CheckCircle 
} from "lucide-react";
import { Project, Task } from "../types";

interface CalendarViewProps {
  projects: Project[];
  tasks: Task[];
}

export function CalendarView({
  projects,
  tasks
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(i);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to find events on a given day
  const getEventsForDay = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayProjects = projects.filter(p => p.deadline === formattedDate);
    const dayTasks = tasks.filter(t => t.deadline === formattedDate);
    return { dayProjects, dayTasks };
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none bg-black text-zinc-100 min-h-screen text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
        <div>
          <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider font-mono">Operational Schedule</span>
          <h2 className="text-xl font-black text-white mt-1">Deadlines Calendar</h2>
          <p className="text-zinc-500 mt-1">Monitor target startup delivery dates and milestones.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={prevMonth}
            className="p-2 border border-zinc-900 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-white text-sm w-32 text-center">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 border border-zinc-900 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Calendar */}
      <div className="border border-zinc-800 bg-zinc-950 rounded-2xl overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 bg-zinc-900/40 border-b border-zinc-850 p-3 text-center font-bold text-zinc-500 uppercase tracking-widest text-[9px]">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-zinc-900 min-h-[450px]">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="bg-black/20 p-2 min-h-[90px]" />;
            }

            const { dayProjects, dayTasks } = getEventsForDay(day);
            const hasEvents = dayProjects.length > 0 || dayTasks.length > 0;

            return (
              <div key={idx} className={`p-3 min-h-[95px] flex flex-col justify-between hover:bg-zinc-900/10 transition ${
                hasEvents ? "bg-zinc-950/20" : ""
              }`}>
                <span className="font-bold font-mono text-zinc-400 text-xs leading-none">
                  {day}
                </span>

                <div className="space-y-1 mt-2 flex-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                  {dayProjects.map((p) => (
                    <div 
                      key={p.id}
                      className="p-1 text-[8px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded truncate"
                      title={`Project: ${p.name}`}
                    >
                      🚀 {p.startup_name}
                    </div>
                  ))}

                  {dayTasks.map((t) => (
                    <div 
                      key={t.id}
                      className="p-1 text-[8px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 rounded truncate"
                      title={`Task: ${t.name}`}
                    >
                      ✏️ {t.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
