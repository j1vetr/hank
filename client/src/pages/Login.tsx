import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: 'Başarılı', description: 'Giriş yapıldı' });
      navigate('/');
    } catch (error: any) {
      toast({ 
        title: 'Hata', 
        description: error.message || 'Giriş başarısız',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-md mx-auto">
          <h1 className="font-display text-4xl tracking-wider text-center mb-8" data-testid="text-page-title">
            GİRİŞ YAP
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                data-testid="input-email"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-testid="input-password"
                className="bg-background border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-sm tracking-wider"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
            </Button>
          </form>

          <div className="mt-8 text-center text-muted-foreground">
            <p>Hesabınız yok mu?{' '}
              <Link href="/kayit" data-testid="link-register">
                <span className="text-foreground hover:underline">Kayıt Ol</span>
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
