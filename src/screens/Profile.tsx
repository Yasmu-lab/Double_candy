import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera, Lock, LogOut, User } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Skeleton';
import { api, ApiError } from '../lib/api';
import { validateImageFile } from '../lib/imageValidation';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Digite seu nome completo'),
  phone: z.string().trim().min(8, 'Telefone inválido'),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmPassword: z.string().min(6, 'Mínimo de 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export function Profile() {
  const navigate = useNavigate();
  const customer = useAuthStore((s) => s.customer);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const setPhotoUrl = useAuthStore((s) => s.setPhotoUrl);
  const logout = useAuthStore((s) => s.logout);
  const showToast = useUiStore((s) => s.showToast);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { name: customer?.name ?? '', phone: customer?.phone ?? '' },
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handlePhotoFile = async (file: File | undefined) => {
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      showToast(error);
      return;
    }
    setUploadingPhoto(true);
    try {
      const { photoUrl } = await api.uploadMyPhoto(file);
      setPhotoUrl(photoUrl);
      showToast('Foto atualizada');
    } catch {
      showToast('Não deu pra subir a foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSaveProfile = async (values: ProfileForm) => {
    setSavingProfile(true);
    try {
      await updateProfile(values);
      showToast('Perfil atualizado');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'PHONE_IN_USE') {
        showToast('Esse telefone já está em uso por outra conta.');
      } else {
        showToast('Não deu pra salvar. Tenta de novo.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (values: PasswordForm) => {
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      passwordForm.reset();
      showToast('Senha alterada com sucesso');
    } catch {
      showToast('Não deu pra trocar a senha. Tenta de novo.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dc-app-bg min-h-dvh px-5 pb-16 pt-8 lg:px-8 lg:pt-10">
      <div className="lg:mx-auto lg:max-w-lg">
        <div className="mb-6 flex items-center gap-4">
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeft size={20} strokeWidth={2.2} />
          </IconButton>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-[-0.5px]">Meu Perfil</h1>
            <p className="mt-0.5 text-sm text-text-2">Seus dados e preferências</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              handlePhotoFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handlePhotoFile(e.dataTransfer.files?.[0]);
            }}
            className={[
              'group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors',
              dragOver ? 'border-pink bg-pink/10' : 'border-white/10 bg-card',
            ].join(' ')}
          >
            {customer?.photoUrl ? (
              <img src={customer.photoUrl} alt={customer.name} className="h-full w-full object-cover" />
            ) : (
              <User size={40} strokeWidth={1.6} className="text-text-2" />
            )}
            <span
              className={[
                'absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity',
                uploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              ].join(' ')}
            >
              {uploadingPhoto ? <Spinner size={26} /> : <Camera size={22} strokeWidth={2} className="text-white" />}
            </span>
          </button>
          <p className="mt-2.5 text-[12.5px] text-text-2">Toque para trocar a foto</p>
        </div>

        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} noValidate className="rounded-xl border border-white/[0.06] bg-surface p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold">Dados pessoais</h2>

          <div className="mb-[16px]">
            <label className="mb-2 block text-[13px] font-semibold text-text-2">Nome</label>
            <Input placeholder="Seu nome" {...profileForm.register('name')} />
            {profileForm.formState.errors.name && (
              <p className="mt-1.5 text-[12.5px] text-red">{profileForm.formState.errors.name.message}</p>
            )}
          </div>

          <div className="mb-[20px]">
            <label className="mb-2 block text-[13px] font-semibold text-text-2">Telefone</label>
            <Input placeholder="(00) 00000-0000" type="tel" {...profileForm.register('phone')} />
            {profileForm.formState.errors.phone && (
              <p className="mt-1.5 text-[12.5px] text-red">{profileForm.formState.errors.phone.message}</p>
            )}
          </div>

          <Button type="submit" variant="primary" disabled={savingProfile}>
            {savingProfile ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </form>

        <form
          onSubmit={passwordForm.handleSubmit(onChangePassword)}
          noValidate
          className="mt-4 rounded-xl border border-white/[0.06] bg-surface p-5"
        >
          <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold">
            <Lock size={16} strokeWidth={2.2} className="text-lime" />
            Alterar senha
          </h2>

          <div className="mb-[16px]">
            <label className="mb-2 block text-[13px] font-semibold text-text-2">Nova senha</label>
            <Input placeholder="Mínimo 6 caracteres" type="password" {...passwordForm.register('password')} />
            {passwordForm.formState.errors.password && (
              <p className="mt-1.5 text-[12.5px] text-red">{passwordForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="mb-[20px]">
            <label className="mb-2 block text-[13px] font-semibold text-text-2">Confirmar senha</label>
            <Input placeholder="Repita a nova senha" type="password" {...passwordForm.register('confirmPassword')} />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="mt-1.5 text-[12.5px] text-red">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" variant="secondary" disabled={savingPassword}>
            {savingPassword ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </form>

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red/30 bg-red/[0.08] py-4 text-sm font-bold text-red transition-colors hover:bg-red/[0.16]"
        >
          <LogOut size={17} strokeWidth={2.2} />
          Sair
        </button>
      </div>
    </div>
  );
}
