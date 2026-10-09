import os

avatars_dir = '/public/avatars'
os.makedirs(avatars_dir, exist_ok=True)

def chef_hat(x=100, y=42, scale=1.0):
    return f'''
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

# 11. Tigre Popote (chef-tiger.svg)
def create_tiger():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgTiger" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="shTiger" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#78350F" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgTiger)" stroke="#D97706" stroke-width="4"/>

  <g filter="url(#shTiger)">
    <!-- Round Ears -->
    <circle cx="56" cy="68" r="18" fill="#F97316"/>
    <circle cx="56" cy="68" r="10" fill="#FEF08A"/>
    <circle cx="144" cy="68" r="18" fill="#F97316"/>
    <circle cx="144" cy="68" r="10" fill="#FEF08A"/>

    <!-- Head & Body -->
    <path d="M50 185 C50 125 60 76 100 76 C140 76 150 125 150 185 Z" fill="#F97316"/>
    <ellipse cx="100" cy="118" rx="44" ry="40" fill="#FB923C"/>
    <!-- White Muzzle -->
    <ellipse cx="88" cy="128" rx="16" ry="12" fill="#FFFBEB"/>
    <ellipse cx="112" cy="128" rx="16" ry="12" fill="#FFFBEB"/>
    <polygon points="95,120 105,120 100,126" fill="#7C2D12"/>

    <!-- Tiger Stripes -->
    <path d="M100 82 L100 94 M92 86 L94 96 M108 86 L106 96" stroke="#7C2D12" stroke-width="3" stroke-linecap="round"/>
    <path d="M58 114 L70 116 M58 122 L72 122 M142 114 L130 116 M142 122 L128 122" stroke="#7C2D12" stroke-width="3" stroke-linecap="round"/>
  </g>

  {standard_eyes(82, 118, 112, 6)}
  {cheeks(68, 132, 126, 6, '#F43F5E', '0.4')}

  <!-- Spatula held by tiger -->
  <g filter="url(#shTiger)">
    <rect x="146" y="80" width="6" height="34" rx="2" fill="#94A3B8" transform="rotate(15 149 97)"/>
    <rect x="140" y="65" width="18" height="18" rx="2" fill="#CBD5E1" transform="rotate(15 149 74)"/>
    <line x1="145" y1="68" x2="145" y2="78" stroke="#94A3B8" stroke-width="2" transform="rotate(15 149 74)"/>
    <line x1="151" y1="68" x2="151" y2="78" stroke="#94A3B8" stroke-width="2" transform="rotate(15 149 74)"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 12. Cerf Forestier (chef-deer.svg)
def create_deer():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgDeer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="100%" stop-color="#7DD3FC" />
    </linearGradient>
    <filter id="shDeer" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0284C7" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgDeer)" stroke="#0284C7" stroke-width="4"/>

  <g filter="url(#shDeer)">
    <!-- Antlers -->
    <path d="M70 65 L60 40 M60 50 L50 45 M130 65 L140 40 M140 50 L150 45" stroke="#92400E" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Big Ears -->
    <ellipse cx="55" cy="80" rx="12" ry="24" fill="#B45309" transform="rotate(-35 55 80)"/>
    <ellipse cx="55" cy="80" rx="6" ry="16" fill="#FDE68A" transform="rotate(-35 55 80)"/>
    <ellipse cx="145" cy="80" rx="12" ry="24" fill="#B45309" transform="rotate(35 145 80)"/>
    <ellipse cx="145" cy="80" rx="6" ry="16" fill="#FDE68A" transform="rotate(35 145 80)"/>

    <!-- Deer Head & Body -->
    <path d="M60 185 C60 135 70 85 100 85 C130 85 140 135 140 185 Z" fill="#B45309"/>
    <ellipse cx="100" cy="116" rx="38" ry="34" fill="#D97706"/>
    <!-- Muzzle -->
    <ellipse cx="100" cy="126" rx="20" ry="14" fill="#FEF3C7"/>
    <ellipse cx="100" cy="122" rx="7" ry="5" fill="#451A03"/>
    <!-- Fawn Spots -->
    <circle cx="82" cy="98" r="2.5" fill="#FFF" opacity="0.8"/>
    <circle cx="118" cy="98" r="2.5" fill="#FFF" opacity="0.8"/>
  </g>

  {standard_eyes(82, 118, 110, 6)}
  {cheeks(68, 132, 122, 6, '#F43F5E', '0.4')}

  <!-- Hands holding a crisp red apple -->
  <g filter="url(#shDeer)">
    <circle cx="100" cy="162" r="14" fill="#EF4444"/>
    <path d="M100 148 Q103 144 105 142" stroke="#78350F" stroke-width="2" fill="none"/>
    <ellipse cx="107" cy="144" rx="4" ry="2" fill="#22C55E"/>
    <!-- Paws -->
    <circle cx="84" cy="162" r="7" fill="#B45309"/>
    <circle cx="116" cy="162" r="7" fill="#B45309"/>
  </g>
  {chef_hat(100, 36, 0.9)}
</svg>'''

