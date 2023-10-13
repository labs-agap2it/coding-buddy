import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')


from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import scoped_session, sessionmaker

engine = create_engine(DATABASE_URL, echo=True)
metadata = MetaData()

# Use scoped session to ensure thread safety
db_session = scoped_session(sessionmaker(bind=engine))

def init_db():
    metadata.create_all(bind=engine)
