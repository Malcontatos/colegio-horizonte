import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useAuth, homeForRole } from '../context/auth';
import { BrandLockup } from '../components/Brand';

export function NotFoundPage() {
  const { user } = useAuth();
  const destination = user ? homeForRole(user.role) : '/login';

  return (
    <div className="bg-paper flex min-h-screen flex-col items-center justify-center px-5 py-12 text-center">
      <BrandLockup />
      <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-100 text-gold-600">
        <Compass className="h-8 w-8" />
      </div>
      <p className="mt-6 font-display text-6xl font-semibold text-navy-900">404</p>
      <h1 className="mt-2 text-xl font-semibold text-navy-800">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
        O endereço acessado não existe ou foi movido. Volte ao início para
        continuar navegando pelo portal.
      </p>
      <Link
        to={destination}
        className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white transition hover:bg-navy-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao início
      </Link>
    </div>
  );
}
