export const DEFAULTS = Object.freeze({
  purchase: 60000, renovation: 15000, contingency: 10, otherCosts: 3500,
  initialDebt: 0, arv: 100000, ltv: 75, refiCosts: 2000, rate: 7, years: 25,
  rent: 850, vacancy: 5, maintenance: 8, capex: 5, management: 0,
  taxes: 60, insurance: 20,
});

export const LIMITS = Object.freeze({
  purchase: [0, 100000000], renovation: [0, 100000000], contingency: [0, 100], otherCosts: [0, 100000000],
  initialDebt: [0, 100000000], arv: [0, 100000000], ltv: [0, 100], refiCosts: [0, 100000000],
  rate: [0, 50], years: [1, 50], rent: [0, 1000000], vacancy: [0, 100],
  maintenance: [0, 100], capex: [0, 100], management: [0, 100], taxes: [0, 1000000], insurance: [0, 1000000],
});

export function normalize(input = {}) {
  if (!input || typeof input !== 'object') input = {};
  return Object.fromEntries(Object.entries(DEFAULTS).map(([key, fallback]) => {
    const n = input[key] === '' || input[key] === null || typeof input[key] === 'boolean' ? NaN : Number(input[key]);
    const [min, max] = LIMITS[key];
    return [key, Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback];
  }));
}

export function payment(principal, annualRate, years) {
  if (principal <= 0) return 0;
  const months = years * 12;
  const monthly = annualRate / 1200;
  return monthly === 0 ? principal / months : principal * monthly / -Math.expm1(-months * Math.log1p(monthly));
}

export function calculate(input) {
  const p = normalize(input);
  const renovationReserve = p.renovation * p.contingency / 100;
  const totalCost = p.purchase + p.renovation + renovationReserve + p.otherCosts;
  const initialCash = totalCost - p.initialDebt;
  const newLoan = p.arv * p.ltv / 100;
  const cashRecovered = newLoan - p.initialDebt - p.refiCosts;
  const cashLeft = initialCash - cashRecovered;
  const equity = p.arv - newLoan;
  const monthlyPayment = payment(newLoan, p.rate, p.years);
  const vacancyCost = p.rent * p.vacancy / 100;
  const rentCollected = p.rent - vacancyCost;
  const maintenanceCost = p.rent * p.maintenance / 100;
  const capexCost = p.rent * p.capex / 100;
  const managementCost = rentCollected * p.management / 100;
  const expenses = maintenanceCost + capexCost + managementCost + p.taxes + p.insurance;
  const operatingIncome = rentCollected - expenses;
  const cashflow = operatingIncome - monthlyPayment;
  const rentCoefficient = (1 - p.vacancy / 100) * (1 - p.management / 100) - (p.maintenance + p.capex) / 100;
  const breakEvenRent = rentCoefficient > 0 ? (monthlyPayment + p.taxes + p.insurance) / rentCoefficient : null;
  const coverage = monthlyPayment > 0 ? operatingIncome / monthlyPayment : null;
  const invalidDebt = p.initialDebt > totalCost;
  return { ...p, renovationReserve, totalCost, initialCash, newLoan, cashRecovered, cashLeft, equity,
    monthlyPayment, vacancyCost, rentCollected, maintenanceCost, capexCost, managementCost,
    expenses, operatingIncome, cashflow, breakEvenRent, coverage, invalidDebt,
    recoveredPercent: initialCash > 0 ? cashRecovered / initialCash * 100 : null,
  };
}

export function stressScenarios(input) {
  const p = normalize(input);
  return [
    { name: 'Scenariul tău', values: p },
    { name: 'Evaluare −10%', values: { ...p, arv: p.arv * .9 } },
    { name: 'Renovare +20%', values: { ...p, renovation: p.renovation * 1.2 } },
    { name: 'Chirie −10%', values: { ...p, rent: p.rent * .9 } },
    { name: 'Dobândă +2 puncte', values: { ...p, rate: Math.min(50, p.rate + 2) } },
    { name: 'Toate în același timp', values: { ...p, arv: p.arv * .9, renovation: p.renovation * 1.2, rent: p.rent * .9, rate: Math.min(50, p.rate + 2) } },
  ].map(s => ({ name: s.name, result: calculate(s.values) }));
}
