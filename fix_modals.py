import glob
import re

files = glob.glob('*.html') + glob.glob('css/*.css')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Modal background
    content = re.sub(r'background:\s*rgba\(18,\s*20,\s*26,\s*0\.95\)', 'background: rgba(255, 255, 255, 0.95)', content)
    content = re.sub(r'background:\s*rgba\(20,\s*24,\s*33,\s*0\.95\)', 'background: rgba(255, 255, 255, 0.95)', content)
    
    # Form select option background
    content = re.sub(r'background:\s*#12141a', 'background: #ffffff', content)
    content = re.sub(r'background:\s*#14161f', 'background: #ffffff', content)
    
    # Body background just in case
    content = re.sub(r'background:\s*#000000;', 'background: #f5f5f7;', content)
    content = re.sub(r'background:#000;', 'background:#f5f5f7;', content)
    
    # Any color: white not caught
    content = re.sub(r'color:\s*#fff\b', 'color: #1d1d1f', content)
    
    # Toast background
    content = re.sub(r'background:\s*rgba\(12,\s*14,\s*20,\s*0\.96\)', 'background: rgba(255, 255, 255, 0.96)', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed modal/dark colors in {filepath}")
