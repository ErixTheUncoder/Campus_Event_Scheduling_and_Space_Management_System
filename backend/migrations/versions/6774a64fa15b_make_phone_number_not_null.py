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
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'phone_number',
            existing_type=sa.VARCHAR(length=30),
            nullable=False
        )



def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('phone_number',
               existing_type=sa.VARCHAR(length=30),
               nullable=True)
        batch_op.alter_column('user_role',
               existing_type=sa.Enum('STUDENT', 'EVENT_ORGANIZER', 'ADMIN', name='userrole'),
               type_=sa.VARCHAR(length=50),
               existing_nullable=False)
