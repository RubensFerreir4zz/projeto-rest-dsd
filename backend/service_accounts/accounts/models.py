from django.db import models
from django.contrib.auth.models import AbstractUser


# Create your models here.

class Plans(models.TextChoices):
    FREE = "free", "Free"
    PRO = "pro", "Pro"
    ENTERPRISE = "enterprise", "Enterprise"


class User(AbstractUser):
    email =  models.EmailField(unique=True)
    plan = models.CharField(max_length=15, choices=Plans.choices, default=Plans.FREE)
    storage_used = models.BigIntegerField(default=0)

    @property
    def storage_limit(self):
        limits = {
            Plans.FREE: 15 * 1024 * 1024,
            Plans.PRO: 50 * 1024 * 1024,
            Plans.ENTERPRISE: 100 * 1024 * 1024,
        }
        return limits.get(self.plan, limits[Plans.FREE])

    def has_available_space(self):
        return self.storage_used < self.storage_limit

    def __str__(self):
        return f"{self.username} ({self.get_plan_display()})"
    
