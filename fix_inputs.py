import glob
import re

files = glob.glob('*.html') + glob.glob('css/*.css')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Fix any input text color that is explicitly white
    # e.g., color: #ffffff; color: white;
    content = re.sub(r'color:\s*white\b', 'color: #1d1d1f', content)
    content = re.sub(r'color:\s*#ffffff\b', 'color: #1d1d1f', content)
    content = re.sub(r'color:\s*#fff\b', 'color: #1d1d1f', content)
    content = re.sub(r'color:#fff\b', 'color:#1d1d1f', content)
    content = re.sub(r'color:#ffffff\b', 'color:#1d1d1f', content)
    content = re.sub(r'color:white\b', 'color:#1d1d1f', content)

    # Let's also check for specific input styles like .form-input
    content = content.replace('color: #ffffff;', 'color: #1d1d1f;')
    content = content.replace('color: #fff;', 'color: #1d1d1f;')

    # Fix placeholder color too, if it's too light
    # placeholder is usually #86868b or rgba(...)

    # Special check for index.html - input field #mesaInput
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed input colors in {filepath}")
