import glob
import re

files = glob.glob('*.html')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacer_css(match):
        current_version = int(match.group(1))
        return f"css/style.css?v={current_version + 1}"

    def replacer_js(match):
        current_version = int(match.group(2))
        return f"{match.group(1)}?v={current_version + 1}"

    new_content = re.sub(r'css/style\.css\?v=(\d+)', replacer_css, content)
    new_content = re.sub(r'(js/[a-zA-Z0-9_-]+\.js)\?v=(\d+)', replacer_js, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Bumped versions in {filepath}")
