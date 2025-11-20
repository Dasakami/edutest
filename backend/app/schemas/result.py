from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from ..models.question import QuestionType


class TestSubmit(BaseModel):
    test_id: int
    answers: Dict[int, List[str]] = Field(default_factory=dict)
    time_spent_minutes: Optional[int] = None


class QuestionResultDetail(BaseModel):
    question_id: int
    question_text: str
    question_type: QuestionType
    options: List[str] = Field(default_factory=list)
    correct_answers: List[str] = Field(default_factory=list)
    selected_answers: List[str] = Field(default_factory=list)
    is_correct: Optional[bool] = None
    points: int
    earned_points: int


class ResultResponse(BaseModel):
    id: int
    test_id: int
    user_id: int
    score: float
    max_score: float
    percentage: float
    passed: bool
    answers: Dict[int, List[str]] = Field(default_factory=dict)
    time_spent_minutes: Optional[int]
    completed_at: datetime

    class Config:
        from_attributes = True


class DetailedResultResponse(ResultResponse):
    test_title: str
    user_name: str


class ResultDetailResponse(DetailedResultResponse):
    questions: List[QuestionResultDetail] = Field(default_factory=list)


class StatisticsResponse(BaseModel):
    total_attempts: int
    average_score: float
    max_score: float
    min_score: float
    pass_rate: float