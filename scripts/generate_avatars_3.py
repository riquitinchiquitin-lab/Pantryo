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

# 21. Chien Boucher (chef-dog.svg)
def create_dog():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgDog" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFEDD5" />
      <stop offset="100%" stop-color="#FB923C" />
    </linearGradient>
    <filter id="shDog" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#7C2D12" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgDog)" stroke="#EA580C" stroke-width="4"/>

  <g filter="url(#shDog)">
    <!-- Floppy Puppy Ears -->
    <ellipse cx="50" cy="95" rx="16" ry="32" fill="#B45309" transform="rotate(15 50 95)"/>
    <ellipse cx="150" cy="95" rx="16" ry="32" fill="#B45309" transform="rotate(-15 150 95)"/>

    <!-- Dog Body & Head -->
    <path d="M52 185 C52 125 62 76 100 76 C138 76 148 125 148 185 Z" fill="#F59E0B"/>
    <ellipse cx="100" cy="116" rx="42" ry="38" fill="#FBBF24"/>

    <!-- Red Bandana -->
    <path d="M70 148 Q100 165 130 148 L100 176 Z" fill="#DC2626"/>

    <!-- Cream Muzzle -->
    <ellipse cx="100" cy="126" rx="24" ry="18" fill="#FFFBEB"/>
    <!-- Cute Puppy Nose -->
    <ellipse cx="100" cy="120" rx="9" ry="7" fill="#1C1917"/>
    <!-- Tongue Poking Out -->
    <path d="M96 132 Q100 144 104 132 Z" fill="#F43F5E"/>
  </g>

  {standard_eyes(80, 120, 108, 6.5)}
  {cheeks(68, 132, 122, 6, '#F43F5E', '0.4')}
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 22. Koala Doux (chef-koala.svg)
def create_koala():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgKoala" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="100%" stop-color="#38BDF8" />
    </linearGradient>
    <filter id="shKoala" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0369A1" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgKoala)" stroke="#0284C7" stroke-width="4"/>

  <g filter="url(#shKoala)">
    <!-- Big Fluffy Ears -->
    <circle cx="52" cy="78" r="26" fill="#94A3B8"/>
    <circle cx="52" cy="78" r="16" fill="#FFFFFF"/>
    <circle cx="148" cy="78" r="26" fill="#94A3B8"/>
    <circle cx="148" cy="78" r="16" fill="#FFFFFF"/>

    <!-- Koala Body & Head -->
    <path d="M55 185 C55 125 65 80 100 80 C135 80 145 125 145 185 Z" fill="#94A3B8"/>
    <ellipse cx="100" cy="118" rx="44" ry="38" fill="#CBD5E1"/>

    <!-- Iconic Oval Dark Koala Nose -->
    <ellipse cx="100" cy="122" rx="14" ry="18" fill="#1E293B"/>
    <ellipse cx="98" cy="116" rx="4" ry="6" fill="#475569"/>
  </g>

  {standard_eyes(78, 122, 108, 6)}
  {cheeks(66, 134, 122, 6, '#F43F5E', '0.4')}

  <!-- Hands holding a chocolate chip cookie -->
  <g filter="url(#shKoala)">
    <circle cx="100" cy="162" r="14" fill="#D97706"/>
    <!-- Chocolate Chips -->
    <circle cx="95" cy="158" r="2.5" fill="#451A03"/>
    <circle cx="105" cy="157" r="2.5" fill="#451A03"/>
    <circle cx="99" cy="166" r="2.5" fill="#451A03"/>
    <!-- Paws -->
    <circle cx="82" cy="162" r="7" fill="#94A3B8"/>
    <circle cx="118" cy="162" r="7" fill="#94A3B8"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 23. Grenouille Reine (chef-frog.svg)
