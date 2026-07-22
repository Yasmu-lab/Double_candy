export interface PrepItem {
  key: string;
  name: string;
  qty: number;
  orders: number;
  unit: number;
  tint: string;
}

export const PREP_ITEMS: PrepItem[] = [
  { key: 'pirulito', name: 'Pirulito Espiral', qty: 18, orders: 9, unit: 2.0, tint: 'linear-gradient(135deg,#FF4FA0,#E63B8C)' },
  { key: 'bala', name: 'Bala de Goma Rainbow', qty: 42, orders: 14, unit: 3.5, tint: 'linear-gradient(135deg,#9B6BFF,#6b3fd6)' },
  { key: 'brigadeiro', name: 'Chocolate Recheado', qty: 15, orders: 8, unit: 5.0, tint: 'linear-gradient(135deg,#FFA347,#e6842a)' },
  { key: 'pacoca', name: 'Pé de Moleque', qty: 8, orders: 5, unit: 4.0, tint: 'linear-gradient(135deg,#C6FF4D,#8fbf20)' },
  { key: 'trufa', name: 'Trufa de Morango', qty: 11, orders: 6, unit: 6.5, tint: 'linear-gradient(135deg,#FF5C6C,#E63B8C)' },
  { key: 'marsh', name: 'Marshmallow Torcido', qty: 7, orders: 4, unit: 4.5, tint: 'linear-gradient(135deg,#FF4FA0,#9B6BFF)' },
];
