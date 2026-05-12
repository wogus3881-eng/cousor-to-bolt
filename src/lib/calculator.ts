export interface SimulatorInputs {
  currentAge: number;
  retirementAge: number;
  pensionYears: number;
  currentSavings: number;
  // 3-bucket monthly contributions + individual rates
  monthlyBank: number;         // 은행 적립 (과세)
  bankRate: number;            // 은행 수익률 % (기본 2.5)
  monthlyStock: number;        // 증권 투자 (과세)
  stockRate: number;           // 증권 수익률 % (기본 5.0)
  monthlyInsurance: number;    // 보험/비과세 연금 (비과세)
  insuranceRate: number;       // 보험 수익률 % (기본 3.5)
  insurancePaymentYears: number; // 보험 납입 기간 (년, 기본 10)
  /** @deprecated 이전 호환용 */
  monthlyContribution?: number;
  /** @deprecated expectedReturn → stockRate 로 대체 */
  expectedReturn?: number;
  annualSalary: number;
  monthlyExpense: number;
  activeEndAge: number;
  medicalCostEnabled: boolean;
  monthlyMedicalCost: number;
}

export interface YearRow {
  age: number;
  requiredExpense: number;
  livingExpense: number;
  medicalExpense: number;
  pension: number;
  pensionNet: number;
  healthInsurance: number;
  pensionTax: number;
  balance: number;
  balanceReal: number;        // 실질 가치 (현재 구매력 환산)
  balanceGross: number;       // 전액 과세(증권) 비교선
  balanceInsOnly: number;     // 전액 비과세(보험) 비교선
  bankTaxBurden: number;      // 연간 은행 세금+건보료
  stockTaxBurden: number;     // 연간 증권 세금+건보료
  dividendIncome: number;     // 배당 소득 월 수령액 (증권 잔액 * 3% / 12)
  dividendReal: number;       // 배당 소득 실질 가치 (물가 할인)
  isActivePhase: boolean;
  isAccumulationPhase: boolean;
  deficit: number;
  isInsurancePaymentPhase: boolean;
  insuranceAnnuity: number;
  isPostDepletion: boolean;
}

export interface SimulationResult {
  inputs: SimulatorInputs;
  retirementBalance: number;
  retirementBalanceBank: number;
  retirementBalanceStock: number;
  retirementBalanceInsurance: number;
  inflationAdjustedMonthlyExpense: number;
  pensionAtRetirement: number;
  pensionNetAtRetirement: number;
  pensionReplacementRate: number;
  dignityEndAge: number | null;
  dignityEndAgeGross: number | null;
  dignityEndAgeInsOnly: number | null;
  extraNeeded: number;
  yearRows: YearRow[];
  lifeExpectancy: number;
  weakPension: boolean;
  highIncome: boolean;
  pensionCapped: boolean;
  pensionUncapped: number;
  totalTaxBurden: number;
  taxFreeYearsGained: number;
  healthInsuranceTriggered: boolean;
  monthlySavingsNeededFor95: number;
  insurancePaymentEndAge: number; // 보험 납입 종료 나이
  insAnnuityMonthly: number;      // 종신연금 월 수령액 (보험 원금 연금화)
  // 세금 인사이트
  annualFinancialTaxAtRetirement: number; // 은퇴 첫해 과세자산 세금+건보료 합계
}

const INFLATION = 0.03;
const PENSION_ANNUAL_INCREASE = 0.03;
const LIFE_EXPECTANCY = 100;

const PENSION_INCOME_CAP_MONTHLY = 6170000;
const PENSION_INCOME_CAP_ANNUAL = PENSION_INCOME_CAP_MONTHLY * 12;
const PENSION_MAX_30Y = 1800000;
const PENSION_MAX_20Y = 1200000;
const PENSION_MAX_UNDER20 = 700000;

export const DEFAULT_BANK_RATE = 2.5;
export const DEFAULT_STOCK_RATE = 5.0;
export const DEFAULT_INS_RATE = 3.5;

