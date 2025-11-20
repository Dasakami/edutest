import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, Question } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Save, Trash2, GripVertical } from 'lucide-react';

interface QuestionData {
  question_text: string;
  question_type: 'single' | 'multiple' | 'text';
  options: string[];
  correct_answers: string[];
  points: number;
  order_number: number;
}

export default function CreateTest() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'single',
        options: ['', ''],
        correct_answers: [],
        points: 1,
        order_number: questions.length + 1,
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof QuestionData, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push('');
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const oldValue = updated[questionIndex].options[optionIndex];
    updated[questionIndex].options[optionIndex] = value;
    if (updated[questionIndex].correct_answers.includes(oldValue)) {
      updated[questionIndex].correct_answers = updated[questionIndex].correct_answers.map((answer) =>
        answer === oldValue ? value : answer
      );
    }
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.splice(optionIndex, 1);
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => (q.order_number = i + 1));
    setQuestions(updated);
  };

  const toggleCorrectAnswer = (questionIndex: number, answer: string) => {
    const updated = [...questions];
    const question = updated[questionIndex];
    
    if (question.question_type === 'single') {
      question.correct_answers = [answer];
    } else {
      const index = question.correct_answers.indexOf(answer);
      if (index > -1) {
        question.correct_answers.splice(index, 1);
      } else {
        question.correct_answers.push(answer);
      }
    }
    
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Введите название теста');
      return;
    }

    if (questions.length === 0) {
      toast.error('Добавьте хотя бы один вопрос');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Вопрос ${i + 1}: введите текст вопроса`);
        return;
      }
      if (q.question_type !== 'text' && q.options.some(o => !o.trim())) {
        toast.error(`Вопрос ${i + 1}: заполните все варианты ответа`);
        return;
      }
      if (q.correct_answers.length === 0 && q.question_type !== 'text') {
        toast.error(`Вопрос ${i + 1}: укажите правильный ответ`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const test = await apiClient.createTest({
        title,
        description,
        duration_minutes: durationMinutes,
        is_active: isActive,
      });

      for (const question of questions) {
        await apiClient.createQuestion({
          ...question,
          test_id: test.id,
        });
      }

      toast.success('Тест создан успешно!');
      navigate('/teacher/dashboard');
    } catch (error: any) {
      console.error('Failed to create test:', error);
      toast.error(error.response?.data?.detail || 'Ошибка создания теста');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Создание теста</h1>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Сохранение...' : 'Сохранить тест'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Заполните основные данные о тесте</CardDescription>
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
                  Добавить первый вопрос
                </Button>
              </CardContent>
            </Card>
          )}

          {questions.map((question, qIndex) => (
            <Card key={qIndex}>
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
                      onValueChange={(value) => updateQuestion(qIndex, 'question_type', value)}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(qIndex, oIndex)}
                          >
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
