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
import { COUNTRIES } from '@/lib/countries';

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
    country: 'Türkiye',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        country: formData.country || 'Türkiye',
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

  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500'];
  const strengthTexts = ['', 'Zayıf', 'Orta', 'Güçlü'];

  const inputCls = "h-12 bg-stone-50 border-black/12 focus:border-black/40 rounded-none text-black placeholder:text-black/25";
  const labelCls = "text-xs font-medium tracking-wide uppercase text-black/50";

  return (
    <div className="min-h-screen bg-white">
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
              >
                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 border border-black/10 bg-stone-50">
                  <User className="w-6 h-6 text-black/40" />
                </div>
                <h1 className="font-display text-4xl tracking-wide mb-3 text-black" data-testid="text-page-title">
                  KAYIT OL
                </h1>
                <p className="text-black/45">
                  Hesap oluştur ve alışverişe başla.
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
                  <Label htmlFor="firstName" className={labelCls}>Ad</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Adınız"
                      data-testid="input-firstName"
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className={labelCls}>Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Soyadınız"
                      data-testid="input-lastName"
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className={labelCls}>E-posta Adresi *</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ornek@email.com"
                    required
                    data-testid="input-email"
                    className={`${inputCls} pl-11`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className={labelCls}>Telefon *</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05XX XXX XX XX"
                    required
                    data-testid="input-phone"
                    className={`${inputCls} pl-11`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className={labelCls}>Adres</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Sokak, Mahalle, Bina No, Daire No"
                  data-testid="input-address"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className={labelCls}>İl</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="İstanbul"
                    data-testid="input-city"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district" className={labelCls}>İlçe</Label>
                  <Input
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Kadıköy"
                    data-testid="input-district"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className={labelCls}>Ülke</Label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  data-testid="select-country"
                  className="w-full h-12 bg-stone-50 border border-black/12 focus:border-black/40 focus:outline-none rounded-none px-4 text-black text-sm"
                >
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className={labelCls}>Şifre *</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="En az 6 karakter"
                    required
                    data-testid="input-password"
                    className={`${inputCls} pl-11 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
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
                          className={`h-0.5 flex-1 transition-colors ${
                            passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-black/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs ${
                      passwordStrength === 1 ? 'text-red-500' :
                      passwordStrength === 2 ? 'text-amber-500' :
                      passwordStrength === 3 ? 'text-green-600' : ''
                    }`}>
                      {strengthTexts[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className={labelCls}>Şifre Tekrar *</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Şifrenizi tekrar girin"
                    required
                    data-testid="input-confirmPassword"
                    className={`${inputCls} pl-11`}
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
                  className="w-full h-12 bg-black text-white hover:bg-black/85 font-bold tracking-[0.12em] text-xs uppercase group rounded-none"
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
              <p className="text-black/45 text-sm">
                Zaten hesabın var mı?{' '}
                <Link href="/giris" data-testid="link-login">
                  <span className="text-black font-semibold hover:underline underline-offset-2">Giriş Yap</span>
                </Link>
              </p>
            </motion.div>

            <p className="text-xs text-black/30 text-center mt-6">
              Kayıt olarak <span className="underline">Kullanım Koşulları</span> ve{' '}
              <span className="underline">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
            </p>
          </motion.div>
      </main>
    </div>
  );
}
