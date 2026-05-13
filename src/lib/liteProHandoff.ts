import type { SimulatorInputs } from './calculator';
import type { LiteInputValues } from './liteToSimulator';
import { liteInputToSimulator } from './liteToSimulator';

const STORAGE_KEY = 'egi-lite-to-pro-handoff-v1';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/** 최소 필드만 검증 (JSON 변조·구버전 데이터 방지) */
function parseSimulatorInputs(raw: unknown): SimulatorInputs | null {
  if (!isRecord(raw)) return null;
  const currentAge = typeof raw.currentAge === 'number' && Number.isFinite(raw.currentAge) ? raw.currentAge : NaN;
  const retirementAge =
    typeof raw.retirementAge === 'number' && Number.isFinite(raw.retirementAge) ? raw.retirementAge : NaN;
  if (!Number.isFinite(currentAge) || !Number.isFinite(retirementAge)) return null;
  if (retirementAge <= currentAge) return null;
  return raw as SimulatorInputs;
}

/** 설계사 전용(/pro)으로 넘길 시뮬레이터 입력을 세션에 저장 (동일 탭에서만 유효) */
export function stashSimulatorInputsForPro(inputs: SimulatorInputs): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    /* 비공개 모드 등 */
  }
}

/** 간편 입력 값 → 프로와 동일한 입력으로 변환 후 저장 */
export function stashLiteValuesForPro(lite: LiteInputValues): void {
  stashSimulatorInputsForPro(liteInputToSimulator(lite));
}

/**
 * Pro 첫 진입 시 읽기만 (삭제 X). 없거나 유효하지 않으면 null.
 */
export function peekHandoffSimulatorInputs(): SimulatorInputs | null {
  try {
    const s = sessionStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    return parseSimulatorInputs(JSON.parse(s));
  } catch {
    return null;
  }
}

export function clearLiteProHandoffStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** @deprecated peek + clearLiteProHandoffStorage 사용 권장 */
export function consumeHandoffSimulatorInputs(): SimulatorInputs | null {
  const v = peekHandoffSimulatorInputs();
  clearLiteProHandoffStorage();
  return v;
}
