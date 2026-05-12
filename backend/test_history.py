import os
from database import get_chat_history

def print_history_format():
    recent = get_chat_history()
    history = []
    print("RAW DB:")
    for msg in recent:
        print(f"Role: {msg['role']}, Content: {repr(msg['content'].encode('ascii', 'ignore').decode('ascii'))}")
        if msg["role"] == "user":
            history.append({"role": "user", "content": msg["content"]})
        elif msg["role"] == "bot":
            content = msg["content"].split("<div class=\"emi-card\">")[0].strip()
            history.append({"role": "assistant", "content": content})
            
    print("\nFORMATTED FOR GROQ:")
    for h in history:
        print(h)

if __name__ == "__main__":
    print_history_format()
