import glob
import re

files = glob.glob('js/*.js') + glob.glob('*.html') + glob.glob('css/*.css')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Check for bright light blue often used in Tailwind for dark mode
    # #60a5fa (blue-400), #3b82f6 (blue-500), #93c5fd (blue-300), #7dd3fc (sky-300), #38bdf8 (sky-400)
    # Also var(--accent-light) or similar
    
    # We want a darker blue like #1d4ed8 (blue-700) or #2563eb (blue-600)
    # Let's see what color is in mesas.js
    
    content = content.replace('color: #60a5fa;', 'color: #1d4ed8;')
    content = content.replace('color: #3b82f6;', 'color: #1d4ed8;')
    content = content.replace('color: #38bdf8;', 'color: #0369a1;')
    content = content.replace('color: #7dd3fc;', 'color: #0369a1;')
    content = content.replace('color:#60a5fa;', 'color:#1d4ed8;')
    content = content.replace('color:#3b82f6;', 'color:#1d4ed8;')

    # Let's also check for var(--accent) being too light? No, var(--accent) is #0071e3 which is a good blue.
    # What if it's color: #60a5fa without semicolon? Let's use regex
    
    content = re.sub(r'color:\s*#60a5fa\b', 'color: #1d4ed8', content)
    content = re.sub(r'color:\s*#3b82f6\b', 'color: #1d4ed8', content)
    content = re.sub(r'color:\s*#38bdf8\b', 'color: #0369a1', content)
    content = re.sub(r'color:\s*#7dd3fc\b', 'color: #0369a1', content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed light blue in {filepath}")
