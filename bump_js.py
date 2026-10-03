import glob
import re

files = glob.glob('*.html')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacer(match):
        current_version = int(match.group(2))
        return f"{match.group(1)}?v={current_version + 1}"

    # Match js/something.js?v=X
    new_content = re.sub(r'(js/[a-zA-Z0-9_-]+\.js)\?v=(\d+)', replacer, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Bumped JS version in {filepath}")
