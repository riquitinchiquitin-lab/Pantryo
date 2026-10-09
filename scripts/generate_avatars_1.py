import os

avatars_dir = '/public/avatars'
os.makedirs(avatars_dir, exist_ok=True)

# Helper for standard chef hat SVG
def chef_hat(x=100, y=42, scale=1.0):
    return f'''
    <!-- Chef Toque -->
    <g transform="translate({x},{y}) scale({scale})">
      <ellipse cx="-22" cy="0" rx="15" ry="15" fill="#FFFFFF"/>
      <ellipse cx="22" cy="0" rx="15" ry="15" fill="#FFFFFF"/>
      <ellipse cx="0" cy="-8" rx="20" ry="18" fill="#FFFFFF"/>
      <rect x="-26" y="8" width="52" height="16" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
      <line x1="-16" y1="12" x2="-16" y2="20" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="-6" y1="12" x2="-6" y2="20" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="6" y1="12" x2="6" y2="20" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="16" y1="12" x2="16" y2="20" stroke="#CBD5E1" stroke-width="1.5"/>
    </g>
    '''

def standard_eyes(cx1=80, cx2=120, cy=115, r=7, fill="#1E293B"):
    return f'''
    <ellipse cx="{cx1}" cy="{cy}" rx="{r}" ry="{r*1.3}" fill="{fill}"/>
    <ellipse cx="{cx2}" cy="{cy}" rx="{r}" ry="{r*1.3}" fill="{fill}"/>
    <circle cx="{cx1-2.5}" cy="{cy-3}" r="{r*0.4}" fill="#FFFFFF"/>
    <circle cx="{cx2-2.5}" cy="{cy-3}" r="{r*0.4}" fill="#FFFFFF"/>
    <circle cx="{cx1+2}" cy="{cy+3}" r="{r*0.2}" fill="#FFFFFF"/>
    <circle cx="{cx2+2}" cy="{cy+3}" r="{r*0.2}" fill="#FFFFFF"/>
    '''

def cheeks(cx1=66, cx2=134, cy=125, r=8, fill="#F43F5E", op="0.4"):
    return f'''
    <circle cx="{cx1}" cy="{cy}" r="{r}" fill="{fill}" opacity="{op}"/>
    <circle cx="{cx2}" cy="{cy}" r="{r}" fill="{fill}" opacity="{op}"/>
    '''

