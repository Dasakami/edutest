from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Result(Base):
    __tablename__ = "results"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answers = Column(JSON, nullable=False)  # Dict: {question_id: [selected_answers]}
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    time_spent_minutes = Column(Integer)
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    test = relationship("Test", back_populates="results")
    user = relationship("User", back_populates="results")