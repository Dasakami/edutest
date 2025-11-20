from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base

class QuestionType(str, enum.Enum):
    SINGLE = "single"
    MULTIPLE = "multiple"
    TEXT = "text"

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False, default=QuestionType.SINGLE)
    options = Column(JSON, nullable=False)  
    correct_answers = Column(JSON, nullable=False)  
    points = Column(Integer, default=1)
    order_number = Column(Integer, default=0)
    
    test = relationship("Test", back_populates="questions")