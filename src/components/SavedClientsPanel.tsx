import { useEffect, useState } from 'react';
import { Users, Save, Trash2 } from 'lucide-react';
import type { SimulatorInputs } from '../lib/calculator';
import { listSavedClients, saveClient, deleteSavedClient, type SavedClient } from '../lib/savedClients';

interface Props {
  currentInputs: SimulatorInputs;
  onLoad: (inputs: SimulatorInputs) => void;
}

export default function SavedClientsPanel({ currentInputs, onLoad }: Props) {
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setClients(await listSavedClients());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave() {
    const label = window.prompt('고객 이름 또는 메모를 입력하세요 (예: 김철수님 - 2026.08 상담)');
    if (!label || !label.trim()) return;
    setSaving(true);
    const { error } = await saveClient(label.trim(), currentInputs);
    setSaving(false);
    if (error) {
      window.alert(error);
      return;
    }
    refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('이 고객 정보를 삭제할까요?')) return;
    await deleteSavedClient(id);
    refresh();
  }

  return (
    <div className="animate-fade-in bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-navy-500" />
          <p className="text-[13px] font-bold text-navy-900">저장된 고객</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 rounded-lg bg-navy-800 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
        >
          <Save size={12} />
          {saving ? '저장 중…' : '현재 입력 저장'}
        </button>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-400">불러오는 중…</p>
      ) : clients.length === 0 ? (
        <p className="text-[11px] text-slate-400">저장된 고객이 없어요. 입력 후 &apos;현재 입력 저장&apos;을 눌러보세요.</p>
      ) : (
        <div className="space-y-1.5">
          {clients.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-xl bg-navy-50/60 px-3 py-2">
              <button
                type="button"
                onClick={() => onLoad(c.inputs)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-[12px] font-bold text-navy-800">{c.label}</p>
                <p className="text-[10px] text-slate-400">
                  {new Date(c.updated_at).toLocaleDateString('ko-KR')} 저장
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="shrink-0 text-slate-300 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
