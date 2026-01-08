import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({ 
        title: 'Hata', 
        description: 'Şifreler eşleşmiyor',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({ 
        title: 'Hata', 
        description: 'Şifre en az 6 karakter olmalıdır',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
      });
      toast({ title: 'Başarılı', description: 'Kayıt tamamlandı' });
      navigate('/');
    } catch (error: any) {
      toast({ 
        title: 'Hata', 
        description: error.message || 'Kayıt başarısız',
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
            KAYIT OL
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ad"
                  data-testid="input-firstName"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Soyad"
                  data-testid="input-lastName"
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ornek@email.com"
                required
                data-testid="input-email"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="05XX XXX XX XX"
                data-testid="input-phone"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="En az 6 karakter"
                required
                data-testid="input-password"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Şifrenizi tekrar girin"
                required
                data-testid="input-confirmPassword"
                className="bg-background border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-sm tracking-wider"
              disabled={loading}
              data-testid="button-register"
            >
              {loading ? 'KAYIT YAPILIYOR...' : 'KAYIT OL'}
            </Button>
          </form>

          <div className="mt-8 text-center text-muted-foreground">
            <p>Zaten hesabınız var mı?{' '}
              <Link href="/giris" data-testid="link-login">
                <span className="text-foreground hover:underline">Giriş Yap</span>
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
