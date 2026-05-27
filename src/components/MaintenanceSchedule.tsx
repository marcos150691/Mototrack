import React, { useState } from 'react';
import { MaintenanceItem, Motorcycle, MaintenanceHistoryLog } from '../types';
import { calculateMaintenanceStatus } from '../utils/maintenanceHelper';
import { Wrench, Plus, CheckCircle2, AlertTriangle, Clock, History, DollarSign, Calendar } from 'lucide-react';

interface MaintenanceScheduleProps {
  maintenanceItems: MaintenanceItem[];
  historyLogs: MaintenanceHistoryLog[];
  activeMotorcycle: Motorcycle | null;
  onResetItem: (itemId: string, completedOdometer: number, completedDate: string, cost?: number, notes?: string) => void;
  onAddItem: (item: Omit<MaintenanceItem, 'id' | 'nextDueKm' | 'nextDueDate'>) => void;
  onDeleteCustomItem: (itemId: string) => void;
}

export default function MaintenanceSchedule({
  maintenanceItems,
  historyLogs,
  activeMotorcycle,
  onResetItem,
  onAddItem,
  onDeleteCustomItem,
}: MaintenanceScheduleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'km' | 'period' | 'both'>('km');
  const [intervalKm, setIntervalKm] = useState(5000);
  const [intervalMonths, setIntervalMonths] = useState(6);
  const [lastCompletedKm, setLastCompletedKm] = useState(activeMotorcycle?.currentOdometer || 0);
  const [lastCompletedDate, setLastCompletedDate] = useState('2026-05-27');

  // Replacement modal state for quick confirm
  const [resetItemId, setResetItemId] = useState<string | null>(null);
  const [resetOdometer, setResetOdometer] = useState(activeMotorcycle?.currentOdometer || 0);
  const [resetDate, setResetDate] = useState('2026-05-27');
  const [resetCost, setResetCost] = useState<number | ''>('');
  const [resetNotes, setResetNotes] = useState('');

  React.useEffect(() => {
    if (activeMotorcycle) {
      setLastCompletedKm(activeMotorcycle.currentOdometer);
      setResetOdometer(activeMotorcycle.currentOdometer);
    }
  }, [activeMotorcycle]);

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMotorcycle || !name) {
      alert('Preencha o nome do componente.');
      return;
    }

    if (triggerType !== 'period' && (intervalKm <= 0 || lastCompletedKm < 0)) {
      alert('Insira uma quilometragem de intervalo e última troca válidas.');
      return;
    }

    if (triggerType !== 'km' && (!lastCompletedDate || intervalMonths <= 0)) {
      alert('Insira dados de prazo em meses e data da última troca válidos.');
      return;
    }

    onAddItem({
      motorcycleId: activeMotorcycle.id,
      name,
      intervalKm: triggerType === 'period' ? 0 : intervalKm,
      lastCompletedKm: triggerType === 'period' ? 0 : lastCompletedKm,
      triggerType,
      intervalMonths: triggerType === 'km' ? undefined : intervalMonths,
      lastCompletedDate: triggerType === 'km' ? undefined : lastCompletedDate,
      isCustom: true,
    });

    // Reset form states
    setName('');
    setIntervalKm(5000);
    setIntervalMonths(6);
    setTriggerType('km');
    setShowAddForm(false);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetItemId || !activeMotorcycle) return;

    if (resetOdometer < 0) {
      alert('Quilometragem inválida.');
      return;
    }

    if (!resetDate) {
      alert('Data inválida.');
      return;
    }

    onResetItem(
      resetItemId,
      resetOdometer,
      resetDate,
      resetCost === '' ? undefined : resetCost,
      resetNotes || undefined
    );

    // Reset local states
    setResetItemId(null);
    setResetCost('');
    setResetNotes('');
  };

  const activeItems = maintenanceItems.filter((item) => item.motorcycleId === activeMotorcycle?.id);
  const activeHistory = historyLogs
    .filter((log) => log.motorcycleId === activeMotorcycle?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 shadow-xl" id="maintenance-tracker-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FFB300]/10 text-[#FFB300] rounded-xl border border-[#FFB300]/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">Manutenção Preventiva</h3>
            <p className="text-xs text-white/40 font-mono">GERENCIE A SAÚDE DAS PEÇAS E COMPONENTES</p>
          </div>
        </div>
        {!showAddForm && activeMotorcycle && (
          <button
            onClick={() => {
              setLastCompletedKm(activeMotorcycle.currentOdometer);
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#FFB300] hover:bg-[#FFC107] rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Nova Peça
          </button>
        )}
      </div>

      {resetItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-fade-in animate-duration-200">
          <div className="bg-[#111113] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#FFB300] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Confirmar Troca da Peça / Serviço
            </h4>
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">Km Atual desta Troca</label>
                <input
                  type="number"
                  value={resetOdometer}
                  onChange={(e) => setResetOdometer(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white font-mono focus:outline-none focus:border-[#FFB300]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">Data desta Troca / Manutenção</label>
                <input
                  type="date"
                  value={resetDate}
                  onChange={(e) => setResetDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white font-mono focus:outline-none focus:border-[#FFB300]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">Custo Adicional (R$ - opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 120.00"
                  value={resetCost}
                  onChange={(e) => setResetCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white font-mono focus:outline-none focus:border-[#FFB300]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">Observações / Marca</label>
                <input
                  type="text"
                  placeholder="Ex: Óleo Yamalube 10W40, Vela NGK"
                  value={resetNotes}
                  onChange={(e) => setResetNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetItemId(null)}
                  className="w-1/2 py-2 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-[10px] font-black uppercase tracking-wider bg-[#FFB300] hover:bg-[#FFC107] text-black rounded-lg transition-colors"
                >
                  Registrar Troca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={handleAddItemSubmit} className="space-y-4 border border-white/5 bg-black/80 p-4 rounded-xl mb-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#FFB300] font-sans">Configurar Novo Alerta Preventivo</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Nome do Componente / Alerta</label>
              <input
                type="text"
                placeholder="Ex: Troca de Vela de Ignição, Óleo, Licenciamento"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-[#FFB300]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Tipo de Gatilho do Alerta (Modo)</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-black rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setTriggerType('km')}
                  className={`py-1.5 text-[8px] font-black uppercase rounded tracking-wider transition-all ${
                    triggerType === 'km' ? 'bg-[#FFB300] text-black font-extrabold' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Quilometragem
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerType('period')}
                  className={`py-1.5 text-[8px] font-black uppercase rounded tracking-wider transition-all ${
                    triggerType === 'period' ? 'bg-[#FFB300] text-black font-extrabold' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Período (Tempo)
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerType('both')}
                  className={`py-1.5 text-[8px] font-black uppercase rounded tracking-wider transition-all ${
                    triggerType === 'both' ? 'bg-[#FFB300] text-black font-extrabold' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Ambos (Ou)
                </button>
              </div>
            </div>
          </div>

          {/* Conditional inputs for Kilometers */}
          {(triggerType === 'km' || triggerType === 'both') && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 border border-white/5 rounded-xl animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 font-mono">Alerta a Cada (Quilômetros)</label>
                <input
                  type="number"
                  value={intervalKm}
                  onChange={(e) => setIntervalKm(parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white font-mono focus:outline-none focus:border-[#FFB300]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">km Última Troca / Manutenção</label>
                <input
                  type="number"
                  value={lastCompletedKm}
                  onChange={(e) => setLastCompletedKm(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white font-mono focus:outline-none focus:border-[#FFB300]"
                  required
                />
              </div>
            </div>
          )}

          {/* Conditional inputs for Time/Dates */}
          {(triggerType === 'period' || triggerType === 'both') && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 border border-white/5 rounded-xl animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 font-mono">Alerta a Cada (Meses)</label>
                <input
                  type="number"
                  value={intervalMonths}
                  onChange={(e) => setIntervalMonths(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white font-mono focus:outline-none focus:border-[#FFB300]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">Data Última Troca / Manutenção</label>
                <input
                  type="date"
                  value={lastCompletedDate}
                  onChange={(e) => setLastCompletedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white font-mono focus:outline-none focus:border-[#FFB300]"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#FFB300] hover:bg-[#FFC107] font-black text-black text-[10px] tracking-widest uppercase rounded-lg transition-all duration-200"
          >
            Salvar e Registrar Alerta
          </button>
        </form>
      ) : null}

      <div className="space-y-4">
        {activeItems.length === 0 ? (
          <div className="text-center py-10 bg-black/40 rounded-xl border border-dashed border-white/5">
            <p className="text-xs text-white/40">Nenhum componente cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeItems.map((item) => {
              const currentKm = activeMotorcycle ? activeMotorcycle.currentOdometer : 0;
              const status = calculateMaintenanceStatus(item, currentKm);
              const trigger = item.triggerType || 'km';

              // Colors based on wear percentages
              let barColor = "bg-[#FFB300]";
              let textColor = "text-[#FFB300]";
              let badgeBg = "bg-[#FFB300]/10 border-[#FFB300]/20";
              let stateIcon = <Clock className="w-3.5 h-3.5 text-[#FFB300]" />;

              if (status.percent >= 90) {
                barColor = "bg-red-500";
                textColor = "text-red-400";
                badgeBg = "bg-red-500/10 border-red-500/25";
                stateIcon = <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />;
              } else if (status.percent >= 70) {
                barColor = "bg-orange-500";
                textColor = "text-orange-400";
                badgeBg = "bg-[#FFB300]/10 border-orange-500/25";
                stateIcon = <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
              }

              return (
                <div
                  key={item.id}
                  className="bg-black/35 border border-white/5 p-4 rounded-xl flex flex-col justify-between hover:border-white/10 hover:bg-black/50 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black uppercase text-white tracking-wider truncate">{item.name}</h4>
                          <span className="text-[7px] uppercase font-black tracking-widest text-[#FFB300] bg-[#FFB300]/10 border border-[#FFB300]/25 px-1.5 py-0.5 rounded shrink-0">
                            {trigger === 'km' ? 'SÓ KM' : trigger === 'period' ? 'SÓ DATA' : 'KM OU DATA'}
                          </span>
                        </div>
                        
                        {/* Summary of exchange trigger interval rule */}
                        <span className="text-[10px] text-white/40 block mt-1">
                          Regra: {trigger === 'km' && `a cada ${item.intervalKm.toLocaleString('pt-BR')} km`}
                          {trigger === 'period' && `a cada ${item.intervalMonths} meses`}
                          {trigger === 'both' && `a cada ${item.intervalKm.toLocaleString('pt-BR')} km ou ${item.intervalMonths} meses`}
                        </span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 font-mono shrink-0 ${badgeBg}`}>
                        {stateIcon}
                        <span className={textColor}>{status.percent}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-black rounded-full h-1.5 overflow-hidden mb-3.5 border border-white/5">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${status.percent}%` }}></div>
                    </div>

                    <div className="space-y-1 text-[10px] text-white/40">
                      {(trigger === 'km' || trigger === 'both') && (
                        <div className="flex justify-between font-mono">
                          <span>Km Último / Limite:</span>
                          <span className="text-white/60">{item.lastCompletedKm.toLocaleString('pt-BR')} / {item.nextDueKm.toLocaleString('pt-BR')} km</span>
                        </div>
                      )}
                      {(trigger === 'period' || trigger === 'both') && (
                        <div className="flex justify-between font-mono">
                          <span>Data Último / Limite:</span>
                          <span className="text-white/60">
                            {item.lastCompletedDate ? new Date(item.lastCompletedDate + 'T12:00:00').toLocaleDateString('pt-BR') : '--'} / {item.nextDueDate ? new Date(item.nextDueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '--'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <div className="text-[10px] text-white/40 font-mono">
                      <span className={status.percent >= 90 ? "text-red-400 font-black uppercase animate-pulse" : ""}>
                        {status.statusText}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.isCustom && (
                        <button
                          onClick={() => onDeleteCustomItem(item.id)}
                          className="px-2 py-1 text-[10px] text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                        >
                          Remover
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (activeMotorcycle) {
                            setResetItemId(item.id);
                            setResetOdometer(activeMotorcycle.currentOdometer);
                            setResetDate(new Date().toISOString().split('T')[0]);
                          }
                        }}
                        className="px-2.5 py-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] rounded-lg transition-all duration-200 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Trocado
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Histórico Recente de Manutenções */}
      <div className="mt-8 border-t border-white/5 pb-2">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 mt-5 mb-4 flex items-center gap-2">
          <History className="w-4.5 h-4.5 text-[#FFB300]" />
          Histórico de Peças Trocadas
        </h4>

        <div className="border border-white/5 rounded-xl bg-black/20 max-h-[180px] overflow-y-auto custom-scrollbar">
          {activeHistory.length === 0 ? (
            <p className="text-center py-8 text-xs text-white/30 italic">Nenhum histórico registrado ainda.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {activeHistory.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between text-xs hover:bg-black/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-black/80 rounded-lg text-[#FFB300] border border-white/5">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white">{log.itemName}</h5>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5">
                        <span>{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-white/10">•</span>
                        <span className="font-mono">{log.odometer.toLocaleString('pt-BR')} km</span>
                        {log.notes && (
                          <>
                            <span className="text-white/10">•</span>
                            <span className="italic truncate max-w-[150px]">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {log.cost !== undefined && (
                    <div className="flex items-center gap-0.5 px-2.5 py-1 bg-black/40 rounded text-[#FFB300] font-black font-mono border border-white/5">
                      <DollarSign className="w-3 h-3 text-white/30" />
                      <span>{log.cost.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
