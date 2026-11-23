import { Alert, Paper, Select, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useT } from '../../i18n/context.tsx';
import { convertTemperature, units, type TemperatureUnit } from './convert.ts';

const labels = { C: '°C', F: '°F', K: 'K' };

export default function TemperatureConverter() {
  const t = useT();
  const [input, setInput] = useState('0');
  const [unit, setUnit] = useState<TemperatureUnit>('C');
  const result = convertTemperature(input, unit);

  return <Paper className="panel">
    <div className="tool-options">
      <TextInput label={t('temperature.input')} value={input} maxLength={48} inputMode="decimal"
        onChange={(event) => setInput(event.currentTarget.value)} />
      <Select label={t('temperature.unit')} value={unit}
        data={units.map((value) => ({ value, label: labels[value] }))}
        onChange={(value) => { if (value === 'C' || value === 'F' || value === 'K') setUnit(value); }} />
    </div>
    {!result && input.trim() && <Alert role="status" color="red">{t('temperature.invalid')}</Alert>}
    <div className="tool-options">
      {units.map((value) => <TextInput key={value} label={labels[value]} readOnly
        value={result ? String(Number(result[value].toPrecision(12))) : ''} />)}
    </div>
  </Paper>;
}
