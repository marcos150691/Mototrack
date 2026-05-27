import React, { useState } from 'react';
import { RideLog, Motorcycle } from '../types';
import { Route, Plus, Trash2, Calendar, MapPin, Gauge } from 'lucide-react';

interface RideLogsProps {
  rides: RideLog[];
  activeMotorcycle: Motorcycle | null;
  onAddRide: (ride: Omit<RideLog, 'id' | 'distance'>) => void;
  onDeleteRide: (id: string) => void;
}

export default function RideLogs({
  rides,
  activeMotorcycle,
  onAddRide,
  onDeleteRide,
}: RideLogsProps) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [startKm, setStartKm] = useState(activeMotorcycle?.currentOdometer || 0);
  const [endKm, setEndKm] = useState((activeMotorcycle?.currentOdometer || 0) + 10);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Sync starting Km with motorcycle change
  React.useEffect(() => {
    if (activeMotorcycle) {
      setStartKm(activeMotorcycle.currentOdometer);
      setEndKm(activeMotorcycle.currentOdometer + 10);
    }
  }, [activeMotorcycle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMotorcycle) return;

    if (!description || startKm < 0 || endKm <= startKm) {
      alert('A quilometragem final deve ser maior que a quilometragem inicial e a descrição deve ser informada.');
      return;
    }

    onAddRide({
      motorcycleId: activeMotorcycle.id,
      date,
      description,
      startKm,
      endKm,
    });

    setDescription('');
    setStartKm(endKm); // Auto-advances start km for next log
    setEndKm(endKm + 10);
    setShowForm(false);
  };

  const activeRides = rides.filter((r) => r.motorcycleId === activeMotorcycle?.id);
  const totalKmTraveled = activeRides.reduce((acc, curr) => acc + curr.distance, 0);  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 shadow-xl" id="ride-logs-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FFB300]/10 text-[#FFB300] rounded-xl border border-[#FFB300]/20">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">Registro de Viagens</h3>
            <p className="text-xs text-white/40 font-mono">MONITORE TRAJETOS E QUILOMETRAGEM</p>
          </div>
        </div>
        {!showForm && activeMotorcycle && (
          <button
            onClick={() => {
              // Ensure odometer values are freshly read from currently active bike
              setStartKm(activeMotorcycle.currentOdometer);
              setEndKm(activeMotorcycle.currentOdometer + 15);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#FFB300] hover:bg-[#FFC107] rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Novo Trajeto
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 border border-white/5 bg-black/80 p-4 rounded-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#FFB300]">ADICIONAR NOVO PERCURSO</h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Trabalho (Ida e Volta), Viagem Serra"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-[#FFB300]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Partida (km)</label>
              <input
                type="number"
                value={startKm}
                onChange={(e) => setStartKm(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300] font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Chegada (km)</label>
              <input
                type="number"
                value={endKm}
                onChange={(e) => setEndKm(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300] font-mono"
                required
              />
            </div>
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

          <div className="bg-[#FFB300]/5 border border-[#FFB300]/10 p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-xs text-[#FFB300]">Resumo da distância:</span>
            <span className="text-sm font-bold text-white font-mono">{Math.max(0, endKm - startKm)} km rodados</span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#FFB300] hover:bg-[#FFC107] font-black text-black text-[10px] tracking-widest uppercase rounded-lg transition-all"
          >
            Registrar Viagem
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-[#FFB300] uppercase tracking-widest font-bold">Total Rodado</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">{totalKmTraveled.toLocaleString('pt-BR')}</span>
                <span className="text-xs text-white/40">km</span>
              </div>
            </div>
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-[#FFB300] uppercase tracking-widest font-bold">Registros</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">{activeRides.length}</span>
                <span className="text-xs text-white/40">trajetos</span>
              </div>
            </div>
          </div>

          <div className="border border-white/5 rounded-xl bg-black/20 max-h-[250px] overflow-y-auto custom-scrollbar">
            {activeRides.length === 0 ? (
              <div className="text-center py-10 text-white/30">
                <MapPin className="w-8 h-8 mx-auto stroke-[1.5] text-white/20 mb-2" />
                <p className="text-xs">Nenhum percurso registrado nesta motocicleta.</p>
                <p className="text-[10px] text-white/20 mt-0.5">As viagens alimentam o desgaste de peças.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {activeRides.map((ride) => (
                  <div key={ride.id} className="p-3.5 flex items-center justify-between hover:bg-black/20 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-black/80 rounded-lg text-[#FFB300] border border-white/5">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{ride.description}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(ride.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-white/10">•</span>
                          <span>{ride.startKm} km à {ride.endKm} km</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-black text-white font-mono">+{ride.distance}</span>
                        <span className="text-[10px] text-[#FFB300] ml-0.5 font-bold">km</span>
                      </div>
                      <button
                        onClick={() => onDeleteRide(ride.id)}
                        className="p-1 text-white/33 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Excluir trajeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
