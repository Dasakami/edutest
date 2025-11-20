from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.security import get_current_teacher
from ..models.user import User
from ..models.question import Question, QuestionType
from ..models.test import Test
from ..schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse

router = APIRouter(prefix="/questions", tags=["questions"])

def _prepare_question_payload(
    question_type: QuestionType,
    options: List[str],
    correct_answers: List[str]
) -> tuple[List[str], List[str]]:
    if question_type == QuestionType.TEXT:
        # текстовые вопросы не имеют вариантов ответа и проверяются вручную
        return [], []

    cleaned_options = [option for option in (options or []) if option.strip()]
    if len(cleaned_options) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо указать минимум два варианта ответа"
        )

    cleaned_correct = [answer for answer in (correct_answers or []) if answer.strip()]
    if not cleaned_correct:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Укажите хотя бы один правильный ответ"
        )

    invalid_answers = set(cleaned_correct) - set(cleaned_options)
    if invalid_answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Правильные ответы должны присутствовать в списке вариантов"
        )

    return cleaned_options, cleaned_correct

@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    test = db.query(Test).filter(Test.id == question_data.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    options, correct_answers = _prepare_question_payload(
        question_data.question_type,
        question_data.options,
        question_data.correct_answers
    )

    payload = question_data.model_dump()
    payload["options"] = options
    payload["correct_answers"] = correct_answers

    db_question = Question(**payload)
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    test = db.query(Test).filter(Test.id == db_question.test_id).first()
    if test.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    update_data = question_data.model_dump(exclude_unset=True)
    effective_type = update_data.get("question_type", db_question.question_type)
    options = update_data.get("options", db_question.options or [])
    correct_answers = update_data.get("correct_answers", db_question.correct_answers or [])
    prepared_options, prepared_correct_answers = _prepare_question_payload(
        effective_type,
        options,
        correct_answers
    )

    update_data["question_type"] = effective_type
    update_data["options"] = prepared_options
    update_data["correct_answers"] = prepared_correct_answers

    for field, value in update_data.items():
        setattr(db_question, field, value)
    
    db.commit()
    db.refresh(db_question)
    return db_question

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    test = db.query(Test).filter(Test.id == db_question.test_id).first()
    if test.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_question)
    db.commit()
    return None