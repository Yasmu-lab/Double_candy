import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Lock, Lollipop } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const schema = z
  .object({
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'As senhas não coincidem', path: ['confirmPassword'] });
type FormValues = z.infer<typeof schema>;

export function ResetPassword() {
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const init = useAuthStore((s) => s.init);
  // The recovery link's session is established asynchronously by the Supabase client parsing
  // the URL on load, so we can't just check getSession() synchronously on mount.
  const [ready, setReady] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    let settled = false;
    const settle = (valid: boolean) => {
      if (settled) return;
      settled = true;
      setReady(valid ? 'valid' : 'invalid');
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) settle(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') settle(true);
    });
    const timeout = setTimeout(() => settle(false), 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      await init();
      setDone(true);
      showToast('Senha redefinida com sucesso!');
      setTimeout(() => navigate('/home'), 1600);
    } catch {
      showToast('Não deu pra redefinir a senha. Peça um novo link.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dc-app-bg animate-dc-fade-up min-h-dvh px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-gradient-to-br from-pink to-purple shadow-[0_16px_40px_-12px_rgba(255,79,160,0.6)]">
          <Lollipop size={36} strokeWidth={2} color="#fff" />
        </div>

        {ready === 'checking' && <p className="text-[15px] text-text-2">Verificando o link...</p>}

        {ready === 'invalid' && (
          <>
            <h1 className="mb-1.5 font-display text-3xl font-bold tracking-[-0.6px]">Link inválido</h1>
            <p className="mb-8 text-[15px] text-text-2">
              Esse link de redefinição expirou ou já foi usado. Peça um novo em "Esqueci minha senha".
            </p>
            <Button size="lg" fullWidth onClick={() => navigate('/login')}>
              Voltar pro login
            </Button>
          </>
        )}

        {ready === 'valid' && !done && (
          <>
            <h1 className="mb-1.5 font-display text-3xl font-bold tracking-[-0.6px]">Nova senha</h1>
            <p className="mb-8 text-[15px] text-text-2">Escolha uma senha nova pra sua conta.</p>

            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="mb-[18px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Nova senha</label>
                <Input
                  icon={<Lock size={20} strokeWidth={2} className="shrink-0 text-lime" />}
                  placeholder="Mínimo 6 caracteres"
                  type="password"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="mt-1.5 text-[12.5px] text-red">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="mb-[26px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Confirmar senha</label>
                <Input
                  icon={<Lock size={20} strokeWidth={2} className="shrink-0 text-lime" />}
                  placeholder="Repita a senha"
                  type="password"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1.5 text-[12.5px] text-red">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" ripple size="lg" fullWidth disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
            </form>
          </>
        )}

        {done && (
          <div className="flex flex-col items-center text-center">
            <div className="animate-dc-scale-in flex h-[80px] w-[80px] items-center justify-center rounded-full bg-lime/[0.14]">
              <div className="animate-dc-pop flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gradient-to-br from-lime to-lime-dark [animation-delay:.15s]">
                <Check size={30} strokeWidth={3} className="text-bg-deep" />
              </div>
            </div>
            <p className="animate-dc-fade-up mt-5 text-[15px] text-text-2 [animation-delay:.2s]">
              Senha redefinida! Te levando pra tela inicial...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