def create_frog():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgFrog" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DCFCE7" />
      <stop offset="100%" stop-color="#22C55E" />
    </linearGradient>
    <filter id="shFrog" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#14532D" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgFrog)" stroke="#16A34A" stroke-width="4"/>

  <g filter="url(#shFrog)">
    <!-- Big Bulging Eyes on Top -->
    <circle cx="68" cy="78" r="22" fill="#4ADE80"/>
    <circle cx="132" cy="78" r="22" fill="#4ADE80"/>
    <circle cx="68" cy="78" r="14" fill="#FFFFFF"/>
    <circle cx="132" cy="78" r="14" fill="#FFFFFF"/>
    <circle cx="68" cy="78" r="8" fill="#14532D"/>
    <circle cx="132" cy="78" r="8" fill="#14532D"/>
    <circle cx="65" cy="74" r="3.5" fill="#FFFFFF"/>
    <circle cx="129" cy="74" r="3.5" fill="#FFFFFF"/>

    <!-- Frog Body & Head -->
    <path d="M55 185 C55 130 65 95 100 95 C135 95 145 130 145 185 Z" fill="#22C55E"/>
    <ellipse cx="100" cy="120" rx="52" ry="38" fill="#4ADE80"/>
    <!-- Light Belly -->
    <ellipse cx="100" cy="132" rx="34" ry="24" fill="#BBF7D0"/>

    <!-- Wide Froggy Smile -->
    <path d="M72 124 Q100 145 128 124" stroke="#15803D" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>

  {cheeks(66, 134, 126, 7, '#F43F5E', '0.45')}

  <!-- Hand waving spatula -->
  <g filter="url(#shFrog)">
    <rect x="42" y="80" width="6" height="34" rx="2" fill="#94A3B8" transform="rotate(-20 45 97)"/>
    <rect x="36" y="65" width="18" height="18" rx="2" fill="#CBD5E1" transform="rotate(-20 45 74)"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 24. Chaton Pâtissier (chef-kitten.svg)
def create_kitten():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgKitten" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE7F3" />
      <stop offset="100%" stop-color="#F472B6" />
    </linearGradient>
    <filter id="shKitten" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#831843" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgKitten)" stroke="#EC4899" stroke-width="4"/>

  <g filter="url(#shKitten)">
    <!-- Pointy Ears -->
    <polygon points="56,76 38,36 78,52" fill="#FDBA74"/>
    <polygon points="58,70 46,44 74,54" fill="#F472B6"/>
    <polygon points="144,76 162,36 122,52" fill="#FDBA74"/>
    <polygon points="142,70 154,44 126,54" fill="#F472B6"/>

    <!-- Kitten Body & Head -->
    <path d="M50 185 C50 125 60 76 100 76 C140 76 150 125 150 185 Z" fill="#FDBA74"/>
    <ellipse cx="100" cy="118" rx="44" ry="40" fill="#FED7AA"/>
    <!-- Muzzle -->
    <ellipse cx="100" cy="128" rx="22" ry="16" fill="#FFFBEB"/>
    <polygon points="96,120 104,120 100,125" fill="#F43F5E"/>
    <path d="M100 125 L100 130 M94 130 Q100 136 106 130" stroke="#7C2D12" stroke-width="2" fill="none"/>

    <!-- Whiskers -->
    <line x1="68" y1="124" x2="48" y2="120" stroke="#C2410C" stroke-width="2"/>
    <line x1="68" y1="128" x2="48" y2="132" stroke="#C2410C" stroke-width="2"/>
    <line x1="132" y1="124" x2="152" y2="120" stroke="#C2410C" stroke-width="2"/>
    <line x1="132" y1="128" x2="152" y2="132" stroke="#C2410C" stroke-width="2"/>
  </g>

  <!-- Left Eye Wide, Right Eye Winking -->
  <ellipse cx="80" cy="112" rx="7" ry="10" fill="#047857"/>
  <circle cx="77.5" cy="109" r="3" fill="#FFFFFF"/>
  <circle cx="82" cy="115" r="1" fill="#FFFFFF"/>
  <!-- Winking eye -->
  <path d="M112 112 Q120 106 128 112" stroke="#7C2D12" stroke-width="3" stroke-linecap="round" fill="none"/>

  {cheeks(68, 132, 124, 7, '#F43F5E', '0.4')}

  <!-- Whisk held in paw -->
  <g filter="url(#shKitten)">
    <line x1="136" y1="140" x2="152" y2="95" stroke="#94A3B8" stroke-width="3"/>
    <ellipse cx="154" cy="90" rx="8" ry="13" fill="none" stroke="#64748B" stroke-width="2" transform="rotate(20 154 90)"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 25. Singe Jongleur (chef-monkey.svg)
