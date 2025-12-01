#!/usr/bin/env python3
import re

# Resolve DriverView.jsx conflict
with open('App/frontend/src/components/DriverView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace conflict block
content = re.sub(
    r'<<<<<<< HEAD\nexport default function DriverView\(\{ user, onLogout, isImpersonated = false, originalAdmin = null, onExitImpersonation = null \}\) \{\n=======\nexport default function DriverView\(\{ user, onLogout, isAssumedBySponsor = false, actualSponsor = null \}\) \{\n>>>>>>> 02adef66d2684ca60e7a6176a4926bdd4288dfdc',
    'export default function DriverView({ user, onLogout, isImpersonated = false, originalAdmin = null, onExitImpersonation = null, isAssumedBySponsor = false, actualSponsor = null }) {',
    content,
    flags=re.MULTILINE
)

with open('App/frontend/src/components/DriverView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Resolve SponsorView.jsx conflict
with open('App/frontend/src/components/SponsorView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace conflict block
content = re.sub(
    r'<<<<<<< HEAD\nexport default function SponsorView\(\{ user, onLogout, isImpersonated = false, originalAdmin = null, onExitImpersonation = null \}\) \{\n=======\nexport default function SponsorView\(\{ user, onLogout, onAssumeDriver \}\) \{\n>>>>>>> 02adef66d2684ca60e7a6176a4926bdd4288dfdc',
    'export default function SponsorView({ user, onLogout, isImpersonated = false, originalAdmin = null, onExitImpersonation = null, onAssumeDriver = null }) {',
    content,
    flags=re.MULTILINE
)

with open('App/frontend/src/components/SponsorView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Conflicts resolved successfully!")


