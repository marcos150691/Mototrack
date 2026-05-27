import React, { useState, useEffect } from 'react';
import { Motorcycle, RideLog, FuelLog, MaintenanceItem, MaintenanceHistoryLog } from './types';
import MotorcycleProfile from './components/MotorcycleProfile';
import RideLogs from './components/RideLogs';
import FuelTracker from './components/FuelTracker';
import MaintenanceSchedule from './components/MaintenanceSchedule';
import AiMechanic from './components/AiMechanic';
import { calculateMaintenanceStatus, addMonths } from './utils/maintenanceHelper';
import { playMilestoneSound, playTestSound } from './utils/audioHelper';
import { MileageGoal } from './types';
import { 
  Bike, 
  Route, 
  Fuel, 
  Wrench, 
  Bot, 
  Gauge, 
  TrendingUp, 
  Sparkles, 
  Settings, 
  AlertTriangle,
  Compass,
  ArrowRight,
  CheckCircle2,
  Bell,
  Trophy,
  Target,
  Volume2,
  Trash2
} from 'lucide-react';

const LOCAL_STORAGE_KEYS = {
  motos: 'moto_odo_motos_v1',
  activeId: 'moto_odo_active_id_v1',
  rides: 'moto_odo_rides_v1',
  fuels: 'moto_odo_fuels_v1',
  items: 'moto_odo_items_v1',
  history: 'moto_odo_history_v1',
};

// Initial realistic default data for Honda CG 160 Titan
const DEFAULT_MOTORS: Motorcycle[] = [
  {
    id: 'bike-honda-1',
    brand: 'Honda',
    model: 'CG 160 Titan',
    year: 2024,
    engineSize: 160,
    initialOdometer: 10000,
    currentOdometer: 11230,
    fuelCapacity: 16.1,
  },
];

const DEFAULT_RIDES: RideLog[] = [
  {
    id: 'ride-1',
    motorcycleId: 'bike-honda-1',
    date: '2026-05-20',
    description: 'Bate-volta Campos do Jordão (Fim de Semana)',
    startKm: 10000,
    endKm: 10220,
    distance: 220,
  },
  {
    id: 'ride-2',
    motorcycleId: 'bike-honda-1',
    date: '2026-05-23',
    description: 'Ida e Volta ao Trabalho',
    startKm: 10220,
    endKm: 10245,
    distance: 25,
  },
  {
    id: 'ride-3',
    motorcycleId: 'bike-honda-1',
    date: '2026-05-25',
    description: 'Estrada - Viagem de Passeio',
    startKm: 10245,
    endKm: 11230,
    distance: 985,
  },
];

const DEFAULT_FUELS: FuelLog[] = [
  {
    id: 'fuel-1',
    motorcycleId: 'bike-honda-1',
    date: '2026-05-20',
    odometer: 10100,
    liters: 11,
    pricePerLiter: 5.79,
    totalPrice: 63.69,
    fuelType: 'Gasolina',
    station: 'Posto Petrobras BR',
  },
  {
    id: 'fuel-2',
    motorcycleId: 'bike-honda-1',
    date: '2026-05-22',
    odometer: 10510,
    liters: 12.1,
    pricePerLiter: 5.85,
    totalPrice: 70.79,
    fuelType: 'Gasolina',
    station: 'Posto Shell Select',
    avgConsumption: 33.88, // (10510 - 10100) / 12.1 = 33.88 km/L
  },
  {
    id: 'fuel-3',
    motorcycleId: 'bike-honda-1',
    date: '2026-05-25',
    odometer: 11020,
    liters: 13.5,
    pricePerLiter: 5.69,
    totalPrice: 76.82,
    fuelType: 'Aditivada',
    station: 'Posto Ipiranga Rota 60',
    avgConsumption: 37.77, // (11020 - 10510) / 13.5 = 37.77 km/L
  },
];

const DEFAULT_ITEMS: MaintenanceItem[] = [
  {
    id: 'item-1',
    motorcycleId: 'bike-honda-1',
    name: 'Troca de Óleo do Motor (3.000 km)',
    intervalKm: 3000,
    lastCompletedKm: 10000,
    nextDueKm: 13000,
    triggerType: 'both',
    intervalMonths: 6,
    lastCompletedDate: '2026-05-18',
    nextDueDate: '2026-11-18',
  },
  {
    id: 'item-2',
    motorcycleId: 'bike-honda-1',
    name: 'Pastilhas de Freio (10.000 km)',
    intervalKm: 10000,
    lastCompletedKm: 8000,
    nextDueKm: 18000,
    triggerType: 'km',
  },
  {
    id: 'item-3',
    motorcycleId: 'bike-honda-1',
    name: 'Filtro de Ar (15.000 km)',
    intervalKm: 15000,
    lastCompletedKm: 0,
    nextDueKm: 15000,
    triggerType: 'km',
  },
  {
    id: 'item-4',
    motorcycleId: 'bike-honda-1',
    name: 'Vela de Ignição (12.000 km)',
    intervalKm: 12000,
    lastCompletedKm: 0,
    nextDueKm: 12000,
    triggerType: 'km',
  },
  {
    id: 'item-5',
    motorcycleId: 'bike-honda-1',
    name: 'Kit Relação (Corrente/Pinhão)',
    intervalKm: 15000,
    lastCompletedKm: 10000,
    nextDueKm: 25000,
    triggerType: 'km',
  },
  {
    id: 'item-6',
    motorcycleId: 'bike-honda-1',
    name: 'Revisão Geral de Mangueiras e Fluido (Anual)',
    intervalKm: 0,
    lastCompletedKm: 10000,
    nextDueKm: 10000,
    triggerType: 'period',
    intervalMonths: 12,
    lastCompletedDate: '2025-05-20',
    nextDueDate: '2026-05-20', // Overdue since May 20th!
  }
];

const DEFAULT_HISTORY: MaintenanceHistoryLog[] = [
  {
    id: 'hist-1',
    motorcycleId: 'bike-honda-1',
    itemId: 'item-1',
    itemName: 'Óleo do Motor (3.000 km)',
    date: '2026-05-18',
    odometer: 10000,
    cost: 48.00,
    notes: 'Mobil Super Moto 20W50',
  },
  {
    id: 'hist-2',
    motorcycleId: 'bike-honda-1',
    itemId: 'item-5',
    itemName: 'Kit Relação (Corrente/Pinhão)',
    date: '2026-05-18',
    odometer: 10000,
    cost: 160.00,
    notes: 'Relação DID com retentor',
  },
];

