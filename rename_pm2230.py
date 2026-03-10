"""
Rename PM2200 → PM2200 across all project files.
Preserves UTF-8 encoding properly (unlike PowerShell Set-Content).
"""
import os

SKIP_DIRS = {'.venv', 'node_modules', '.next', '.git', '__pycache__', 'dist', 'build'}
EXTENSIONS = {'.py', '.tsx', '.ts', '.bat', '.sh', '.md', '.json', '.svg', '.html', '.mjs', '.css'}

root_dir = os.path.dirname(os.path.abspath(__file__))
updated = []

for dirpath, dirnames, filenames in os.walk(root_dir):
    # Skip unwanted directories
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    
    for filename in filenames:
        # Check file extension
        _, ext = os.path.splitext(filename)
        # Also handle .env.example (no standard ext match)
        if ext not in EXTENSIONS and filename != '.env.example':
            continue
        
        filepath = os.path.join(dirpath, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except (UnicodeDecodeError, PermissionError):
            continue
        
        if 'PM2200' in content or 'pm2200' in content:
            new_content = content.replace('PM2200', 'PM2200').replace('pm2200', 'pm2200')
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.write(new_content)
            updated.append(os.path.relpath(filepath, root_dir))

print(f"\n✅ Updated {len(updated)} files:")
for f in sorted(updated):
    print(f"   {f}")
print("\nDone! All files saved as UTF-8.")
