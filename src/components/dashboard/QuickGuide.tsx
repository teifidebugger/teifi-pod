"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dices, ClipboardCheck, DollarSign, CalendarDays } from "lucide-react";

const STORAGE_KEY = "teifi_dashboard_guide_open";
const DEFAULT_OPEN = ["planning-poker"];

const GUIDE_ITEMS = [
  {
    id: "planning-poker",
    icon: Dices,
    title: "Planning Poker workflow",
    steps: [
      "Create a session at /estimation and link it to a project",
      "Add issues or tasks to the session as rounds",
      "All participants vote on each round simultaneously",
      "Host reveals votes and confirms (or re-votes) the estimate",
      "Confirmed estimate saves story points directly to the task",
    ],
  },
  {
    id: "timesheet-approvals",
    icon: ClipboardCheck,
    title: "Timesheet approval process",
    steps: [
      "Team members log time and submit their weekly timesheets",
      "Managers navigate to /time/approvals to review submissions",
      "Each entry can be Approved or Rejected with an optional comment",
      "Rejected entries are returned to the member for correction",
      "Approved entries are locked and included in billing reports",
    ],
  },
  {
    id: "billing-rates",
    icon: DollarSign,
    title: "How billing rates work",
    steps: [
      "Project rate — one flat rate applied to all time entries on the project",
      "Tasks rate — each task carries its own hourly rate (falls back to project rate)",
      "People rate — each team member has a personal billable rate (with per-project overrides)",
      "None — project is non-billable; no rate is applied to any entries",
    ],
  },
  {
    id: "schedule-capacity",
    icon: CalendarDays,
    title: "Schedule & capacity planning",
    steps: [
      "Open /schedule to see the team timeline and Gantt chart",
      "Drag to create allocations; set type to SOFT (tentative) or HARD (confirmed)",
      "Assign allocations to members or placeholder roles",
      "Monitor team utilization at /reports/capacity",
      "Overbooked members are highlighted in red/orange; safe capacity in green",
    ],
  },
];

export function QuickGuide() {
  const [openItems, setOpenItems] = useState<string[]>(DEFAULT_OPEN);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOpenItems(parsed);
        }
      } catch {
        // ignore malformed stored value
      }
    }
    setMounted(true);
  }, []);

  function handleValueChange(value: string[]) {
    setOpenItems(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  // Avoid hydration mismatch — render nothing until localStorage is read
  if (!mounted) return null;

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={handleValueChange}
      className="w-full"
    >
      {GUIDE_ITEMS.map(({ id, icon: Icon, title, steps }) => (
        <AccordionItem key={id} value={id}>
          <AccordionTrigger className="gap-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {title}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="ml-6 mt-1 space-y-1.5 list-decimal text-sm text-muted-foreground">
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
