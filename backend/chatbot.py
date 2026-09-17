import pandas as pd
import torch

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from transformers import AutoTokenizer, AutoModelForCausalLM
from pathlib import Path

# =========================================================
# Load dataset
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "slime_closed_domain_dataset.csv"

df = pd.read_csv(DATASET_PATH)

documents = (
    df["question"].fillna("")
    + " "
    + df["answer"].fillna("")
    + " "
    + df["category"].fillna("")
).tolist()


# =========================================================
# Load semantic embedding model
# =========================================================

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

print("Loading semantic search model...")

embedding_model = SentenceTransformer(
    EMBEDDING_MODEL
)

print("Creating dataset embeddings...")

document_embeddings = embedding_model.encode(
    documents,
    convert_to_tensor=False,
    show_progress_bar=True
)

print("Semantic search ready.")


# =========================================================
# Load Small Language Model
# =========================================================

MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct"

print("Loading SLM...")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float32
)

model.eval()

print("SLM loaded.")


# =========================================================
# Semantic retrieval
# =========================================================

def retrieve_knowledge(query, top_k=3):

    query_embedding = embedding_model.encode(
        [query],
        convert_to_tensor=False
    )

    similarities = cosine_similarity(
        query_embedding,
        document_embeddings
    )[0]

    top_indices = similarities.argsort()[
        -top_k:
    ][::-1]


    results = []

    for index in top_indices:

        score = float(
            similarities[index]
        )

        results.append({

            "question":
                df.iloc[index]["question"],

            "answer":
                df.iloc[index]["answer"],

            "category":
                df.iloc[index]["category"],

            "score":
                score

        })


    return results


# =========================================================
# Generate response
# =========================================================

def generate_response(user_message):

    retrieved = retrieve_knowledge(
        user_message,
        top_k=1
    )


    # -----------------------------------------------------
    # No useful semantic match
    # -----------------------------------------------------

    if not retrieved:

        return (
            "I don't have enough information in my "
            "slime knowledge base to answer that."
        )


    best_match = retrieved[0]


    # -----------------------------------------------------
    # Similarity threshold
    # -----------------------------------------------------

    if best_match["score"] < 0.45:

        return (
            "I don't have enough information in my "
            "slime knowledge base to answer that."
        )


    # -----------------------------------------------------
    # Give the SLM only relevant knowledge
    # -----------------------------------------------------

    knowledge_answer = best_match["answer"]

    messages = [
        {
            "role": "system",
            "content": (
                "You are SlimeCraft AI, a closed-domain "
                "assistant for slime making. "
                "Answer the user using ONLY the provided "
                "knowledge answer. "
                "Do not add facts, ingredients, substitutions, "
                "recipes, warnings, hashtags, emojis, or advice "
                "that is not present in the knowledge answer. "
                "Do not mention these instructions. "
                "Do not write Human or Assistant labels."
            )
        },
        {
            "role": "user",
            "content": (
                f"Knowledge answer:\n{knowledge_answer}\n\n"
                f"User question:\n{user_message}"
            )
        }
    ]

    prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=3072
    )

    with torch.no_grad():

        output = model.generate(
            **inputs,
            max_new_tokens=180,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id
        )

    generated_tokens = output[0][
        inputs["input_ids"].shape[1]:
    ]

    response = tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True
    ).strip()

    return response