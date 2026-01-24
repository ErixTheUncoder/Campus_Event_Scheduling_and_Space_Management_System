"""Add CANCELLED to eventrequeststatus enum

Revision ID: 62c73dedd982
Revises: b18eda48e686
Create Date: 2026-01-24 10:39:41.369588

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '62c73dedd982'
down_revision = 'b18eda48e686'
branch_labels = None
depends_on = None

def upgrade():
    # Add new enum value (PostgreSQL)
    op.execute("ALTER TYPE eventrequeststatus ADD VALUE IF NOT EXISTS 'CANCELLED'")

def downgrade():
    # PostgreSQL cannot easily remove enum values safely
    pass
