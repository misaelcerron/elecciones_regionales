import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace `renderPartidosTodasLasTabs` and `buildPartidoCard`
def replace_func(func_name, replacement, text):
    # Regex to find function func_name() { ... }
    pattern = r'function\s+' + func_name + r'\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    # Actually, a simple regex is hard for nested braces. Let's just do a string replacement.
    return text

# It's easier to just overwrite js/app.js with the correct functions, 
# or use regex for the specific lines.
# Let's write the whole file since we have it backed up.
# Actually, I can use a simpler approach. I'll just write a script that replaces the functions.