def create_monkey():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgMonkey" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="shMonkey" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#78350F" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgMonkey)" stroke="#D97706" stroke-width="4"/>

  <g filter="url(#shMonkey)">
    <!-- Big Monkey Ears -->
    <circle cx="50" cy="110" r="22" fill="#78350F"/>
    <circle cx="50" cy="110" r="14" fill="#FDE68A"/>
    <circle cx="150" cy="110" r="22" fill="#78350F"/>
    <circle cx="150" cy="110" r="14" fill="#FDE68A"/>

    <!-- Head & Body -->
    <path d="M55 185 C55 130 65 80 100 80 C135 80 145 130 145 185 Z" fill="#78350F"/>
    <circle cx="100" cy="112" r="42" fill="#78350F"/>

    <!-- Heart-shaped Tan Face -->
    <ellipse cx="88" cy="104" rx="16" ry="18" fill="#FDE68A"/>
    <ellipse cx="112" cy="104" rx="16" ry="18" fill="#FDE68A"/>
    <ellipse cx="100" cy="120" rx="30" ry="20" fill="#FDE68A"/>

    <!-- Nostrils & Mischievous Grin with Tongue -->
    <circle cx="96" cy="116" r="2" fill="#78350F"/>
    <circle cx="104" cy="116" r="2" fill="#78350F"/>
    <path d="M88 124 Q100 134 112 124" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="106" cy="130" rx="4" ry="5" fill="#F43F5E"/>
  </g>

  <!-- Winking Left Eye, Open Right Eye -->
  <path d="M80 104 Q86 98 92 104" stroke="#78350F" stroke-width="3" stroke-linecap="round" fill="none"/>
  <circle cx="112" cy="104" r="6" fill="#1E293B"/>
  <circle cx="110" cy="102" r="2" fill="#FFFFFF"/>
  {cheeks(70, 130, 116, 6, '#F43F5E', '0.4')}

  <!-- Juggling Bananas -->
  <g filter="url(#shMonkey)">
    <!-- Banana 1 left -->
    <path d="M42 65 Q45 80 58 75 Q48 78 42 65" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
    <!-- Banana 2 right -->
    <path d="M158 65 Q155 80 142 75 Q152 78 158 65" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 26. Lion Cuistot (chef-lion.svg)
