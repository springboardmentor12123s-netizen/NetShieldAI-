from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS notes VARCHAR;"))
    conn.execute(text("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;"))
    conn.commit()

print("Columns added successfully.")