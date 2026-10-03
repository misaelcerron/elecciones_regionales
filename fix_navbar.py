import glob
import re

files = glob.glob('*.html') + glob.glob('css/*.css')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Fix navbar background
    content = re.sub(r'background:\s*rgba\(0,\s*0,\s*0,\s*0\.8[2-9]\)', r'background: rgba(255, 255, 255, 0.84)', content)
    content = re.sub(r'background:\s*rgba\(0,\s*0,\s*0,\s*0\.8[2-9]\)\s*!important', r'background: rgba(255, 255, 255, 0.84) !important', content)
    
    # Also, navbar link colors. The user screenshot shows dark links on a dark background.
    # In my previous script I changed white to #1d1d1f.
    # Let's ensure the links pill has a light background too.
    content = re.sub(r'\.navbar-links\s*{\s*(.*?)\s*background:\s*rgba\(0,\s*0,\s*0,\s*0\.04\)\s*!important;', r'.navbar-links {\n\1\n    background: rgba(255, 255, 255, 0.5) !important;', content, flags=re.DOTALL)
    
    # Let's just fix .navbar directly
    content = content.replace('background: rgba(0, 0, 0, 0.84) !important;', 'background: rgba(255, 255, 255, 0.84) !important;')
    content = content.replace('background:rgba(0,0,0,0.82);', 'background:rgba(255,255,255,0.84);')
    content = content.replace('background: rgba(0, 0, 0, 0.82);', 'background:rgba(255,255,255,0.84);')

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated navbar bg in {filepath}")
