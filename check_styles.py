import re

with open('usuarios.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find any modal-related classes in style tags
styles = re.findall(r'<style>(.*?)</style>', content, re.DOTALL)
if styles:
    for style in styles:
        lines = style.split('\n')
        for line in lines:
            if 'modal' in line or 'input' in line or 'background' in line:
                print(line.strip())
