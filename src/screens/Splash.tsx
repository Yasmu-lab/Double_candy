import { ChevronDown, Lollipop } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Splash() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div
      onClick={() => navigate(isAuthenticated ? '/home' : '/login')}
      className="relative flex min-h-dvh cursor-pointer flex-col items-center justify-center gap-8 overflow-hidden"
      style={{
        background: 'radial-gradient(900px 700px at 50% 30%, #3a1a54 0%, #1B1330 70%)',
      }}
    >
      <div
        className="animate-dc-float absolute left-[12%] top-[18%] h-24 w-24 rounded-full opacity-50 blur-[2px]"
        style={{ background: 'radial-gradient(circle at 30% 30%,#FF7FBB,#E63B8C)' }}
      />
      <div
        className="animate-dc-float absolute bottom-[22%] right-[13%] h-[70px] w-[70px] rounded-full opacity-45"
        style={{ background: 'radial-gradient(circle at 30% 30%,#C6FF4D,#8fbf20)', animationDelay: '.5s' }}
      />
      <div
        className="animate-dc-float absolute right-[18%] top-[34%] h-11 w-11 rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle at 30% 30%,#9B6BFF,#6b3fd6)', animationDelay: '1s' }}
      />

      <div className="animate-dc-scale-in flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-pink to-purple shadow-[0_24px_60px_-14px_rgba(255,79,160,0.7)]">
        <Lollipop size={56} strokeWidth={2} color="#fff" />
      </div>

      <div className="animate-dc-fade-up text-center [animation-delay:.1s]">
        <div className="font-display text-4xl font-bold tracking-[-1px]">Double Candy</div>
        <div className="mt-1.5 text-[15px] text-text-2">Doces da galera, na palma da mão</div>
      </div>

      <div className="animate-dc-fade absolute bottom-14 flex flex-col items-center gap-2.5 [animation-delay:.6s]">
        <div className="animate-dc-float flex h-6 w-6 items-center justify-center rounded-full border-2 border-text-2">
          <ChevronDown size={13} strokeWidth={3} className="text-text-2" />
        </div>
        <span className="text-xs text-text-2">Toque para começar</span>
      </div>
    </div>
  );
}
