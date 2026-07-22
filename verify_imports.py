"""Re-audit: verify all unused imports have been removed from backend/app."""
import os, ast

BACKEND_APP = r"C:\Users\navee\OneDrive\Desktop\gowtham4201\backend\app"
IGNORE_DIRS = {"__pycache__", ".pytest_cache", "venv", ".venv"}

def get_py_files(root):
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        for fn in filenames:
            if fn.endswith(".py"):
                files.append(os.path.join(dirpath, fn))
    return files

def get_used_names(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        src = f.read()
    try:
        tree = ast.parse(src, filename=filepath)
    except SyntaxError:
        return set()
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            names.add(node.id)
        elif isinstance(node, ast.Attribute):
            if isinstance(node.value, ast.Name):
                names.add(node.value.id)
    return names

def check_unused_imports(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        src = f.read()
    try:
        tree = ast.parse(src, filename=filepath)
    except SyntaxError:
        return []
    aliases = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                local = alias.asname if alias.asname else alias.name.split(".")[0]
                aliases[local] = alias.name
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                local = alias.asname if alias.asname else alias.name
                if alias.name != "*":
                    aliases[local] = alias.name
    used = get_used_names(filepath)
    return [(l, o) for l, o in aliases.items() if l not in used and l != "_" and not l.startswith("__")]

files = get_py_files(BACKEND_APP)
total_unused = 0
for fp in sorted(files):
    unused = check_unused_imports(fp)
    if unused:
        rel = fp.replace(BACKEND_APP + "\\", "")
        print(f"  {rel}")
        for l, o in unused:
            print(f"    - {l!r} (from {o!r})")
        total_unused += len(unused)

if total_unused == 0:
    print("SUCCESS: 0 unused imports found across all files.")
else:
    print(f"\nSTILL HAS {total_unused} unused import(s) to review.")
