import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]
auth_pattern = re.compile(r'js/auth\.js\?v=\d+')
dash_pattern = re.compile(r'js/dashboard\.js\?v=\d+')
app_pattern = re.compile(r'js/app\.js\?v=\d+')
usuarios_pattern = re.compile(r'js/usuarios\.js\?v=\d+')
personeros_pattern = re.compile(r'js/personeros\.js\?v=\d+')

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = content
    new_content = auth_pattern.sub('js/auth.js?v=30', new_content)
    new_content = dash_pattern.sub('js/dashboard.js?v=30', new_content)
    new_content = app_pattern.sub('js/app.js?v=30', new_content)
    new_content = usuarios_pattern.sub('js/usuarios.js?v=30', new_content)
    new_content = personeros_pattern.sub('js/personeros.js?v=30', new_content)

    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated scripts in {f}")
print("Done")
