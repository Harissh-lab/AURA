"""Simple retrieval example: query a FAISS index created by `create_embeddings.py`.

Usage:
  python query_index.py --index_dir ./embeddings --query "how to stop anxiety" --model all-MiniLM-L6-v2 --k 5
"""
from pathlib import Path
import argparse
import json

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

try:
    import faiss
except Exception:
    faiss = None

import numpy as np


def load_metadata(md_path: Path):
    meta = []
    with md_path.open("r", encoding="utf-8") as f:
        for line in f:
            meta.append(json.loads(line))
    return meta


def query(index_dir: Path, query_text: str, model_name: str, k: int = 5):
    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers not installed")
    if faiss is None:
        raise RuntimeError("faiss-cpu not installed")

    model = SentenceTransformer(model_name)
    q_emb = model.encode([query_text], convert_to_numpy=True)

    idx = faiss.read_index(str(index_dir / "index.faiss"))
    D, I = idx.search(q_emb, k)

    meta = load_metadata(index_dir / "metadata.jsonl")
    results = []
    for dist, idx in zip(D[0], I[0]):
        if idx < len(meta):
            results.append((dist, meta[idx]))
    return results


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--index_dir", required=True, type=Path)
    p.add_argument("--query", required=True)
    p.add_argument("--model", default="all-MiniLM-L6-v2")
    p.add_argument("--k", type=int, default=5)
    args = p.parse_args()

    res = query(args.index_dir, args.query, args.model, args.k)
    for dist, m in res:
        print(f"score={dist:.4f} doc={m}")


if __name__ == "__main__":
    main()