# 1. Crabe Marmiton (chef-crab.svg)
def create_crab():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgCrab" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFEDD5" />
      <stop offset="100%" stop-color="#FB923C" />
    </linearGradient>
    <filter id="shCrab" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#9A3412" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgCrab)" stroke="#EA580C" stroke-width="4"/>
  <circle cx="35" cy="45" r="3" fill="#FFF" opacity="0.8"/>
  <circle cx="165" cy="55" r="4" fill="#FFF" opacity="0.8"/>

  <g filter="url(#shCrab)">
    <!-- Legs -->
    <path d="M48 140 Q30 155 45 170 M40 125 Q20 135 32 150 M152 140 Q170 155 155 170 M160 125 Q180 135 168 150" stroke="#EA580C" stroke-width="6" stroke-linecap="round" fill="none"/>
    <!-- Claws holding tools -->
    <!-- Left Claw with spatula -->
    <path d="M50 110 Q40 85 52 68" stroke="#EA580C" stroke-width="8" stroke-linecap="round" fill="none"/>
    <ellipse cx="50" cy="62" rx="14" ry="12" fill="#F97316"/>
    <!-- Spatula -->
    <rect x="42" y="32" width="7" height="28" rx="2" fill="#CBD5E1" transform="rotate(-15 45 46)"/>
    <rect x="36" y="24" width="18" height="14" rx="2" fill="#94A3B8" transform="rotate(-15 45 31)"/>
    <!-- Right Claw with tongs -->
    <path d="M150 110 Q160 85 148 68" stroke="#EA580C" stroke-width="8" stroke-linecap="round" fill="none"/>
    <ellipse cx="150" cy="62" rx="14" ry="12" fill="#F97316"/>
    <!-- Tongs -->
    <path d="M146 22 L150 50 M156 22 L152 50" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>

    <!-- Crab Body -->
    <ellipse cx="100" cy="130" rx="55" ry="38" fill="#F97316"/>
    <ellipse cx="100" cy="136" rx="38" ry="24" fill="#FED7AA"/>

    <!-- Eyestalks -->
    <rect x="76" y="80" width="8" height="20" rx="4" fill="#EA580C"/>
    <rect x="116" y="80" width="8" height="20" rx="4" fill="#EA580C"/>
    <circle cx="80" cy="80" r="14" fill="#FFFFFF" stroke="#EA580C" stroke-width="2"/>
    <circle cx="120" cy="80" r="14" fill="#FFFFFF" stroke="#EA580C" stroke-width="2"/>
    <circle cx="82" cy="79" r="6" fill="#1E293B"/>
    <circle cx="122" cy="79" r="6" fill="#1E293B"/>
    <circle cx="80" cy="77" r="2.5" fill="#FFFFFF"/>
    <circle cx="120" cy="77" r="2.5" fill="#FFFFFF"/>
  </g>

  <!-- Smile -->
  <path d="M90 135 Q100 144 110 135" stroke="#9A3412" stroke-width="3" stroke-linecap="round" fill="none"/>
  {cheeks(68, 132, 132, 6, '#BE185D', '0.4')}
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 2. Tortue Mijoteuse (chef-turtle.svg)
def create_turtle():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgTurtle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DCFCE7" />
      <stop offset="100%" stop-color="#4ADE80" />
    </linearGradient>
    <filter id="shTurtle" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#14532D" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgTurtle)" stroke="#16A34A" stroke-width="4"/>
  <circle cx="40" cy="50" r="3" fill="#FFF" opacity="0.8"/>

  <g filter="url(#shTurtle)">
    <!-- Shell Back -->
    <ellipse cx="100" cy="135" rx="58" ry="46" fill="#15803D"/>
    <ellipse cx="100" cy="135" rx="48" ry="38" fill="#16A34A"/>
    <!-- Shell Pattern -->
    <path d="M100 105 L118 118 L118 138 L100 150 L82 138 L82 118 Z" fill="#22C55E" opacity="0.7"/>

    <!-- Paws -->
    <ellipse cx="50" cy="148" rx="14" ry="10" fill="#86EFAC"/>
    <ellipse cx="150" cy="148" rx="14" ry="10" fill="#86EFAC"/>

    <!-- Head -->
    <ellipse cx="100" cy="98" rx="36" ry="32" fill="#86EFAC"/>
    <ellipse cx="100" cy="104" rx="26" ry="18" fill="#BBF7D0"/>
  </g>

  {standard_eyes(85, 115, 96, 6)}
  <!-- Sweet Smile -->
  <path d="M92 108 Q100 116 108 108" stroke="#166534" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  {cheeks(74, 126, 105, 6, '#F43F5E', '0.35')}

  <!-- Steaming Soup Bowl held in front -->
  <g filter="url(#shTurtle)">
    <path d="M80 150 Q100 178 120 150 Z" fill="#F472B6" stroke="#DB2777" stroke-width="2"/>
    <ellipse cx="100" cy="150" rx="20" ry="6" fill="#FDE047"/>
    <!-- Steam -->
    <path d="M94 144 Q91 138 95 132 M100 142 Q103 136 99 130 M106 144 Q103 138 107 132" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8"/>
  </g>
  {chef_hat(100, 38, 0.95)}
