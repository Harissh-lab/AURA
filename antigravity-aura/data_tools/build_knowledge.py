"""Build knowledge artifacts from the dataset CSV.

Produces a JSONL file where each line is a document chunk with metadata.

Usage:
  python build_knowledge.py --csv ../train_data.csv --out knowledge.jsonl

Optional embedding (requires sentence-transformers and faiss):
  python build_knowledge.py --csv ../train_data.csv --out knowledge.jsonl --embed --model all-MiniLM-L6-v2 --index_out ./embeddings
"""
from pathlib import Path
import argparse
import json
import re
from typing import List

import pandas as pd


def chunk_text(text: str, chunk_size: int = 800, min_chunk: int = 200) -> List[str]:
    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    # naive sentence split
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    cur = []
    cur_len = 0
    for s in sentences:
        slen = len(s)
        if cur_len + slen <= chunk_size or not cur:
            cur.append(s)
            cur_len += slen + 1
        else:
            chunk = " ".join(cur).strip()
            if len(chunk) < min_chunk and chunks:
                # prepend to previous if too small
                chunks[-1] = chunks[-1] + " " + chunk
            else:
                chunks.append(chunk)
            cur = [s]
            cur_len = slen + 1

    if cur:
        last = " ".join(cur).strip()
        if len(last) < min_chunk and chunks:
            chunks[-1] = chunks[-1] + " " + last
        else:
            chunks.append(last)

    return chunks


def build_jsonl(csv_path: Path, out_path: Path, chunk_size: int = 800):
    df = pd.read_csv(csv_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", encoding="utf-8") as out_f:
        for idx, row in df.iterrows():
            text = str(row.get("text", ""))
            chunks = chunk_text(text, chunk_size=chunk_size)
            for i, ch in enumerate(chunks):
                doc = {
                    "doc_id": f"{row.get('post_id')}_{row.get('id')}_{i}",
                    "post_id": row.get("post_id"),
                    "subreddit": row.get("subreddit"),
                    "label": int(row.get("label")) if pd.notnull(row.get("label")) else None,
                    "chunk_index": i,
                    "text": ch,
                    "metadata": {k: v for k, v in row.items() if k != "text"},
                }
                out_f.write(json.dumps(doc) + "\n")

    print(f"Wrote knowledge JSONL to {out_path}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--csv", required=True, type=Path)
    p.add_argument("--out", default=Path("knowledge.jsonl"), type=Path)
    p.add_argument("--chunk_size", type=int, default=800)
    args = p.parse_args()
    build_jsonl(args.csv, args.out, chunk_size=args.chunk_size)


if __name__ == "__main__":
    main()
