const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function fmtMoney(n: number): string {
  return currency.format(n);
}

export function fmtSignedMoney(n: number): string {
  const s = currency.format(Math.abs(n));
  return n >= 0 ? `+${s}` : `-${s}`;
}

export function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function fmtRatio(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function fmtOdds(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
