import { CalendarClock } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'date-time-converter',
  nameKey: 'dateTime.name',
  groupKey: 'groups.converters',
  descriptionKey: 'dateTime.description',
  keywords: [
    'date', 'time', 'datetime', 'iso', 'iso8601', 'iso9075', 'rfc3339', 'rfc7231',
    'unix', 'timestamp', 'utc', 'mongo', 'objectid', 'excel',
    'ngày', 'giờ',
  ],
  icon: CalendarClock,
  dataFlow: 'local',
  actions: { convert: 'dateTime.action.convert' },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
