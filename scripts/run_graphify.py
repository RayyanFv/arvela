# scripts/run_graphify.py
# Automates the graphify pipeline for the Arvela project using pure Python.

import os
import sys
import json
import shutil
from pathlib import Path
from collections import Counter

def main():
    print("Step 1: Initializing folders and paths...")
    os.makedirs("graphify-out", exist_ok=True)
    os.makedirs("public", exist_ok=True)

    python_path = sys.executable
    scan_root = str(Path(".").resolve())

    Path("graphify-out/.graphify_python").write_text(python_path, encoding="utf-8")
    Path("graphify-out/.graphify_root").write_text(scan_root, encoding="utf-8")

    print("Step 2: Running File Detection...")
    from graphify.detect import detect
    detect_res = detect(Path("."))
    Path("graphify-out/.graphify_detect.json").write_text(json.dumps(detect_res, ensure_ascii=False), encoding="utf-8")

    total_files = detect_res.get("total_files", 0)
    total_words = detect_res.get("total_words", 0)
    print(f"  Corpus detected: {total_files} files (~{total_words:,} words)")
    for cat, paths in detect_res.get("files", {}).items():
        if paths:
            print(f"  - {cat}: {len(paths)} files")

    print("Step 3: Extracting AST (code structure)...")
    from graphify.extract import collect_files, extract
    code_files = []
    for f in detect_res.get("files", {}).get("code", []):
        code_files.extend(collect_files(Path(f)) if Path(f).is_dir() else [Path(f)])

    if code_files:
        ast_result = extract(code_files, cache_root=Path("."))
        Path("graphify-out/.graphify_ast.json").write_text(json.dumps(ast_result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  AST Extraction: {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges")
    else:
        ast_result = {'nodes': [], 'edges': [], 'input_tokens': 0, 'output_tokens': 0}
        Path("graphify-out/.graphify_ast.json").write_text(json.dumps(ast_result), encoding="utf-8")
        print("  No code files found.")

    print("Step 4: Setting up empty semantic extraction...")
    sem_result = {'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
    Path("graphify-out/.graphify_semantic.json").write_text(json.dumps(sem_result), encoding="utf-8")

    print("Step 5: Merging AST and Semantic extraction...")
    seen = {n['id'] for n in ast_result['nodes']}
    merged_nodes = list(ast_result['nodes'])
    for n in sem_result['nodes']:
        if n['id'] not in seen:
            merged_nodes.append(n)
            seen.add(n['id'])

    merged = {
        'nodes': merged_nodes,
        'edges': ast_result['edges'] + sem_result['edges'],
        'hyperedges': sem_result.get('hyperedges', []),
        'input_tokens': sem_result.get('input_tokens', 0),
        'output_tokens': sem_result.get('output_tokens', 0),
    }
    Path("graphify-out/.graphify_extract.json").write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  Merged: {len(merged_nodes)} nodes, {len(merged['edges'])} edges")

    print("Step 6: Building Graph and Clustering...")
    from graphify.build import build_from_json
    from graphify.cluster import cluster, score_all
    from graphify.analyze import god_nodes, surprising_connections, suggest_questions
    from graphify.report import generate
    from graphify.export import to_json, to_html

    G = build_from_json(merged, root=".", directed=False)
    if G.number_of_nodes() == 0:
        print("  ERROR: Graph is empty.")
        sys.exit(1)

    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {'input': 0, 'output': 0}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)

    # Initial report with placeholders
    labels = {cid: 'Community ' + str(cid) for cid in communities}
    questions = suggest_questions(G, communities, labels)

    wrote = to_json(G, communities, 'graphify-out/graph.json')
    if not wrote:
        print("  ERROR: Refused to shrink graphify-out/graph.json")
        sys.exit(1)

    print(f"  Graph Built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")

    print("Step 7: Auto-Labeling Communities...")
    auto_labels = {}
    for cid, nodes in communities.items():
        folders = []
        for node in nodes:
            path_part = node.split(':')[0] if ':' in node else node
            parts = path_part.replace('\\', '/').split('/')
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
            
        auto_labels[cid] = label

    Path("graphify-out/.graphify_labels.json").write_text(json.dumps({str(k): v for k, v in auto_labels.items()}, ensure_ascii=False), encoding="utf-8")
    
    # Regenerate questions and report with real community labels
    questions = suggest_questions(G, communities, auto_labels)
    report = generate(G, communities, cohesion, auto_labels, gods, surprises, detect_res, tokens, '.', suggested_questions=questions)
    Path("graphify-out/GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    print("  Successfully auto-labeled communities!")

    print("Step 8: Generating Interactive HTML Visualization...")
    to_html(G, communities, "graphify-out/graph.html", community_labels=auto_labels)

    print("Step 9: Copying Visualizer to public/trace.html...")
    shutil.copy("graphify-out/graph.html", "public/trace.html")

    print("Step 10: Saving manifest and cleanup...")
    from graphify.detect import save_manifest
    save_manifest(detect_res['files'], root='.')

    # Clean up temp files
    temp_files = [
        "graphify-out/.graphify_detect.json",
        "graphify-out/.graphify_extract.json",
        "graphify-out/.graphify_ast.json",
        "graphify-out/.graphify_semantic.json",
        "graphify-out/.graphify_analysis.json"
    ]
    for p in temp_files:
        try:
            os.remove(p)
        except OSError:
            pass

    print("\nTrace graph generated successfully!")
    print("  - Interactive trace available at: public/trace.html")
    print("  - Read report at: graphify-out/GRAPH_REPORT.md")
    print("  - Raw JSON data at: graphify-out/graph.json")

if __name__ == "__main__":
    main()
