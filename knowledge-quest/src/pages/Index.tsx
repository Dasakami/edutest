import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <div className="text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg-custom">
          <BookOpen className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          Система тестирования знаний
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Интерактивная платформа для проверки знаний по информатике
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={() => navigate('/auth/login')} className="shadow-smooth">
            <LogIn className="mr-2 h-5 w-5" />
            Войти
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth/register')}>
            <UserPlus className="mr-2 h-5 w-5" />
            Регистрация
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
