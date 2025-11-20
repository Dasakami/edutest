from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .question import QuestionForStudent, QuestionResponse

class TestBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int = 60
    is_active: bool = True

class TestCreate(TestBase):
    pass

class TestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None

class TestResponse(TestBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionResponse] = Field(default_factory=list)
    
    class Config:
        from_attributes = True

class TestListResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    duration_minutes: int
    is_active: bool
    created_at: datetime
    question_count: int
    
    class Config:
        from_attributes = True

class TestForStudentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    duration_minutes: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionForStudent] = Field(default_factory=list)

    class Config:
        from_attributes = True
