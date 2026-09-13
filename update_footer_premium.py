import glob
import re

html_files = glob.glob('*.html')

OLD_FOOTER_PATTERNS = [
    # Pattern 1: old simple footer inside .page div
    r'    <!-- FOOTER -->\s*<div[^>]*margin-top: 4rem[^>]*>.*?</div>\s*</div>',
    # Pattern 2: old footer as standalone block
    r'\n<!-- FOOTER -->\s*<div[^>]*>.*?</div>\n',
    r'    <!-- FOOTER -->\s*\n.*?</div>\n',
]

NEW_FOOTER = '''
</div><!-- .page or .page-wrapper close -->

<!-- ════ FOOTER PREMIUM ════ -->
<footer class="site-footer">
    <div class="footer-inner">
        <!-- Gradient line top -->
        <div class="footer-gradient-line"></div>

        <div class="footer-grid">
            <!-- Branding col -->
            <div class="footer-brand">
                <div class="footer-logo-wrap">
                    <img src="img/podemos_peru_logo.jpg" alt="Podemos Perú" class="footer-logo-img">
                </div>
                <div>
                    <div class="footer-brand-name">Sistema Electoral</div>
                    <div class="footer-brand-sub">ODPE Pasco · Perú 2026</div>
                </div>
            </div>

            <!-- Center info col -->
            <div class="footer-info">
                <div class="footer-badge">
                    <span class="footer-badge-dot"></span> Plataforma Oficial de Escrutinio
                </div>
                <p class="footer-legal">
                    Diseñado y desarrollado por
                </p>
                <p class="footer-company">GRUPO YRLAND S.A.C</p>
                <div class="footer-meta-row">
                    <span class="footer-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        RUC 20612537811
                    </span>
                    <span class="footer-meta-sep">·</span>
                    <span class="footer-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Yanahuanca, Pasco
                    </span>
                    <span class="footer-meta-sep">·</span>
                    <span class="footer-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 7.93 7.93l1.32-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        943 939 128
                    </span>
                </div>
            </div>

            <!-- Right col -->
            <div class="footer-right">
                <div class="footer-secure-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Datos Protegidos
                </div>
                <div class="footer-copy">
                    © 2026 Grupo Yrland S.A.C<br>
                    Todos los derechos reservados
                </div>
            </div>
        </div>
    </div>
</footer>

<style>
.site-footer {
    position: relative;
    margin-top: 5rem;
    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%);
    border-top: 0.5px solid rgba(255,255,255,0.06);
}
.footer-gradient-line {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(0,113,227,0.6) 30%, rgba(175,82,222,0.6) 70%, transparent 100%);
    margin-bottom: 2rem;
}
.footer-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.5rem 2.5rem;
}
.footer-grid {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 2rem;
    align-items: center;
}
.footer-brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}
.footer-logo-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255,255,255,0.06);
    border: 0.5px solid rgba(255,255,255,0.12);
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.footer-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 10px;
}
.footer-brand-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: -0.01em;
}
.footer-brand-sub {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
    margin-top: 0.1rem;
}
.footer-info {
    text-align: center;
}
.footer-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(50,215,75,0.85);
    background: rgba(50,215,75,0.08);
    border: 0.5px solid rgba(50,215,75,0.2);
    border-radius: 30px;
    padding: 0.25rem 0.75rem;
    margin-bottom: 0.75rem;
}
.footer-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #32d74b;
    box-shadow: 0 0 6px #32d74b;
    animation: pulseDot 2s ease-in-out infinite;
}
@keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
}
.footer-legal {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.3);
    margin-bottom: 0.15rem;
}
.footer-company {
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    background: linear-gradient(90deg, #0071e3, #af52de);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.65rem;
}
.footer-meta-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
}
.footer-meta-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}
.footer-meta-item svg {
    opacity: 0.6;
}
.footer-meta-sep {
    opacity: 0.2;
}
.footer-right {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
}
.footer-secure-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(0,113,227,0.8);
    background: rgba(0,113,227,0.08);
    border: 0.5px solid rgba(0,113,227,0.2);
    border-radius: 20px;
    padding: 0.3rem 0.75rem;
}
.footer-copy {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.2);
    line-height: 1.6;
}
@media (max-width: 720px) {
    .footer-grid {
        grid-template-columns: 1fr;
        text-align: center;
    }
    .footer-brand { justify-content: center; }
    .footer-right { align-items: center; }
}
</style>
'''

for f in html_files:
    if f in ['login.html', 'elec.html']:
        continue

    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()

    # Remove old simple footer div
    content = re.sub(
        r'\s*<!-- FOOTER -->\s*<div[^>]*>.*?</div>',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Remove old standalone page-closing div if present (won't touch non-footer)
    # Add footer before </body>
    if '<footer class="site-footer">' not in content:
        content = content.replace('</body>', NEW_FOOTER + '\n</body>')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Done! Footer aplicado a todos los HTML.")
