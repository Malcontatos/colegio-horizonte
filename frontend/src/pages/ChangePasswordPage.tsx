import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, homeForRole } from '../context/auth';
import {
  Button,
  Card,
  Field,
  FormError,
  Input,
  PageHeader,
} from '../components/ui';
import { api, ApiError } from '../lib/api';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z
      .string()
      .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
      .regex(/[A-Za-z]/, 'A nova senha deve conter letras.')
      .regex(/[0-9]/, 'A nova senha deve conter números.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export function ChangePasswordPage() {
  const { user } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      await api.patch<{ message: string }>('/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Senha alterada com sucesso.');
      reset();
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível alterar a senha.',
      );
    }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={user ? homeForRole(user.role) : '/login'}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 transition hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o início
      </Link>

      <PageHeader
        eyebrow="Sua conta"
        title="Alterar senha"
        description="Escolha uma senha forte, com pelo menos 8 caracteres, letras e números. A troca é imediata."
      />

      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-100/60 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
          <p className="text-[13px] leading-relaxed text-navy-600">
            Por segurança, não compartilhe sua senha. Se você acredita que ela
            foi exposta, altere-a agora mesmo e avise a secretaria.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <FormError message={serverError} />

          <Field
            label="Senha atual"
            htmlFor="currentPassword"
            error={errors.currentPassword?.message}
          >
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha atual"
              {...register('currentPassword')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nova senha"
              htmlFor="newPassword"
              error={errors.newPassword?.message}
              hint="Mínimo de 8 caracteres, com letras e números."
            >
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Nova senha"
                {...register('newPassword')}
              />
            </Field>

            <Field
              label="Confirmar nova senha"
              htmlFor="confirmPassword"
              error={errors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                {...register('confirmPassword')}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-navy-400">
              A sessão atual continua ativa após a alteração.
            </p>
            <Button type="submit" loading={isSubmitting} icon={<KeyRound className="h-4 w-4" />}>
              Salvar nova senha
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