</svg>'''

# 3. Éléphant Chef (chef-elephant.svg)
def create_elephant():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgEle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="100%" stop-color="#38BDF8" />
    </linearGradient>
    <filter id="shEle" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0369A1" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgEle)" stroke="#0284C7" stroke-width="4"/>

  <g filter="url(#shEle)">
    <!-- Big Ears -->
    <ellipse cx="50" cy="105" rx="28" ry="34" fill="#94A3B8"/>
    <ellipse cx="50" cy="105" rx="18" ry="24" fill="#FBCFE8"/>
    <ellipse cx="150" cy="105" rx="28" ry="34" fill="#94A3B8"/>
    <ellipse cx="150" cy="105" rx="18" ry="24" fill="#FBCFE8"/>

    <!-- Body -->
    <path d="M60 185 C60 135 70 95 100 95 C130 95 140 135 140 185 Z" fill="#94A3B8"/>
    <!-- Head -->
    <circle cx="100" cy="110" r="42" fill="#CBD5E1"/>

    <!-- Trunk curling up holding salt shaker -->
    <path d="M96 118 Q90 145 108 148 Q118 150 114 135" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M96 118 Q90 145 108 148 Q118 150 114 135" stroke="#CBD5E1" stroke-width="10" stroke-linecap="round" fill="none"/>
  </g>

  {standard_eyes(82, 118, 104, 6)}
  {cheeks(68, 132, 118, 7, '#F43F5E', '0.35')}

  <!-- Cooking pot & salt shaker -->
  <g filter="url(#shEle)">
    <rect x="74" y="156" width="52" height="30" rx="6" fill="#475569"/>
    <ellipse cx="100" cy="156" rx="26" ry="6" fill="#64748B"/>
    <!-- Salt shaker in trunk -->
    <rect x="110" y="120" width="14" height="20" rx="3" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" transform="rotate(-25 117 130)"/>
    <!-- Salt sprinkles -->
    <circle cx="108" cy="142" r="1.5" fill="#FFF"/>
    <circle cx="104" cy="146" r="1.5" fill="#FFF"/>
    <circle cx="100" cy="149" r="1.5" fill="#FFF"/>
  </g>
  {chef_hat(100, 36, 1.0)}
</svg>'''

# 4. Oiseau Chanteur (chef-bird.svg)
def create_bird():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgBird" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF9C3" />
      <stop offset="100%" stop-color="#FCD34D" />
    </linearGradient>
    <filter id="shBird" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#854D0E" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgBird)" stroke="#F59E0B" stroke-width="4"/>

  <!-- Perch Branch with leaves -->
  <path d="M25 155 Q80 150 175 140" stroke="#78350F" stroke-width="8" stroke-linecap="round"/>
  <path d="M40 153 Q30 145 35 138 Q48 142 45 152" fill="#22C55E"/>
  <path d="M60 152 Q55 140 68 142 Q70 150 63 153" fill="#22C55E"/>

  <g filter="url(#shBird)">
    <!-- Tail feathers -->
    <path d="M135 130 L165 115 L155 130 L170 132 L140 140 Z" fill="#818CF8"/>
    <!-- Bird Body -->
    <ellipse cx="98" cy="115" rx="36" ry="30" fill="#FB923C"/>
    <!-- Wing -->
    <path d="M90 105 Q125 110 130 135 Q105 132 90 105 Z" fill="#38BDF8"/>
    <!-- Chest -->
    <ellipse cx="85" cy="122" rx="20" ry="18" fill="#FEF08A"/>
    <!-- Head -->
    <circle cx="85" cy="85" r="24" fill="#38BDF8"/>
  </g>

  <!-- Big Eye -->
  <circle cx="78" cy="82" r="7" fill="#1E293B"/>
  <circle cx="76" cy="80" r="2.5" fill="#FFFFFF"/>
  <circle cx="80" cy="84" r="1.2" fill="#FFFFFF"/>
  <circle cx="70" cy="90" r="5" fill="#F43F5E" opacity="0.4"/>

  <!-- Beak holding sweet berry -->
  <polygon points="62,82 50,86 64,92" fill="#F59E0B"/>
  <circle cx="48" cy="95" r="7" fill="#8B5CF6"/>
  <path d="M48 88 Q50 84 56 86" stroke="#15803D" stroke-width="2" fill="none"/>

  {chef_hat(85, 34, 0.85)}
