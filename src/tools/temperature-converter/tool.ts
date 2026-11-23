import { Thermometer } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'temperature-converter',
  nameKey: 'temperature.name',
  groupKey: 'groups.converters',
  descriptionKey: 'temperature.description',
  keywords: ['temperature', 'celsius', 'fahrenheit', 'kelvin', 'nhiệt độ'],
  icon: Thermometer,
  dataFlow: 'local',
  actions: {},
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
