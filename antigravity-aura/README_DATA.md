# Dataset knowledge extraction (train_data.csv) 🔧

This directory contains utilities to inspect the dataset and convert it into knowledge artifacts suitable for feeding to a retrieval-augmented bot.

Quick steps ✅

1. Inspect dataset and write a summary:

```powershell
python antigravity-aura/data_tools/inspect_dataset.py --csv antigravity-aura/train_data.csv --out antigravity-aura/data_tools/dataset_summary.json
```

2. Convert CSV into a chunked JSONL "knowledge" file (one JSON document per line):

```powershell
python antigravity-aura/data_tools/build_knowledge.py --csv antigravity-aura/train_data.csv --out antigravity-aura/data_tools/knowledge.jsonl
```

3. (Optional) Create embeddings and a vector index using `sentence-transformers` and `faiss` — see the script comments for configuration.

What the tooling produces ✨
- `dataset_summary.json`: basic schema, counts, text length statistics and missing-value info
- `knowledge.jsonl`: one document per chunk with metadata fields (`doc_id`, `post_id`, `subreddit`, `label`, `metadata`)

How to feed to a bot 💡
- Use the JSONL `knowledge.jsonl` as your knowledge source. Each chunk is a self-contained text + metadata you can embed and store in a vector DB (FAISS, Milvus, etc.).
- At query time: embed the user query, retrieve top-k documents from the index, and pass them as context to your LLM or chatbot.

If you'd like, I can: (a) build embeddings and an index locally, (b) add a small example that wires retrieval to a response generator, or (c) produce prompt templates for safety-sensitive behaviors. Tell me which next. ✅
