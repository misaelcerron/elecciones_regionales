import glob
import re

files = glob.glob('js/*.js')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Colors in styles
    content = content.replace('color:#fff', 'color:#1d1d1f')
    content = content.replace('color: #fff', 'color: #1d1d1f')
    content = content.replace('color:#ffffff', 'color:#1d1d1f')
    content = content.replace('color: white', 'color: #1d1d1f')
    
    # Chart JS configurations
    content = content.replace("color: '#fff'", "color: '#86868b'")
    content = content.replace("color: 'rgba(255,255,255,0.7)'", "color: 'rgba(0,0,0,0.5)'")
    content = content.replace("color: 'rgba(255, 255, 255, 0.7)'", "color: 'rgba(0, 0, 0, 0.5)'")
    content = content.replace("color: 'rgba(255,255,255,0.1)'", "color: 'rgba(0,0,0,0.1)'")
    content = content.replace("color: 'rgba(255, 255, 255, 0.1)'", "color: 'rgba(0, 0, 0, 0.1)'")
    content = content.replace("ctx.fillStyle = '#fff'", "ctx.fillStyle = '#1d1d1f'")
    content = content.replace("backgroundColor: '#fff'", "backgroundColor: '#1d1d1f'")

    # RGBA replacements for borders and backgrounds inline
    content = re.sub(r'rgba\(255,\s*255,\s*255,\s*(0\.\d+)\)', r'rgba(0, 0, 0, \1)', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
