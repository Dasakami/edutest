from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.security import get_current_user, get_current_teacher
from ..models.user import User
from ..models.test import Test
from ..models.result import Result
from ..schemas.result import (
    TestSubmit,
    ResultResponse,
    DetailedResultResponse,
    ResultDetailResponse,
    StatisticsResponse,
)
from ..services.result_service import ResultService

router = APIRouter(prefix="/results", tags=["results"])

@router.post("/submit", response_model=ResultResponse)
def submit_test(
    submission: TestSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    test = db.query(Test).filter(Test.id == submission.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if not test.is_active:
        raise HTTPException(status_code=400, detail="Test is not active")
    
    result = ResultService.submit_test(db, current_user.id, submission)
    payload = ResultService.serialize_result(result)
    return ResultResponse(**payload)

@router.get("/my", response_model=List[DetailedResultResponse])
def get_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = ResultService.get_user_results(db, current_user.id)
    serialized: List[DetailedResultResponse] = []
    for result in results:
        payload = ResultService.serialize_result(result)
        payload.update({
            "test_title": result.test.title,
            "user_name": result.user.full_name
        })
        serialized.append(DetailedResultResponse(**payload))
    return serialized

@router.get("/test/{test_id}", response_model=List[DetailedResultResponse])
def get_test_results(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    results = ResultService.get_test_results(db, test_id)
    serialized: List[DetailedResultResponse] = []
    for result in results:
        payload = ResultService.serialize_result(result)
        payload.update({
            "test_title": result.test.title,
            "user_name": result.user.full_name
        })
        serialized.append(DetailedResultResponse(**payload))
    return serialized

@router.get("/statistics/{test_id}", response_model=StatisticsResponse)
def get_test_statistics(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return ResultService.get_statistics(db, test_id)

@router.get("/{result_id}", response_model=ResultDetailResponse)
def get_result_detail(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(Result).filter(Result.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    if current_user.role == "student" and result.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if current_user.role == "teacher" and result.test.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    payload = ResultService.serialize_result(result)
    payload.update({
        "test_title": result.test.title,
        "user_name": result.user.full_name,
        "questions": ResultService.build_question_details(result)
    })

    return ResultDetailResponse(**payload)