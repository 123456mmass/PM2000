import sys
import os
from dotenv import dotenv_values

print("--- MEIPASS DEBUGGER ---")
print(f"Is frozen: {getattr(sys, 'frozen', False)}")

if getattr(sys, 'frozen', False):
    print(f"MEIPASS: {sys._MEIPASS}")
    env_path = os.path.join(sys._MEIPASS, '.env')
    print(f".env path: {env_path}")
    print(f".env exists: {os.path.exists(env_path)}")
    
    if os.path.exists(env_path):
        print("\n--- .env contents ---")
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                print(f.read())
            print("\n--- dotenv parsed ---")
            print(dotenv_values(env_path))
        except Exception as e:
            print(f"Error reading .env: {e}")
    else:
        print("\n--- MEIPASS directory contents ---")
        import glob
        for f in glob.glob(os.path.join(sys._MEIPASS, '*')):
            print(f)
            
print("\nPress Enter to exit...")
input()
