import Link from 'next/link';
import { Clock, CalendarDays, Dices, Users, BarChart2, UserCircle } from 'lucide-react';

const shortcuts = [
  {
    navKey: 'time',
    href: '/time',
    icon: Clock,
    label: 'Log Time',
    description: 'Track hours, manage timers, submit timesheets',
  },
  {
    navKey: 'schedule',
    href: '/schedule',
    icon: CalendarDays,
    label: 'Schedule',
    description: 'Allocate team capacity and visualise the Gantt',
  },
  {
    navKey: 'estimation',
    href: '/estimation',
    icon: Dices,
    label: 'Estimation',
    description: 'Plan poker sessions with your team',
  },
  {
    navKey: null,
    href: '/portal',
    icon: Users,
    label: 'Client Portal',
    description: 'Review UAT feedback and manage client issues',
  },
  {
    navKey: 'reports',
    href: '/reports',
    icon: BarChart2,
    label: 'Reports',
    description: 'Analyse time, budgets, utilisation and expenses',
  },
  {
    navKey: 'team-overview',
    href: '/team',
    icon: UserCircle,
    label: 'Team',
    description: 'Manage members, roles, rates and permissions',
  },
];

interface Props {
  hiddenNavItems?: string[]
}

export function WorkflowShortcuts({ hiddenNavItems = [] }: Props) {
  const visible = shortcuts.filter(s => !s.navKey || !hiddenNavItems.includes(s.navKey));

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Navigate</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {visible.map(({ href, icon: Icon, label, description }) => (
          <Link key={href} href={href}>
            <div className="rounded-lg border border-border/40 bg-card p-4 h-full cursor-pointer hover:border-border hover:bg-muted/20 transition-colors">
              <Icon className="h-4 w-4 text-muted-foreground mb-2.5" />
              <p className="text-sm font-medium leading-none text-foreground">{label}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-snug">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
