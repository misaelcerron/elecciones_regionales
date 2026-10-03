import glob
import re

files = glob.glob('*.html') + glob.glob('css/*.css')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Replace dark gray backgrounds
    content = content.replace('background-color: #1c1c1e;', 'background-color: #ffffff;')
    content = content.replace('background: #1c1c1e;', 'background: #ffffff;')
    content = content.replace('background:#1c1c1e;', 'background:#ffffff;')
    
    content = content.replace('background-color: #14161f;', 'background-color: #ffffff;')
    content = content.replace('background: #14161f;', 'background: #ffffff;')
    content = content.replace('background:#14161f;', 'background:#ffffff;')
    
    content = content.replace('background: rgba(28,28,30,0.95);', 'background: rgba(255,255,255,0.95);')
    content = content.replace('background: rgba(28, 28, 30, 0.95);', 'background: rgba(255, 255, 255, 0.95);')
    
    # Just in case for dropdowns
    content = content.replace('background:#12141a;', 'background:#ffffff;')
    content = content.replace('background: #12141a;', 'background: #ffffff;')

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed remaining dark modales in {filepath}")