# 13. Canard Bec sucré (chef-duck.svg)
def create_duck():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgDuck" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF9C3" />
      <stop offset="100%" stop-color="#FACC15" />
    </linearGradient>
    <filter id="shDuck" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#854D0E" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgDuck)" stroke="#EAB308" stroke-width="4"/>

  <g filter="url(#shDuck)">
    <!-- Duck Body -->
    <path d="M55 185 C55 130 65 90 100 90 C135 90 145 130 145 185 Z" fill="#FDE047"/>
    <!-- Duck Head -->
    <circle cx="100" cy="108" r="40" fill="#FACC15"/>
    <!-- Polka Dot Bandana / Scarf around neck -->
    <path d="M72 145 Q100 162 128 145 Q100 152 72 145 Z" fill="#F97316"/>
    <polygon points="100,158 92,176 108,176" fill="#F97316"/>

    <!-- Duck Orange Bill -->
    <ellipse cx="100" cy="122" rx="22" ry="12" fill="#FB923C"/>
    <circle cx="94" cy="118" r="2" fill="#C2410C"/>
    <circle cx="106" cy="118" r="2" fill="#C2410C"/>
  </g>

  {standard_eyes(82, 118, 102, 6.5)}
  {cheeks(68, 132, 114, 7, '#F43F5E', '0.4')}

  {chef_hat(100, 36, 0.95)}
