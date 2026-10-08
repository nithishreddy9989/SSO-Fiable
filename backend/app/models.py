from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ClientConfig(Base):
    """
    Multi-Tenant Entra ID Credentials Registry.
    Stores separate Microsoft Entra Client IDs, Tenant IDs, and domain mappings per client organization.
    """
    __tablename__ = "client_configs"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)  # e.g., 'acme-corp'
    client_name = Column(String(255), nullable=False)                    # e.g., 'Acme Corporation'
    domain_suffix = Column(String(255), unique=True, index=True)         # e.g., 'acme.com'
    azure_tenant_id = Column(String(255), nullable=False, default="common")
    azure_client_id = Column(String(255), nullable=False)
    azure_client_secret = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="client")


class User(Base):
    """
    Unified User Model supporting SuperAdmin, Tenant Admin, and Standard User roles.
    Allows login via Email + Password (no ID required) OR Microsoft Entra ID SSO.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_configs.id"), nullable=True)  # Null for SuperAdmin
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Password hash for email/password login
    role = Column(String(50), nullable=False, default="User")  # 'SuperAdmin', 'Admin', 'User'
    entra_oid = Column(String(255), index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("ClientConfig", back_populates="users")
