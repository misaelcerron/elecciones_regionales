import glob
import re

files = glob.glob('*.html') + glob.glob('css/*.css')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    content = content.replace('color: white;', 'color: #1d1d1f;')
    content = content.replace('color:white;', 'color:#1d1d1f;')
    content = content.replace('color: white', 'color: #1d1d1f')

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