</svg>'''

# 5. Souris Fromagère (chef-mouse.svg)
def create_mouse():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgMouse" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F1F5F9" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>
    <filter id="shMouse" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#334155" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgMouse)" stroke="#64748B" stroke-width="4"/>

  <g filter="url(#shMouse)">
    <!-- Big Round Ears -->
    <circle cx="55" cy="72" r="26" fill="#94A3B8"/>
    <circle cx="55" cy="72" r="18" fill="#FBCFE8"/>
    <circle cx="145" cy="72" r="26" fill="#94A3B8"/>
    <circle cx="145" cy="72" r="18" fill="#FBCFE8"/>

    <!-- Mouse Body -->
    <path d="M55 185 C55 130 68 85 100 85 C132 85 145 130 145 185 Z" fill="#94A3B8"/>
    <ellipse cx="100" cy="118" rx="38" ry="34" fill="#CBD5E1"/>
    <!-- Snout -->
    <ellipse cx="100" cy="128" rx="20" ry="14" fill="#E2E8F0"/>
    <circle cx="100" cy="122" r="5" fill="#F43F5E"/>
  </g>

  {standard_eyes(82, 118, 112, 6)}
  {cheeks(68, 132, 122, 6, '#F43F5E', '0.4')}

  <!-- Whiskers -->
  <line x1="65" y1="126" x2="45" y2="124" stroke="#64748B" stroke-width="2"/>
  <line x1="65" y1="130" x2="45" y2="134" stroke="#64748B" stroke-width="2"/>
  <line x1="135" y1="126" x2="155" y2="124" stroke="#64748B" stroke-width="2"/>
  <line x1="135" y1="130" x2="155" y2="134" stroke="#64748B" stroke-width="2"/>

  <!-- Hands holding wedge of swiss cheese -->
  <g filter="url(#shMouse)">
    <path d="M82 152 L118 152 L124 175 L76 175 Z" fill="#FACC15" stroke="#EAB308" stroke-width="2"/>
    <circle cx="92" cy="162" r="4" fill="#EAB308"/>
    <circle cx="112" cy="160" r="3" fill="#EAB308"/>
    <circle cx="102" cy="170" r="3" fill="#EAB308"/>
    <!-- Paws -->
    <circle cx="78" cy="162" r="7" fill="#CBD5E1"/>
    <circle cx="122" cy="162" r="7" fill="#CBD5E1"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 6. Baleine Gourmet (chef-whale.svg)
def create_whale():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgWhale" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#BAE6FD" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <filter id="shWhale" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#075985" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgWhale)" stroke="#0369A1" stroke-width="4"/>

  <!-- Water spout bursts with chef sparkle -->
  <path d="M100 58 Q90 35 75 40 M100 58 Q100 25 100 18 M100 58 Q110 35 125 40" stroke="#E0F2FE" stroke-width="4" stroke-linecap="round" fill="none"/>
  <circle cx="75" cy="38" r="4" fill="#E0F2FE"/>
  <circle cx="100" cy="16" r="4.5" fill="#E0F2FE"/>
  <circle cx="125" cy="38" r="4" fill="#E0F2FE"/>

  <g filter="url(#shWhale)">
    <!-- Whale Body -->
    <path d="M35 130 C35 80 80 75 140 85 C165 90 175 105 160 120 C145 135 135 155 75 155 C45 155 35 145 35 130 Z" fill="#0284C7"/>
    <!-- Tail Fin -->
    <path d="M38 125 Q20 115 15 100 Q30 115 36 120 Q30 135 15 145 Q22 135 38 125 Z" fill="#0284C7"/>
    <!-- White Belly -->
    <path d="M60 155 C100 155 130 140 145 125 C125 120 100 120 75 130 C58 136 55 148 60 155 Z" fill="#E0F2FE"/>
    <!-- Pectoral Fin -->
    <ellipse cx="88" cy="136" rx="16" ry="8" fill="#0369A1" transform="rotate(-15 88 136)"/>
  </g>

  <!-- Big happy eye -->
  <circle cx="125" cy="105" r="6" fill="#1E293B"/>
  <circle cx="123" cy="103" r="2.5" fill="#FFFFFF"/>
  <circle cx="132" cy="115" r="5" fill="#F43F5E" opacity="0.4"/>
  <!-- Smile -->
  <path d="M125 118 Q135 124 142 116" stroke="#075985" stroke-width="2.5" stroke-linecap="round" fill="none"/>

  {chef_hat(100, 48, 0.85)}
</svg>'''

