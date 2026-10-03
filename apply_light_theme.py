import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Variables
    content = content.replace('--bg:            #000000;', '--bg:            #f5f5f7;')
    content = content.replace('--surface:       rgba(255, 255, 255, 0.04);', '--surface:       #ffffff;')
    content = content.replace('--surface-h:     rgba(255, 255, 255, 0.07);', '--surface-h:     #f0f0f0;')
    content = content.replace('--border:        rgba(255, 255, 255, 0.09);', '--border:        #d2d2d7;')
    content = content.replace('--border-h:      rgba(255, 255, 255, 0.18);', '--border-h:      #c7c7cc;')
    content = content.replace('--text:          #f5f5f7;', '--text:          #1d1d1f;')
    content = content.replace('--text-3:        #515154;', '--text-3:        #86868b;')

    # Body
    content = content.replace('background: #000000 !important;', 'background: #f5f5f7 !important;')
    content = content.replace('background:#000; color:#f5f5f7;', 'background:#f5f5f7; color:#1d1d1f;')
    content = content.replace('color: #f5f5f7 !important;', 'color: #1d1d1f !important;')

    # Navbar
    content = content.replace('background: rgba(0, 0, 0, 0.84) !important;', 'background: rgba(255, 255, 255, 0.84) !important;')
    content = content.replace('background:rgba(0,0,0,0.82);', 'background:rgba(255,255,255,0.82);')
    
    # Generic replacements
    # White opacity surfaces -> Black opacity surfaces
    content = re.sub(r'rgba\(255,\s*255,\s*255,\s*(0\.\d+)\)', r'rgba(0, 0, 0, \1)', content)
    
    # Text colors
    content = content.replace('color: #ffffff', 'color: #1d1d1f')
    content = content.replace('color:#ffffff', 'color:#1d1d1f')
    content = content.replace('color: #fff;', 'color: #1d1d1f;')
    content = content.replace('color:#fff;', 'color:#1d1d1f;')
    
    # But brand text needs to stay white if background is dark, wait, navbar-brand has dark blue background.
    # Let's fix brand text specifically
    content = content.replace('.navbar-brand-main {\n    font-size: 0.75rem !important;\n    font-weight: 900 !important;\n    letter-spacing: 0.06em !important;\n    text-transform: uppercase !important;\n    color: #1d1d1f !important;', 
                              '.navbar-brand-main {\n    font-size: 0.75rem !important;\n    font-weight: 900 !important;\n    letter-spacing: 0.06em !important;\n    text-transform: uppercase !important;\n    color: #ffffff !important;')
                              
    content = content.replace('text-shadow: 0 0 10px rgba(96, 165, 250, 0.7)', 'text-shadow: none')
    
    # Other places where text was #fff but background is blue
    
    # specific fix for html inline styles if any
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

files = glob.glob('*.html') + ['css/style.css']
for f in files:
    process_file(f)
