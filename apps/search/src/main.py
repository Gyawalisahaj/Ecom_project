# apps/search/src/main.py
import os
from typing import Literal
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import meilisearch
from .recommender import HybridRecommender

app = FastAPI(title="BuyIt Search & Recommendation Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEILI_HOST = os.getenv("MEILI_HOST", "http://127.0.0.1:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "your-dev-master-key")
client = meilisearch.Client(MEILI_HOST, MEILI_MASTER_KEY)

# Initialize Hybrid Recommender from apps/search/data/*.json
recommender = HybridRecommender()


class InteractionEvent(BaseModel):
    session_id: str
    product_id: str
    event_type: Literal["view", "cart", "purchase"] = "view"


@app.get("/")
def health_check():
    return {
        "status": "online",
        "indexed_recommendation_products": len(recommender.products),
    }


@app.get("/api/v1/search/products/")
def search_products(
    q: str = Query("", description="The search query"),
    limit: int = Query(20, description="Max results to return"),
    offset: int = Query(0, description="Pagination offset"),
):
    try:
        index = client.index("products")
        results = index.search(q, {"limit": limit, "offset": offset})
        return {
            "query": q,
            "hits": results["hits"],
            "estimatedTotalHits": results.get("estimatedTotalHits", len(results["hits"])),
            "processingTimeMs": results["processingTimeMs"],
        }
    except Exception as e:
        return {"error": "Search failed", "details": str(e)}


@app.get("/api/v1/recommendations/{product_id}/")
def get_recommendations(
    product_id: str,
    limit: int = Query(8, ge=1, le=24, description="Number of recommended products"),
):
    result = recommender.recommend(product_id, limit=limit)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Product '{product_id}' not found in recommendation catalog.",
        )
    return result


@app.post("/api/v1/recommendations/events/")
def track_interaction(event: InteractionEvent):
    recorded = recommender.record_interaction(
        session_id=event.session_id,
        product_id=event.product_id,
        event_type=event.event_type,
    )
    if not recorded:
        raise HTTPException(status_code=404, detail="Unknown product_id")
    return {"status": "recorded"}


@app.post("/api/v1/recommendations/reload/")
def reload_datasets():
    """Reloads JSON files from apps/search/data/ without restarting FastAPI."""
    recommender.load_datasets()
    return {"status": "reloaded", "total_products": len(recommender.products)}