# 7. Castor Bricoleur (chef-beaver.svg)
def create_beaver():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgBeaver" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FED7AA" />
      <stop offset="100%" stop-color="#C2410C" />
    </linearGradient>
    <filter id="shBeaver" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#431407" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgBeaver)" stroke="#9A3412" stroke-width="4"/>

  <g filter="url(#shBeaver)">
    <!-- Flat Tail visible at side -->
    <ellipse cx="150" cy="155" rx="24" ry="14" fill="#78350F" transform="rotate(25 150 155)"/>
    <!-- Round Beaver Ears -->
    <circle cx="62" cy="74" r="14" fill="#78350F"/>
    <circle cx="62" cy="74" r="8" fill="#FDBA74"/>
    <circle cx="138" cy="74" r="14" fill="#78350F"/>
    <circle cx="138" cy="74" r="8" fill="#FDBA74"/>

    <!-- Beaver Body & Head -->
    <path d="M52 185 C52 125 65 82 100 82 C135 82 148 125 148 185 Z" fill="#9A3412"/>
    <ellipse cx="100" cy="120" rx="42" ry="38" fill="#9A3412"/>
    <!-- Chubby cheeks & muzzle -->
    <ellipse cx="88" cy="132" rx="16" ry="12" fill="#FDBA74"/>
    <ellipse cx="112" cy="132" rx="16" ry="12" fill="#FDBA74"/>
    <!-- Nose -->
    <ellipse cx="100" cy="124" rx="8" ry="6" fill="#431407"/>
    <!-- Iconic White Beaver Teeth -->
    <rect x="94" y="136" width="6" height="10" rx="1" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="1"/>
    <rect x="100" y="136" width="6" height="10" rx="1" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="1"/>
  </g>

  {standard_eyes(82, 118, 110, 6)}
  {cheeks(68, 132, 126, 6, '#F43F5E', '0.4')}

  <!-- Paws holding big wooden cooking spoon -->
  <g filter="url(#shBeaver)">
    <!-- Wooden Spoon -->
    <rect x="68" y="152" width="68" height="8" rx="4" fill="#D97706" transform="rotate(-30 100 156)"/>
    <ellipse cx="132" cy="138" rx="14" ry="10" fill="#D97706" transform="rotate(-30 132 138)"/>
    <!-- Paws -->
    <circle cx="82" cy="165" r="9" fill="#78350F"/>
    <circle cx="118" cy="165" r="9" fill="#78350F"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 8. Pieuvre Polyvalente (chef-octopus.svg)
def create_octopus():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgOcto" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3E8FF" />
      <stop offset="100%" stop-color="#C084FC" />
    </linearGradient>
    <filter id="shOcto" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#581C87" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgOcto)" stroke="#9333EA" stroke-width="4"/>

  <g filter="url(#shOcto)">
    <!-- Tentacles reaching out holding whisk & spatula -->
    <!-- Left tentacle holding whisk -->
    <path d="M70 140 Q40 130 45 100" stroke="#A855F7" stroke-width="12" stroke-linecap="round" fill="none"/>
    <!-- Whisk in tentacle -->
    <path d="M42 90 L40 65 M34 75 Q40 60 46 75 M37 80 Q40 60 43 80" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none"/>

    <!-- Right tentacle holding spatula -->
    <path d="M130 140 Q160 130 155 100" stroke="#A855F7" stroke-width="12" stroke-linecap="round" fill="none"/>
    <!-- Spatula in tentacle -->
    <rect x="153" y="70" width="6" height="26" fill="#94A3B8"/>
    <rect x="147" y="60" width="18" height="14" rx="2" fill="#CBD5E1"/>

    <!-- Bottom curling tentacles -->
    <path d="M60 155 Q50 178 70 180 Q85 178 78 155" fill="#A855F7"/>
    <path d="M85 155 Q80 182 98 182 Q112 182 108 155" fill="#9333EA"/>
    <path d="M115 155 Q118 182 135 180 Q148 178 138 155" fill="#A855F7"/>

    <!-- Octopus Head / Body -->
    <ellipse cx="100" cy="120" rx="46" ry="42" fill="#A855F7"/>
    <ellipse cx="100" cy="132" rx="32" ry="24" fill="#C084FC"/>
  </g>

  {standard_eyes(82, 118, 116, 6)}
  <!-- Happy mouth -->
  <path d="M93 128 Q100 136 107 128" stroke="#581C87" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  {cheeks(68, 132, 126, 7, '#EC4899', '0.45')}

  {chef_hat(100, 42, 0.95)}
