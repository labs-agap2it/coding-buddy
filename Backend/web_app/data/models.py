from sqlalchemy import Column, Integer, Table
from .base import metadata

Users = Table(
    'Users', metadata,
    Column('Id', Integer, primary_key=True)
)