</svg>'''

# 14. Mouton Pâtissier (chef-sheep.svg)
def create_sheep():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgSheep" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE7F3" />
      <stop offset="100%" stop-color="#F472B6" />
    </linearGradient>
    <filter id="shSheep" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#831843" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgSheep)" stroke="#EC4899" stroke-width="4"/>

  <g filter="url(#shSheep)">
    <!-- Woolly Puffs around head -->
    <circle cx="60" cy="85" r="18" fill="#FFFFFF"/>
    <circle cx="140" cy="85" r="18" fill="#FFFFFF"/>
    <circle cx="50" cy="110" r="18" fill="#FFFFFF"/>
    <circle cx="150" cy="110" r="18" fill="#FFFFFF"/>
    <circle cx="65" cy="135" r="18" fill="#FFFFFF"/>
    <circle cx="135" cy="135" r="18" fill="#FFFFFF"/>

    <!-- Droopy Ears -->
    <ellipse cx="50" cy="105" rx="14" ry="8" fill="#FBCFE8" transform="rotate(25 50 105)"/>
    <ellipse cx="150" cy="105" rx="14" ry="8" fill="#FBCFE8" transform="rotate(-25 150 105)"/>

    <!-- Face -->
    <ellipse cx="100" cy="115" rx="36" ry="32" fill="#FDE8E8"/>
    <!-- Nose & Smile -->
    <polygon points="96,122 104,122 100,126" fill="#F43F5E"/>
    <path d="M100 126 L100 130 M95 130 Q100 136 105 130" stroke="#9F1239" stroke-width="2" fill="none"/>
  </g>

  {standard_eyes(84, 116, 110, 6)}
  {cheeks(70, 130, 122, 6, '#F43F5E', '0.45')}

  <!-- Tray of Cupcakes -->
  <g filter="url(#shSheep)">
    <!-- Tray -->
    <rect x="62" y="156" width="76" height="6" rx="3" fill="#CBD5E1"/>
    <!-- Cupcake 1 -->
    <polygon points="72,156 82,156 80,148 74,148" fill="#B45309"/>
    <ellipse cx="77" cy="146" rx="6" ry="5" fill="#F472B6"/>
    <!-- Cupcake 2 -->
    <polygon points="95,156 105,156 103,148 97,148" fill="#B45309"/>
    <ellipse cx="100" cy="146" rx="6" ry="5" fill="#38BDF8"/>
    <!-- Cupcake 3 -->
    <polygon points="118,156 128,156 126,148 120,148" fill="#B45309"/>
    <ellipse cx="123" cy="146" rx="6" ry="5" fill="#FBBF24"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 15. Loutre Amuseuse (chef-otter.svg)
def create_otter():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgOtter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#CCFBF1" />
      <stop offset="100%" stop-color="#2DD4BF" />
    </linearGradient>
    <filter id="shOtter" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0F766E" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgOtter)" stroke="#0D9488" stroke-width="4"/>

  <g filter="url(#shOtter)">
    <!-- Tiny Round Ears -->
    <circle cx="62" cy="78" r="10" fill="#78350F"/>
    <circle cx="138" cy="78" r="10" fill="#78350F"/>

    <!-- Otter Head & Body -->
    <path d="M55 185 C55 125 65 80 100 80 C135 80 145 125 145 185 Z" fill="#9A3412"/>
    <ellipse cx="100" cy="115" rx="42" ry="36" fill="#A16207"/>
    <!-- Cream Muzzle -->
    <ellipse cx="100" cy="125" rx="26" ry="18" fill="#FEF3C7"/>
    <!-- Triangular Black Nose -->
    <polygon points="94,120 106,120 100,126" fill="#1C1917"/>
    <!-- Whiskers -->
    <line x1="72" y1="126" x2="52" y2="124" stroke="#78350F" stroke-width="2"/>
    <line x1="72" y1="130" x2="52" y2="134" stroke="#78350F" stroke-width="2"/>
    <line x1="128" y1="126" x2="148" y2="124" stroke="#78350F" stroke-width="2"/>
    <line x1="128" y1="130" x2="148" y2="134" stroke="#78350F" stroke-width="2"/>
  </g>

  {standard_eyes(82, 118, 110, 6)}
  {cheeks(68, 132, 122, 6, '#F43F5E', '0.4')}

  <!-- Whisk held playfully in paws -->
  <g filter="url(#shOtter)">
    <line x1="135" y1="130" x2="155" y2="85" stroke="#94A3B8" stroke-width="4"/>
    <ellipse cx="158" cy="80" rx="8" ry="14" fill="none" stroke="#64748B" stroke-width="2" transform="rotate(25 158 80)"/>
    <circle cx="86" cy="165" r="9" fill="#78350F"/>
    <circle cx="120" cy="165" r="9" fill="#78350F"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 16. Hibou Savant (chef-owl.svg)
def create_owl():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgOwl" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0E7FF" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
    <filter id="shOwl" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#312E81" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgOwl)" stroke="#4F46E5" stroke-width="4"/>

  <g filter="url(#shOwl)">
    <!-- Feather Tufts / Ears -->
    <polygon points="65,70 50,45 78,60" fill="#78350F"/>
    <polygon points="135,70 150,45 122,60" fill="#78350F"/>

    <!-- Owl Body & Head -->
    <ellipse cx="100" cy="124" rx="48" ry="46" fill="#92400E"/>
    <ellipse cx="100" cy="138" rx="32" ry="26" fill="#FEF3C7"/>

    <!-- Round Glasses -->
    <circle cx="76" cy="115" r="22" fill="#FFF" stroke="#0D9488" stroke-width="3"/>
    <circle cx="124" cy="115" r="22" fill="#FFF" stroke="#0D9488" stroke-width="3"/>
    <line x1="98" y1="115" x2="102" y2="115" stroke="#0D9488" stroke-width="3"/>

    <!-- Big Owl Eyes inside glasses -->
    <circle cx="76" cy="115" r="10" fill="#1E293B"/>
    <circle cx="124" cy="115" r="10" fill="#1E293B"/>
    <circle cx="73" cy="112" r="3.5" fill="#FFF"/>
    <circle cx="121" cy="112" r="3.5" fill="#FFF"/>

    <!-- Beak -->
    <polygon points="96,126 104,126 100,135" fill="#F59E0B"/>
  </g>

  <!-- Breast feathers -->
  <path d="M92 145 Q100 148 108 145 M88 153 Q100 156 112 153" stroke="#D97706" stroke-width="2" stroke-linecap="round" fill="none"/>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 17. Porcin Festif (chef-pig.svg)
def create_pig():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgPig" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE4E6" />
      <stop offset="100%" stop-color="#FB7185" />
    </linearGradient>
    <filter id="shPig" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#9F1239" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgPig)" stroke="#E11D48" stroke-width="4"/>

  <g filter="url(#shPig)">
    <!-- Pointy Piggy Ears -->
    <polygon points="62,75 45,50 78,60" fill="#FDA4AF"/>
    <polygon points="62,70 52,55 72,62" fill="#FB7185"/>
    <polygon points="138,75 155,50 122,60" fill="#FDA4AF"/>
    <polygon points="138,70 148,55 128,62" fill="#FB7185"/>

    <!-- Pig Body & Head -->
    <path d="M52 185 C52 125 65 80 100 80 C135 80 148 125 148 185 Z" fill="#FDA4AF"/>
    <circle cx="100" cy="116" r="42" fill="#FBCFE8"/>

    <!-- Pig Snout -->
    <ellipse cx="100" cy="126" rx="18" ry="13" fill="#FB7185"/>
    <circle cx="94" cy="126" r="3.5" fill="#881337"/>
    <circle cx="106" cy="126" r="3.5" fill="#881337"/>
  </g>

  {standard_eyes(80, 120, 108, 6)}
  {cheeks(66, 134, 122, 7, '#E11D48', '0.45')}

  <!-- Holding big soup spoon -->
  <g filter="url(#shPig)">
    <line x1="56" y1="165" x2="68" y2="120" stroke="#94A3B8" stroke-width="4"/>
    <ellipse cx="70" cy="115" rx="9" ry="13" fill="#CBD5E1"/>
    <circle cx="70" cy="162" r="8" fill="#F472B6"/>
    <circle cx="130" cy="162" r="8" fill="#F472B6"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 18. Abeille Butineuse (chef-bee.svg)
def create_bee():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgBee" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF9C3" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>
    <filter id="shBee" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#78350F" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgBee)" stroke="#D97706" stroke-width="4"/>

  <g filter="url(#shBee)">
    <!-- Wings -->
    <ellipse cx="65" cy="75" rx="16" ry="26" fill="#E0F2FE" opacity="0.85" transform="rotate(-30 65 75)"/>
    <ellipse cx="135" cy="75" rx="16" ry="26" fill="#E0F2FE" opacity="0.85" transform="rotate(30 135 75)"/>

    <!-- Bee Body -->
    <ellipse cx="100" cy="120" rx="42" ry="38" fill="#FACC15"/>
    <!-- Black Stripes -->
    <path d="M70 110 C85 114 115 114 130 110 L132 118 C115 122 85 122 68 118 Z" fill="#1C1917"/>
    <path d="M72 130 C85 134 115 134 128 130 L126 138 C115 142 85 142 74 138 Z" fill="#1C1917"/>

    <!-- Antennae -->
    <path d="M85 75 Q75 60 72 65" stroke="#1C1917" stroke-width="3" fill="none"/>
    <circle cx="72" cy="65" r="4" fill="#1C1917"/>
    <path d="M115 75 Q125 60 128 65" stroke="#1C1917" stroke-width="3" fill="none"/>
    <circle cx="128" cy="65" r="4" fill="#1C1917"/>
  </g>

  {standard_eyes(84, 116, 102, 6)}
  <!-- Smile -->
  <path d="M92 110 Q100 118 108 110" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  {cheeks(70, 130, 112, 6, '#F43F5E', '0.45')}

  <!-- Clay Honey Pot with dripping honey -->
  <g filter="url(#shBee)">
    <path d="M125 148 Q118 178 140 178 Q162 178 155 148 Z" fill="#D97706"/>
    <ellipse cx="140" cy="148" rx="15" ry="5" fill="#B45309"/>
    <!-- Golden honey dripping -->
    <ellipse cx="140" cy="148" rx="11" ry="3" fill="#FDE047"/>
    <path d="M136 150 Q138 160 144 150" fill="#FDE047"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 19. Girafe Gourmande (chef-giraffe.svg)
def create_giraffe():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGiraffe" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF3C7" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="shGiraffe" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#78350F" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgGiraffe)" stroke="#D97706" stroke-width="4"/>

  <g filter="url(#shGiraffe)">
    <!-- Horns (Ossicones) -->
    <line x1="85" y1="65" x2="82" y2="45" stroke="#B45309" stroke-width="4"/>
    <circle cx="82" cy="45" r="5" fill="#78350F"/>
    <line x1="115" y1="65" x2="118" y2="45" stroke="#B45309" stroke-width="4"/>
    <circle cx="118" cy="45" r="5" fill="#78350F"/>

    <!-- Ears -->
    <ellipse cx="62" cy="75" rx="14" ry="7" fill="#F59E0B" transform="rotate(-25 62 75)"/>
    <ellipse cx="138" cy="75" rx="14" ry="7" fill="#F59E0B" transform="rotate(25 138 75)"/>

    <!-- Long Neck & Body -->
    <rect x="85" y="115" width="30" height="70" fill="#FCD34D"/>
    <!-- Spots on Neck -->
    <rect x="90" y="135" width="12" height="14" rx="3" fill="#B45309"/>
    <rect x="98" y="155" width="14" height="16" rx="4" fill="#B45309"/>

    <!-- Red Bandana / Scarf around neck -->
    <path d="M80 125 Q100 138 120 125 L108 144 Z" fill="#EF4444"/>

    <!-- Giraffe Head -->
    <ellipse cx="100" cy="95" rx="32" ry="28" fill="#FCD34D"/>
    <!-- Muzzle -->
    <ellipse cx="100" cy="106" rx="20" ry="14" fill="#FDE68A"/>
    <ellipse cx="100" cy="102" rx="6" ry="4" fill="#78350F"/>
  </g>

  {standard_eyes(84, 116, 92, 5.5)}
  {cheeks(72, 128, 102, 6, '#F43F5E', '0.4')}

  {chef_hat(100, 32, 0.9)}
</svg>'''

