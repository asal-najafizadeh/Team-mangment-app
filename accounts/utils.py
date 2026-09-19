"""
Utility functions for user role checking and permissions
"""
from rest_framework.exceptions import PermissionDenied


def is_admin(user):
    """Check if user is ADMIN (role=1) or Django superuser"""
    return user.is_authenticated and (user.is_superuser or user.role == 1)


def is_supervisor(user):
    """Check if user is SUPERVISOR (role=2)"""
    return user.is_authenticated and user.role == 2


def is_employee(user):
    """Check if user is EMPLOYEE (role=3)"""
    return user.is_authenticated and user.role == 3


def is_admin_or_supervisor(user):
    """Check if user is ADMIN or SUPERVISOR (or Django superuser)"""
    return user.is_authenticated and (user.is_superuser or user.role in [1, 2])


def is_manager(user):
    """Check if user is ADMIN or SUPERVISOR (managers)"""
    return is_admin_or_supervisor(user)


def require_admin(user, message="فقط مدیر سیستم مجاز است."):
    """Raise PermissionDenied if user is not admin"""
    if not is_admin(user):
        raise PermissionDenied(message)


def require_manager(user, message="فقط مدیر مجاز است."):
    """Raise PermissionDenied if user is not manager (admin or supervisor)"""
    if not is_manager(user):
        raise PermissionDenied(message)


def require_admin_or_supervisor(user, message="فقط مدیر یا سرپرست مجاز است."):
    """Raise PermissionDenied if user is not admin or supervisor"""
    if not is_admin_or_supervisor(user):
        raise PermissionDenied(message)

