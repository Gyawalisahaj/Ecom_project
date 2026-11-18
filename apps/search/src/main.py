import os

import meilisearch
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BuyIt Search Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

meili_host = os.getenv("MEILI_HOST", "http://127.0.0.1:7700")
meili_master_key = os.getenv("MEILI_MASTER_KEY", "your-dev-master-key")
client = meilisearch.Client(meili_host, meili_master_key)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "Search Engine is online"}


@app.get("/api/v1/search/products/")
def search_products(
    q: str = Query("", description="The search query"),
    limit: int = Query(20, ge=1, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> dict:
    try:
        index = client.index("products")
        results = index.search(
            q,
            {
                "limit": limit,
                "offset": offset,
            },
        )

        return {
            "query": q,
            "hits": results["hits"],
            "estimatedTotalHits": results.get(
                "estimatedTotalHits", len(results["hits"])
            ),
            "processingTimeMs": results.get("processingTimeMs", 0),
        }
    except Exception as e:
        return {
            "query": q,
            "hits": [],
            "estimatedTotalHits": 0,
            "processingTimeMs": 0,
            "error": str(e),
        }
