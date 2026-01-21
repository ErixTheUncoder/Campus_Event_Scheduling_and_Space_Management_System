"""Make phone_number NOT NULL

Revision ID: 6774a64fa15b
Revises: 
Create Date: 2026-01-14 11:46:01.658768

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6774a64fa15b'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Explicitly cast user_role from VARCHAR to ENUM
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN user_role
        TYPE userrole
        USING user_role::userrole
    """)


def downgrade():
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN user_role
        TYPE VARCHAR(50)
        USING user_role::text
    """)

