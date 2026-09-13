import glob
import re

# Remove the extra stray closing </div><!-- .page or .page-wrapper close --> that the script added
html_files = glob.glob('*.html')

for f in html_files:
    if f in ['login.html', 'elec.html']:
        continue
    
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove the extra </div><!-- .page or .page-wrapper close --> line
    content = content.replace('\n</div><!-- .page or .page-wrapper close -->\n', '\n')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Cleaned stray closing divs.")
