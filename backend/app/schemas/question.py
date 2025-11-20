from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from ..models.question import QuestionType

class QuestionBase(BaseModel):
    question_text: str
    question_type: QuestionType
    options: List[str] = Field(default_factory=list)
    correct_answers: List[str] = Field(default_factory=list)
    points: int = 1
    order_number: int = 0

    @field_validator("options", "correct_answers", mode="before")
    @classmethod
    def default_list(cls, value):
        if value is None:
            return []
        return value

class QuestionCreate(QuestionBase):
    test_id: int

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    options: Optional[List[str]] = None
    correct_answers: Optional[List[str]] = None
    points: Optional[int] = None
    order_number: Optional[int] = None

class QuestionResponse(QuestionBase):
    id: int
    test_id: int
    
    class Config:
        from_attributes = True

class QuestionForStudent(BaseModel):
    id: int
    question_text: str
    question_type: QuestionType
    options: List[str] = Field(default_factory=list)
    points: int
    order_number: int
    
    class Config:
        from_attributes = True