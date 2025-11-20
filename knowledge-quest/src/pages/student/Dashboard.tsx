import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Test, TestResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookOpen, Clock, Award, LogOut, FileText, TrendingUp, Eye } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsData, resultsData] = await Promise.all([
        apiClient.getTests(true),
        apiClient.getMyResults(),
      ]);
      setTests(testsData);
      setResults(resultsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
    toast.success('Вы вышли из системы');
  };

  const handleStartTest = (testId: number) => {
    navigate(`/test/${testId}`);
  };

  const getPassRate = () => {
    if (results.length === 0) return 0;
    const passed = results.filter(r => r.passed).length;
    return Math.round((passed / results.length) * 100);
  };

  const getAverageScore = () => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.percentage, 0);
    return Math.round(total / results.length);
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
              <p className="text-sm text-muted-foreground">Студент: {user?.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Пройдено тестов</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getAverageScore()}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Успешность</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getPassRate()}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Доступные тесты</TabsTrigger>
            <TabsTrigger value="results">Мои результаты</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {tests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">Нет доступных тестов</p>
                  <p className="text-sm text-muted-foreground">Тесты появятся здесь, когда их создаст преподаватель</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tests.map((test) => (
                  <Card key={test.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{test.title}</CardTitle>
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          {test.duration_minutes} мин
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <Button className="w-full" onClick={() => handleStartTest(test.id)}>
                        Начать тест
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {results.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Award className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">Нет результатов</p>
                  <p className="text-sm text-muted-foreground">Пройдите тест, чтобы увидеть результаты</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{result.test_title}</CardTitle>
                        <Badge variant={result.passed ? 'default' : 'destructive'}>
                          {result.passed ? 'Сдан' : 'Не сдан'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Завершено: {new Date(result.completed_at).toLocaleString('ru-RU')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Результат</p>
                          <p className="text-2xl font-bold">
                            {result.score} / {result.max_score}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Процент</p>
                          <p className="text-2xl font-bold">{result.percentage}%</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/student/result/${result.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Смотреть ошибки
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
