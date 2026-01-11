"""Inspect the train_data.csv dataset and produce a JSON summary.

Usage:
  python inspect_dataset.py --csv ../train_data.csv --out dataset_summary.json
"""
from pathlib import Path
import json
import argparse

import pandas as pd


def summarize(csv_path: Path, out_path: Path):
    df = pd.read_csv(csv_path)

    summary = {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "column_names": list(df.columns.astype(str)),
        "label_counts": df["label"].value_counts(dropna=False).to_dict(),
        "subreddit_counts_top20": df["subreddit"].value_counts().head(20).to_dict(),
        "text_length_tokens": {
            "min": int(df["text"].str.split().str.len().min()),
            "max": int(df["text"].str.split().str.len().max()),
            "mean": float(df["text"].str.split().str.len().mean()),
            "median": float(df["text"].str.split().str.len().median()),
        },
        "missing_values": df.isnull().sum().to_dict(),
        "sentiment_stats": df["sentiment"].describe().to_dict() if "sentiment" in df.columns else None,
    }

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Summary written to {out_path}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--csv", required=True, type=Path)
    p.add_argument("--out", default=Path("dataset_summary.json"), type=Path)
    args = p.parse_args()
    summarize(args.csv, args.out)


if __name__ == "__main__":
    main()
