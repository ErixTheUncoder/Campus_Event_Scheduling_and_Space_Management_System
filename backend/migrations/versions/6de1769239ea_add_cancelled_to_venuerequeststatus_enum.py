"""Add CANCELLED to venuerequeststatus enum

Revision ID: 6de1769239ea
Revises: 62c73dedd982
Create Date: 2026-01-24 10:56:54.124327

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6de1769239ea'
down_revision = '62c73dedd982'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE venuerequeststatus ADD VALUE IF NOT EXISTS 'CANCELLED'")


def downgrade():
    pass
