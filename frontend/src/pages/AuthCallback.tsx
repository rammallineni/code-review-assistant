import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, fetchUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      navigate('/', { replace: true });
      return;
    }

    if (token) {
      setToken(token);
      fetchUser().then(() => {
        navigate('/app', { replace: true });
      });
    } else {
      navigate('/', { replace: true });
    }
  }, [searchParams, setToken, fetchUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-ocean-500 animate-spin mx-auto mb-4" />
        <p className="text-ocean-300">Signing you in...</p>
      </div>
    </div>
  );
}
