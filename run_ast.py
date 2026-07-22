import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path
import shutil

code_files = []
detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
for f in detect.get('files', {}).get('code', []):
    code_files.extend(collect_files(Path(f)) if Path(f).is_dir() else [Path(f)])

if code_files:
    result = extract(code_files, cache_root=Path('d:/sampah/arvela'))
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges')

Path('graphify-out/.graphify_semantic.json').write_text(json.dumps({'nodes':[],'edges':[],'hyperedges':[],'input_tokens':0,'output_tokens':0}), encoding='utf-8')
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding='utf-8'))
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(ast, indent=2, ensure_ascii=False), encoding='utf-8')

# Now run build_merge
from graphify.build import build_merge
from graphify.detect import save_manifest

if Path('graphify-out/graph.json').exists():
    shutil.copy('graphify-out/graph.json', 'graphify-out/.graphify_old.json')

new_extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
incremental = json.loads(Path('graphify-out/.graphify_incremental.json').read_text(encoding='utf-8'))
deleted = list(incremental.get('deleted_files', []))
prune = deleted or None

G = build_merge(
    [new_extraction],
    graph_path='graphify-out/graph.json',
    prune_sources=prune,
    root='d:/sampah/arvela',
    directed=False,
)
print(f'[graphify update] Merged: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')

merged_out = {
    'nodes': [{'id': n, **d} for n, d in G.nodes(data=True)],
    'edges': [
        {**{k: val for k, val in d.items() if k not in ('_src', '_tgt', 'source', 'target')},
         'source': d.get('_src', u), 'target': d.get('_tgt', v)}
        for u, v, d in G.edges(data=True)
    ],
    'hyperedges': list(G.graph.get('hyperedges', [])),
    'input_tokens': new_extraction.get('input_tokens', 0),
    'output_tokens': new_extraction.get('output_tokens', 0),
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged_out, ensure_ascii=False), encoding='utf-8')
save_manifest(incremental['files'], root='d:/sampah/arvela')

# Steps 4 to 8: build graph, cluster, analyze, generate outputs
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
detection  = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))

G2 = build_from_json(extraction, root='d:/sampah/arvela', directed=False)
communities = cluster(G2)
cohesion = score_all(G2, communities)
tokens = {'input': 0, 'output': 0}
gods = god_nodes(G2)
surprises = surprising_connections(G2, communities)

# Label community using previous labels if exist
old_labels = {}
if Path('graphify-out/.graphify_labels.json').exists():
    old_labels = json.loads(Path('graphify-out/.graphify_labels.json').read_text(encoding='utf-8'))

labels = {cid: old_labels.get(str(cid), f'Community {cid}') for cid in communities}
questions = suggest_questions(G2, communities, labels)

wrote = to_json(G2, communities, 'graphify-out/graph.json')
report = generate(G2, communities, cohesion, labels, gods, surprises, detection, tokens, 'd:/sampah/arvela', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')

import subprocess
subprocess.run([sys.executable, '-m', 'graphify.cli', 'export', 'html'], cwd='d:/sampah/arvela')
print("Graph update complete!")
