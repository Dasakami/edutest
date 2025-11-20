import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Test } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, LogOut, Plus, Clock, Edit, Trash2, BarChart3 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const data = await apiClient.getMyTests();
      setTests(data);
    } catch (error) {
      console.error('Failed to load tests:', error);
      toast.error('Ошибка загрузки тестов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
    toast.success('Вы вышли из системы');
  };

  const handleDeleteTest = async () => {
    if (!testToDelete) return;

    try {
      await apiClient.deleteTest(testToDelete);
      toast.success('Тест удален');
      loadTests();
    } catch (error) {
      console.error('Failed to delete test:', error);
      toast.error('Ошибка удаления теста');
    } finally {
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Система тестирования</h1>
              <p className="text-sm text-muted-foreground">Преподаватель: {user?.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Мои тесты</h2>
            <p className="text-muted-foreground">Создавайте и управляйте своими тестами</p>
          </div>
          <Button onClick={() => navigate('/teacher/test/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Создать тест
          </Button>
        </div>

        {tests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="mb-4 h-16 w-16 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">У вас пока нет тестов</p>
              <p className="mb-6 text-sm text-muted-foreground">Создайте свой первый тест для студентов</p>
              <Button onClick={() => navigate('/teacher/test/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Создать первый тест
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <Card key={test.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <Badge variant={test.is_active ? 'default' : 'secondary'}>
                      {test.is_active ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                  <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {test.duration_minutes} минут
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/teacher/test/${test.id}/statistics`)}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Статистика
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/teacher/test/${test.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setTestToDelete(test.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тест?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Тест и все связанные с ним данные будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTest}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
