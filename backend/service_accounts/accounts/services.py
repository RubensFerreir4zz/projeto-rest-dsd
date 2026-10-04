from django.contrib.auth import authenticate
from accounts.models import User, Plans
from rest_framework.exceptions import ValidationError


class UserService:
    
    @staticmethod
    def create_user(username, email, password, plan=Plans.FREE):
        
        if User.objects.filter(email=email).exists():
            raise ValidationError("Email já cadastrado")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            plan=plan
        )
        return user

    @staticmethod
    def authenticate_user(email, password):
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None
            
        if user is None:
            raise ValidationError("Credenciais inválidas")
        return user

    @staticmethod
    def check_storage_available(user, size):
        new_total = user.storage_used + size
        return new_total <= user.storage_limit
    
    @staticmethod
    def add_storage_user(user, file_size):
        if not UserService.check_storage_available(user, file_size):
            raise ValidationError({'storage': 'Estouro de armazenamento'})
        user.storage_used += file_size
        user.save(update_fields=['storage_used'])
        return user

    @staticmethod
    def release_storage_user(user, file_size):
        new_total = user.storage_used - file_size
        user.storage_used = max(0, new_total)
        user.save(update_fields=['storage_used'])
        return user

    