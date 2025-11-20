from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union
from ..core.database import get_db
from ..core.security import get_current_user, get_current_teacher
from ..models.user import User
from ..schemas.test import TestCreate, TestUpdate, TestResponse, TestListResponse
from ..schemas.question import QuestionForStudent
from ..services.test_service import TestService

router = APIRouter(prefix="/tests", tags=["tests"])

@router.post("", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
def create_test(
    test_data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    return TestService.create_test(db, test_data, current_user.id)

@router.get("", response_model=List[TestListResponse])
def get_tests(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tests = TestService.get_tests(db, skip, limit, active_only)
    return [
        TestListResponse(
            **test.__dict__,
            question_count=len(test.questions)
        ) for test in tests
    ]

@router.get("/my", response_model=List[TestResponse])
def get_my_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    return TestService.get_teacher_tests(db, current_user.id)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.user import User
from ..schemas.test import TestResponse
from ..schemas.question import QuestionForStudent
from ..services.test_service import TestService

from ..schemas.test import TestForStudentResponse, TestResponse
from ..schemas.question import QuestionForStudent

@router.get("/{test_id}", response_model=Union[TestResponse, TestForStudentResponse])
def get_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    test = TestService.get_test(db, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if current_user.role == "student":
        return TestForStudentResponse(
            id=test.id,
            title=test.title,
            description=test.description,
            duration_minutes=test.duration_minutes,
            is_active=test.is_active,
            created_at=test.created_at,
            updated_at=test.updated_at,
            questions=[
                QuestionForStudent(
                    id=q.id,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    options=q.options,
                    points=q.points,
                    order_number=q.order_number
                )
                for q in test.questions
            ]
        )
    else:
        # для учителя отдаем полный TestResponse с correct_answers
        return TestResponse.from_orm(test)



@router.put("/{test_id}", response_model=TestResponse)
def update_test(
    test_id: int,
    test_data: TestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    test = TestService.get_test(db, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return TestService.update_test(db, test_id, test_data)

@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    test = TestService.get_test(db, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    TestService.delete_test(db, test_id)
    return None