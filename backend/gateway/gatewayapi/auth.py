import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class GatewayUser:
    def __init__(self, user_id: int, username: str, email: str):
        self.id = user_id
        self.username = username
        self.email = email
        self.is_authenticated = True

    def __str__(self):
        return f"{self.username} (ID: {self.id})"


def generate_jwt_for_user(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "username": user_data["username"],
        "email": user_data["email"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=4),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


class GatewayJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user = GatewayUser(
                user_id=payload["user_id"],
                username=payload.get("username", ""),
                email=payload.get("email", "")
            )
            return (user, token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("O token JWT informado expirou.")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("O token JWT informado é inválido.")


from drf_spectacular.extensions import OpenApiAuthenticationExtension

class GatewayJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = 'gatewayapi.auth.GatewayJWTAuthentication'
    name = 'jwtAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': 'Insira o token JWT gerado no login.',
        }
