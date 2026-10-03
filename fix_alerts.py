import glob
import re

files = glob.glob('*.html') + glob.glob('css/*.css')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Ok (green)
    content = content.replace('#32d74b', '#16a34a')
    content = re.sub(r'--ok:\s*#32d74b;', '--ok: #16a34a;', content)
    content = content.replace('rgba(50,215,75', 'rgba(22,163,74')
    
    # Err (red)
    content = content.replace('#ff453a', '#dc2626')
    content = re.sub(r'--err:\s*#ff453a;', '--err: #dc2626;', content)
    content = content.replace('rgba(255,69,58', 'rgba(220,38,38')
    
    # Warn (yellow/amber)
    content = content.replace('#ffd60a', '#d97706')
    content = re.sub(r'--warn:\s*#ffd60a;', '--warn: #d97706;', content)
    content = content.replace('rgba(255,214,10', 'rgba(217,119,6')

    # Just in case field-input has color white explicitly
    content = content.replace('color: white;', 'color: #1d1d1f;')
    
    # Fix .field-input.mesa-ok explicitly to use dark text for the number
    content = content.replace('.field-input.mesa-ok{\n            border-color:var(--ok);\n            box-shadow:0 0 0 4px rgba(22,163,74,0.15);\n            background:rgba(22,163,74,0.08);\n            color:var(--ok);\n        }', 
                              '.field-input.mesa-ok{\n            border-color:var(--ok);\n            box-shadow:0 0 0 4px rgba(22,163,74,0.15);\n            background:rgba(22,163,74,0.08);\n            color:#1d1d1f;\n        }')

    # Also make sure .field-input:focus has explicit color
    content = re.sub(r'(\.field-input:focus\s*\{[^\}]+)(\})', r'\1 color: #1d1d1f;\2', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed alert/neon colors in {filepath}")
