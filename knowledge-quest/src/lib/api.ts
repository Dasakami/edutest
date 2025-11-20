import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'teacher';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  is_active: boolean;
  creator_id: number;
  created_at: string;
  updated_at: string;
  questions?: Question[];
}

export interface Question {
  id: number;
  test_id: number;
  question_text: string;
  question_type: 'single' | 'multiple' | 'text';
  options: string[];
  correct_answers: string[];
  points: number;
  order_number: number;
}

export interface TestResult {
  id: number;
  test_id: number;
  user_id: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  answers: Record<number, string[]>;
  time_spent_minutes?: number | null;
  completed_at: string;
  test_title?: string;
  user_name?: string;
}

export interface QuestionResultDetail {
  question_id: number;
  question_text: string;
  question_type: 'single' | 'multiple' | 'text';
  options: string[];
  correct_answers: string[];
  selected_answers: string[];
  is_correct: boolean | null;
  points: number;
  earned_points: number;
}

export interface TestResultDetail extends TestResult {
  questions: QuestionResultDetail[];
}

export interface Statistics {
  total_attempts: number;
  average_score: number;
  pass_rate: number;
  min_score: number;
  max_score: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  }

  async register(email: string, password: string, full_name: string, role: 'student' | 'teacher'): Promise<User> {
    const { data } = await this.client.post<User>('/auth/register', {
      email,
      password,
      full_name,
      role,
    });
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/users/me');
    return data;
  }

  // Tests
  async getTests(activeOnly: boolean = true): Promise<Test[]> {
    const { data } = await this.client.get<Test[]>('/tests', {
      params: { active_only: activeOnly },
    });
    return data;
  }

  async getMyTests(): Promise<Test[]> {
    const { data } = await this.client.get<Test[]>('/tests/my');
    return data;
  }

  async getTest(id: number): Promise<Test> {
    const { data } = await this.client.get<Test>(`/tests/${id}`);
    return data;
  }

  async createTest(testData: Partial<Test>): Promise<Test> {
    const { data } = await this.client.post<Test>('/tests', testData);
    return data;
  }

  async updateTest(id: number, testData: Partial<Test>): Promise<Test> {
    const { data } = await this.client.put<Test>(`/tests/${id}`, testData);
    return data;
  }

  async deleteTest(id: number): Promise<void> {
    await this.client.delete(`/tests/${id}`);
  }

  // Questions
  async createQuestion(questionData: Partial<Question>): Promise<Question> {
    const { data } = await this.client.post<Question>('/questions', questionData);
    return data;
  }

  async updateQuestion(id: number, questionData: Partial<Question>): Promise<Question> {
    const { data } = await this.client.put<Question>(`/questions/${id}`, questionData);
    return data;
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.client.delete(`/questions/${id}`);
  }

  // Results
  async submitTest(testId: number, answers: Record<number, string[]>): Promise<TestResult> {
    const { data } = await this.client.post<TestResult>('/results/submit', {
      test_id: testId,
      answers,
    });
    return data;
  }

  async getMyResults(): Promise<TestResult[]> {
    const { data } = await this.client.get<TestResult[]>('/results/my');
    return data;
  }

  async getTestResults(testId: number): Promise<TestResult[]> {
    const { data } = await this.client.get<TestResult[]>(`/results/test/${testId}`);
    return data;
  }

  async getTestStatistics(testId: number): Promise<Statistics> {
    const { data } = await this.client.get<Statistics>(`/results/statistics/${testId}`);
    return data;
  }

  async getResultDetail(resultId: number): Promise<TestResultDetail> {
    const { data } = await this.client.get<TestResultDetail>(`/results/${resultId}`);
    return data;
  }
}

export const apiClient = new ApiClient();
