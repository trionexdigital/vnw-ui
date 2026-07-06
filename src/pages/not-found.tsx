import { Link } from 'react-router-dom';
import { Logo } from '@/shared/components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="h-16 w-16 rounded-2xl" />
      <h1 className="mt-6 text-6xl font-extrabold text-gold">404</h1>
      <p className="mt-2 text-lg text-foreground">This page took a wrong number.</p>
      <p className="mt-1 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-gold mt-6">Back to Home</Link>
    </div>
  );
}