def create_lion():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgLion" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFEDD5" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>
    <filter id="shLion" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#7C2D12" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgLion)" stroke="#EA580C" stroke-width="4"/>

  <g filter="url(#shLion)">
    <!-- Big Fluffy Mane -->
    <circle cx="100" cy="116" r="54" fill="#EA580C"/>

    <!-- Round Ears -->
    <circle cx="60" cy="74" r="14" fill="#F59E0B"/>
    <circle cx="60" cy="74" r="8" fill="#FEF3C7"/>
    <circle cx="140" cy="74" r="14" fill="#F59E0B"/>
    <circle cx="140" cy="74" r="8" fill="#FEF3C7"/>

    <!-- Lion Face -->
    <circle cx="100" cy="116" r="38" fill="#FBBF24"/>
    <!-- Muzzle -->
    <ellipse cx="88" cy="126" rx="14" ry="12" fill="#FEF3C7"/>
    <ellipse cx="112" cy="126" rx="14" ry="12" fill="#FEF3C7"/>
    <polygon points="94,118 106,118 100,125" fill="#78350F"/>

    <!-- Yellow Bandana -->
    <path d="M74 148 Q100 162 126 148 L100 172 Z" fill="#FEF08A"/>
  </g>

  {standard_eyes(82, 118, 110, 6)}
  {cheeks(68, 132, 122, 6, '#F43F5E', '0.4')}
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 27. Carotte Toquée (chef-carrot.svg)
def create_carrot():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgCarrot" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DCFCE7" />
      <stop offset="100%" stop-color="#22C55E" />
    </linearGradient>
    <filter id="shCarrot" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#14532D" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgCarrot)" stroke="#16A34A" stroke-width="4"/>

  <!-- Green Carrot Tops -->
  <path d="M90 55 Q75 35 80 25 Q92 38 95 55 M100 50 Q100 25 105 18 Q108 30 105 50 M110 55 Q125 35 120 25 Q108 38 105 55" stroke="#16A34A" stroke-width="4" stroke-linecap="round" fill="none"/>

  <g filter="url(#shCarrot)">
    <!-- Tapering Carrot Body -->
    <path d="M76 68 C82 66 118 66 124 68 C130 90 120 150 100 185 C80 150 70 90 76 68 Z" fill="#F97316"/>
    <!-- Carrot Texture Ridges -->
    <line x1="84" y1="85" x2="94" y2="85" stroke="#C2410C" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="108" y1="105" x2="120" y2="105" stroke="#C2410C" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="88" y1="135" x2="98" y2="135" stroke="#C2410C" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="104" y1="150" x2="112" y2="150" stroke="#C2410C" stroke-width="2.5" stroke-linecap="round"/>

    <!-- Round Eyeglasses -->
    <circle cx="88" cy="108" r="14" fill="#FFF" stroke="#065F46" stroke-width="2.5"/>
    <circle cx="112" cy="108" r="14" fill="#FFF" stroke="#065F46" stroke-width="2.5"/>
    <line x1="102" y1="108" x2="98" y2="108" stroke="#065F46" stroke-width="2.5"/>

    <!-- Big Eyes inside glasses -->
    <circle cx="88" cy="108" r="6" fill="#1E293B"/>
    <circle cx="112" cy="108" r="6" fill="#1E293B"/>
    <circle cx="86" cy="106" r="2" fill="#FFF"/>
    <circle cx="110" cy="106" r="2" fill="#FFF"/>

    <!-- Smile -->
    <path d="M94 126 Q100 134 106 126" stroke="#9A3412" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </g>

  {cheeks(80, 120, 122, 5, '#BE185D', '0.45')}
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 28. Rat Gourmet (chef-rat.svg)
def create_rat():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgRat" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>
    <filter id="shRat" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#1E293B" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgRat)" stroke="#64748B" stroke-width="4"/>

  <g filter="url(#shRat)">
    <!-- Big Rat Ears -->
    <circle cx="56" cy="74" r="24" fill="#64748B"/>
    <circle cx="56" cy="74" r="16" fill="#FBCFE8"/>
    <circle cx="144" cy="74" r="24" fill="#64748B"/>
    <circle cx="144" cy="74" r="16" fill="#FBCFE8"/>

    <!-- Rat Body & Head -->
    <path d="M55 185 C55 130 65 85 100 85 C135 85 145 130 145 185 Z" fill="#64748B"/>
    <ellipse cx="100" cy="118" rx="40" ry="36" fill="#94A3B8"/>
    <!-- Pointed Snout -->
    <polygon points="85,124 115,124 100,136" fill="#E2E8F0"/>
    <circle cx="100" cy="132" r="5" fill="#F43F5E"/>
    <!-- Buck tooth -->
    <rect x="98" y="136" width="4" height="6" rx="1" fill="#FFF"/>

    <!-- Whiskers -->
    <line x1="68" y1="126" x2="48" y2="124" stroke="#475569" stroke-width="2"/>
    <line x1="68" y1="130" x2="48" y2="134" stroke="#475569" stroke-width="2"/>
    <line x1="132" y1="126" x2="152" y2="124" stroke="#475569" stroke-width="2"/>
    <line x1="132" y1="130" x2="152" y2="134" stroke="#475569" stroke-width="2"/>
  </g>

  <!-- Clever Expressive Eyes -->
  <ellipse cx="82" cy="112" rx="6" ry="8" fill="#1E293B"/>
  <ellipse cx="118" cy="112" rx="6" ry="8" fill="#1E293B"/>
  <circle cx="80" cy="110" r="2" fill="#FFF"/>
  <circle cx="116" cy="110" r="2" fill="#FFF"/>
  {cheeks(70, 130, 122, 6, '#F43F5E', '0.4')}

  <!-- Holding golden cheese block -->
  <g filter="url(#shRat)">
    <polygon points="88,154 116,154 122,174 82,174" fill="#FACC15" stroke="#EAB308" stroke-width="2"/>
    <circle cx="98" cy="164" r="3" fill="#CA8A04"/>
    <circle cx="110" cy="162" r="2.5" fill="#CA8A04"/>
    <!-- Paws -->
    <circle cx="80" cy="162" r="7" fill="#CBD5E1"/>
    <circle cx="120" cy="162" r="7" fill="#CBD5E1"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 29. Écureuil Gourmand (chef-squirrel.svg)
