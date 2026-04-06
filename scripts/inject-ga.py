"""Inject the GA4 snippet into dist/index.html at CI build time.

Usage:
    GA_ID=G-XXXXXXXXXX python3 scripts/inject-ga.py
"""
import os
import sys

ga_id = os.environ.get('GA_ID', '').strip()
if not ga_id:
    print('GA_ID not set — skipping GA injection', file=sys.stderr)
    sys.exit(0)

path = 'dist/index.html'
with open(path) as f:
    html = f.read()

if 'googletagmanager' in html:
    print('GA snippet already present — skipping', file=sys.stderr)
    sys.exit(0)

snippet = (
    f'<script async src="https://www.googletagmanager.com/gtag/js?id={ga_id}"></script>\n'
    f'    <script>\n'
    f'      window.dataLayer = window.dataLayer || [];\n'
    f'      function gtag() {{ dataLayer.push(arguments); }}\n'
    f'      gtag("js", new Date());\n'
    f'      gtag("config", "{ga_id}");\n'
    f'    </script>'
)

html = html.replace('</head>', snippet + '\n  </head>', 1)

with open(path, 'w') as f:
    f.write(html)

print(f'Injected GA4 ({ga_id}) into {path}')
