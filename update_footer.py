import glob
import re

html_files = glob.glob('*.html')

footer_html = """
    <!-- FOOTER -->
    <div style="margin-top: 4rem; text-align: center; border-top: 0.5px solid rgba(255,255,255,0.09); padding-top: 2rem; margin-bottom: 2rem;">
        <p style="font-size: 0.75rem; color: #86868b; letter-spacing: 0.02em;">
            Diseñado por <strong>GRUPO YRLAND S.A.C</strong> &nbsp;|&nbsp; RUC: 20612537811 &nbsp;|&nbsp; YANAHUANCA &nbsp;|&nbsp; CEL: 943939128
        </p>
    </div>
"""

for f in html_files:
    if f in ['index.html', 'login.html', 'elec.html']: continue
    
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Add Personeros to navbar
    if 'href="organizaciones.html">Organizaciones</a>' in content and 'href="personeros.html"' not in content:
        content = content.replace(
            '<a href="organizaciones.html">Organizaciones</a>',
            '<a href="organizaciones.html">Organizaciones</a>\n            <a href="personeros.html">Personeros</a>'
        )

    # 2. Add footer at the end of .page
    if '<!-- FOOTER -->' not in content:
        # A safer regex: find </div> just before <script
        content = re.sub(r'(</div>\s*)(<script)', f'\\1{footer_html}\\2', content, count=1)
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
        
print("Updated all HTML files.")
