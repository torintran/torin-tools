/** Fill any field to show it on the About page. Empty values stay hidden. */
export const social = {
  github: '',
  x: '',
  telegram: '',
};

export const donate = {
  buyMeACoffee: '',
  paypal: '',
  momo: { phone: '', qr: '' },
  bankVn: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    qr: '',
  },
};

function filled(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function socialLinks() {
  return ([
    { id: 'github' as const, url: social.github },
    { id: 'x' as const, url: social.x },
    { id: 'telegram' as const, url: social.telegram },
  ]).filter((item): item is { id: typeof item.id; url: string } => filled(item.url))
    .map((item) => ({ ...item, url: item.url.trim() }));
}

export function hasSocial() {
  return socialLinks().length > 0;
}

export type DonateMethod =
  | { id: 'buyMeACoffee'; url: string }
  | { id: 'paypal'; url: string }
  | { id: 'momo'; phone?: string; qr?: string }
  | { id: 'bankVn'; bankName?: string; accountName?: string; accountNumber?: string; qr?: string };

export function donateMethods(): DonateMethod[] {
  const methods: DonateMethod[] = [];
  if (filled(donate.buyMeACoffee)) methods.push({ id: 'buyMeACoffee', url: donate.buyMeACoffee.trim() });
  if (filled(donate.paypal)) methods.push({ id: 'paypal', url: donate.paypal.trim() });
  const momoPhone = filled(donate.momo.phone) ? donate.momo.phone.trim() : undefined;
  const momoQr = filled(donate.momo.qr) ? donate.momo.qr.trim() : undefined;
  if (momoPhone || momoQr) methods.push({ id: 'momo', phone: momoPhone, qr: momoQr });
  const bankName = filled(donate.bankVn.bankName) ? donate.bankVn.bankName.trim() : undefined;
  const accountName = filled(donate.bankVn.accountName) ? donate.bankVn.accountName.trim() : undefined;
  const accountNumber = filled(donate.bankVn.accountNumber) ? donate.bankVn.accountNumber.trim() : undefined;
  const bankQr = filled(donate.bankVn.qr) ? donate.bankVn.qr.trim() : undefined;
  if (bankName || accountName || accountNumber || bankQr) {
    methods.push({ id: 'bankVn', bankName, accountName, accountNumber, qr: bankQr });
  }
  return methods;
}

export function hasDonate() {
  return donateMethods().length > 0;
}
