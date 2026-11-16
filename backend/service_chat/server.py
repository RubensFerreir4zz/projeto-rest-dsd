import asyncio
import json
import logging
from datetime import datetime, timezone
import websockets

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("SafoDriveChat")

active_users = {}

global_history = []
MAX_HISTORY = 50


def get_online_users_list():
    """Retorna lista simplificada de usuários com conexões ativas."""
    users = []
    for uid, data in active_users.items():
        if data["sockets"]:
            users.append({"id": uid, "username": data["username"]})
    return users


async def broadcast_presence():
    """Envia a lista atualizada de usuários online para todos os clientes conectados."""
    online_list = get_online_users_list()
    payload = json.dumps({
        "type": "presence",
        "online_users": online_list
    })
    
    all_sockets = []
    for user_data in active_users.values():
        all_sockets.extend(user_data["sockets"])

    if all_sockets:
        await asyncio.gather(
            *[s.send(payload) for s in all_sockets],
            return_exceptions=True
        )


async def send_to_user(target_user_id: int, payload_str: str):
    """Envia uma mensagem direta para todos os sockets abertos de um usuário específico."""
    user_data = active_users.get(target_user_id)
    if user_data and user_data["sockets"]:
        await asyncio.gather(
            *[s.send(payload_str) for s in user_data["sockets"]],
            return_exceptions=True
        )


async def broadcast_to_all(payload_str: str):
    """Envia uma mensagem para todos os clientes conectados (Broadcast obrigatório)."""
    all_sockets = []
    for user_data in active_users.values():
        all_sockets.extend(user_data["sockets"])

    if all_sockets:
        await asyncio.gather(
            *[s.send(payload_str) for s in all_sockets],
            return_exceptions=True
        )


async def chat_handler(websocket):
    """Gerenciador principal do ciclo de vida da conexão WebSocket."""
    current_user_id = None
    current_username = "Anônimo"

    try:
        async for raw_message in websocket:
            try:
                data = json.loads(raw_message)
            except json.JSONDecodeError:
                logger.warning(f"Mensagem inválida recebida (não é JSON): {raw_message[:50]}")
                continue

            msg_type = data.get("type")

            if msg_type == "join":
                current_user_id = int(data.get("user_id", 0))
                current_username = data.get("username", f"User_{current_user_id}")

                if current_user_id not in active_users:
                    active_users[current_user_id] = {
                        "username": current_username,
                        "sockets": set()
                    }
                active_users[current_user_id]["sockets"].add(websocket)
                active_users[current_user_id]["username"] = current_username

                total_users = len(get_online_users_list())
                print(f"\033[92m[CONEXAO]\033[0m Usuario '{current_username}' (ID: {current_user_id}) conectou. Online: {total_users}")

                history_payload = json.dumps({
                    "type": "history",
                    "room": "global",
                    "messages": global_history
                })
                await websocket.send(history_payload)
                await broadcast_presence()

            elif msg_type == "chat_message":
                if not current_user_id:
                    continue

                text = data.get("text", "").strip()
                if not text:
                    continue

                target = data.get("target", "global")
                target_user_id = data.get("target_user_id")
                target_username = data.get("target_username", "Privado")
                timestamp = datetime.now(timezone.utc).isoformat()

                msg_obj = {
                    "type": "chat_message",
                    "id": f"msg_{datetime.now(timezone.utc).timestamp()}",
                    "sender_id": current_user_id,
                    "sender_name": current_username,
                    "target": target,
                    "target_user_id": target_user_id,
                    "target_username": target_username,
                    "text": text,
                    "timestamp": timestamp
                }
                payload_str = json.dumps(msg_obj)

                if target == "global":
                    print(f"\033[94m[MENSAGEM - GERAL]\033[0m {current_username}: {text}")
                    global_history.append(msg_obj)
                    if len(global_history) > MAX_HISTORY:
                        global_history.pop(0)
                    await broadcast_to_all(payload_str)
                else:
                    print(f"\033[95m[MENSAGEM - DIRETA]\033[0m {current_username} -> {target_username} (ID: {target_user_id}): {text}")
                    if target_user_id:
                        await send_to_user(int(target_user_id), payload_str)
                    await send_to_user(current_user_id, payload_str)

            elif msg_type == "file_share":
                if not current_user_id:
                    continue

                file_info = data.get("file", {})
                if not file_info or not file_info.get("id"):
                    continue

                target = data.get("target", "global")
                target_user_id = data.get("target_user_id")
                target_username = data.get("target_username", "Privado")
                text = data.get("text", "").strip()
                timestamp = datetime.now(timezone.utc).isoformat()

                share_obj = {
                    "type": "file_share",
                    "id": f"file_{datetime.now(timezone.utc).timestamp()}",
                    "sender_id": current_user_id,
                    "sender_name": current_username,
                    "target": target,
                    "target_user_id": target_user_id,
                    "target_username": target_username,
                    "text": text,
                    "file": file_info,
                    "timestamp": timestamp
                }
                payload_str = json.dumps(share_obj)

                if target == "global":
                    print(f"\033[93m[COMPARTILHAMENTO - GERAL]\033[0m {current_username} compartilhou '{file_info.get('original_name')}'")
                    global_history.append(share_obj)
                    if len(global_history) > MAX_HISTORY:
                        global_history.pop(0)
                    await broadcast_to_all(payload_str)
                else:
                    print(f"\033[93m[COMPARTILHAMENTO - DIRETO]\033[0m {current_username} compartilhou '{file_info.get('original_name')}' com {target_username}")
                    if target_user_id:
                        await send_to_user(int(target_user_id), payload_str)
                    await send_to_user(current_user_id, payload_str)

    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        logger.error(f"Erro no handler do websocket: {e}")
    finally:
        if current_user_id and current_user_id in active_users:
            active_users[current_user_id]["sockets"].discard(websocket)
            if not active_users[current_user_id]["sockets"]:
                del active_users[current_user_id]

        total_users = len(get_online_users_list())
        print(f"\033[91m[DESCONEXAO]\033[0m Usuario '{current_username}' (ID: {current_user_id}) desconectou. Online: {total_users}")
        await broadcast_presence()


async def main():
    host = "0.0.0.0"
    port = 8004
    print("=" * 60)
    print(f" Servidor WebSocket SafoDrive iniciado em ws://127.0.0.1:{port}/")
    print(" Protocolo: ws:// puro | Suporte: Broadcast e 1-para-1")
    print("=" * 60)

    async with websockets.serve(chat_handler, host, port):
        await asyncio.get_running_loop().create_future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServidor WebSocket encerrado.")