def create_squirrel():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgSquir" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFEDD5" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>
    <filter id="shSquir" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#7C2D12" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgSquir)" stroke="#EA580C" stroke-width="4"/>

  <g filter="url(#shSquir)">
    <!-- Bushy Tail in Background -->
    <path d="M130 150 Q168 120 155 80 Q145 60 130 75 Q150 95 130 130 Z" fill="#C2410C"/>

    <!-- Small Pointed Ears -->
    <polygon points="62,75 52,50 78,65" fill="#C2410C"/>
    <polygon points="138,75 148,50 122,65" fill="#C2410C"/>

    <!-- Chubby Head & Cheeks -->
    <circle cx="100" cy="116" r="42" fill="#D97706"/>
    <!-- Huge Chubby Cheeks -->
    <circle cx="75" cy="126" r="18" fill="#FDE68A"/>
    <circle cx="125" cy="126" r="18" fill="#FDE68A"/>
    <!-- Snout & Nose -->
    <ellipse cx="100" cy="122" rx="14" ry="10" fill="#FEF3C7"/>
    <circle cx="100" cy="118" r="5" fill="#78350F"/>
  </g>

  {standard_eyes(82, 118, 108, 6)}
  {cheeks(68, 132, 128, 7, '#F43F5E', '0.45')}

  <!-- Holding acorn -->
  <g filter="url(#shSquir)">
    <!-- Acorn Cap -->
    <path d="M92 152 Q100 148 108 152 Z" fill="#78350F"/>
    <rect x="99" y="145" width="2" height="4" fill="#78350F"/>
    <!-- Acorn Nut -->
    <ellipse cx="100" cy="162" rx="11" ry="12" fill="#B45309"/>
    <!-- Paws -->
    <circle cx="85" cy="162" r="7" fill="#C2410C"/>
    <circle cx="115" cy="162" r="7" fill="#C2410C"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

# 30. Mouton Boulanger (chef-rolling-sheep.svg)
def create_rolling_sheep():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bgRollSheep" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="100%" stop-color="#60A5FA" />
    </linearGradient>
    <filter id="shRollSheep" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#1E3A8A" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#bgRollSheep)" stroke="#2563EB" stroke-width="4"/>

  <g filter="url(#shRollSheep)">
    <!-- Wool Puffs -->
    <circle cx="58" cy="85" r="18" fill="#FFFFFF"/>
    <circle cx="142" cy="85" r="18" fill="#FFFFFF"/>
    <circle cx="50" cy="112" r="18" fill="#FFFFFF"/>
    <circle cx="150" cy="112" r="18" fill="#FFFFFF"/>
    <circle cx="65" cy="138" r="18" fill="#FFFFFF"/>
    <circle cx="135" cy="138" r="18" fill="#FFFFFF"/>

    <!-- Droopy Ears -->
    <ellipse cx="50" cy="105" rx="14" ry="8" fill="#FBCFE8" transform="rotate(25 50 105)"/>
    <ellipse cx="150" cy="105" rx="14" ry="8" fill="#FBCFE8" transform="rotate(-25 150 105)"/>

    <!-- Face -->
    <ellipse cx="100" cy="115" rx="36" ry="32" fill="#F8FAFC"/>
    <!-- Nose & Smile -->
    <polygon points="96,122 104,122 100,126" fill="#F43F5E"/>
    <path d="M100 126 L100 130 M95 130 Q100 136 105 130" stroke="#1E293B" stroke-width="2" fill="none"/>
  </g>

  {standard_eyes(84, 116, 110, 6)}
  {cheeks(70, 130, 122, 6, '#F43F5E', '0.45')}

  <!-- Wooden Rolling Pin in Paws -->
  <g filter="url(#shRollSheep)">
    <rect x="60" y="156" width="80" height="10" rx="3" fill="#D97706"/>
    <!-- Handles -->
    <rect x="48" y="158" width="14" height="6" rx="2" fill="#92400E"/>
    <rect x="138" y="158" width="14" height="6" rx="2" fill="#92400E"/>
    <!-- Paws -->
    <circle cx="78" cy="162" r="7" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
    <circle cx="122" cy="162" r="7" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
  </g>
  {chef_hat(100, 36, 0.95)}
</svg>'''

files_batch_3 = {
    'chef-dog.svg': create_dog(),
    'chef-koala.svg': create_koala(),
    'chef-frog.svg': create_frog(),
    'chef-kitten.svg': create_kitten(),
    'chef-monkey.svg': create_monkey(),
    'chef-lion.svg': create_lion(),
    'chef-carrot.svg': create_carrot(),
    'chef-rat.svg': create_rat(),
    'chef-squirrel.svg': create_squirrel(),
    'chef-rolling-sheep.svg': create_rolling_sheep()
}

for name, content in files_batch_3.items():
    with open(os.path.join(avatars_dir, name), 'w') as f:
        f.write(content.strip())
print(f"Generated {len(files_batch_3)} avatars batch 3.")
