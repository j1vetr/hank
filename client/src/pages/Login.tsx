import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20 min-h-screen flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 border border-black/10 bg-stone-50">
                  <Lock className="w-6 h-6 text-black/40" />
                </div>
                <h1 className="font-display text-4xl tracking-wide mb-3 text-black" data-testid="text-page-title">
                  HOŞ GELDİN
                </h1>
                <p className="text-black/45 text-sm">
                  Hesabına giriş yap ve alışverişe başla.
                </p>
              </motion.div>
            </div>
            
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium tracking-wide uppercase text-black/50">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    data-testid="input-email"
                    className="h-12 pl-11 bg-stone-50 border-black/12 focus:border-black/40 rounded-none text-black placeholder:text-black/25"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium tracking-wide uppercase text-black/50">Şifre</Label>
                  <Link href="/sifremi-unuttum" className="text-xs text-black/35 hover:text-black transition-colors">
                    Şifremi unuttum
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    data-testid="input-password"
                    className="h-12 pl-11 pr-11 bg-stone-50 border-black/12 focus:border-black/40 rounded-none text-black placeholder:text-black/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-black text-white hover:bg-black/85 font-bold tracking-[0.12em] text-xs uppercase group rounded-none"
                  disabled={loading}
                  data-testid="button-login"
                >
                  {loading ? (
                    'Giriş yapılıyor...'
                  ) : (
                    <>
                      Giriş Yap
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/8" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-black/30">veya</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-black/45 text-sm">
                  Hesabın yok mu?{' '}
                  <Link href="/kayit" data-testid="link-register">
                    <span className="text-black font-semibold hover:underline underline-offset-2">Hemen Kayıt Ol</span>
                  </Link>
                </p>
              </div>
            </motion.div>
          </motion.div>
      </main>
    </div>
  );
}
