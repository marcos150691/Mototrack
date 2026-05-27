export interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  year: number;
  engineSize: number; // in CC, e.g. 150, 600, 1000
  initialOdometer: number; // in km
  currentOdometer: number; // in km
  fuelCapacity: number; // in Liters
}

export interface RideLog {
  id: string;
  motorcycleId: string;
  date: string;
  description: string;
  startKm: number;
  endKm: number;
  distance: number;
}

export interface FuelLog {
  id: string;
  motorcycleId: string;
  date: string;
  odometer: number; // Odometer reading at refueling
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  fuelType: 'Gasolina' | 'Etanol' | 'Aditivada';
  station?: string;
  avgConsumption?: number; // km per Liter calculated from previous fuel log
}

export interface MaintenanceItem {
  id: string;
  motorcycleId: string;
  name: string;
  intervalKm: number;
  lastCompletedKm: number;
  nextDueKm: number;
  
  // Custom alerts (time-based or km-based or dual)
  triggerType?: 'km' | 'period' | 'both';
  intervalMonths?: number;
  lastCompletedDate?: string;
  nextDueDate?: string;

  notes?: string;
  isCustom?: boolean;
}

export interface MaintenanceHistoryLog {
  id: string;
  motorcycleId: string;
  itemId: string;
  itemName: string;
  date: string;
  odometer: number;
  cost?: number;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface MileageGoal {
  id: string;
  motorcycleId: string;
  targetKm: number;
  description: string;
  achieved: boolean;
  notified?: boolean;
  createdAt: string;
}
