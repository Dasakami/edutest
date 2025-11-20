import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Test, Question } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Clock, ArrowRight, ArrowLeft, Send, AlertCircle } from 'lucide-react';
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

export default function TakeTest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  useEffect(() => {
    loadTest();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadTest = async () => {
    try {
      const data = await apiClient.getTest(Number(id));
      setTest(data);
      setTimeLeft(data.duration_minutes * 60);
    } catch (error) {
      console.error('Failed to load test:', error);
      toast.error('Ошибка загрузки теста');
      navigate('/student/dashboard');
    }
  };

  const currentQuestion = test?.questions?.[currentQuestionIndex];

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Array.isArray(value) ? value : [value],
    }));
  };

  const handleCheckboxChange = (questionId: number, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, option] };
      } else {
        return { ...prev, [questionId]: current.filter((o) => o !== option) };
      }
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await apiClient.submitTest(Number(id), answers);
      toast.success('Тест отправлен на проверку!');
      navigate(`/student/result/${result.id}`);
    } catch (error) {
      console.error('Failed to submit test:', error);
      toast.error('Ошибка отправки теста');
    } finally {
      setIsSubmitting(false);
      setSubmitDialogOpen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = test?.questions ? ((currentQuestionIndex + 1) / test.questions.length) * 100 : 0;

  if (!test || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{test.title}</h1>
              <p className="text-sm text-muted-foreground">
                Вопрос {currentQuestionIndex + 1} из {test.questions?.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 rounded-lg px-4 py-2 ${timeLeft < 60 ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{currentQuestion.question_text}</CardTitle>
                <CardDescription className="mt-2">
                  Баллов: {currentQuestion.points} | Тип:{' '}
                  {currentQuestion.question_type === 'single'
                    ? 'Один ответ'
                    : currentQuestion.question_type === 'multiple'
                    ? 'Несколько ответов'
                    : 'Текстовый ответ'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.question_type === 'single' && (
              <RadioGroup
                value={answers[currentQuestion.id]?.[0] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.question_type === 'multiple' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                    <Checkbox
                      id={`option-${index}`}
                      checked={answers[currentQuestion.id]?.includes(option) || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(currentQuestion.id, option, checked as boolean)
                      }
                    />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'text' && (
              <Textarea
                placeholder="Введите ваш ответ..."
                value={answers[currentQuestion.id]?.[0] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="min-h-[150px]"
              />
            )}

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>

              {currentQuestionIndex < test.questions.length - 1 ? (
                <Button onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>
                  Далее
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setSubmitDialogOpen(true)} disabled={isSubmitting}>
                  <Send className="mr-2 h-4 w-4" />
                  Отправить тест
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {timeLeft < 120 && (
          <Card className="mx-auto mt-4 max-w-3xl border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium">Внимание! Осталось мало времени!</p>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отправить тест?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы ответили на {Object.keys(answers).length} из {test.questions.length} вопросов. После отправки
              изменить ответы будет невозможно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
