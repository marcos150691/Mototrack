import React, { useState } from 'react';
import { Motorcycle } from '../types';
import { Bike, Plus, Trash2, Check, Sparkles, ChevronRight } from 'lucide-react';

interface MotorcycleProfileProps {
  motorcycles: Motorcycle[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (bike: Omit<Motorcycle, 'id' | 'currentOdometer'>) => void;
  onDelete: (id: string) => void;
}

export default function MotorcycleProfile({
  motorcycles,
  activeId,
  onSelect,
  onAdd,
  onDelete,
}: MotorcycleProfileProps) {
  const [showAddNew, setShowAddNew] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [engineSize, setEngineSize] = useState(150);
  const [initialOdometer, setInitialOdometer] = useState(0);
  const [fuelCapacity, setFuelCapacity] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || year <= 0 || engineSize <= 0 || initialOdometer < 0 || fuelCapacity <= 0) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }
    onAdd({
      brand,
      model,
      year,
      engineSize,
      initialOdometer,
      fuelCapacity,
    });
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear());
    setEngineSize(150);
    setInitialOdometer(0);
    setFuelCapacity(12);
    setShowAddNew(false);
  };

  const selectedBike = motorcycles.find((m) => m.id === activeId);

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 shadow-xl" id="moto-profile-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FFB300]/10 text-[#FFB300] rounded-xl border border-[#FFB300]/20">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">Minhas Motos</h3>
            <p className="text-xs text-white/40 font-mono">GERENCIE SEUS PERFIS ATIVOS</p>
          </div>
        </div>
        {!showAddNew && (
          <button
            onClick={() => setShowAddNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#FFB300] hover:bg-[#FFC107] rounded-lg transition-all duration-200"
            id="btn-add-moto"
          >
            <Plus className="w-4 h-4" />
            Nova Moto
          </button>
        )}
      </div>

      {showAddNew ? (
        <form onSubmit={handleSubmit} className="space-y-4 border border-white/5 bg-[#0A0A0B]/80 p-4 rounded-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#FFB300]">CADASTRAR NOVA MOTO</h4>
            <button
              type="button"
              onClick={() => setShowAddNew(false)}
              className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Marca</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white/95 focus:outline-none focus:border-[#FFB300]"
                required
              >
                <option value="">Selecione...</option>
                <option value="Honda">Honda</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Suzuki">Suzuki</option>
                <option value="Kawasaki">Kawasaki</option>
                <option value="BMW">BMW</option>
                <option value="Triumph">Triumph</option>
                <option value="Ducati">Ducati</option>
                <option value="Harley-Davidson">Harley-Davidson</option>
                <option value="Royal Enfield">Royal Enfield</option>
                <option value="Outra">Outra</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Modelo / Versão</label>
              <input
                type="text"
                placeholder="Ex: CB 500X, Fazer 250"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-[#FFB300]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Cilindradas (cc)</label>
              <input
                type="number"
                value={engineSize}
                onChange={(e) => setEngineSize(parseInt(e.target.value) || 150)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Tanque (Litros)</label>
              <input
                type="number"
                step="0.1"
                value={fuelCapacity}
                onChange={(e) => setFuelCapacity(parseFloat(e.target.value) || 12)}
                className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Odômetro Inicial (km)</label>
            <input
              type="number"
              placeholder="Ex: 12500"
              value={initialOdometer}
              onChange={(e) => setInitialOdometer(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-black border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#FFB300]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#FFB300] hover:bg-[#FFC107] font-black text-black text-[10px] tracking-widest uppercase rounded-lg transition-all duration-200"
          >
            Confirmar Cadastro
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {motorcycles.length === 0 ? (
            <div className="text-center py-8 bg-black/40 rounded-xl border border-dashed border-white/10">
              <p className="text-xs text-white/50">Nenhuma motocicleta cadastrada.</p>
              <p className="text-[10px] text-white/30 mt-1">Insira uma moto para começar a monitorar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {motorcycles.map((bike) => {
                const isActive = bike.id === activeId;
                return (
                  <div
                    key={bike.id}
                    onClick={() => onSelect(bike.id)}
                    className={`group relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'bg-black/95 border border-[#FFB300]/50 shadow-lg shadow-[#FFB300]/5'
                        : 'bg-black/30 border border-white/5 hover:border-white/10 hover:bg-black/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg transition-colors duration-200 ${
                          isActive ? 'bg-[#FFB300]/20 text-[#FFB300]' : 'bg-white/5 text-white/40 group-hover:text-white/60'
                        }`}
                      >
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-white font-bold text-sm">
                            {bike.brand} {bike.model}
                          </h4>
                          {isActive && (
                            <span className="flex items-center px-1.5 py-0.5 text-[8px] font-black tracking-widest text-[#FFB300] bg-[#FFB300]/10 rounded uppercase border border-[#FFB300]/20">
                              Ativa
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40">
                          <span>{bike.engineSize}cc</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                          <span>{bike.year}</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                          <span className="text-white/80 font-mono">{bike.currentOdometer.toLocaleString('pt-BR')} km</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {motorcycles.length > 1 && (
                        <button
                          onClick={() => onDelete(bike.id)}
                          className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remover motocicleta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-[#FFB300] translate-x-0.5' : 'text-white/20'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedBike && (
        <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
          <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
            <span className="block text-[9px] text-white/40 uppercase tracking-widest font-mono">Tanque Combustível</span>
            <span className="text-sm font-bold text-white font-mono">{selectedBike.fuelCapacity} L</span>
          </div>
          <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
            <span className="block text-[9px] text-white/40 uppercase tracking-widest font-mono">Odômetro Inicial</span>
            <span className="text-sm font-bold text-white font-mono">{selectedBike.initialOdometer.toLocaleString('pt-BR')} km</span>
          </div>
        </div>
      )}
    </div>
  );
}
