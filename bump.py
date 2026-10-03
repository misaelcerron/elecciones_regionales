import glob
import re

files = glob.glob('*.html')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the style.css?v=X and bump it
    def replacer(match):
        current_version = int(match.group(1))
        return f"css/style.css?v={current_version + 1}"

    new_content = re.sub(r'css/style\.css\?v=(\d+)', replacer, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Bumped version in {filepath}")
