import { PRO_BASIC_LIMITS } from './proTier';

const STORAGE_KEY = 'pro-basic-usage-v1';

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
