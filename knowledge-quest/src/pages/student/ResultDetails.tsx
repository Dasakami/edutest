import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, QuestionResultDetail, TestResultDetail } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, Award, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function ResultDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResultDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [id]);

  const loadResult = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await apiClient.getResultDetail(Number(id));
      setResult(data);
    } catch (error) {
      console.error('Failed to load result details:', error);
      toast.error('Не удалось загрузить результаты теста');
      navigate('/student/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatStatus = (question: QuestionResultDetail) => {
    if (question.question_type === 'text') {
      return { label: 'Ожидает проверку', variant: 'secondary' as const };
    }
    if (question.is_correct) {
      return { label: 'Правильно', variant: 'default' as const };
    }
    return { label: 'Ошибка', variant: 'destructive' as const };
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Результаты: {result.test_title}</h1>
              <p className="text-sm text-muted-foreground">
                Пройдено {new Date(result.completed_at).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>
          <Badge variant={result.passed ? 'default' : 'destructive'}>
            {result.passed ? 'Тест сдан' : 'Тест не сдан'}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Сводка</CardTitle>
            <CardDescription>Общая информация по тесту</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Баллы</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {result.score} / {result.max_score}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Процент</p>
              <p className="text-3xl font-bold">{result.percentage}%</p>
              <Progress value={result.percentage} className="mt-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Время</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {result.time_spent_minutes ? `${result.time_spent_minutes} мин` : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result.questions.map((question, index) => {
            const status = formatStatus(question);
            const selected = question.selected_answers.length
              ? question.selected_answers.join(', ')
              : 'Нет ответа';
            const correct = question.correct_answers.length
              ? question.correct_answers.join(', ')
              : '—';

            return (
              <Card key={question.question_id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Вопрос {index + 1}: {question.question_text}
                      </CardTitle>
                      <CardDescription>
                        Баллы: {question.points}{' '}
                        {question.question_type === 'single'
                          ? '| Один правильный ответ'
                          : question.question_type === 'multiple'
                          ? '| Несколько правильных ответов'
                          : '| Текстовый ответ'}
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium text-muted-foreground">Ваш ответ</p>
                    <p className="text-base">{selected}</p>
                  </div>

                  {question.question_type !== 'text' && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm font-medium text-muted-foreground">Правильный ответ</p>
                      <p className="text-base">{correct}</p>
                    </div>
                  )}

                  {question.question_type === 'text' && (
                    <p className="text-sm text-muted-foreground">
                      Текстовые ответы проверяются преподавателем вручную. Ожидайте оценку.
                    </p>
                  )}

                  {question.question_type !== 'text' && (
                    <div className="flex items-center gap-2 text-sm">
                      {question.is_correct ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Баллы начислены: {question.earned_points}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Баллы не начислены</span>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => navigate('/student/dashboard')}>Вернуться к курсам</Button>
        </div>
      </main>
    </div>
  );
}