export default function App() {
  const [time, setTime] = useState('14:42');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load State from LocalStorage or default
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.motos);
    return saved ? JSON.parse(saved) : DEFAULT_MOTORS;
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.activeId);
    return saved ? saved : (DEFAULT_MOTORS[0]?.id || null);
  });

  const [rides, setRides] = useState<RideLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.rides);
    return saved ? JSON.parse(saved) : DEFAULT_RIDES;
  });

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.fuels);
    return saved ? JSON.parse(saved) : DEFAULT_FUELS;
  });

  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.items);
    return saved ? JSON.parse(saved) : DEFAULT_ITEMS;
  });

  const [historyLogs, setHistoryLogs] = useState<MaintenanceHistoryLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.history);
    return saved ? JSON.parse(saved) : DEFAULT_HISTORY;
  });

  // Mileage goals state with realistic initial targets
  const [mileageGoals, setMileageGoals] = useState<MileageGoal[]>(() => {
    const saved = localStorage.getItem('moto_odo_goals_v1');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'goal-demo-1',
        motorcycleId: 'bike-honda-1',
        targetKm: 12000,
        description: 'Chegar à marca de 12.000 km',
        achieved: false,
        createdAt: '2026-05-27',
      },
      {
        id: 'goal-demo-2',
        motorcycleId: 'bike-honda-1',
        targetKm: 15000,
        description: 'Grande objetivo: Viagem Rodoviária Redonda de 15k',
        achieved: false,
        createdAt: '2026-05-27',
      }
    ];
  });

  const [latestAchievedGoal, setLatestAchievedGoal] = useState<MileageGoal | null>(null);
  const [showOdoEditor, setShowOdoEditor] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'painel' | 'moto' | 'trajetos' | 'abastecimento' | 'manutencao' | 'mecanico'>('painel');
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.motos, JSON.stringify(motorcycles));
  }, [motorcycles]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.activeId, activeId);
    }
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.rides, JSON.stringify(rides));
  }, [rides]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.fuels, JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.items, JSON.stringify(maintenanceItems));
  }, [maintenanceItems]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.history, JSON.stringify(historyLogs));
  }, [historyLogs]);

  useEffect(() => {
    localStorage.setItem('moto_odo_goals_v1', JSON.stringify(mileageGoals));
  }, [mileageGoals]);

  const activeMotorcycle = motorcycles.find(m => m.id === activeId) || null;

  // Add Motorcycle
  const handleAddMotorcycle = (newBikeData: Omit<Motorcycle, 'id' | 'currentOdometer'>) => {
    const bikeId = `bike-${Math.random().toString(36).substring(7)}`;
    const newBike: Motorcycle = {
      ...newBikeData,
      id: bikeId,
      currentOdometer: newBikeData.initialOdometer,
    };

    setMotorcycles(prev => [...prev, newBike]);
    setActiveId(bikeId);

    // Bootstrap standard maintenance items for the new bike (including mileage and period dual triggers!)
    const defaultComponentsList = [
      { name: 'Óleo do Motor (3.000 km)', interval: 3000, triggerType: 'both' as const, intervalMonths: 6 },
      { name: 'Filtro de Óleo (6.000 km)', interval: 6000, triggerType: 'km' as const },
      { name: 'Pastilhas de Freio (10.000 km)', interval: 10000, triggerType: 'km' as const },
      { name: 'Filtro de Ar (15.000 km)', interval: 15000, triggerType: 'km' as const },
      { name: 'Vela de Ignição (12.000 km)', interval: 12000, triggerType: 'km' as const },
      { name: 'Kit Relação (Corrente/Pinhão)', interval: 15000, triggerType: 'km' as const },
      { name: 'Troca de Fluido de Freio e Radiador', interval: 0, triggerType: 'period' as const, intervalMonths: 12 },
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const bootstrappedItems: MaintenanceItem[] = defaultComponentsList.map((comp, idx) => {
      const nextDueDate = comp.intervalMonths ? addMonths(todayStr, comp.intervalMonths) : undefined;
      return {
        id: `item-${bikeId}-${idx}`,
        motorcycleId: bikeId,
        name: comp.name,
        intervalKm: comp.interval,
        lastCompletedKm: newBikeData.initialOdometer,
        nextDueKm: newBikeData.initialOdometer + comp.interval,
        triggerType: comp.triggerType,
        intervalMonths: comp.intervalMonths,
        lastCompletedDate: todayStr,
        nextDueDate,
      };
    });

    setMaintenanceItems(prev => [...prev, ...bootstrappedItems]);
  };

  // Delete Motorcycle
  const handleDeleteMotorcycle = (bikeId: string) => {
    const remaining = motorcycles.filter(m => m.id !== bikeId);
    setMotorcycles(remaining);

    // Delete associated data
    setRides(prev => prev.filter(r => r.motorcycleId !== bikeId));
    setFuelLogs(prev => prev.filter(f => f.motorcycleId !== bikeId));
    setMaintenanceItems(prev => prev.filter(i => i.motorcycleId !== bikeId));
    setHistoryLogs(prev => prev.filter(h => h.motorcycleId !== bikeId));

    if (activeId === bikeId && remaining.length > 0) {
      setActiveId(remaining[0].id);
    } else if (remaining.length === 0) {
      setActiveId(null);
    }
  };

  // Add Trip (updates bike odometer!)
  const handleAddRide = (rideData: Omit<RideLog, 'id' | 'distance'>) => {
    const rideId = `ride-${Math.random().toString(36).substring(7)}`;
    const distance = rideData.endKm - rideData.startKm;

    const newRide: RideLog = {
      ...rideData,
      id: rideId,
      distance,
    };

    setRides(prev => [...prev, newRide]);

    // Critical: Advance current odometer of the active motorcycle to the destination endKm!
    setMotorcycles(prev => prev.map(m => {
      if (m.id === rideData.motorcycleId) {
        // If the new trip reading exceeds current, update it!
        const maxOdo = Math.max(m.currentOdometer, rideData.endKm);
        return {
          ...m,
          currentOdometer: maxOdo,
        };
      }
      return m;
    }));
  };

  // Delete Trip (rollbacks mileage check values where necessary or stands as deletion)
  const handleDeleteRide = (rideId: string) => {
    setRides(prev => prev.filter(r => r.id !== rideId));
  };

  // Add Fueling Record (can calculate consumption)
  const handleAddFuel = (fuelData: Omit<FuelLog, 'id' | 'avgConsumption'>) => {
    const fuelId = `fuel-${Math.random().toString(36).substring(7)}`;

    // Calculate consumption over previous fuel log for same bike
    const sameMotorcycleFuels = fuelLogs
      .filter(l => l.motorcycleId === fuelData.motorcycleId)
      .sort((a, b) => b.odometer - a.odometer); // highest odometer first

    let avgConsumption: number | undefined = undefined;

    if (sameMotorcycleFuels.length > 0) {
      const topPreviousLog = sameMotorcycleFuels[0];
      const distanceDriven = fuelData.odometer - topPreviousLog.odometer;
      if (distanceDriven > 0 && fuelData.liters > 0) {
        avgConsumption = parseFloat((distanceDriven / fuelData.liters).toFixed(2));
      }
    }

    const newFuel: FuelLog = {
      ...fuelData,
      id: fuelId,
      avgConsumption,
    };

    setFuelLogs(prev => [...prev, newFuel]);

    // Also sync motorcycle odometer if this refuel reading represents a higher number!
    setMotorcycles(prev => prev.map(m => {
      if (m.id === fuelData.motorcycleId) {
        return {
          ...m,
          currentOdometer: Math.max(m.currentOdometer, fuelData.odometer),
        };
      }
      return m;
    }));
  };

  // Delete Fueling log
  const handleDeleteFuel = (fuelId: string) => {
    setFuelLogs(prev => prev.filter(f => f.id !== fuelId));
  };

  // Add Maintenance Item manually
  const handleAddMaintenanceItem = (itemData: Omit<MaintenanceItem, 'id' | 'nextDueKm' | 'nextDueDate'>) => {
    const itemId = `item-${Math.random().toString(36).substring(7)}`;
    const nextDueKm = (itemData.lastCompletedKm || 0) + (itemData.intervalKm || 0);

    let nextDueDate: string | undefined = undefined;
    if (itemData.triggerType !== 'km' && itemData.lastCompletedDate && itemData.intervalMonths) {
      nextDueDate = addMonths(itemData.lastCompletedDate, itemData.intervalMonths);
    }

    const newItem: MaintenanceItem = {
      ...itemData,
      id: itemId,
      nextDueKm,
      nextDueDate,
    };

    setMaintenanceItems(prev => [...prev, newItem]);
  };

  // Delete custom added items
  const handleDeleteCustomItem = (itemId: string) => {
    setMaintenanceItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Reset Maintenance Item / Replace Part (adds to service logs history)
  const handleResetMaintenanceItem = (
    itemId: string, 
    completedOdometer: number, 
    completedDate: string,
    cost?: number, 
    notes?: string
  ) => {
    // 1. Update the component item records (updating next due date or km appropriately)
    setMaintenanceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextDueKm = completedOdometer + (item.intervalKm || 0);
        const nextDueDate = item.intervalMonths ? addMonths(completedDate, item.intervalMonths) : undefined;
        return {
          ...item,
          lastCompletedKm: completedOdometer,
          nextDueKm,
          lastCompletedDate: completedDate,
          nextDueDate,
        };
      }
      return item;
    }));

    // 2. Fetch the item's name to register in history
    const targetItem = maintenanceItems.find(i => i.id === itemId);
    if (!targetItem || !activeId) return;

    // 3. Append history log
    const histId = `hist-${Math.random().toString(36).substring(7)}`;
    const newLog: MaintenanceHistoryLog = {
      id: histId,
      motorcycleId: activeId,
      itemId,
      itemName: targetItem.name,
      date: completedDate,
      odometer: completedOdometer,
      cost,
      notes,
    };

    setHistoryLogs(prev => [...prev, newLog]);

    // 4. Update motorcycle odometer if the replacement logged is larger than former!
    setMotorcycles(prev => prev.map(m => {
      if (m.id === activeId) {
        return {
          ...m,
          currentOdometer: Math.max(m.currentOdometer, completedOdometer),
        };
      }
      return m;
    }));
  };

  // Check odometer target goals when the active motorcycle odometer is updated
  useEffect(() => {
    if (!activeMotorcycle) return;
    const currentOdometer = activeMotorcycle.currentOdometer;

    setMileageGoals(prev => {
      const newlyAchieved = prev.find(g => 
        g.motorcycleId === activeMotorcycle.id &&
        !g.achieved &&
        currentOdometer >= g.targetKm
      );

      if (newlyAchieved) {
        // Play high-fidelity synthesized chime sound alerts!
        playMilestoneSound();

        // Store in state to display the gorgeous golden completion modal
        setLatestAchievedGoal({
          ...newlyAchieved,
          achieved: true,
        });

        // Return updated goals list
        return prev.map(g => {
          if (g.id === newlyAchieved.id) {
            return { ...g, achieved: true, notified: true };
          }
          return g;
        });
      }
      
      return prev;
    });
  }, [activeMotorcycle?.currentOdometer, activeMotorcycle?.id]);

  // Adjust odometer manually (excellent for testing milestones)
  const handleUpdateOdometer = (bikeId: string, newOdometer: number) => {
    setMotorcycles(prev => prev.map(m => {
      if (m.id === bikeId) {
        return {
          ...m,
          currentOdometer: Math.max(0, newOdometer),
        };
      }
      return m;
    }));
  };

  // Add new odometer goal
  const handleAddGoal = (targetKm: number, description: string) => {
    if (!activeId) return;
    const isCompleted = (activeMotorcycle ? activeMotorcycle.currentOdometer : 0) >= targetKm;
    const newGoal: MileageGoal = {
      id: `goal-${Math.random().toString(36).substring(7)}`,
      motorcycleId: activeId,
      targetKm,
      description: description || `Meta de ${targetKm.toLocaleString('pt-BR')} km`,
      achieved: isCompleted,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setMileageGoals(prev => [...prev, newGoal]);
    
    // Play a test chime to confirm goal registration
    playTestSound();
  };

  // Delete odometer goal
  const handleDeleteGoal = (goalId: string) => {
    setMileageGoals(prev => prev.filter(g => g.id !== goalId));
  };

  // Compute overall KPIs for Active Motor
  const activeRides = rides.filter(r => r.motorcycleId === activeId);
  const activeFuels = fuelLogs.filter(f => f.motorcycleId === activeId);
  const activeItems = maintenanceItems.filter(i => i.motorcycleId === activeId);

  // Consumption
  const activeConsumptionLogs = activeFuels.filter(f => f.avgConsumption && f.avgConsumption > 0);
  const activeAverageConsumption = activeConsumptionLogs.length > 0
    ? activeConsumptionLogs.reduce((acc, curr) => acc + (curr.avgConsumption || 0), 0) / activeConsumptionLogs.length
    : 0;

  // Next imminent maintenance alerts (utilizing both mileage and time-period alert configurations)
  const imminentMaintenance = activeItems
    .map(item => {
      const currentKm = activeMotorcycle ? activeMotorcycle.currentOdometer : 0;
      const status = calculateMaintenanceStatus(item, currentKm);
      return { item, status };
    })
    .sort((a, b) => b.status.percent - a.status.percent); // highest wear percentage first

  const criticalIssues = imminentMaintenance.filter(m => m.status.isUrgent);
  const cautionIssues = imminentMaintenance.filter(m => m.status.isWarning);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] font-sans selection:bg-[#FFB300] selection:text-black antialiased" id="main-applet-root">
      {/* System Status Telemetry Bar */}
      <header className="h-10 px-4 sm:px-8 flex justify-between items-center border-b border-white/5 bg-[#121214] font-mono select-none">
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <div className="w-0.5 sm:w-1 h-3 bg-[#FFB300]"></div>
            <div className="w-0.5 sm:w-1 h-3 bg-[#FFB300]"></div>
            <div className="w-0.5 sm:w-1 h-3 bg-[#FFB300]"></div>
            <div className="w-0.5 sm:w-1 h-3 bg-white/20"></div>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-widest text-[#FFB300]/80">SIGNAL: STRONG</span>
        </div>
        <span className="text-xs font-bold tracking-tighter text-white">{time}</span>
        <div className="flex items-center gap-3">
          <span className="text-[9px] sm:text-[10px] text-white/40">BAT: 88%</span>
          <div className="w-6 h-3 border border-white/20 rounded-sm p-[1px]">
            <div className="w-full h-full bg-[#4CAF50]"></div>
          </div>
        </div>
      </header>

      {/* Main Top Header Navigation with Branding */}
      <header className="border-b border-white/5 bg-[#0A0A0B]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#FFB300] text-black p-2 rounded-lg shadow-lg">
              <Gauge className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                MotoTrack <span className="text-[9px] bg-white/5 text-[#FFB300] border border-white/10 font-mono font-bold px-1.5 py-0.5 rounded tracking-normal normal-case">V2.4</span>
              </h1>
              <p className="text-[10px] text-white/40 font-mono">TELEMETRY & COMPONENT TRACKER</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell alert hub */}
            {activeMotorcycle && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-[#121214] text-white/70 hover:text-[#FFB300] border border-white/5 hover:border-[#FFB300]/30 rounded-xl transition-all relative"
                  title="Painel de Notificações de Alerta"
                  id="notif-bell-btn"
                >
                  <Bell className="w-4 h-4" />
                  {(criticalIssues.length + cautionIssues.length) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] font-black items-center justify-center text-white font-mono">
                        {criticalIssues.length + cautionIssues.length}
                      </span>
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in" id="notif-dropdown">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                      <span className="text-[10px] font-black tracking-widest text-[#FFB300] uppercase font-mono">CENTRO DE ALERTAS</span>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-[9px] text-white/30 hover:text-white uppercase font-bold"
                      >
                        Fechar
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {criticalIssues.length === 0 && cautionIssues.length === 0 ? (
                        <div className="text-center py-6 text-white/30 text-xs">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400/30 mx-auto mb-1.5" />
                          <p className="font-bold text-white/70">Nenhum Alerta Pendente</p>
                          <p className="text-[9px] text-white/40 mt-0.5 font-mono">Todas as peças estão dentro dos prazos de conformidade.</p>
                        </div>
                      ) : (
                        <>
                          {criticalIssues.map(({ item, status }) => (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                setActiveTab('manutencao');
                                setShowNotifications(false);
                              }}
                              className="p-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-left cursor-pointer transition-colors group flex gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white uppercase tracking-wider line-clamp-1">{item.name}</p>
                                <p className="text-[9px] text-red-300 font-mono mt-0.5">{status.statusText}</p>
                                <p className="text-[8px] text-white/40 font-mono mt-0.5">Vence em: {status.nextDueText}</p>
                              </div>
                            </div>
                          ))}
                          {cautionIssues.map(({ item, status }) => (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                setActiveTab('manutencao');
                                setShowNotifications(false);
                              }}
                              className="p-2.5 bg-[#FFB300]/5 hover:bg-[#FFB300]/10 border border-[#FFB300]/20 rounded-xl text-left cursor-pointer transition-colors group flex gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 text-[#FFB300] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white uppercase tracking-wider line-clamp-1">{item.name}</p>
                                <p className="text-[9px] text-[#FFB300]/80 font-mono mt-0.5">{status.statusText}</p>
                                <p className="text-[8px] text-white/40 font-mono mt-0.5">Vence em: {status.nextDueText}</p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t border-white/5 mt-3 text-center">
                      <button
                        onClick={() => {
                          setActiveTab('manutencao');
                          setShowNotifications(false);
                        }}
                        className="text-[9px] font-black uppercase text-[#FFB300] hover:underline font-mono tracking-wider"
                      >
                        GERENCIAR ALERTAS DE PEÇAS
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick bike status indicator */}
            {activeMotorcycle ? (
              <div className="bg-[#121214] border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Bike className="w-4 h-4 text-[#FFB300]" />
                <span className="text-xs font-mono font-bold text-white/80">
                  {activeMotorcycle.brand} {activeMotorcycle.model}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse"></span>
              </div>
            ) : (
              <span className="text-xs text-white/30 italic">Cadastre uma moto para iniciar</span>
            )}
          </div>
        </div>
      </header>

      {/* Main application body spacing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Navigation Tabs bar resembling dashboard modules */}
        <div className="flex items-center gap-1 bg-[#121214] p-1.5 rounded-xl mb-6 overflow-x-auto border border-white/5 no-scrollbar" id="nav-tabs">
          <button
            onClick={() => setActiveTab('painel')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider whitespace-nowrap ${
              activeTab === 'painel' ? 'bg-[#FFB300] text-black shadow-inner font-extrabold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Painel Central
          </button>
          <button
            onClick={() => setActiveTab('moto')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider whitespace-nowrap ${
              activeTab === 'moto' ? 'bg-[#FFB300] text-black shadow-inner font-extrabold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            Minhas Motos
          </button>
          <button
            onClick={() => setActiveTab('trajetos')}
            disabled={!activeId}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed ${
              activeTab === 'trajetos' ? 'bg-[#FFB300] text-black shadow-inner font-extrabold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            Trajetos
          </button>
          <button
            onClick={() => setActiveTab('abastecimento')}
            disabled={!activeId}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed ${
              activeTab === 'abastecimento' ? 'bg-[#FFB300] text-black shadow-inner font-extrabold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            Abastecer
          </button>
          <button
            onClick={() => setActiveTab('manutencao')}
            disabled={!activeId}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed ${
              activeTab === 'manutencao' ? 'bg-[#FFB300] text-black shadow-inner font-extrabold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Preventiva
          </button>
          <button
            onClick={() => setActiveTab('mecanico')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider whitespace-nowrap ${
              activeTab === 'mecanico' ? 'bg-[#FFB300] text-black shadow-md font-extrabold' : 'text-white/60 hover:text-[#FFB300]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Mecânico IA
          </button>
        </div>

        {/* Tab view containers */}
        <div className="space-y-6">
          
          {/* PAINEL CENTRAL TABS */}
          {activeTab === 'painel' && (
            <div className="space-y-6" id="dashboard-tab-view">
              
              {/* ODOMETER INTEGRATED HERO HERO CARD */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual circular dashboard cluster panel */}
                <div className="lg:col-span-7 bg-[#111113] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-[#FFB300]/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-4 z-10">
                    <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase font-sans">Computador de Bordo</span>
                    <span className="text-[9px] text-[#4CAF50] font-mono font-bold bg-[#4CAF50]/10 px-2 py-0.5 rounded border border-[#4CAF50]/20 uppercase tracking-widest">TELEMETRY: ONLINE</span>
                  </div>

                  <div className="my-6 flex flex-col items-center justify-center relative">
                    {/* SVG Odometer and Speed Dial Ring */}
                    <svg className="w-56 h-56 transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                      {/* Grey outer dial ring bg */}
                      <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="5" strokeDasharray="264" />
                      {/* Active gold glowing metric marker representing current progress inside active bike */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="42" 
                        fill="transparent" 
                        stroke="#FFB300" 
                        strokeWidth="5" 
                        strokeDasharray="264" 
                        strokeDashoffset={activeMotorcycle ? Math.max(0, 264 - (activeMotorcycle.currentOdometer % 10000) / 10000 * 264) : 264} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out shadow-lg drop-shadow-[0_0_8px_rgba(255,179,0,0.4)]"
                      />
                    </svg>

                    {/* Numeric Digital Panel inside */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-2">
                      <div className="flex items-center gap-1 text-white/40 font-bold text-[10px] uppercase tracking-[0.2em]">
                        <Gauge className="w-3.5 h-3.5 text-[#FFB300]" />
                        ODÔMETRO
                      </div>
                      <span className="text-5xl font-black text-white font-mono tracking-tighter drop-shadow-md">
                        {activeMotorcycle ? activeMotorcycle.currentOdometer.toLocaleString('pt-BR') : '0'}
                      </span>
                      <span className="text-[10px] font-bold text-[#FFB300] font-mono tracking-[0.3em] uppercase mt-1">SISTEMA INTEGRADO</span>

                      {/* Manual odometer adjustment for testing goals */}
                      {activeMotorcycle && (
                        <div className="mt-2 flex flex-col items-center z-20">
                          {showOdoEditor ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formEl = e.currentTarget;
                                const val = parseInt((formEl.elements.namedItem('directOdo') as HTMLInputElement).value) || 0;
                                handleUpdateOdometer(activeMotorcycle.id, val);
                                setShowOdoEditor(false);
                              }}
                              className="flex items-center gap-1 p-1 bg-black/85 border border-[#FFB300]/45 rounded-lg shadow-lg scale-90 animate-fade-in"
                            >
                              <input
                                name="directOdo"
                                type="number"
                                defaultValue={activeMotorcycle.currentOdometer}
                                className="w-20 px-1.5 py-0.5 text-xs text-center bg-[#111113] border border-white/5 rounded text-white font-mono focus:outline-none"
                                required
                              />
                              <button 
                                type="submit"
                                className="px-2 py-0.5 text-[8px] bg-[#FFB300] text-black font-black uppercase rounded hover:bg-[#FFC107] transition-all"
                              >
                                Salvar
                              </button>
                              <button 
                                type="button"
                                onClick={() => setShowOdoEditor(false)}
                                className="px-1.5 py-0.5 text-[8px] bg-white/5 text-white/60 hover:text-white uppercase rounded hover:bg-white/10"
                              >
                                X
                              </button>
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setShowOdoEditor(true);
                              }}
                              className="px-2 py-0.5 bg-white/5 hover:bg-[#FFB300]/10 hover:text-[#FFB300] text-[8px] font-mono font-bold tracking-wider uppercase text-white/50 hover:text-white rounded border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                              title="Ajustar quilometragem atual"
                            >
                              <Settings className="w-2.5 h-2.5 text-[#FFB300]" />
                              Ajustar Km
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KPIs Footer */}
                  <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/5 mt-2 text-center">
                    <div>
                      <span className="block text-[9px] text-white/40 font-bold uppercase tracking-widest font-sans">Motos Ativas</span>
                      <span className="text-xl font-bold text-white mt-0.5 block font-mono">{motorcycles.length}</span>
                    </div>
                    <div className="border-x border-white/5">
                      <span className="block text-[9px] text-white/40 font-bold uppercase tracking-widest font-sans">Contagem</span>
                      <span className="text-xl font-bold text-white mt-0.5 block font-mono">{rides.length}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-white/40 font-bold uppercase tracking-widest font-sans">Consumo Médio</span>
                      <span className="text-xl font-bold text-[#FFB300] mt-0.5 block font-mono">
                        {activeAverageConsumption > 0 ? `${activeAverageConsumption.toFixed(1)}` : '--'} <span className="text-xs text-white/40">km/L</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ALERTA DE MANUTENÇÃO / NOTIFICAÇÕES LATERAIS */}
                <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
                  
                  {/* Immediate alerts card */}
                  <div className="bg-[#111113] border border-white/5 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                        <span>LIMITES MECÂNICOS</span>
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                      </h4>

                      {criticalIssues.length === 0 && cautionIssues.length === 0 ? (
                        <div className="py-12 text-center text-white/30">
                          <CheckCircle2 className="w-12 h-12 text-[#4CAF50]/30 mx-auto stroke-[1.2] mb-2" id="icon-success-shield" />
                          <p className="text-xs font-bold text-[#4CAF50]/80 uppercase tracking-wider">COMPONENTES EM CONFORMIDADE</p>
                          <p className="text-[10px] mt-0.5 font-mono">Todos os sistemas operacionais e alertas preventivos atendidos.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                          {criticalIssues.map(({ item, status }) => (
                            <div key={item.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                              <div>
                                <span className="block text-xs font-black text-red-350 uppercase tracking-widest">{item.name}</span>
                                <span className="block text-[10px] text-red-400/80 font-mono font-bold mt-0.5">{status.statusText}</span>
                                <span className="block text-[9px] text-white/30 font-mono mt-0.5">Vencimento: {status.nextDueText}</span>
                              </div>
                            </div>
                          ))}
                          {cautionIssues.map(({ item, status }) => (
                            <div key={item.id} className="p-3 bg-[#FFB300]/5 border border-[#FFB300]/20 rounded-xl flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-[#FFB300] shrink-0 mt-0.5" />
                              <div>
                                <span className="block text-xs font-bold text-[#FFB300]/95 uppercase tracking-widest">{item.name}</span>
                                <span className="block text-[10px] text-[#FFB300]/85 font-mono mt-0.5">{status.statusText}</span>
                                <span className="block text-[9px] text-white/40 font-mono mt-0.5">Vencimento: {status.nextDueText}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <button
                        onClick={() => setActiveTab('manutencao')}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white font-bold rounded-xl transition-all duration-200 uppercase tracking-widest flex items-center justify-center gap-1"
                      >
                        Acessar Painel de Peças
                        <ArrowRight className="w-3.5 h-3.5 text-[#FFB300]" />
                      </button>
                    </div>
                  </div>

                  {/* AI Quick mechanical advice card */}
                  <div className="bg-[#111113] border border-white/5 rounded-3xl p-5 shadow-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute -right-2 -bottom-2 w-28 h-28 bg-[#FFB300]/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="p-3 bg-[#FFB300]/10 text-[#FFB300] rounded-2xl border border-[#FFB300]/20">
                      <Bot className="w-7 h-7 shrink-0 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#FFB300] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#FFB300]" />
                        MECÂNICO DE BOLSO IA
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">Dúvida sobre barulho ou manutenção preventiva?</h4>
                      <p className="text-[10px] text-white/40 mt-0.5">Clique para falar com o assistente inteligente agora mesmo.</p>
                      <button
                        onClick={() => setActiveTab('mecanico')}
                        className="mt-2.5 px-3 py-1 bg-[#FFB300] hover:bg-[#FFC107] text-black text-[9px] font-black rounded-lg uppercase tracking-widest transition-all"
                      >
                        Iniciar Conversa
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* QUICK STATS CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                  <div className="p-3 bg-white/5 text-slate-300 rounded-xl border border-white/10">
                    <Route className="w-5 h-5 text-[#FFB300]" />
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Último Percurso</span>
                    <h5 className="text-xs font-bold text-white mt-1 line-clamp-1">
                      {activeRides.length > 0 ? activeRides[activeRides.length - 1].description : 'Nenhuma viagem'}
                    </h5>
                    <span className="text-xs text-[#FFB300] font-mono font-black block mt-0.5">
                      {activeRides.length > 0 ? `+${activeRides[activeRides.length - 1].distance} km` : '--'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                  <div className="p-3 bg-white/5 text-slate-300 rounded-xl border border-white/10">
                    <Fuel className="w-5 h-5 text-[#4CAF50]" />
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Combustível Abastecido</span>
                    <h5 className="text-sm font-black text-white mt-1 font-mono">
                      {activeFuels.reduce((acc, curr) => acc + curr.liters, 0).toFixed(1)} <span className="text-xs text-white/40">Litros</span>
                    </h5>
                    <span className="text-[10px] text-white/50 block font-mono">
                      R$ {activeFuels.reduce((acc, curr) => acc + curr.totalPrice, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pagos
                    </span>
                  </div>
                </div>

                <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                  <div className="p-3 bg-white/5 text-slate-300 rounded-xl border border-white/10">
                    <Wrench className="w-5 h-5 text-[#FFB300]" />
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Atenção Preventiva</span>
                    <h5 className="text-sm font-bold text-white mt-1">
                      {imminentMaintenance.filter(m => m.percent >= 70).length} Componentes
                    </h5>
                    <span className="text-[10px] text-red-400 font-mono">
                      {criticalIssues.length} peças críticas urgentes
                    </span>
                  </div>
                </div>

              </div>

              {/* DETAILED GOALS AND MILESTONES COMPONENT */}
              <div className="bg-[#111113] border border-white/5 rounded-3xl p-6 shadow-xl animate-fade-in mt-6" id="mileage-goals-box">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#FFB300]" />
                      Metas de Quilometragem & Alertas Sonoros
                    </h3>
                    <p className="text-[10px] text-white/45 font-mono mt-0.5">ESTABELEÇA OBJETIVOS DE ESTRADA COM ALARMA EM TEMPO REAL</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playTestSound();
                      }}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-mono tracking-wider font-bold border border-white/10 rounded-lg text-white/85 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Testar como soa o alarme ao bater metas"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#FFB300]" />
                      Testar Alerta Sonoro 🔔
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
                  {/* Left Area: List Existing Milestones */}
                  <div className="lg:col-span-8 space-y-3">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Suas metas para {activeMotorcycle?.brand} {activeMotorcycle?.model}</h4>
                    
                    {mileageGoals.filter(g => g.motorcycleId === activeId).length === 0 ? (
                      <div className="py-12 text-center text-white/30 border border-dashed border-white/5 rounded-2xl bg-black/10">
                        <Trophy className="w-8 h-8 text-white/10 mx-auto mb-2" />
                        <p className="text-xs font-bold text-white/55">Nenhuma meta de quilometragem ativa para esta moto.</p>
                        <p className="text-[9px] text-white/40 mt-1 max-w-sm mx-auto">Defina um odômetro alvo no formulário ao lado e receba uma notificação sonora festiva ao alcançá-la!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {mileageGoals.filter(g => g.motorcycleId === activeId).map((goal) => {
                          const currentKm = activeMotorcycle ? activeMotorcycle.currentOdometer : 0;
                          const isAchieved = currentKm >= goal.targetKm;
                          const diff = goal.targetKm - currentKm;
                          const percent = isAchieved ? 100 : Math.min(100, Math.max(0, Math.round((currentKm / goal.targetKm) * 100)));
                          
                          return (
                            <div 
                              key={goal.id} 
                              className={`p-4 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                                isAchieved 
                                  ? 'bg-[#FF9800]/5 border-[#FFB300]/30 shadow-inner'
                                  : 'bg-[#121214]/65 border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2.5 mb-1.5">
                                  <div>
                                    <h5 className={`text-xs font-bold uppercase tracking-wide truncate ${isAchieved ? 'text-[#FFB300]' : 'text-white'}`}>
                                      {goal.description}
                                    </h5>
                                    <span className="text-[9px] text-white/40 block font-mono mt-0.5">
                                      Alvo: {goal.targetKm.toLocaleString('pt-BR')} km
                                    </span>
                                  </div>
                                  {isAchieved ? (
                                    <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-black bg-[#FFB300] rounded-md font-mono shrink-0 flex items-center gap-1 animate-pulse">
                                      <Trophy className="w-2.5 h-2.5" />
                                      Atingido!
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/40 bg-white/5 rounded-md font-mono shrink-0">
                                      Pendente
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] space-y-1 mt-2.5 text-white/50 leading-relaxed font-mono">
                                  <div className="flex justify-between">
                                    <span>Progresso:</span>
                                    <span className={isAchieved ? "text-[#FFB300] font-bold" : "text-white/80"}>
                                      {percent}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Para alcançar:</span>
                                    <span className={isAchieved ? "text-[#FFB300]" : "text-white/80"}>
                                      {isAchieved ? 'Metas completas! 🎉' : `${diff.toLocaleString('pt-BR')} km`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                {/* Progress light indicator bar */}
                                <div className="w-3/4 bg-white/5 h-1.5 rounded-full overflow-hidden mr-3">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isAchieved ? 'bg-[#FFB300]' : 'bg-blue-500'}`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>

                                <button
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  className="p-1 px-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors shrink-0 cursor-pointer"
                                  title="Excluir de minhas metas"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Area: Define and Add Goal */}
                  <div className="lg:col-span-4 bg-black/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-[#FFB300] uppercase tracking-widest font-mono mb-3">CONSTRUIR META ALVO</h4>
                      
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const target = parseInt((form.elements.namedItem('targetKm') as HTMLInputElement).value) || 0;
                        const desc = (form.elements.namedItem('description') as HTMLInputElement).value;
                        
                        if (target <= (activeMotorcycle?.currentOdometer || 0)) {
                          alert(`Insira um valor maior que o quilômetro atual da moto (${activeMotorcycle?.currentOdometer} km).`);
                          return;
                        }
                        
                        handleAddGoal(target, desc);
                        form.reset();
                      }} className="space-y-4">
                        <div>
                          <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1 font-mono">Km Alvo do Odômetro</label>
                          <input
                            name="targetKm"
                            type="number"
                            placeholder={`Ex: ${(activeMotorcycle ? Math.ceil((activeMotorcycle.currentOdometer + 1000) / 1000) * 1000 : 15000)}`}
                            className="w-full px-3 py-2 text-xs bg-[#121214] border border-white/5 rounded-lg text-white font-mono focus:outline-none focus:border-[#FFB300] transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1 font-mono">Título ou Motivo</label>
                          <input
                            name="description"
                            type="text"
                            placeholder="Ex: Viagem de Fim de Semana"
                            className="w-full px-3 py-2 text-xs bg-[#121214] border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-[#FFB300] transition-colors"
                            required
                          />
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest w-full block font-mono">Sugestão Expressa:</span>
                          {[100, 500, 1000, 5000].map((add) => {
                            const currentVal = activeMotorcycle ? activeMotorcycle.currentOdometer : 0;
                            const sum = currentVal + add;
                            return (
                              <button
                                type="button"
                                key={add}
                                onClick={() => {
                                  handleAddGoal(sum, `Alcançar ${sum.toLocaleString('pt-BR')} km (+${add} km)`);
                                }}
                                className="px-2 py-1 bg-white/5 hover:bg-[#FFB300]/10 hover:text-[#FFB300] border border-white/5 hover:border-[#FFB300]/20 rounded text-[9px] font-mono font-bold text-white/60 transition-colors cursor-pointer"
                              >
                                +{add} km
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[#FFB300] hover:bg-[#FFC107] text-black font-black text-[9px] tracking-widest uppercase rounded-lg transition-colors mt-2 cursor-pointer"
                        >
                          Salvar Objetivo 🏁
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ACTIVE MOTORCYCLE SELECTION EDIT TABS */}
          {activeTab === 'moto' && (
            <div className="max-w-2xl mx-auto" id="moto-tab-view">
              <MotorcycleProfile
                motorcycles={motorcycles}
                activeId={activeId}
                onSelect={(id) => setActiveId(id)}
                onAdd={handleAddMotorcycle}
                onDelete={handleDeleteMotorcycle}
              />
            </div>
          )}

          {/* TRAJETOS RIDE LOGS TAB */}
          {activeTab === 'trajetos' && (
            <div className="max-w-3xl mx-auto animate-fade-in" id="trajetos-tab-view">
              <RideLogs
                rides={rides}
                activeMotorcycle={activeMotorcycle}
                onAddRide={handleAddRide}
                onDeleteRide={handleDeleteRide}
              />
            </div>
          )}

          {/* ABASTECIMENTO FUEL MANAGEMENT TAB */}
          {activeTab === 'abastecimento' && (
            <div className="max-w-3xl mx-auto" id="abastecimento-tab-view">
              <FuelTracker
                fuelLogs={fuelLogs}
                activeMotorcycle={activeMotorcycle}
                onAddFuel={handleAddFuel}
                onDeleteFuel={handleDeleteFuel}
              />
            </div>
          )}

          {/* PREVENTIVE MAINTENANCE SCHEDULES */}
          {activeTab === 'manutencao' && (
            <div className="max-w-4xl mx-auto" id="manutencao-tab-view">
              <MaintenanceSchedule
                maintenanceItems={maintenanceItems}
                historyLogs={historyLogs}
                activeMotorcycle={activeMotorcycle}
                onResetItem={handleResetMaintenanceItem}
                onAddItem={handleAddMaintenanceItem}
                onDeleteCustomItem={handleDeleteCustomItem}
              />
            </div>
          )}

          {/* REAL CHAT POCKET MECHANIC */}
          {activeTab === 'mecanico' && (
            <div className="max-w-2xl mx-auto" id="mecanico-tab-view">
              <AiMechanic
                activeMotorcycle={activeMotorcycle}
                historyLogs={historyLogs}
              />
            </div>
          )}

        </div>

      </main>

      {/* Floating alert if no active bike profile created */}
      {!activeId && activeTab !== 'moto' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#111113] border border-white/5 p-8 rounded-3xl max-w-md text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB300]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="p-4 bg-[#FFB300]/10 text-[#FFB300] rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-[#FFB300]/20 mb-4 animate-pulse">
              <Bike className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">Bem-vindo ao MotoTrack</h3>
            <p className="text-xs text-white/50 mt-3 leading-relaxed">
              Para começarmos a monitorar a quilometragem rodada da sua moto, calcular desgaste preventivo de componentes e acompanhar consumo médio de combustível, crie ou selecione um perfil de motocicleta.
            </p>
            <button
              onClick={() => {
                setActiveTab('moto');
              }}
              className="mt-6 px-6 py-3 bg-[#FFB300] hover:bg-[#FFC107] text-black font-extrabold rounded-xl uppercase text-[10px] tracking-widest transition-all duration-200"
            >
              Criar Perfil da Moto
            </button>
          </div>
        </div>
      )}

      {/* GOAL CELEBRATION OVERLAY */}
      {latestAchievedGoal && activeMotorcycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-[#111113] border-2 border-[#FFB300] p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden animate-scale-up">
            {/* Ambient golden background glow */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#FFB300]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#FFB300]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="p-4 bg-[#FFB300]/20 text-[#FFB300] rounded-full w-20 h-20 flex items-center justify-center mx-auto border-2 border-[#FFB300]/50 mb-5 relative animate-bounce animate-duration-1000">
              <Trophy className="w-10 h-10" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-300 animate-pulse" />
            </div>

            <h3 className="text-xl font-black uppercase tracking-wider text-white">
              Meta de Odômetro Batida! 🏍️🏆
            </h3>
            <span className="text-[10px] font-mono text-[#FFB300] bg-[#FFB300]/10 border border-[#FFB300]/30 px-3 py-1 rounded-full uppercase tracking-widest mt-2 inline-block">
              {latestAchievedGoal.targetKm.toLocaleString('pt-BR')} km alcançados!
            </span>
            
            <p className="text-xs sm:text-sm text-white/80 mt-4 leading-relaxed font-sans">
              Parabéns! Sua moto <strong className="text-white">{activeMotorcycle.brand} {activeMotorcycle.model}</strong> alcançou o odômetro de <strong className="text-[#FFB300]">{activeMotorcycle.currentOdometer.toLocaleString('pt-BR')} km</strong>, atingindo com sucesso seu objetivo:
            </p>
            <p className="text-xs bg-black/50 border border-white/5 py-3 px-4 rounded-xl text-[#FFB300] font-black italic mt-3">
              "{latestAchievedGoal.description}"
            </p>

            <div className="pt-6 border-t border-white/5 mt-6 flex flex-col gap-2 font-mono">
              <button
                type="button"
                onClick={() => {
                  playMilestoneSound();
                }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-[#FFB300]" />
                Ouvir Alerta Novamente 🔔
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setLatestAchievedGoal(null);
                }}
                className="w-full py-3 bg-[#FFB300] hover:bg-[#FFC107] text-black font-extrabold text-[10px] tracking-widest uppercase rounded-xl transition-all cursor-pointer"
              >
                Confirmar e Continuar Rodando! 🏍️💨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern, clean minimalist footer */}
      <footer className="border-t border-white/5 bg-[#121214]/30 text-white/40 text-center py-8 text-xs font-mono mt-12">
        <p className="tracking-widest uppercase text-[9px] text-[#FFB300]/80">MOTOTRACK COMPONENT SYSTEMS</p>
        <p className="mt-1">© 2026 MotoTrack - Telemetria e Desempenho de Categoria Profissional</p>
        <p className="text-[10px] text-white/20 mt-1.5">Armazenamento local persistente seguro e criptografado offline.</p>
      </footer>
    </div>
  );
}
