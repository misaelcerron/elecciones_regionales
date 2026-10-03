import glob
import re

files = glob.glob('*.html')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Fix root variables
    content = re.sub(r'--text:\s*#f5f5f7;', '--text: #1d1d1f;', content)
    content = re.sub(r'--text-3:\s*#515154;', '--text-3: #86868b;', content)
    
    # Check for any other var missed
    content = re.sub(r'--bg:\s*#000000;', '--bg: #f5f5f7;', content)
    content = re.sub(r'--surface:\s*rgba\(255,\s*255,\s*255,\s*0\.04\);', '--surface: #ffffff;', content)
    
    # Also explicitly fix field-input focus text color just in case
    content = re.sub(r'\.field-input\s*{([^}]+)}', lambda m: '.field-input {' + m.group(1).replace('color:#ffffff;', 'color:#1d1d1f;').replace('color:white;', 'color:#1d1d1f;') + '}', content)

    # Some vote-value inputs have hardcoded color: var(--text); let's make sure --text works.

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed root vars in {filepath}")