const FINANCIAL_INCOME_TAX = 0.154;
const FINANCIAL_HI_THRESHOLD = 20000000;
const FINANCIAL_HI_RATE = 0.0707;

function estimatePensionAtRetirement(
  annualSalary: number,
  pensionYears: number,
  yearsToRetirement: number,
) {
  const cappedAnnualSalary = Math.min(annualSalary, PENSION_INCOME_CAP_ANNUAL);
  let replacementRate: number;
  let hardCapPresent: number;
  if (pensionYears < 20) { replacementRate = 0.12; hardCapPresent = PENSION_MAX_UNDER20; }
  else if (pensionYears < 30) { replacementRate = 0.18; hardCapPresent = PENSION_MAX_20Y; }
  else { replacementRate = 0.25; hardCapPresent = PENSION_MAX_30Y; }

  const pensionPresentUncapped = (annualSalary * replacementRate) / 12;
  const pensionPresentCapped = Math.min((cappedAnnualSalary * replacementRate) / 12, hardCapPresent);
  const pensionAtRetirement = fv(pensionPresentCapped, INFLATION, yearsToRetirement);
  const pensionUncapped = fv(pensionPresentUncapped, INFLATION, yearsToRetirement);
  const finalPension = Math.min(pensionAtRetirement, fv(hardCapPresent, INFLATION, yearsToRetirement));

  return {
    pensionAtRetirement: finalPension,
    pensionUncapped,
    replacementRate: replacementRate * 100,
    pensionCapped: finalPension < pensionUncapped,
  };
}

