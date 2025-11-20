from sqlalchemy.orm import Session
from typing import Dict, List
from ..core.config import settings
from ..models.result import Result
from ..models.question import Question, QuestionType
from ..schemas.result import TestSubmit


class ResultService:
    @staticmethod
    def calculate_score(db: Session, test_id: int, answers: Dict[int, List[str]]) -> Dict:
        questions = db.query(Question).filter(Question.test_id == test_id).all()

        total_score = 0
        max_score = sum(q.points for q in questions)

        answers_dict = ResultService.normalize_answers(answers)

        for question in questions:
            if question.question_type == QuestionType.TEXT:
                # Текстовые ответы не оцениваются автоматически
                continue

            user_answers = sorted(answers_dict.get(question.id, []))
            correct_answers = sorted(str(answer) for answer in (question.correct_answers or []))

            if correct_answers and user_answers == correct_answers:
                total_score += question.points

        percentage = (total_score / max_score * 100) if max_score > 0 else 0
        passed = percentage >= settings.PASS_PERCENTAGE

        return {
            "score": total_score,
            "max_score": max_score,
            "percentage": round(percentage, 2),
            "passed": passed,
            "answers": answers_dict
        }

    @staticmethod
    def submit_test(db: Session, user_id: int, submission: TestSubmit) -> Result:
        result_data = ResultService.calculate_score(db, submission.test_id, submission.answers)

        db_result = Result(
            test_id=submission.test_id,
            user_id=user_id,
            answers=result_data["answers"],
            score=result_data["score"],
            max_score=result_data["max_score"],
            percentage=result_data["percentage"],
            time_spent_minutes=submission.time_spent_minutes
        )

        db.add(db_result)
        db.commit()
        db.refresh(db_result)
        return db_result

    @staticmethod
    def get_user_results(db: Session, user_id: int) -> List[Result]:
        return db.query(Result).filter(Result.user_id == user_id).all()

    @staticmethod
    def get_test_results(db: Session, test_id: int) -> List[Result]:
        return db.query(Result).filter(Result.test_id == test_id).all()

    @staticmethod
    def get_statistics(db: Session, test_id: int) -> Dict:
        results = db.query(Result).filter(Result.test_id == test_id).all()

        if not results:
            return {
                "total_attempts": 0,
                "average_score": 0,
                "max_score": 0,
                "min_score": 0,
                "pass_rate": 0
            }

        scores = [r.percentage for r in results]
        passed = sum(1 for s in scores if s >= settings.PASS_PERCENTAGE)

        return {
            "total_attempts": len(results),
            "average_score": round(sum(scores) / len(scores), 2),
            "max_score": max(scores),
            "min_score": min(scores),
            "pass_rate": round(passed / len(results) * 100, 2)
        }

    @staticmethod
    def normalize_answers(answers: Dict[int, List[str]] | None) -> Dict[int, List[str]]:
        return {
            int(question_id): [str(answer) for answer in (selected or [])]
            for question_id, selected in (answers or {}).items()
        }

    @staticmethod
    def serialize_result(result: Result, include_answers: bool = True) -> Dict:
        base = {
            "id": result.id,
            "test_id": result.test_id,
            "user_id": result.user_id,
            "score": result.score,
            "max_score": result.max_score,
            "percentage": result.percentage,
            "passed": result.percentage >= settings.PASS_PERCENTAGE,
            "time_spent_minutes": result.time_spent_minutes,
            "completed_at": result.completed_at,
        }

        if include_answers:
            base["answers"] = ResultService.normalize_answers(result.answers)
        else:
            base["answers"] = {}

        return base

    @staticmethod
    def build_question_details(result: Result) -> List[Dict]:
        answers = ResultService.normalize_answers(result.answers)
        details: List[Dict] = []

        for question in sorted(result.test.questions, key=lambda q: q.order_number):
            selected = answers.get(question.id, [])
            correct = [str(answer) for answer in (question.correct_answers or [])]

            if question.question_type == QuestionType.TEXT:
                is_correct = None
                earned_points = 0
                correct_answers = []
            else:
                is_correct = sorted(selected) == sorted(correct) if correct else False
                earned_points = question.points if is_correct else 0
                correct_answers = correct

            details.append({
                "question_id": question.id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "options": question.options or [],
                "correct_answers": correct_answers,
                "selected_answers": selected,
                "is_correct": is_correct,
                "points": question.points,
                "earned_points": earned_points,
            })

        return details