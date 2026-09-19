from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        (1, "ADMIN"),
        (2, "SUPERVISOR"),
        (3, "EMPLOYEE"),
    )

    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=3)

    def __str__(self):
        return self.username
