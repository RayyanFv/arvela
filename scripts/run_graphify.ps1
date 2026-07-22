# scripts/run_graphify.ps1
# Automates the graphify pipeline for the Arvela project.

$ErrorActionPreference = "Stop"

# Ensure output and public directories exist
New-Item -ItemType Directory -Force -Path graphify-out | Out-Null
New-Item -ItemType Directory -Force -Path public | Out-Null

$PYTHON = "d:\sampah\arvela\.venv\Scripts\python.exe"
$GRAPHIFY = "d:\sampah\arvela\.venv\Scripts\graphify.exe"

# Save interpreter and scan root paths
$PYTHON | Out-File -FilePath graphify-out\.graphify_python -Encoding utf8 -NoNewline
(Resolve-Path .).Path | Out-File -FilePath graphify-out\.graphify_root -Encoding utf8 -NoNewline

Write-Host "Step 1: Running File Detection..."
& $PYTHON -c "
import json
from graphify.detect import detect
from pathlib import Path
result = detect(Path('.'))
Path('graphify-out/.graphify_detect.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
"

# Parse and display detect summary
& $PYTHON -c "
import json
from pathlib import Path
d = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
files = d.get('files', {})
print(f'Corpus detected: {d.get(\"total_files\", 0)} files (~{d.get(\"total_words\", 0):,} words)')
for cat, paths in files.items():
    if paths:
        print(f'  - {cat}: {len(paths)} files')
"

Write-Host "Step 2: Extracting AST (code structure)..."
& $PYTHON -c "
import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path

code_files = []
detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
for f in detect.get('files', {}).get('code', []):
    code_files.extend(collect_files(Path(f)) if Path(f).is_dir() else [Path(f)])

if code_files:
    result = extract(code_files, cache_root=Path('.'))
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'  AST Extraction: {len(result[\"nodes\"])} nodes, {len(result[\"edges\"])} edges')
else:
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}), encoding='utf-8')
    print('  No code files found.')
"

Write-Host "Step 3: Checking for API keys for semantic extraction..."
# Write default empty semantic file first
& $PYTHON -c "
import json
from pathlib import Path
Path('graphify-out/.graphify_semantic.json').write_text(json.dumps({'nodes':[],'edges':[],'hyperedges':[],'input_tokens':0,'output_tokens':0}), encoding='utf-8')
"

# Check if Gemini key is set for doc indexing
if ($env:GEMINI_API_KEY -or $env:GOOGLE_API_KEY) {
    Write-Host "  Gemini API key found! Running semantic extraction on docs/papers..."
} else {
    Write-Host "  No Gemini/Google API key found. Skipping semantic extraction for docs."
}

Write-Host "Step 4: Merging AST and Semantic extraction..."
& $PYTHON -c "
import sys, json
from pathlib import Path

ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding='utf-8'))
sem = json.loads(Path('graphify-out/.graphify_semantic.json').read_text(encoding='utf-8'))

seen = {n['id'] for n in ast['nodes']}
merged_nodes = list(ast['nodes'])
for n in sem['nodes']:
    if n['id'] not in seen:
        merged_nodes.append(n)
        seen.add(n['id'])

merged_edges = ast['edges'] + sem['edges']
merged_hyperedges = sem.get('hyperedges', [])
merged = {
    'nodes': merged_nodes,
    'edges': merged_edges,
    'hyperedges': merged_hyperedges,
    'input_tokens': sem.get('input_tokens', 0),
    'output_tokens': sem.get('output_tokens', 0),
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'  Merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges')
"

Write-Host "Step 5: Building Graph and Clustering..."
& $PYTHON -c "
import sys, json
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from pathlib import Path

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
detection  = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))

G = build_from_json(extraction, root='.', directed=False)
if G.number_of_nodes() == 0:
    print('  ERROR: Graph is empty.')
    sys.exit(1)

communities = cluster(G)
cohesion = score_all(G, communities)
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}
gods = god_nodes(G)
surprises = surprising_connections(G, communities)

labels = {cid: 'Community ' + str(cid) for cid in communities}
questions = suggest_questions(G, communities, labels)

wrote = to_json(G, communities, 'graphify-out/graph.json')
if not wrote:
    print('  ERROR: Refused to shrink graphify-out/graph.json')
    sys.exit(1)

report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, '.', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')

analysis = {
    'communities': {str(k): v for k, v in communities.items()},
    'cohesion': {str(k): v for k, v in cohesion.items()},
    'gods': gods,
    'surprises': surprises,
    'questions': questions,
}
Path('graphify-out/.graphify_analysis.json').write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'  Graph Built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities')
"

Write-Host "Step 6: Auto-Labeling Communities..."
& $PYTHON -c "
import json
from pathlib import Path
from collections import Counter

analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text(encoding='utf-8'))
communities = analysis.get('communities', {})

labels = {}
for cid, nodes in communities.items():
    folders = []
    for node in nodes:
        path_part = node.split(':')[0] if ':' in node else node
        parts = path_part.replace('\\\\', '/').split('/')
        if len(parts) > 1:
            if parts[0] in ['src', 'scripts', 'supabase']:
                folders.append('/'.join(parts[:2]))
            else:
                folders.append(parts[0])
    
    if folders:
        top_folder = Counter(folders).most_common(1)[0][0]
        if 'src/app' in top_folder:
            label = f'Next.js Pages & Routes (C{cid})'
        elif 'src/components' in top_folder:
            label = f'UI Components (C{cid})'
        elif 'src/hooks' in top_folder:
            label = f'React Hooks (C{cid})'
        elif 'src/lib' in top_folder:
            label = f'Utilities & Helpers (C{cid})'
        elif 'scripts' in top_folder:
            label = f'Database & Seed Scripts (C{cid})'
        elif 'supabase' in top_folder:
            label = f'Supabase Configuration (C{cid})'
        else:
            label = f'{top_folder} Code (C{cid})'
    else:
        label = f'Code Logic (C{cid})'
        
    labels[int(cid)] = label

Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding='utf-8')

from graphify.build import build_from_json
from graphify.report import generate
from graphify.analyze import suggest_questions

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
detection  = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
G = build_from_json(extraction, root='.', directed=False)
cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}
questions = suggest_questions(G, {int(k): v for k, v in communities.items()}, labels)

report = generate(G, {int(k): v for k, v in communities.items()}, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, '.', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
print('  Successfully auto-labeled communities!')
"

Write-Host "Step 7: Generating Interactive HTML Visualization..."
& $GRAPHIFY export html

Write-Host "Step 8: Copying Visualizer to public/trace.html..."
Copy-Item -Path "graphify-out/graph.html" -Destination "public/trace.html" -Force

Write-Host "Step 9: Saving manifest and cleanup..."
& $PYTHON -c "
import json
from pathlib import Path
from graphify.detect import save_manifest
detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
save_manifest(detect['files'], root='.')
"

Remove-Item -Path graphify-out/.graphify_detect.json -ErrorAction SilentlyContinue
Remove-Item -Path graphify-out/.graphify_extract.json -ErrorAction SilentlyContinue
Remove-Item -Path graphify-out/.graphify_ast.json -ErrorAction SilentlyContinue
Remove-Item -Path graphify-out/.graphify_semantic.json -ErrorAction SilentlyContinue
Remove-Item -Path graphify-out/.graphify_analysis.json -ErrorAction SilentlyContinue

Write-Host "`nTrace graph generated successfully!"
Write-Host "  - Interactive trace available at: public/trace.html"
Write-Host "  - Read report at: graphify-out/GRAPH_REPORT.md"
Write-Host "  - Raw JSON data at: graphify-out/graph.json"
