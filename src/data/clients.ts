export interface AdminClient {
  name: string;
  initials: string;
  phone: string;
  orders: number;
  spent: number;
  last: string;
  bg: string;
}

export const CLIENTS: AdminClient[] = [
  { name: 'Beatriz Rocha', initials: 'BR', phone: '(11) 98800-1122', orders: 14, spent: 198.5, last: 'Hoje', bg: 'linear-gradient(135deg,#FF4FA0,#E63B8C)' },
  { name: 'Pedro Alves', initials: 'PA', phone: '(11) 98812-3401', orders: 9, spent: 132.0, last: 'Hoje', bg: 'linear-gradient(135deg,#9B6BFF,#6b3fd6)' },
  { name: 'Julia Costa', initials: 'JC', phone: '(11) 99934-7712', orders: 7, spent: 98.5, last: 'Há 25 min', bg: 'linear-gradient(135deg,#FFA347,#e6842a)' },
  { name: 'Rafael Lima', initials: 'RL', phone: '(11) 97721-8890', orders: 5, spent: 64.0, last: 'Há 1h', bg: 'linear-gradient(135deg,#C6FF4D,#8fbf20)' },
  { name: 'Lucas Melo', initials: 'LM', phone: '(11) 99123-4455', orders: 4, spent: 47.5, last: 'Ontem', bg: 'linear-gradient(135deg,#FF5C6C,#E63B8C)' },
  { name: 'Sofia Nunes', initials: 'SN', phone: '(11) 98456-2200', orders: 3, spent: 38.0, last: '2 dias', bg: 'linear-gradient(135deg,#9B6BFF,#FF4FA0)' },
];
