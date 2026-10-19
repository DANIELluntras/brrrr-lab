import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, calculate, payment, normalize, stressScenarios } from '../docs/model.js';

test('cazul din lecție: 80.000 investiți, 73.000 recuperați și datorie de 75.000', () => {
  const r = calculate(DEFAULTS);
  assert.equal(r.totalCost, 80000);
  assert.equal(r.initialCash, 80000);
  assert.equal(r.renovationReserve, 1500);
  assert.equal(r.newLoan, 75000);
  assert.equal(r.cashRecovered, 73000);
  assert.equal(r.cashLeft, 7000);
  assert.equal(r.equity, 25000);
  assert.ok(Math.abs(r.monthlyPayment - 530.0843978) < .01);
  assert.equal(r.rentCollected, 807.5);
  assert.equal(r.expenses, 190.5);
  assert.ok(Math.abs(r.cashflow - 86.9156022) < .01);
});

test('datoria veche reduce atât aportul inițial, cât și numerarul recuperat', () => {
  const r = calculate({ ...DEFAULTS, initialDebt: 40000 });
  assert.equal(r.initialCash, 40000);
  assert.equal(r.cashRecovered, 33000);
  assert.equal(r.cashLeft, 7000);
  assert.equal(r.newLoan, 75000);
});

test('când creditul nu acoperă refinanțarea, diferența este un aport suplimentar', () => {
  const r = calculate({ ...DEFAULTS, initialDebt: 79000 });
  assert.equal(r.cashRecovered, -6000);
  assert.equal(r.initialCash, 1000);
  assert.equal(r.cashLeft, 7000);
});

test('dobânda zero și creditul zero au rate finite și corecte', () => {
  assert.equal(payment(75000, 0, 25), 250);
  assert.equal(payment(0, 7, 25), 0);
  assert.equal(calculate({ ...DEFAULTS, ltv: 0 }).coverage, null);
});

test('o chirie la pragul de echilibru lasă exact zero în model', () => {
  const base = calculate({ ...DEFAULTS, management: 8 });
  const atBreakEven = calculate({ ...DEFAULTS, management: 8, rent: base.breakEvenRent });
  assert.ok(Math.abs(atBreakEven.cashflow) < .000001);
});

test('neocuparea integrală și procentele excesive nu produc un prag fals', () => {
  const r = calculate({ ...DEFAULTS, vacancy: 100, management: 10 });
  assert.equal(r.rentCollected, 0);
  assert.equal(r.managementCost, 0);
  assert.equal(r.breakEvenRent, null);
  assert.ok(r.cashflow < 0);
  assert.equal(calculate({ ...DEFAULTS, maintenance: 60, capex: 50 }).breakEvenRent, null);
});

test('evaluarea mai mică lasă mai mult capital blocat, deși rata scade', () => {
  const scenarios = stressScenarios(DEFAULTS);
  const lower = scenarios[1].result;
  assert.equal(lower.newLoan, 67500);
  assert.equal(lower.cashLeft, 14500);
  assert.ok(lower.monthlyPayment < scenarios[0].result.monthlyPayment);
  assert.equal(scenarios[2].result.totalCost, 83300);
  assert.ok(scenarios.at(-1).result.cashflow < 0);
});

test('recuperarea a peste 100% nu șterge datoria sau costul lunar', () => {
  const r = calculate({ ...DEFAULTS, arv: 120000 });
  assert.equal(r.cashRecovered, 88000);
  assert.equal(r.cashLeft, -8000);
  assert.equal(r.newLoan, 90000);
  assert.ok(r.monthlyPayment > 600);
});

test('valorile din stocare sunt normalizate și datoria excesivă este semnalată', () => {
  const p = normalize({ rent: '950', years: 0, rate: 'NaN', ltv: 180, purchase: -5, insurance: true });
  assert.equal(p.rent, 950);
  assert.equal(p.years, 1);
  assert.equal(p.rate, DEFAULTS.rate);
  assert.equal(p.ltv, 100);
  assert.equal(p.purchase, 0);
  assert.equal(p.insurance, DEFAULTS.insurance);
  assert.equal(calculate({ ...DEFAULTS, initialDebt: 90000 }).invalidDebt, true);
});
