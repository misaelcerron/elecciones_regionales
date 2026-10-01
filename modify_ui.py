import re
import sys

# Modify index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace tabs container
tabs_repl = """<div class="tabs-container" id="tabsContainer">
                <button type="button" class="tab-btn active" data-tab="1">1. Acta Regional</button>
                <button type="button" class="tab-btn" data-tab="2">2. Acta Municipal</button>
            </div>"""

html = re.sub(r'<div class="tabs-container" id="tabsContainer">.*?</div>', tabs_repl, html, flags=re.DOTALL)

# We will replace the 4 tab-contents with just 2 tab contents.
# Let's completely wipe the existing tab contents and insert new ones.

new_tabs = """
            <div class="tab-content active" id="tab-content-1">
                <h3 class="section-title" style="font-size: 0.95rem; margin-bottom: 1rem; text-align: center; color: var(--accent);">
                    ELECCIONES REGIONALES
                </h3>
                
                <div class="table-responsive" style="overflow-x: auto; margin-bottom: 1rem;">
                    <table class="acta-table" style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: var(--r-lg);">
                        <thead>
                            <tr>
                                <th style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: left; width: 40%;">ORGANIZACIONES POLÍTICAS</th>
                                <th style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; border-left: 1px solid var(--border);">GOBERNADOR Y VICEGOBERNADOR</th>
                                <th style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; border-left: 1px solid var(--border);">CONSEJERO REGIONAL</th>
                            </tr>
                        </thead>
                        <tbody id="partidosContainer_1">
                            <!-- Filas generadas por JS -->
                        </tbody>
                        <tbody>
                            <!-- Otros votos -->
                            <tr style="background: rgba(255,255,255,0.01);">
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">VOTOS EN BLANCO</td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_blancos_1" data-tab="1" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_blancos_2" data-tab="2" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                            </tr>
                            <tr style="background: rgba(255,255,255,0.01);">
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">VOTOS NULOS</td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_nulos_1" data-tab="1" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_nulos_2" data-tab="2" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                            </tr>
                            <tr style="background: rgba(255,255,255,0.01);">
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">VOTOS IMPUGNADOS</td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_impugnados_1" data-tab="1" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_impugnados_2" data-tab="2" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                            </tr>
                            <tr style="background: rgba(255,255,255,0.05); font-weight: 800;">
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">TOTAL DE VOTOS EMITIDOS</td>
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center; color: var(--accent); font-size: 1.2rem;" id="sumVotos_1">0</td>
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center; color: var(--accent); font-size: 1.2rem;" id="sumVotos_2">0</td>
                            </tr>
                            <tr>
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">TOTAL DE CIUDADANOS QUE VOTARON</td>
                                <td colspan="2" style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="field-input total-votaron-input" id="total_votaron_1" data-tab="1" placeholder="0" required min="0" inputmode="numeric" style="width: 150px; text-align: center; margin: 0 auto; display: block; border-color: rgba(59,130,246,0.5);">
                                    <button type="button" class="btnAutoVotaron" data-target="1" style="display:none;background:rgba(0,113,227,0.18);border:0.5px solid rgba(59,130,246,0.45);color:#93c5fd;padding:0.12rem 0.5rem;border-radius:10px;font-size:0.68rem;font-weight:700;cursor:pointer;margin-top:0.5rem;transition:all 0.2s ease;">? Usar suma (<span class="btnAutoVotaronNum">0</span>)</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="tab-content" id="tab-content-2">
                <h3 class="section-title" style="font-size: 0.95rem; margin-bottom: 1rem; text-align: center; color: #a78bfa;">
                    ELECCIONES MUNICIPALES
                </h3>
                
                <div class="table-responsive" style="overflow-x: auto; margin-bottom: 1rem;">
                    <table class="acta-table" style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: var(--r-lg);">
                        <thead>
                            <tr>
                                <th style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: left; width: 40%;">ORGANIZACIONES POLÍTICAS</th>
                                <th style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; border-left: 1px solid var(--border);">PROVINCIAL</th>
                                <th style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; border-left: 1px solid var(--border);">DISTRITAL</th>
                            </tr>
                        </thead>
                        <tbody id="partidosContainer_2">
                            <!-- Filas generadas por JS -->
                        </tbody>
                        <tbody>
                            <!-- Otros votos -->
                            <tr style="background: rgba(255,255,255,0.01);">
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">VOTOS EN BLANCO</td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_blancos_3" data-tab="3" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_blancos_4" data-tab="4" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                            </tr>
                            <tr style="background: rgba(255,255,255,0.01);">
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">VOTOS NULOS</td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_nulos_3" data-tab="3" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_nulos_4" data-tab="4" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                            </tr>
                            <tr style="background: rgba(255,255,255,0.01);">
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">VOTOS IMPUGNADOS</td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_impugnados_3" data-tab="3" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                                <td style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="vote-value other-input" id="votos_impugnados_4" data-tab="4" value="0" min="0" inputmode="numeric" style="width: 100%; text-align: center; background: transparent; border: none; color: var(--text); font-size: 1.5rem; font-weight: 800; outline: none;">
                                </td>
                            </tr>
                            <tr style="background: rgba(255,255,255,0.05); font-weight: 800;">
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">TOTAL DE VOTOS EMITIDOS</td>
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center; color: var(--accent); font-size: 1.2rem;" id="sumVotos_3">0</td>
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center; color: var(--accent); font-size: 1.2rem;" id="sumVotos_4">0</td>
                            </tr>
                            <tr>
                                <td style="padding: 1rem; border-bottom: 1px solid var(--border);">TOTAL DE CIUDADANOS QUE VOTARON</td>
                                <td colspan="2" style="padding: 0.5rem; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); text-align: center;">
                                    <input type="number" class="field-input total-votaron-input" id="total_votaron_3" data-tab="3" placeholder="0" required min="0" inputmode="numeric" style="width: 150px; text-align: center; margin: 0 auto; display: block; border-color: rgba(59,130,246,0.5);">
                                    <button type="button" class="btnAutoVotaron" data-target="3" style="display:none;background:rgba(0,113,227,0.18);border:0.5px solid rgba(59,130,246,0.45);color:#93c5fd;padding:0.12rem 0.5rem;border-radius:10px;font-size:0.68rem;font-weight:700;cursor:pointer;margin-top:0.5rem;transition:all 0.2s ease;">? Usar suma (<span class="btnAutoVotaronNum">0</span>)</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
"""

# Find the start of tab-content-1 and end of tab-content-4
html = re.sub(r'<div class="tab-content active" id="tab-content-1">.*?</div>\s*</div>\s*<div class="tab-content " id="tab-content-2">.*?</div>\s*</div>\s*<div class="tab-content " id="tab-content-3">.*?</div>\s*</div>\s*<div class="tab-content " id="tab-content-4">.*?</div>\s*</div>', new_tabs, html, flags=re.DOTALL)
# The above regex might not match correctly because of nested divs.
# Let's just find <div class="tabs-container" id="tabsContainer"> and replace everything until <div class="step" id="step3">

start_idx = html.find('<div class="tabs-container" id="tabsContainer">')
end_idx = html.find('<div class="section-card" id="validacionSection" style="display:none;">')

if start_idx != -1 and end_idx != -1:
    new_html = html[:start_idx] + tabs_repl + new_tabs + "</div>\n" + html[end_idx:]
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
else:
    print("Could not find boundaries for index.html replacement.")
