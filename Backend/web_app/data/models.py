from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer

Base = declarative_base()

class User(Base):
    __tablename__ = 'Users'
    Id = Column(Integer, primary_key=True)
