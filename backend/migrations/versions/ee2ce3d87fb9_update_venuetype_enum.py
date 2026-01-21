"""Update VenueType enum

Revision ID: ee2ce3d87fb9
Revises: 6774a64fa15b
Create Date: 2026-01-20 22:28:27.352975

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ee2ce3d87fb9'
down_revision = '6774a64fa15b'
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

    # ### end Alembic commands ###
