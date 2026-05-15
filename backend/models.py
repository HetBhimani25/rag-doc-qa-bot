from pydantic import BaseModel
from typing import Optional

class RegisterRequest(BaseModel):
    name:     str
    email:    str
    password: str

class LoginRequest(BaseModel):
    email:    str
    password: str

class QuestionRequest(BaseModel):
    session_id: str
    question:   str

class DeleteRequest(BaseModel):
    session_id: str

class SuggestRequest(BaseModel):
    session_id: str

class BookmarkRequest(BaseModel):
    session_id: str
    question:   str
    answer:     str
    sources:    list

class DeleteBookmarkRequest(BaseModel):
    bookmark_id: str