import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react';

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
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
        address: formData.address || undefined,
        city: formData.city || undefined,
        district: formData.district || undefined,
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

  const passwordStrength = formData.password.length === 0 ? 0 : 
    formData.password.length < 6 ? 1 :
    formData.password.length < 8 ? 2 : 3;

  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthTexts = ['', 'Zayıf', 'Orta', 'Güçlü'];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 min-h-screen flex items-center justify-center p-6 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md py-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-2xl" />
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-xl">
                  <User className="w-7 h-7 text-white" />
                </div>
                <h1 className="font-display text-4xl tracking-wide mb-3" data-testid="text-page-title">
                  Kayıt Ol
                </h1>
                <p className="text-muted-foreground">
                  Hesap oluştur ve alışverişe başla
                </p>
              </motion.div>
            </div>
            
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">Ad</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Adınız"
                      data-testid="input-firstName"
                      className="h-12 pl-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Soyadınız"
                      data-testid="input-lastName"
                      className="h-12 pl-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">E-posta Adresi *</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ornek@email.com"
                    required
                    data-testid="input-email"
                    className="h-12 pl-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Telefon *</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05XX XXX XX XX"
                    required
                    data-testid="input-phone"
                    className="h-12 pl-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Adres</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Sokak, Mahalle, Bina No, Daire No"
                  data-testid="input-address"
                  className="h-12 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">İl</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="İstanbul"
                    data-testid="input-city"
                    className="h-12 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district" className="text-sm font-medium">İlçe</Label>
                  <Input
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Kadıköy"
                    data-testid="input-district"
                    className="h-12 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Şifre *</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="En az 6 karakter"
                    required
                    data-testid="input-password"
                    className="h-12 pl-11 pr-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs ${
                      passwordStrength === 1 ? 'text-red-500' :
                      passwordStrength === 2 ? 'text-yellow-500' :
                      passwordStrength === 3 ? 'text-green-500' : ''
                    }`}>
                      {strengthTexts[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Şifre Tekrar *</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Şifrenizi tekrar girin"
                    required
                    data-testid="input-confirmPassword"
                    className="h-12 pl-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide text-sm group rounded-lg"
                  disabled={loading}
                  data-testid="button-register"
                >
                  {loading ? (
                    'Kayıt yapılıyor...'
                  ) : (
                    <>
                      Kayıt Ol
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
              className="mt-6 text-center"
            >
              <p className="text-muted-foreground text-sm">
                Zaten hesabın var mı?{' '}
                <Link href="/giris" data-testid="link-login">
                  <span className="text-foreground font-medium hover:underline">Giriş Yap</span>
                </Link>
              </p>
            </motion.div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Kayıt olarak <span className="underline">Kullanım Koşulları</span> ve{' '}
              <span className="underline">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
            </p>
          </motion.div>
      </main>
    </div>
  );
}
