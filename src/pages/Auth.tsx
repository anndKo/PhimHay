import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Film, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const {
    user,
    signIn,
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: 'Đăng nhập thành công!'
        });
        navigate('/');
      } else {
        const {
          error
        } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({
          title: 'Đăng ký thành công!'
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const features = ['Xem phim không giới hạn', 'Chất lượng Full HD', 'Không quảng cáo', 'Hỗ trợ đa nền tảng'];
  return <div className="min-h-screen bg-background relative overflow-hidden flex">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] animate-pulse-slow" style={{
        animationDelay: '1s'
      }} />
        
        <div className="relative z-10 max-w-lg space-y-8 animate-fade-in">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
              <Sparkles className="relative w-12 h-12 text-primary" />
            </div>
            <span className="font-display text-4xl font-bold">
              <span className="text-gradient">ANND</span>
              <span>PHIM</span>
            </span>
          </Link>

          <div className="space-y-4">
            <h1 className="font-display text-5xl font-bold leading-tight">
              Trải nghiệm điện ảnh
              <br />
              <span className="text-gradient">đỉnh cao</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Khám phá hàng ngàn bộ phim đa dạng với chất lượng hình ảnh tuyệt vời và trải nghiệm xem không gián đoạn.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => <div key={index} className="flex items-center gap-3 text-sm opacity-0 animate-fade-in" style={{
            animationDelay: `${0.3 + index * 0.1}s`,
            animationFillMode: 'forwards'
          }}>
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>)}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="font-display text-2xl font-bold">
              <span className="text-gradient">ANND</span>
              <span>PHIM</span>
            </span>
          </Link>

          {/* Card */}
          <div className="glass-card p-8 md:p-10 space-y-8 animate-scale-in">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="font-display text-3xl font-bold">
                {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
              </h2>
              <p className="text-muted-foreground">
                {isLogin ? 'Đăng nhập để tiếp tục' : 'Đăng ký miễn phí ngay hôm nay'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-secondary/50 rounded-xl">
              <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${isLogin ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>
                Đăng nhập
              </button>
              <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${!isLogin ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>
                Đăng ký
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && <div className="space-y-2 animate-slide-up">
                  <Label htmlFor="fullName" className="text-sm font-medium">Họ và tên</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="fullName" placeholder="Nhập họ và tên" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-12 h-13 bg-secondary/50 border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                  </div>
                </div>}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/10 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-12 h-13 bg-secondary/50 border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Mật khẩu</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/10 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-12 pr-12 h-13 bg-secondary/50 border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {!isLogin && <p className="text-xs text-muted-foreground pl-1">Mật khẩu tối thiểu 6 ký tự</p>}
              </div>

              <Button type="submit" className="w-full h-13 btn-primary rounded-xl text-base font-semibold gap-2 group" disabled={isLoading}>
                {isLoading ? <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Đang xử lý...
                  </div> : <>
                    {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-4 text-muted-foreground">hoặc</span>
              </div>
            </div>

            {/* Alternative Action */}
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground gap-2">
              <Film className="w-5 h-5" />
              Tiếp tục xem không cần đăng nhập
            </Button>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground">
            Bằng việc đăng ký, bạn đồng ý với{' '}
            <a href="#" className="text-primary hover:underline">Điều khoản sử dụng</a>
            {' '}và{' '}
            <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>
          </p>
        </div>
      </div>
    </div>;
}