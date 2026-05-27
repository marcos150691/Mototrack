import React, { useState } from 'react';
import { FuelLog, Motorcycle } from '../types';
import { Fuel, Plus, Trash2, Calendar, Coins, History, TrendingUp } from 'lucide-react';

interface FuelTrackerProps {
  fuelLogs: FuelLog[];
  activeMotorcycle: Motorcycle | null;
  onAddFuel: (log: Omit<FuelLog, 'id' | 'avgConsumption'>) => void;
  onDeleteFuel: (id: string) => void;
}

export default function FuelTracker({
  fuelLogs,
  activeMotorcycle,
  onAddFuel,
  onDeleteFuel,
}: FuelTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [odometer, setOdometer] = useState(activeMotorcycle?.currentOdometer || 0);
  const [liters, setLiters] = useState(10);
  const [pricePerLiter, setPricePerLiter] = useState(5.89);
  const [fuelType, setFuelType] = useState<'Gasolina' | 'Etanol' | 'Aditivada'>('Gasolina');
  const [station, setStation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (activeMotorcycle) {
      setOdometer(activeMotorcycle.currentOdometer);
    }
  }, [activeMotorcycle]);

  // Handle price/liters auto multiplication
  const totalPrice = parseFloat((liters * pricePerLiter).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMotorcycle) return;

    if (odometer < activeMotorcycle.initialOdometer) {
      alert(`O odômetro no abastecimento não pode ser menor que o odômetro inicial da moto (${activeMotorcycle.initialOdometer} km).`);
      return;
    }

    onAddFuel({
      motorcycleId: activeMotorcycle.id,
      date,
      odometer,
      liters,
      pricePerLiter,
      totalPrice,
      fuelType,
      station: station || undefined,
    });

    setStation('');
    setShowForm(false);
  };

  const activeLogs = fuelLogs
    .filter((log) => log.motorcycleId === activeMotorcycle?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // descending by date

  // Chronological ascending for calculating metrics and chart rendering
  const chronoLogs = [...activeLogs].reverse();

  // Compute stats
  const totalLiters = activeLogs.reduce((acc, curr) => acc + curr.liters, 0);
  const totalCost = activeLogs.reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Computed averages over history
  const validConsumptionLogs = activeLogs.filter((log) => log.avgConsumption && log.avgConsumption > 0);
  const overallAvgConsumption = validConsumptionLogs.length > 0
    ? validConsumptionLogs.reduce((acc, curr) => acc + (curr.avgConsumption || 0), 0) / validConsumptionLogs.length
    : 0;

  const averagePricePerLiter = activeLogs.length > 0
    ? totalCost / totalLiters
    : 0;

  // Render a responsive visual custom SVG graph for average consumption timeline
  const renderConsumptionChart = () => {
    const dataPoints = chronoLogs.filter((l) => l.avgConsumption && l.avgConsumption > 0);
    if (dataPoints.length < 2) {
      return (
        <div className="h-40 flex flex-col items-center justify-center bg-[#0A0A0B]/60 rounded-xl border border-dashed border-white/5 p-4">
          <TrendingUp className="w-8 h-8 text-white/20 mb-1" />
          <p className="text-[11px] text-white/40 text-center">Registros de combustíveis insuficientes.</p>
          <p className="text-[9px] text-white/30 text-center mt-0.5">Faça pelo menos 2 abastecimentos com kM diferentes para calcular e plotar médias de consumo.</p>
        </div>
      );
    }

    const width = 400;
    const height = 140;
    const padding = 25;

    const values = dataPoints.map((d) => d.avgConsumption || 0);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const yRange = maxVal - minVal;

    const getX = (index: number) => {
      if (dataPoints.length <= 1) return padding;
      return padding + (index / (dataPoints.length - 1)) * (width - padding * 2);
    };

    const getY = (val: number) => {
      if (yRange === 0) return height / 2;
      return height - padding - ((val - minVal) / yRange) * (height - padding * 2);
    };

    // Construct path line
    const pathD = dataPoints.reduce((acc, curr, index) => {
      const x = getX(index);
      const y = getY(curr.avgConsumption || 0);
      return acc + `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, '');

    // Under-fill gradient path
    const fillD = pathD + ` L ${getX(dataPoints.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

    return (
      <div className="bg-[#0A0A0B] border border-white/5 p-4 rounded-xl mt-4">
        <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#FFB300]" />
          Evolução do Consumo (km/L)
        </h4>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFB300" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFB300" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1={padding} y1={getY(minVal)} x2={width - padding} y2={getY(minVal)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1={padding} y1={getY(maxVal)} x2={width - padding} y2={getY(maxVal)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1={padding} y1={getY((minVal + maxVal) / 2)} x2={width - padding} y2={getY((minVal + maxVal) / 2)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />

          {/* Area Fill */}
          <path d={fillD} fill="url(#chartGradient)" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Nodes */}
          {dataPoints.map((dp, idx) => {
            const x = getX(idx);
            const y = getY(dp.avgConsumption || 0);
            return (
              <g key={dp.id} className="group/node">
                <circle cx={x} cy={y} r="4" fill="#0A0A0B" stroke="#FFB300" strokeWidth="2" />
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  className="fill-[#FFB300] text-[9px] font-bold font-mono"
                >
                  {(dp.avgConsumption || 0).toFixed(1)}
                </text>
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-white/30 text-[7px]"
                >
                  {new Date(dp.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' })}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 shadow-xl" id="fuel-tracker-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#4CAF50]/10 text-[#4CAF50] rounded-xl border border-[#4CAF50]/20">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">Abastecimento</h3>
            <p className="text-xs text-white/40 font-mono">CALCULE GASTOS E CONSUMO MÉDIO</p>
          </div>
        </div>
        {!showForm && activeMotorcycle && (
          <button
            onClick={() => {
              setOdometer(activeMotorcycle.currentOdometer);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#FFB300] hover:bg-[#FFC107] rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Abastecer
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 border border-white/5 bg-black/80 p-4 rounded-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#FFB300]">ADICIONAR ABASTECIMENTO</h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Odômetro Atual (km)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300] font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Tipo de Combustível</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300]"
                required
              >
                <option value="Gasolina">Gasolina Comum</option>
                <option value="Aditivada">Gasolina Aditivada</option>
                <option value="Etanol">Etanol</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Litros</label>
              <input
                type="number"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300] font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Preço por Litro (R$)</label>
              <input
                type="number"
                step="0.01"
                value={pricePerLiter}
                onChange={(e) => setPricePerLiter(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300] font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Posto de Combustível</label>
              <input
                type="text"
                placeholder="Ex: Petrobras, Shell, Ipiranga"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-[#FFB300]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300] font-mono"
                required
              />
            </div>
          </div>

          <div className="bg-[#FFB300]/5 border border-[#FFB300]/10 p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-xs text-[#FFB300]">Custo Total Previsto:</span>
            <span className="text-sm font-black text-[#FFB300] font-mono">R$ {totalPrice.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#FFB300] hover:bg-[#FFC107] font-black text-black text-[10px] tracking-widest uppercase rounded-lg transition-all"
          >
            Registrar Abastecimento
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/30 border border-white/5 p-3 rounded-lg text-center flex flex-col justify-center">
              <span className="block text-[9px] text-[#FFB300] uppercase tracking-widest font-bold">Média Geral</span>
              <div className="mt-1 flex items-baseline justify-center gap-0.5">
                <span className="text-xl font-black text-white font-mono">
                  {overallAvgConsumption > 0 ? overallAvgConsumption.toFixed(1) : '--'}
                </span>
                <span className="text-[10px] text-[#FFB300] font-bold font-mono">km/L</span>
              </div>
            </div>
            <div className="bg-black/30 border border-white/5 p-3 rounded-lg text-center flex flex-col justify-center">
              <span className="block text-[9px] text-white/40 uppercase tracking-widest">Gasto Total</span>
              <div className="mt-1 flex items-baseline justify-center gap-0.5">
                <span className="text-[10px] text-[#FFB300] font-bold font-mono">R$</span>
                <span className="text-xl font-black text-white font-mono">{totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="bg-black/30 border border-white/5 p-3 rounded-lg text-center flex flex-col justify-center">
              <span className="block text-[9px] text-white/40 uppercase tracking-widest">Preço Médio</span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-[9px] text-white/40 font-bold font-mono">R$</span>
                <span className="text-lg font-black text-white font-mono">{averagePricePerLiter > 0 ? averagePricePerLiter.toFixed(2) : '--'}</span>
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">/L</span>
              </div>
            </div>
          </div>

          {renderConsumptionChart()}

          <div className="border border-white/5 rounded-xl bg-black/20 max-h-[220px] overflow-y-auto custom-scrollbar">
            {activeLogs.length === 0 ? (
              <div className="text-center py-10 text-white/30">
                <History className="w-8 h-8 mx-auto stroke-[1.5] text-white/20 mb-2" />
                <p className="text-xs">Nenhum abastecimento registrado nesta motocicleta.</p>
                <p className="text-[10px] text-white/20 mt-0.5">Preencha o primeiro abastecimento para calcular as médias.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {activeLogs.map((log) => {
                  let badgeColor = "bg-white/5 text-white/40";
                  if (log.fuelType === "Gasolina") badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                  if (log.fuelType === "Aditivada") badgeColor = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
                  if (log.fuelType === "Etanol") badgeColor = "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20";

                  return (
                    <div key={log.id} className="p-3 flex items-center justify-between hover:bg-black/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-black/80 rounded-lg text-[#FFB300] border border-white/5">
                          <Fuel className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{log.odometer.toLocaleString('pt-BR')} km</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase rounded ${badgeColor}`}>
                              {log.fuelType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                            {log.station && (
                              <>
                                <span className="text-white/10">•</span>
                                <span className="italic block max-w-[120px] truncate">{log.station}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs font-bold text-white">
                            {log.avgConsumption && log.avgConsumption > 0 ? (
                              <span className="text-[#FFB300] font-black font-mono">{log.avgConsumption.toFixed(1)} <span className="text-[10px] font-normal text-white/40">km/L</span></span>
                            ) : (
                              <span className="text-white/30 text-[10px] font-mono">Calculando...</span>
                            )}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">
                            {log.liters.toFixed(1)}L @ R${log.pricePerLiter.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="text-xs font-black text-white font-mono whitespace-nowrap">
                            R$ {log.totalPrice.toFixed(0)}
                          </div>
                          <button
                            onClick={() => onDeleteFuel(log.id)}
                            className="p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Excluir abastecimento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
