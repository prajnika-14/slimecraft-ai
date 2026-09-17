import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials are missing from .env")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


def create_chat(user_id: str, title: str = "New Chat"):
    response = supabase.table("chats").insert({
        "user_id": user_id,
        "title": title
    }).execute()

    return response.data[0]


def save_message(chat_id: str, role: str, content: str):
    response = supabase.table("messages").insert({
        "chat_id": chat_id,
        "role": role,
        "content": content
    }).execute()

    return response.data[0]


def get_user_chats(user_id: str):
    response = (
        supabase
        .table("chats")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


def get_chat_messages(chat_id: str):
    response = (
        supabase
        .table("messages")
        .select("*")
        .eq("chat_id", chat_id)
        .order("created_at", desc=False)
        .execute()
    )

    return response.data