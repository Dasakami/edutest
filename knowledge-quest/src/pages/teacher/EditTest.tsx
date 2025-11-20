import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, GripVertical, Loader2, Plus, Save, Trash2 } from 'lucide-react';

interface EditableQuestion {
  id?: number;
  question_text: string;
  question_type: 'single' | 'multiple' | 'text';
  options: string[];
  correct_answers: string[];
  points: number;
  order_number: number;
}

export default function EditTest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [removedQuestionIds, setRemovedQuestionIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, [id]);

  const loadTest = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const test = await apiClient.getTest(Number(id));
      setTitle(test.title);
      setDescription(test.description || '');
      setDurationMinutes(test.duration_minutes);
      setIsActive(test.is_active);
      const sortedQuestions = (test.questions || [])
        .sort((a, b) => a.order_number - b.order_number)
        .map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          correct_answers: q.correct_answers || [],
          points: q.points,
          order_number: q.order_number,
        }));
      setQuestions(sortedQuestions);
    } catch (error) {
      console.error('Failed to load test:', error);
      toast.error('Не удалось загрузить тест');
      navigate('/teacher/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        question_type: 'single',
        options: ['', ''],
        correct_answers: [],
        points: 1,
        order_number: prev.length + 1,
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof EditableQuestion, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };

      if (field === 'question_type') {
        const newType = value as EditableQuestion['question_type'];
        if (newType === 'text') {
          current.options = [];
          current.correct_answers = [];
        } else if (current.question_type === 'text') {
          current.options = ['', ''];
          current.correct_answers = [];
        }
        current.question_type = newType;
      } else {
        (current as any)[field] = value;
      }

      updated[index] = current;
      return updated;
    });
  };

  const addOption = (questionIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[questionIndex].options.push('');
      return updated;
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const oldValue = updated[questionIndex].options[optionIndex];
      updated[questionIndex].options[optionIndex] = value;
      if (updated[questionIndex].correct_answers.includes(oldValue)) {
        updated[questionIndex].correct_answers = updated[questionIndex].correct_answers.map((answer) =>
          answer === oldValue ? value : answer
        );
      }
      return updated;
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[questionIndex].options.splice(optionIndex, 1);
      return updated;
    });
  };

  const toggleCorrectAnswer = (questionIndex: number, answer: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const question = updated[questionIndex];

      if (question.question_type === 'single') {
        question.correct_answers = [answer];
      } else {
        const idx = question.correct_answers.indexOf(answer);
        if (idx > -1) {
          question.correct_answers.splice(idx, 1);
        } else {
          question.correct_answers.push(answer);
        }
      }

      return updated;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => {
      const target = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      updated.forEach((q, idx) => (q.order_number = idx + 1));
      if (target?.id) {
        setRemovedQuestionIds((ids) => [...ids, target.id!]);
      }
      return updated;
    });
  };

  const validateQuestions = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Вопрос ${i + 1}: введите текст`);
        return false;
      }
      if (q.points <= 0) {
        toast.error(`Вопрос ${i + 1}: баллы должны быть положительными`);
        return false;
      }
      if (q.question_type !== 'text') {
        if (q.options.length < 2 || q.options.some((o) => !o.trim())) {
          toast.error(`Вопрос ${i + 1}: заполните как минимум два варианта`);
          return false;
        }
        if (q.correct_answers.length === 0) {
          toast.error(`Вопрос ${i + 1}: выберите правильный ответ`);
          return false;
        }
      }
    }
    return true;
  };

  const prepareQuestionPayload = (question: EditableQuestion, order: number) => {
    if (question.question_type === 'text') {
      return {
        question_text: question.question_text,
        question_type: question.question_type,
        options: [],
        correct_answers: [],
        points: question.points,
        order_number: order,
      };
    }

    return {
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options,
      correct_answers: question.correct_answers,
      points: question.points,
      order_number: order,
    };
  };

  const handleSubmit = async () => {
    if (!id) return;

    if (!title.trim()) {
      toast.error('Введите название теста');
      return;
    }

    if (questions.length === 0) {
      toast.error('Добавьте хотя бы один вопрос');
      return;
    }

    if (!validateQuestions()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.updateTest(Number(id), {
        title,
        description,
        duration_minutes: durationMinutes,
        is_active: isActive,
      });

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const payload = prepareQuestionPayload(question, i + 1);

        if (question.id) {
          await apiClient.updateQuestion(question.id, payload);
        } else {
          await apiClient.createQuestion({
            ...payload,
            test_id: Number(id),
          });
        }
      }

      for (const questionId of removedQuestionIds) {
        await apiClient.deleteQuestion(questionId);
      }

      toast.success('Тест обновлен');
      navigate('/teacher/dashboard');
    } catch (error: any) {
      console.error('Failed to update test:', error);
      toast.error(error.response?.data?.detail || 'Ошибка сохранения теста');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Редактирование теста</h1>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Обновите данные о тесте</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название теста *</Label>
                <Input
                  id="title"
                  placeholder="Введите название теста"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Краткое описание теста"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Длительность (минут)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between space-y-2 pt-8">
                  <Label htmlFor="active">Активен</Label>
                  <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Вопросы</h2>
            <Button onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить вопрос
            </Button>
          </div>

          {questions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-4 text-muted-foreground">Нет вопросов</p>
                <Button onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить вопрос
                </Button>
              </CardContent>
            </Card>
          )}

          {questions.map((question, qIndex) => (
            <Card key={question.id ?? qIndex}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Вопрос {qIndex + 1}</CardTitle>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => removeQuestion(qIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Текст вопроса *</Label>
                  <Textarea
                    placeholder="Введите текст вопроса"
                    value={question.question_text}
                    onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Тип вопроса</Label>
                    <Select
                      value={question.question_type}
                      onValueChange={(value) =>
                        updateQuestion(qIndex, 'question_type', value as EditableQuestion['question_type'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Один ответ</SelectItem>
                        <SelectItem value="multiple">Несколько ответов</SelectItem>
                        <SelectItem value="text">Текстовый ответ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Баллы</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', Number(e.target.value))}
                    />
                  </div>
                </div>

                {question.question_type !== 'text' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Варианты ответа *</Label>
                      <Button variant="outline" size="sm" onClick={() => addOption(qIndex)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Добавить вариант
                      </Button>
                    </div>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <Input
                          placeholder={`Вариант ${oIndex + 1}`}
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        />
                        <Button
                          variant={question.correct_answers.includes(option) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleCorrectAnswer(qIndex, option)}
                          disabled={!option.trim()}
                        >
                          {question.correct_answers.includes(option) ? '✓' : '○'}
                        </Button>
                        {question.options.length > 2 && (
                          <Button variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Нажмите на ○ или ✓ чтобы отметить правильные ответы
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

