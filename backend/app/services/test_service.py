from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.test import Test
from ..models.question import Question
from ..schemas.test import TestCreate, TestUpdate

class TestService:
    @staticmethod
    def create_test(db: Session, test_data: TestCreate, creator_id: int) -> Test:
        db_test = Test(**test_data.model_dump(), creator_id=creator_id)
        db.add(db_test)
        db.commit()
        db.refresh(db_test)
        return db_test
    
    @staticmethod
    def get_test(db: Session, test_id: int) -> Optional[Test]:
        return db.query(Test).filter(Test.id == test_id).first()
    
    @staticmethod
    def get_tests(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False) -> List[Test]:
        query = db.query(Test)
        if active_only:
            query = query.filter(Test.is_active == True)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_teacher_tests(db: Session, teacher_id: int) -> List[Test]:
        return db.query(Test).filter(Test.creator_id == teacher_id).all()
    
    @staticmethod
    def update_test(db: Session, test_id: int, test_data: TestUpdate) -> Optional[Test]:
        db_test = db.query(Test).filter(Test.id == test_id).first()
        if not db_test:
            return None
        
        update_data = test_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_test, field, value)
        
        db.commit()
        db.refresh(db_test)
        return db_test
    
    @staticmethod
    def delete_test(db: Session, test_id: int) -> bool:
        db_test = db.query(Test).filter(Test.id == test_id).first()
        if not db_test:
            return False
        db.delete(db_test)
        db.commit()
        return True