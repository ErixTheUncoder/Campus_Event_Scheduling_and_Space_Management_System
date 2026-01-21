"""Add is_active to users

Revision ID: b18eda48e686
Revises: dc3a1e9731e0
Create Date: 2026-01-21 03:31:41.017775

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b18eda48e686'
down_revision = 'dc3a1e9731e0'
branch_labels = None
depends_on = None


def upgrade():
    # add column is_active with default True
    op.add_column(
        'users',
        sa.Column(
            'is_active',
            sa.Boolean(),
            server_default=sa.text('true'),
            nullable=False
        )
    )

    # remove server default
    op.alter_column(
        'users',
        'is_active',
        server_default=None
    )



def downgrade():
    op.drop_column('users', 'is_active')
