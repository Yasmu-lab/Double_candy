import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Lock, Lollipop, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api, ApiError } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Digite seu nome completo'),
  phone: z.string().trim().min(8, 'Telefone inválido'),
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
});
type SignUpForm = z.infer<typeof signUpSchema>;

const signInSchema = z.object({
  phone: z.string().trim().min(8, 'Telefone inválido'),
  password: z.string().min(1, 'Digite sua senha'),
});
type SignInForm = z.infer<typeof signInSchema>;

const forgotSchema = z.object({
  phone: z.string().trim().min(8, 'Telefone inválido'),
});
type ForgotForm = z.infer<typeof forgotSchema>;

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Telefone ou senha incorretos.';
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Esse telefone já tem uma conta. Tenta entrar.';
  }
  if (message.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  return 'Não deu pra completar. Tenta de novo.';
}

export function Login() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const signIn = useAuthStore((s) => s.signIn);
  const showToast = useUiStore((s) => s.showToast);
  const [mode, setMode] = useState<'signup' | 'signin' | 'forgot'>('signup');
  const [submitting, setSubmitting] = useState(false);

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' },
  });
  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { phone: '', password: '' },
  });
  const forgotForm = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { phone: '' },
  });

  const onSignUp = async (values: SignUpForm) => {
    setSubmitting(true);
    try {
      await signUp(values.name, values.phone, values.password, values.email);
      navigate('/home');
    } catch (e) {
      if (e instanceof Error && e.message === 'SIGNUP_NEEDS_CONFIRMATION') {
        showToast('Confirmação de e-mail está ativa no projeto Supabase — peça pro admin desativar em Auth > Sign In / Providers > Email.', 'error');
      } else {
        showToast(e instanceof Error ? translateAuthError(e.message) : 'Não deu pra criar a conta.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSignIn = async (values: SignInForm) => {
    setSubmitting(true);
    try {
      await signIn(values.phone, values.password);
      navigate('/home');
    } catch (e) {
      showToast(e instanceof Error ? translateAuthError(e.message) : 'Não deu pra entrar.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = async (values: ForgotForm) => {
    setSubmitting(true);
    try {
      const { email, hasRealEmail } = await api.resolvePhoneEmail(values.phone);
      if (hasRealEmail) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        showToast('Te mandamos um link de redefinição no email cadastrado.');
      } else {
        // No real email on file yet (older account) — fall back to the admin-mediated flow.
        await api.requestPasswordReset(values.phone);
        showToast('Pedido enviado! Como você ainda não tem email cadastrado, um administrador vai te ajudar.');
      }
      forgotForm.reset();
      setMode('signin');
    } catch (e) {
      showToast(e instanceof ApiError ? 'Não deu pra enviar o pedido. Tenta de novo.' : 'Não deu pra enviar o pedido.', 'error');
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

        {mode === 'signup' ? (
          <>
            <h1 className="mb-1.5 font-display text-3xl font-bold tracking-[-0.6px]">Criar conta</h1>
            <p className="mb-8 text-[15px] text-text-2">Nome, telefone e uma senha. Rapidinho.</p>

            <form onSubmit={signUpForm.handleSubmit(onSignUp)} noValidate>
              <div className="mb-[18px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Nome</label>
                <Input
                  icon={<User size={20} strokeWidth={2} className="shrink-0 text-purple" />}
                  placeholder="Seu nome"
                  {...signUpForm.register('name')}
                />
                {signUpForm.formState.errors.name && (
                  <p className="mt-1.5 text-[12.5px] text-red">{signUpForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="mb-[18px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Telefone</label>
                <Input
                  icon={<Phone size={20} strokeWidth={2} className="shrink-0 text-pink" />}
                  placeholder="(00) 00000-0000"
                  type="tel"
                  {...signUpForm.register('phone')}
                />
                {signUpForm.formState.errors.phone && (
                  <p className="mt-1.5 text-[12.5px] text-red">{signUpForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="mb-[18px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Email</label>
                <Input
                  icon={<Mail size={20} strokeWidth={2} className="shrink-0 text-orange" />}
                  placeholder="seu@email.com"
                  type="email"
                  {...signUpForm.register('email')}
                />
                {signUpForm.formState.errors.email && (
                  <p className="mt-1.5 text-[12.5px] text-red">{signUpForm.formState.errors.email.message}</p>
                )}
                <p className="mt-1.5 text-[12px] text-text-2">Usamos só pra te ajudar a recuperar a senha se precisar.</p>
              </div>

              <div className="mb-[26px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Senha</label>
                <Input
                  icon={<Lock size={20} strokeWidth={2} className="shrink-0 text-lime" />}
                  placeholder="Mínimo 6 caracteres"
                  type="password"
                  {...signUpForm.register('password')}
                />
                {signUpForm.formState.errors.password && (
                  <p className="mt-1.5 text-[12.5px] text-red">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                ripple
                size="lg"
                fullWidth
                disabled={submitting}
                iconRight={<ArrowRight size={20} strokeWidth={2.2} />}
              >
                {submitting ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>

            <button
              onClick={() => setMode('signin')}
              className="mt-6 w-full cursor-pointer text-center text-[13px] font-semibold text-text-2 hover:text-purple"
            >
              Já tem conta? <span className="text-pink">Entrar</span>
            </button>
          </>
        ) : mode === 'signin' ? (
          <>
            <h1 className="mb-1.5 font-display text-3xl font-bold tracking-[-0.6px]">Bora entrar</h1>
            <p className="mb-8 text-[15px] text-text-2">Telefone e senha.</p>

            <form onSubmit={signInForm.handleSubmit(onSignIn)} noValidate>
              <div className="mb-[18px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Telefone</label>
                <Input
                  icon={<Phone size={20} strokeWidth={2} className="shrink-0 text-pink" />}
                  placeholder="(00) 00000-0000"
                  type="tel"
                  {...signInForm.register('phone')}
                />
                {signInForm.formState.errors.phone && (
                  <p className="mt-1.5 text-[12.5px] text-red">{signInForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="mb-[26px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Senha</label>
                <Input
                  icon={<Lock size={20} strokeWidth={2} className="shrink-0 text-lime" />}
                  placeholder="Sua senha"
                  type="password"
                  {...signInForm.register('password')}
                />
                {signInForm.formState.errors.password && (
                  <p className="mt-1.5 text-[12.5px] text-red">{signInForm.formState.errors.password.message}</p>
                )}
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="mt-2 cursor-pointer text-[12.5px] font-semibold text-text-2 hover:text-purple"
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button
                type="submit"
                ripple
                size="lg"
                fullWidth
                disabled={submitting}
                iconRight={<ArrowRight size={20} strokeWidth={2.2} />}
              >
                {submitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <button
              onClick={() => setMode('signup')}
              className="mt-6 w-full cursor-pointer text-center text-[13px] font-semibold text-text-2 hover:text-purple"
            >
              Não tem conta? <span className="text-pink">Criar conta</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setMode('signin')}
              className="mb-4 flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-text-2 hover:text-purple"
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
              Voltar
            </button>
            <h1 className="mb-1.5 font-display text-3xl font-bold tracking-[-0.6px]">Esqueci minha senha</h1>
            <p className="mb-8 text-[15px] text-text-2">
              Informa seu telefone. Se você tiver um email cadastrado, mandamos um link de redefinição na hora.
            </p>

            <form onSubmit={forgotForm.handleSubmit(onForgot)} noValidate>
              <div className="mb-[26px]">
                <label className="mb-2 block text-[13px] font-semibold text-text-2">Telefone</label>
                <Input
                  icon={<Phone size={20} strokeWidth={2} className="shrink-0 text-pink" />}
                  placeholder="(00) 00000-0000"
                  type="tel"
                  {...forgotForm.register('phone')}
                />
                {forgotForm.formState.errors.phone && (
                  <p className="mt-1.5 text-[12.5px] text-red">{forgotForm.formState.errors.phone.message}</p>
                )}
              </div>

              <Button
                type="submit"
                ripple
                size="lg"
                fullWidth
                disabled={submitting}
                iconRight={<ArrowRight size={20} strokeWidth={2.2} />}
              >
                {submitting ? 'Enviando...' : 'Enviar pedido'}
              </Button>
            </form>
          </>
        )}

        <p className="mt-[22px] text-center text-[12.5px] text-text-2">Ao continuar você concorda com os termos da Double Candy.</p>
      </div>
    </div>
  );
}