function fvAnnuity(monthly: number, annualRate: number, years: number): number {
  if (years <= 0) return 0;
  if (annualRate === 0) return monthly * 12 * years;
  const r = annualRate / 12;
  const n = years * 12;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

function fv(pv: number, rate: number, years: number): number {
  if (years <= 0) return pv;
  return pv * Math.pow(1 + rate, years);
}

function applyTaxOnReturn(balance: number, rate: number): { netBalance: number; taxPaid: number } {
  if (balance <= 0) return { netBalance: 0, taxPaid: 0 };
  const annualReturn = balance * rate;
  const tax = annualReturn * FINANCIAL_INCOME_TAX;
  const hi = annualReturn > FINANCIAL_HI_THRESHOLD
    ? (annualReturn - FINANCIAL_HI_THRESHOLD) * FINANCIAL_HI_RATE
    : 0;
  return { netBalance: balance * (1 + rate) - tax - hi, taxPaid: tax + hi };
}

export function simulate(inputs: SimulatorInputs): SimulationResult {
  // 구버전 필드 정규화
  const norm: SimulatorInputs = {
    ...inputs,
    monthlyBank: inputs.monthlyBank ?? 0,
    bankRate: inputs.bankRate ?? DEFAULT_BANK_RATE,
    monthlyStock: inputs.monthlyStock ?? (inputs.monthlyContribution ?? 0),
    stockRate: inputs.stockRate ?? (inputs.expectedReturn ?? DEFAULT_STOCK_RATE),
    monthlyInsurance: inputs.monthlyInsurance ?? 0,
    insuranceRate: inputs.insuranceRate ?? DEFAULT_INS_RATE,
    insurancePaymentYears: inputs.insurancePaymentYears ?? 10,
  };

  const {
    currentAge, retirementAge, pensionYears,
    currentSavings, monthlyBank, bankRate: bankRatePct,
    monthlyStock, stockRate: stockRatePct,
    monthlyInsurance, insuranceRate: insRatePct,
    insurancePaymentYears,
    annualSalary, monthlyExpense,
    activeEndAge, medicalCostEnabled, monthlyMedicalCost,
  } = norm;

  const bankR = bankRatePct / 100;
  const stockR = stockRatePct / 100;
  const insR = insRatePct / 100;

  const ACTIVE_END_AGE = activeEndAge ?? 78;
  const INACTIVE_EXPENSE_RATIO = 0.75;
  const MEDICAL_START_AGE = 80;
  const MEDICAL_COST = medicalCostEnabled ? (monthlyMedicalCost ?? 400000) : 0;
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);

  // 현재 자산을 월납 비율로 3버킷 배분
  const totalMonthly = monthlyBank + monthlyStock + monthlyInsurance || 1;
  const bankRatio = monthlyBank / totalMonthly;
  const stockRatio = monthlyStock / totalMonthly;
  const insRatio = monthlyInsurance / totalMonthly;

  const retirementBalanceBank = fv(currentSavings * bankRatio, bankR, yearsToRetirement)
    + fvAnnuity(monthlyBank, bankR, yearsToRetirement);
  const retirementBalanceStock = fv(currentSavings * stockRatio, stockR, yearsToRetirement)
    + fvAnnuity(monthlyStock, stockR, yearsToRetirement);
  // 보험: 납입기간(insurancePaymentYears)만 납입 후 은퇴까지 복리 증식
  const insPayYears = Math.min(insurancePaymentYears, yearsToRetirement);
  const insBalanceAtPaymentEnd = fv(currentSavings * insRatio, insR, insPayYears)
    + fvAnnuity(monthlyInsurance, insR, insPayYears);
  const yearsCompoundAfterPayment = yearsToRetirement - insPayYears;
  const retirementBalanceInsurance = fv(insBalanceAtPaymentEnd, insR, yearsCompoundAfterPayment);
  // 납입 종료 나이 (은퇴 전)
  const insurancePaymentEndAge = currentAge + insPayYears;
  const retirementBalance = retirementBalanceBank + retirementBalanceStock + retirementBalanceInsurance;

  // 비교선: 전액 과세(증권 수익률), 전액 비과세(보험 수익률)
  const totalContrib = monthlyBank + monthlyStock + monthlyInsurance;
  const retirementBalanceGrossOnly = fv(currentSavings, stockR, yearsToRetirement)
    + fvAnnuity(totalContrib, stockR, yearsToRetirement);
  const retirementBalanceInsOnly = fv(currentSavings, insR, yearsToRetirement)
    + fvAnnuity(totalContrib, insR, yearsToRetirement);

  const inflationAdjustedMonthlyExpense = fv(monthlyExpense, INFLATION, yearsToRetirement);

  const { pensionAtRetirement, pensionUncapped, replacementRate, pensionCapped } =
    estimatePensionAtRetirement(annualSalary, pensionYears, yearsToRetirement);

  const weakPension = pensionYears < 25;
  const highIncome = annualSalary > PENSION_INCOME_CAP_ANNUAL;

  const HEALTH_INS_THRESHOLD_ANNUAL = 20000000;
  const HEALTH_INS_RATE = 0.08;
  const PENSION_TAX_RATE = 0.04;

  const pensionAnnualAtRetirement = pensionAtRetirement * 12;
  const healthInsuranceTriggered = pensionAnnualAtRetirement > HEALTH_INS_THRESHOLD_ANNUAL;
  const pensionTaxMonthly = pensionAtRetirement * PENSION_TAX_RATE;
  const healthInsMonthly = healthInsuranceTriggered ? pensionAtRetirement * HEALTH_INS_RATE : 0;
  const pensionNetAtRetirement = pensionAtRetirement - pensionTaxMonthly - healthInsMonthly;

  // 은퇴 첫해 과세자산 세금+건보료 (인사이트 표시용)
  const firstYearBankReturn = retirementBalanceBank * bankR;
  const firstYearStockReturn = retirementBalanceStock * stockR;
  const firstYearBankTax = firstYearBankReturn * FINANCIAL_INCOME_TAX
    + (firstYearBankReturn > FINANCIAL_HI_THRESHOLD ? (firstYearBankReturn - FINANCIAL_HI_THRESHOLD) * FINANCIAL_HI_RATE : 0);
  const firstYearStockTax = firstYearStockReturn * FINANCIAL_INCOME_TAX
    + (firstYearStockReturn > FINANCIAL_HI_THRESHOLD ? (firstYearStockReturn - FINANCIAL_HI_THRESHOLD) * FINANCIAL_HI_RATE : 0);
  const annualFinancialTaxAtRetirement = firstYearBankTax + firstYearStockTax;

  // 종신연금 월 수령액 계산 (보험 원금을 100세까지 연금화)
  // 연금현가 공식: PV = PMT * [1 - (1+r)^-n] / r  →  PMT = PV * r / [1 - (1+r)^-n]
  const annuityYears = Math.max(1, LIFE_EXPECTANCY - retirementAge);
  const insMonthlyRate = insR / 12;
  const insAnnuityMonthly = retirementBalanceInsurance > 0
    ? insMonthlyRate === 0
      ? retirementBalanceInsurance / (annuityYears * 12)
      : retirementBalanceInsurance * insMonthlyRate
        / (1 - Math.pow(1 + insMonthlyRate, -(annuityYears * 12)))
    : 0;

  // ── 축적기: currentAge 기준으로 연도별 잔고를 월 복리로 추적 ──────────────────
  // 보험: 납입기간 내만 월납, 이후 은퇴까지 복리만 증식
  const accRows: Array<{ age: number; bal: number; balBank: number; balStock: number; balIns: number }> = [];
  {
    let aBank = currentSavings * bankRatio;
    let aStock = currentSavings * stockRatio;
    let aIns = currentSavings * insRatio;
    const bankMR = bankR / 12;
    const stockMR = stockR / 12;
    const insMR = insR / 12;

    for (let age = currentAge; age <= retirementAge; age++) {
      accRows.push({ age, bal: aBank + aStock + aIns, balBank: aBank, balStock: aStock, balIns: aIns });
      if (age < retirementAge) {
        // 월 복리 12회 반복
        for (let m = 0; m < 12; m++) {
          aBank = aBank * (1 + bankMR) + monthlyBank;
          aStock = aStock * (1 + stockMR) + monthlyStock;
          // 보험: 납입 기간 내면 월납, 이후 복리만
          const yearsFromNow = (age - currentAge) + (m + 1) / 12;
          const insContrib = yearsFromNow < insPayYears ? monthlyInsurance : 0;
          aIns = aIns * (1 + insMR) + insContrib;
        }
      }
    }
  }

  const yearRows: YearRow[] = [];
  let bBank = retirementBalanceBank;
  let bStock = retirementBalanceStock;
  let bIns = retirementBalanceInsurance;
  let balanceGross = retirementBalanceGrossOnly;
  let balanceInsOnly = retirementBalanceInsOnly;

  let dignityEndAge: number | null = null;
  let dignityEndAgeGross: number | null = null;
  let dignityEndAgeInsOnly: number | null = null;
  let totalTaxBurden = 0;
  let isPostDepletion = false;

  // 축적기 행 추가 (currentAge ~ retirementAge-1)
  for (const acc of accRows) {
    if (acc.age >= retirementAge) break;
    const realFactor = Math.pow(1 + INFLATION, -(acc.age - currentAge));
    yearRows.push({
      age: acc.age,
      requiredExpense: monthlyExpense,
      livingExpense: monthlyExpense,
      medicalExpense: 0,
      pension: 0,
      pensionNet: 0,
      healthInsurance: 0,
      pensionTax: 0,
      balance: acc.bal,
      balanceReal: acc.bal * realFactor,
      balanceGross: acc.bal,
      balanceInsOnly: acc.bal,
      bankTaxBurden: 0,
      stockTaxBurden: 0,
      dividendIncome: 0,
      dividendReal: 0,
      isActivePhase: true,
      isAccumulationPhase: true,
      deficit: 0,
      isInsurancePaymentPhase: acc.age < insurancePaymentEndAge,
      insuranceAnnuity: 0,
      isPostDepletion: false,
    });
  }

  // 인출기: retirementAge ~ LIFE_EXPECTANCY
  for (let age = retirementAge; age <= LIFE_EXPECTANCY; age++) {
    const yearsIntoRetirement = age - retirementAge;
    const isActivePhase = age <= ACTIVE_END_AGE;

    let baseMonthlyLiving: number;
    if (isActivePhase) {
      baseMonthlyLiving = inflationAdjustedMonthlyExpense * Math.pow(1 + INFLATION, yearsIntoRetirement);
    } else {
      const yearsIntoInactive = age - ACTIVE_END_AGE;
      const expAtTransition = inflationAdjustedMonthlyExpense
        * Math.pow(1 + INFLATION, ACTIVE_END_AGE - retirementAge);
      baseMonthlyLiving = expAtTransition * INACTIVE_EXPENSE_RATIO
        * Math.pow(1 + INFLATION, yearsIntoInactive);
    }

    const medicalInflFactor = age >= MEDICAL_START_AGE
      ? Math.pow(1 + INFLATION, age - MEDICAL_START_AGE) : 0;
    const monthlyMedical = age >= MEDICAL_START_AGE ? MEDICAL_COST * medicalInflFactor : 0;
    const monthlyTotalExpense = baseMonthlyLiving + monthlyMedical;
    const yearlyExpense = monthlyTotalExpense * 12;

    const yearlyPensionGross = pensionAtRetirement
      * Math.pow(1 + PENSION_ANNUAL_INCREASE, yearsIntoRetirement) * 12;
    const yearlyTax = yearlyPensionGross * PENSION_TAX_RATE;
    const yearlyHealthIns = healthInsuranceTriggered ? yearlyPensionGross * HEALTH_INS_RATE : 0;
    const yearlyPensionNet = yearlyPensionGross - yearlyTax - yearlyHealthIns;

    totalTaxBurden += yearlyTax + yearlyHealthIns;

    const posBank = Math.max(0, bBank);
    const posStock = Math.max(0, bStock);
    const posIns = Math.max(0, bIns);

    // ── 배당 인컴 모델 ──────────────────────────────────────────────────────
    // 증권 자산은 연 5%(배당 3% + 자본성장 2%) 수익률 배당 자산으로 전환 운용
    const DIVIDEND_RATE = 0.03;   // 배당 수익률
    const CAPITAL_GROWTH = 0.02;  // 자본 성장률
    const yearlyDividend = posStock * DIVIDEND_RATE;
    const monthlyDividendIncome = yearlyDividend / 12;

    // 수령 우선순위: ①배당 ②국민연금 → 부족분만 원금 인출
    // 잉여분(배당+연금 > 지출)은 증권 원금에 재투자
    const incomeBeforePrincipal = yearlyDividend + yearlyPensionNet;
    const principalNeeded = Math.max(0, yearlyExpense - incomeBeforePrincipal);
    const yearlyStockGrowth = posStock * CAPITAL_GROWTH; // 자본성장 부분
    const surplusForReinvest = Math.max(0, incomeBeforePrincipal - yearlyExpense);

    let stockW = 0;
    if (principalNeeded > 0) {
      // 원금 인출: 은행·보험 잔고 비율로 은행 우선, 증권 보조
      const posOther = posBank + posIns;
      if (posOther > 0) {
        const bankW_ = Math.min(posBank, principalNeeded * (posBank / posOther));
        const insW_  = Math.min(posIns,  principalNeeded * (posIns  / posOther));
        const withdrawn = bankW_ + insW_;
        const bankTaxPre = applyTaxOnReturn(posBank, bankR);
        bBank = bankTaxPre.netBalance - bankW_;
        totalTaxBurden += bankTaxPre.taxPaid;
        bIns = posIns * (1 + insR) - insW_;
        stockW = Math.max(0, principalNeeded - withdrawn);
      } else {
        // 은행·보험 고갈 → 증권에서 전액
        bBank = 0;
        bIns = posIns * (1 + insR);
        stockW = principalNeeded;
      }
    } else {
      // 배당+연금이 충분 → 원금 인출 없음
      const bankTaxPre = applyTaxOnReturn(posBank, bankR);
      bBank = bankTaxPre.netBalance;
      totalTaxBurden += bankTaxPre.taxPaid;
      bIns = posIns * (1 + insR);
      stockW = 0;
    }

    // 증권: 자본성장 + 배당 재투자(잉여분)
    const { netBalance: newStock, taxPaid: stockTax } = applyTaxOnReturn(posStock, CAPITAL_GROWTH);
    bStock = newStock - stockW + surplusForReinvest;
    const rowStockTax = stockTax;
    totalTaxBurden += stockTax;
    // 은행·보험 세금 (위에서 처리 안 된 경우 보정)
    const rowBankTax = principalNeeded > 0 && posBank + posIns > 0 ? 0 : (() => {
      const t = applyTaxOnReturn(posBank, bankR);
      totalTaxBurden += t.taxPaid;
      bBank = t.netBalance;
      return t.taxPaid;
    })();
    void rowBankTax;

    const combinedBalance = bBank + bStock + bIns;

    // 비교선 1: 전액 과세
    const { netBalance: newGross, taxPaid: grossTaxPaid } = applyTaxOnReturn(Math.max(0, balanceGross), stockR);
    void grossTaxPaid;
    balanceGross = newGross - Math.max(0, yearlyExpense - yearlyPensionGross);

    // 비교선 2: 전액 비과세
    balanceInsOnly = Math.max(0, balanceInsOnly) * (1 + insR)
      - Math.max(0, yearlyExpense - yearlyPensionNet);

    if (combinedBalance <= 0 && dignityEndAge === null) {
      dignityEndAge = age;
      isPostDepletion = true;
    }
    if (balanceGross <= 0 && dignityEndAgeGross === null) dignityEndAgeGross = age;
    if (balanceInsOnly <= 0 && dignityEndAgeInsOnly === null) dignityEndAgeInsOnly = age;

    const currentInsAnnuity = insAnnuityMonthly;

    // 실질 가치: 은퇴 시점 기준으로 물가 할인
    const realFactor = Math.pow(1 + INFLATION, -(age - currentAge));

    yearRows.push({
      age,
      requiredExpense: monthlyTotalExpense,
      livingExpense: baseMonthlyLiving,
      medicalExpense: monthlyMedical,
      pension: yearlyPensionGross / 12,
      pensionNet: yearlyPensionNet / 12,
      healthInsurance: yearlyHealthIns / 12,
      pensionTax: yearlyTax / 12,
      balance: Math.max(0, combinedBalance),
      balanceReal: Math.max(0, combinedBalance) * realFactor,
      balanceGross: Math.max(0, balanceGross),
      balanceInsOnly: Math.max(0, balanceInsOnly),
      bankTaxBurden: 0,
      stockTaxBurden: rowStockTax,
      dividendIncome: monthlyDividendIncome,
      dividendReal: monthlyDividendIncome * realFactor,
      isActivePhase,
      isAccumulationPhase: false,
      deficit: combinedBalance < 0 ? Math.abs(combinedBalance) : 0,
      isInsurancePaymentPhase: age < insurancePaymentEndAge,
      insuranceAnnuity: currentInsAnnuity,
      isPostDepletion: isPostDepletion && age > retirementAge,
    });
  }

  const taxFreeYearsGained = dignityEndAge !== null && dignityEndAgeInsOnly !== null
    ? Math.max(0, dignityEndAgeInsOnly - dignityEndAge)
    : dignityEndAge !== null && dignityEndAgeInsOnly === null
    ? Math.max(0, LIFE_EXPECTANCY - dignityEndAge)
    : 0;

  const blendedRetirementRate = retirementBalance > 0
    ? (retirementBalanceBank * bankR + retirementBalanceStock * stockR + retirementBalanceInsurance * insR)
      / retirementBalance
    : stockR;

  function calcTargetBalance(targetAge: number): number {
    let bal = 0;
    for (let age = targetAge - 1; age >= retirementAge; age--) {
      const y = age - retirementAge;
      const isAct = age <= ACTIVE_END_AGE;
      let base: number;
      if (isAct) {
        base = inflationAdjustedMonthlyExpense * Math.pow(1 + INFLATION, y);
      } else {
        const inactYrs = age - ACTIVE_END_AGE;
        const expTrans = inflationAdjustedMonthlyExpense * Math.pow(1 + INFLATION, ACTIVE_END_AGE - retirementAge);
        base = expTrans * INACTIVE_EXPENSE_RATIO * Math.pow(1 + INFLATION, inactYrs);
      }
      const mInfl = age >= MEDICAL_START_AGE ? Math.pow(1 + INFLATION, age - MEDICAL_START_AGE) : 0;
      const mCost = age >= MEDICAL_START_AGE ? MEDICAL_COST * mInfl : 0;
      const yrExp = (base + mCost) * 12;
      const yrPenGross = pensionAtRetirement * Math.pow(1 + PENSION_ANNUAL_INCREASE, y) * 12;
      const yrTax = yrPenGross * PENSION_TAX_RATE;
      const yrHI = healthInsuranceTriggered ? yrPenGross * HEALTH_INS_RATE : 0;
      const yrPenNet = yrPenGross - yrTax - yrHI;
      const netW = Math.max(0, yrExp - yrPenNet);
      bal = (bal + netW) / (1 + blendedRetirementRate);
    }
    return bal;
  }

  // 90세 이전에 고갈되는 경우에만 extraNeeded 계산
  const targetBalance90 = (dignityEndAge !== null && dignityEndAge <= 90) ? calcTargetBalance(90) : 0;
  const extraNeeded = (dignityEndAge !== null && dignityEndAge <= 90)
    ? Math.max(0, targetBalance90 - retirementBalance) : 0;

  // 95세 이전에 고갈되는 경우에만 추가 저축 계산
  const needs95 = dignityEndAge !== null && dignityEndAge < 95;
  const targetBalance95 = needs95 ? calcTargetBalance(95) : 0;
  const shortfall95 = needs95 ? Math.max(0, targetBalance95 - retirementBalance) : 0;

  const blendedMonthlyRate = (
    totalContrib > 0
      ? (monthlyBank * bankR + monthlyStock * stockR + monthlyInsurance * insR) / totalContrib
      : stockR
  ) / 12;
  const monthsToRetirement = Math.max(1, yearsToRetirement * 12);
  const monthlySavingsNeededFor95 = shortfall95 <= 0
    ? 0
    : blendedMonthlyRate === 0
      ? shortfall95 / monthsToRetirement
      : shortfall95 * blendedMonthlyRate / (Math.pow(1 + blendedMonthlyRate, monthsToRetirement) - 1);

  return {
    inputs: norm,
    retirementBalance,
    retirementBalanceBank,
    retirementBalanceStock,
    retirementBalanceInsurance,
    inflationAdjustedMonthlyExpense,
    pensionAtRetirement,
    pensionNetAtRetirement,
    pensionReplacementRate: replacementRate,
    dignityEndAge,
    dignityEndAgeGross,
    dignityEndAgeInsOnly,
    extraNeeded,
    yearRows,
    lifeExpectancy: LIFE_EXPECTANCY,
    weakPension,
    highIncome,
    pensionCapped,
    pensionUncapped,
    totalTaxBurden,
    taxFreeYearsGained,
    healthInsuranceTriggered,
    monthlySavingsNeededFor95,
    insurancePaymentEndAge,
    insAnnuityMonthly,
    annualFinancialTaxAtRetirement,
  };
}

export function formatKRW(amount: number, short = false): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (short) {
    if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1)}억`;
    if (abs >= 10000) return `${sign}${Math.floor(abs / 10000).toLocaleString()}만`;
    return `${sign}${Math.floor(abs).toLocaleString()}`;
  }
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000);
    const man = Math.floor((abs % 100000000) / 10000);
    if (man === 0) return `${sign}${eok.toLocaleString()}억 원`;
    return `${sign}${eok.toLocaleString()}억 ${man.toLocaleString()}만 원`;
  }
  if (abs >= 10000) return `${sign}${Math.floor(abs / 10000).toLocaleString()}만 원`;
  return `${sign}${Math.floor(abs).toLocaleString()}원`;
}

export function formatMan(amount: number): string {
  return `${Math.floor(amount / 10000).toLocaleString()}만 원`;
}