# 20. Blaireau Boulanger (chef-badger.svg)
def create_badger():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgBadger" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#64748B" />
    </linearGradient>
    <filter id="shBadger" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgBadger)" stroke="#475569" stroke-width="4"/>

  <g filter="url(#shBadger)">
    <!-- Small Round Ears -->
    <circle cx="62" cy="74" r="14" fill="#334155"/>
    <circle cx="62" cy="74" r="8" fill="#FFF"/>
    <circle cx="138" cy="74" r="14" fill="#334155"/>
    <circle cx="138" cy="74" r="8" fill="#FFF"/>

    <!-- Badger Head -->
    <ellipse cx="100" cy="116" rx="44" ry="38" fill="#F8FAFC"/>
    <!-- Iconic Badger Black Eye Stripes -->
    <path d="M70 85 L90 85 L84 135 L64 125 Z" fill="#1E293B"/>
    <path d="M130 85 L110 85 L116 135 L136 125 Z" fill="#1E293B"/>

    <!-- Black Nose -->
    <ellipse cx="100" cy="126" rx="9" ry="7" fill="#0F172A"/>
  </g>

  <!-- Eyes embedded in stripes -->
  <ellipse cx="78" cy="110" rx="5.5" ry="7.5" fill="#FFFFFF"/>
  <ellipse cx="122" cy="110" rx="5.5" ry="7.5" fill="#FFFFFF"/>
  <circle cx="78" cy="110" r="4" fill="#0F172A"/>
  <circle cx="122" cy="110" r="4" fill="#0F172A"/>
  <circle cx="76.5" cy="108" r="1.5" fill="#FFF"/>
  <circle cx="120.5" cy="108" r="1.5" fill="#FFF"/>

  <!-- Hands Kneading Dough on Board -->
  <g filter="url(#shBadger)">
    <!-- Dough Board -->
    <rect x="65" y="162" width="70" height="14" rx="4" fill="#D97706"/>
    <!-- Fresh Bread Dough -->
    <ellipse cx="100" cy="160" rx="24" ry="12" fill="#FEF3C7"/>
    <!-- Paws kneading -->
    <circle cx="86" cy="155" r="9" fill="#334155"/>
    <circle cx="114" cy="155" r="9" fill="#334155"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

files_batch_2 = {
    'chef-tiger.svg': create_tiger(),
    'chef-deer.svg': create_deer(),
    'chef-duck.svg': create_duck(),
    'chef-sheep.svg': create_sheep(),
    'chef-otter.svg': create_otter(),
    'chef-owl.svg': create_owl(),
    'chef-pig.svg': create_pig(),
    'chef-bee.svg': create_bee(),
    'chef-giraffe.svg': create_giraffe(),
    'chef-badger.svg': create_badger()
}

for name, content in files_batch_2.items():
    with open(os.path.join(avatars_dir, name), 'w') as f:
        f.write(content.strip())
print(f"Generated {len(files_batch_2)} avatars batch 2.")
