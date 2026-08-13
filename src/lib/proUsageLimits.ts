import { PRO_BASIC_LIMITS, PRO_TRIAL_LIMITS } from './proTier';

const STORAGE_KEY = 'pro-basic-usage-v1';
const TRIAL_STORAGE_KEY = 'pro-trial-usage-v1';

interface UsageState {
  month: string;
  simulations: number;
  prints: number;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function readState(): UsageState {
  const empty: UsageState = { month: currentMonth(), simulations: 0, prints: 0 };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as UsageState;
    if (parsed.month !== currentMonth()) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

function writeState(state: UsageState): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getBasicUsage() {
  const state = readState();
  return {
    simulations: state.simulations,
    prints: state.prints,
    simLimit: PRO_BASIC_LIMITS.simulationsPerMonth,
    printLimit: PRO_BASIC_LIMITS.printsPerMonth,
  };
}

export function canRunBasicSimulation(): boolean {
  return readState().simulations < PRO_BASIC_LIMITS.simulationsPerMonth;
}

export function recordBasicSimulation(): void {
  const state = readState();
  writeState({ ...state, month: currentMonth(), simulations: state.simulations + 1 });
}

export function canRunBasicPrint(): boolean {
  return readState().prints < PRO_BASIC_LIMITS.printsPerMonth;
}

export function recordBasicPrint(): void {
  const state = readState();
  writeState({ ...state, month: currentMonth(), prints: state.prints + 1 });
}

interface TrialUsageState {
  firstUsedAt: string;
  simulations: number;
}

function readTrialState(): TrialUsageState {
  const empty: TrialUsageState = { firstUsedAt: new Date().toISOString(), simulations: 0 };
  try {
    const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (!raw) return empty;
    return JSON.parse(raw) as TrialUsageState;
  } catch {
    return empty;
  }
}

function writeTrialState(state: TrialUsageState): void {
  localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(state));
}

/** 첫 시뮬레이션 이후 남은 체험 일수. 아직 한 번도 시뮬레이션하지 않았으면 전체 기간이 그대로 남아있는 것으로 계산합니다. */
export function trialDaysRemaining(): number {
  const state = readTrialState();
  if (state.simulations === 0) return PRO_TRIAL_LIMITS.validDays;
  const elapsedDays = (Date.now() - new Date(state.firstUsedAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(PRO_TRIAL_LIMITS.validDays - elapsedDays));
}

export function isTrialExpired(): boolean {
  return trialDaysRemaining() <= 0;
}

export function getTrialUsage() {
  const state = readTrialState();
  return {
    simulations: state.simulations,
    daysRemaining: trialDaysRemaining(),
  };
}

export function recordTrialSimulation(): void {
  const state = readTrialState();
  writeTrialState({ ...state, simulations: state.simulations + 1 });
}