</svg>'''

# 9. Kangourou Sauteur (chef-kangaroo.svg)
def create_kangaroo():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgKang" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFEDD5" />
      <stop offset="100%" stop-color="#FB923C" />
    </linearGradient>
    <filter id="shKang" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#7C2D12" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgKang)" stroke="#EA580C" stroke-width="4"/>

  <g filter="url(#shKang)">
    <!-- Long Ears -->
    <ellipse cx="65" cy="55" rx="10" ry="26" fill="#D97706" transform="rotate(-15 65 55)"/>
    <ellipse cx="65" cy="55" rx="6" ry="18" fill="#FDE68A" transform="rotate(-15 65 55)"/>
    <ellipse cx="135" cy="55" rx="10" ry="26" fill="#D97706" transform="rotate(15 135 55)"/>
    <ellipse cx="135" cy="55" rx="6" ry="18" fill="#FDE68A" transform="rotate(15 135 55)"/>

    <!-- Kangaroo Body -->
    <path d="M52 185 C52 125 65 80 100 80 C135 80 148 125 148 185 Z" fill="#D97706"/>
    <!-- Head -->
    <ellipse cx="100" cy="98" rx="32" ry="28" fill="#F59E0B"/>
    <!-- Muzzle -->
    <ellipse cx="100" cy="108" rx="18" ry="12" fill="#FEF3C7"/>
    <ellipse cx="100" cy="104" rx="6" ry="4" fill="#78350F"/>

    <!-- Pouch -->
    <path d="M72 150 Q100 178 128 150 Z" fill="#B45309"/>
    <!-- Baby Joey in Pouch -->
    <circle cx="100" cy="148" r="14" fill="#F59E0B"/>
    <circle cx="95" cy="146" r="2.5" fill="#1E293B"/>
    <circle cx="105" cy="146" r="2.5" fill="#1E293B"/>
    <circle cx="100" cy="150" r="2" fill="#78350F"/>
    <!-- Baby Joey mini chef hat -->
    <rect x="94" y="132" width="12" height="4" fill="#FFF"/>
    <circle cx="100" cy="130" r="5" fill="#FFF"/>
  </g>

  {standard_eyes(85, 115, 94, 5.5)}
  {cheeks(74, 126, 104, 6, '#F43F5E', '0.4')}
  {chef_hat(100, 32, 0.9)}
</svg>'''

# 10. Hérisson Friand (chef-hedgehog.svg)
def create_hedgehog():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgHedge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5F5F4" />
      <stop offset="100%" stop-color="#A8A29E" />
    </linearGradient>
    <filter id="shHedge" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#292524" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgHedge)" stroke="#78716C" stroke-width="4"/>

  <g filter="url(#shHedge)">
    <!-- Spiky Quills Crest around head -->
    <path d="M48 115 L35 95 L52 90 L42 70 L62 70 L58 50 L78 55 L82 35 L100 45 L118 35 L122 55 L142 50 L138 70 L158 70 L148 90 L165 95 L152 115 L165 135 L148 145 L155 165 Z" fill="#57534E"/>

    <!-- Round Face -->
    <ellipse cx="100" cy="122" rx="45" ry="40" fill="#E7E5E4"/>
    <!-- Snout & Nose -->
    <circle cx="100" cy="125" r="6" fill="#292524"/>
    <path d="M95 132 Q100 138 105 132" stroke="#44403C" stroke-width="2" fill="none"/>
  </g>

  {standard_eyes(82, 118, 114, 6)}
  {cheeks(68, 132, 126, 7, '#F43F5E', '0.4')}

  <!-- Hands holding a delicious star cookie -->
  <g filter="url(#shHedge)">
    <polygon points="100,150 106,162 119,162 109,170 113,182 100,174 87,182 91,170 81,162 94,162" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
    <!-- Paws -->
    <circle cx="85" cy="168" r="7" fill="#D6D3D1"/>
    <circle cx="115" cy="168" r="7" fill="#D6D3D1"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# Write first 10
files_batch_1 = {
    'chef-crab.svg': create_crab(),
    'chef-turtle.svg': create_turtle(),
    'chef-elephant.svg': create_elephant(),
    'chef-bird.svg': create_bird(),
    'chef-mouse.svg': create_mouse(),
    'chef-whale.svg': create_whale(),
    'chef-beaver.svg': create_beaver(),
    'chef-octopus.svg': create_octopus(),
    'chef-kangaroo.svg': create_kangaroo(),
    'chef-hedgehog.svg': create_hedgehog()
}

for name, content in files_batch_1.items():
    with open(os.path.join(avatars_dir, name), 'w') as f:
        f.write(content.strip())
print(f"Generated {len(files_batch_1)} avatars batch 1.")
