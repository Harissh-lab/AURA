"""Create embeddings from `knowledge.jsonl` and build a FAISS index.

Requirements (optional): sentence-transformers, faiss-cpu, numpy

Usage:
  python create_embeddings.py --knowledge knowledge.jsonl --model all-MiniLM-L6-v2 --index_out ./embeddings
"""
from pathlib import Path
import argparse
import json

try:
    from sentence_transformers import SentenceTransformer
except Exception as e:
    SentenceTransformer = None

try:
    import faiss
except Exception:
    faiss = None

import numpy as np


def load_knowledge(kl_path: Path):
    docs = []
    with kl_path.open("r", encoding="utf-8") as f:
        for line in f:
            docs.append(json.loads(line))
    return docs


def create_index(docs, model_name: str, out_dir: Path):
    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers not installed. Install it to create embeddings.")
    if faiss is None:
        raise RuntimeError("faiss-cpu not installed. Install it to build an index.")

    model = SentenceTransformer(model_name)
    texts = [d["text"] for d in docs]
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    out_dir.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(out_dir / "index.faiss"))
    # save metadata
    with (out_dir / "metadata.jsonl").open("w", encoding="utf-8") as f:
        for d in docs:
            f.write(json.dumps({"doc_id": d["doc_id"], "post_id": d.get("post_id"), "subreddit": d.get("subreddit"), "label": d.get("label")}) + "\n")

    # also save embeddings matrix for potential re-use
    np.save(out_dir / "embeddings.npy", embeddings)
    print(f"Wrote FAISS index and metadata to {out_dir}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--knowledge", required=True, type=Path)
    p.add_argument("--model", default="all-MiniLM-L6-v2")
    p.add_argument("--index_out", default=Path("./embeddings"), type=Path)
    args = p.parse_args()

    docs = load_knowledge(args.knowledge)
    create_index(docs, args.model, args.index_out)


if __name__ == "__main__":
    main()
