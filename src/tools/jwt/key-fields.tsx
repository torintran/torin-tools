import { Select, Textarea, TextInput } from '@mantine/core';
import { useT } from '../../i18n/context.tsx';
import { jwtAlgorithms, type JwtAlgorithm, type KeyFormat } from './signature.ts';

export type KeyFieldsState = { algorithm: JwtAlgorithm; key: string; secretFormat: 'text' | 'base64url' };

export function selectedKey(fields: KeyFieldsState): { key: string; format: KeyFormat } {
  return { key: fields.key, format: fields.algorithm.startsWith('HS') ? fields.secretFormat : 'pem-jwk' };
}

export function JwtKeyFields({ fields, onChange, usage, disabled }: {
  fields: KeyFieldsState;
  onChange: (next: KeyFieldsState) => void;
  usage: 'sign' | 'verify';
  disabled: boolean;
}) {
  const t = useT();
  const usesSecret = fields.algorithm.startsWith('HS');

  return <div className="fields">
    <div className="tool-options jwt-key-options">
      <Select label={usage === 'sign' ? t('jwt.signAlg') : t('jwt.verifyAlg')}
        value={fields.algorithm} disabled={disabled} data={[...jwtAlgorithms]} onChange={(value) => {
          if (!value) return;
          const algorithm = value as JwtAlgorithm;
          onChange({ ...fields, algorithm, key: algorithm.slice(0, 2) === fields.algorithm.slice(0, 2) ? fields.key : '' });
        }} />
      {usesSecret && <Select label={t('jwt.secretFormat')} value={fields.secretFormat} disabled={disabled}
        data={[{ value: 'text', label: t('jwt.secretText') }, { value: 'base64url', label: t('jwt.secretB64') }]}
        onChange={(value) => { if (value) onChange({ ...fields, secretFormat: value === 'base64url' ? 'base64url' : 'text' }); }} />}
    </div>
    {usesSecret
      ? <TextInput label={t('jwt.sharedSecret')} type="password"
        autoComplete="off" spellCheck={false} autoCapitalize="off" autoCorrect="off"
        value={fields.key} maxLength={128_000} disabled={disabled}
        onChange={(event) => onChange({ ...fields, key: event.currentTarget.value })} />
      : <Textarea className="compact-editor"
        label={usage === 'sign' ? t('jwt.privateKey') : t('jwt.publicKey')}
        autoComplete="off" spellCheck={false} autoCapitalize="off" autoCorrect="off"
        value={fields.key} maxLength={128_000} disabled={disabled}
        onChange={(event) => onChange({ ...fields, key: event.currentTarget.value })} />}
  </div>;
}
