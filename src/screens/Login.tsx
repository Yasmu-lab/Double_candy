import { ArrowRight, Lollipop, Phone, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const canSubmit = name.trim().length > 1 && phone.trim().length > 7;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    login(name.trim(), phone.trim());
    navigate('/home');
  };

  return (
    <div className="dc-app-bg min-h-dvh px-6 py-16 sm:py-20">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm">
        <div className="mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-gradient-to-br from-pink to-purple shadow-[0_16px_40px_-12px_rgba(255,79,160,0.6)]">
          <Lollipop size={36} strokeWidth={2} color="#fff" />
        </div>
        <h1 className="mb-1.5 font-display text-3xl font-bold tracking-[-0.6px]">Bora entrar</h1>
        <p className="mb-8 text-[15px] text-text-2">Só o nome e o telefone e você já tá dentro.</p>

        <label className="mb-2 block text-[13px] font-semibold text-text-2">Nome</label>
        <Input
          icon={<User size={20} strokeWidth={2} className="text-purple shrink-0" />}
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          containerClassName="mb-[18px]"
        />

        <label className="mb-2 block text-[13px] font-semibold text-text-2">Telefone</label>
        <Input
          icon={<Phone size={20} strokeWidth={2} className="text-pink shrink-0" />}
          placeholder="(00) 00000-0000"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          containerClassName="mb-[30px]"
        />

        <Button type="submit" ripple size="lg" fullWidth disabled={!canSubmit} iconRight={<ArrowRight size={20} strokeWidth={2.2} />}>
          Entrar
        </Button>
        <p className="mt-[22px] text-center text-[12.5px] text-text-3">
          Ao entrar você concorda com os termos da cantina.
        </p>
      </form>
    </div>
  );
}
