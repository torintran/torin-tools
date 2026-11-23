import { Button, Paper } from '@mantine/core';
import { Coffee, Landmark, Send, Smartphone, Wallet } from 'lucide-react';
import { useT } from '../i18n/context.tsx';
import { BrandIcon } from './brand-icons.tsx';
import { donateMethods, hasDonate, hasSocial, socialLinks } from './support-config.ts';

export function About() {
  const t = useT();
  const social = socialLinks();
  const methods = donateMethods();

  return <>
    <Paper component="section" className="panel downloads">
      <p>{t('about.summary')}</p>
      <p>{t('about.credit')}</p>
    </Paper>

    {hasSocial() && <Paper component="section" className="panel downloads" aria-labelledby="about-social">
      <h2 id="about-social">{t('about.socialTitle')}</h2>
      <div className="actions support-social">
        {social.map(({ id, url }) => {
          const label = t(id === 'github' ? 'about.github' : id === 'x' ? 'about.x' : 'about.telegram');
          const icon = id === 'telegram'
            ? <Send size={18} aria-hidden="true" />
            : <BrandIcon kind={id} size={18} />;
          return <Button key={id} component="a" href={url} target="_blank" rel="noopener noreferrer"
            leftSection={icon}>{label}</Button>;
        })}
      </div>
    </Paper>}

    {hasDonate() && <Paper component="section" className="panel downloads" aria-labelledby="about-support">
      <h2 id="about-support">{t('about.supportTitle')}</h2>
      <p>{t('about.supportIntro')}</p>
      <ul className="support-methods">
        {methods.map((method) => {
          if (method.id === 'buyMeACoffee') {
            return <li key={method.id}>
              <Button component="a" href={method.url} target="_blank" rel="noopener noreferrer"
                leftSection={<Coffee size={18} aria-hidden="true" />}>{t('about.buyMeACoffee')}</Button>
            </li>;
          }
          if (method.id === 'paypal') {
            return <li key={method.id}>
              <Button component="a" href={method.url} target="_blank" rel="noopener noreferrer"
                leftSection={<Wallet size={18} aria-hidden="true" />}>{t('about.paypal')}</Button>
            </li>;
          }
          if (method.id === 'momo') {
            return <li key={method.id} className="support-method">
              <h3><Smartphone size={18} aria-hidden="true" /> {t('about.momo')}</h3>
              {method.phone && <p>{t('about.momoPhone', { phone: method.phone })}</p>}
              {method.qr && <img className="support-qr" src={method.qr} alt={t('about.qrAlt')} width={180} height={180} />}
            </li>;
          }
          return <li key={method.id} className="support-method">
            <h3><Landmark size={18} aria-hidden="true" /> {t('about.bankVn')}</h3>
            {method.bankName && <p>{t('about.bankName', { name: method.bankName })}</p>}
            {method.accountName && <p>{t('about.accountName', { name: method.accountName })}</p>}
            {method.accountNumber && <p>{t('about.accountNumber', { number: method.accountNumber })}</p>}
            {method.qr && <img className="support-qr" src={method.qr} alt={t('about.qrAlt')} width={180} height={180} />}
          </li>;
        })}
      </ul>
    </Paper>}

    <Paper component="section" className="panel downloads" aria-labelledby="about-license">
      <h2 id="about-license">{t('about.license')}</h2>
      <p>{t('about.licenseText')}</p>
    </Paper>
  </>;
}
