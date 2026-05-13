from loguru import logger
from datetime import datetime, timedelta
from config import (
    NEWSAPI_KEY,
    NEWS_LOOKBACK_DAYS,
    NEWS_MAX_ARTICLES,
    RAG_CHUNK_SIZE,
    RAG_CHUNK_OVERLAP,
    RAG_TOP_K,
    NEWS_CACHE_TTL,
)
import re
from functools import lru_cache
from typing import List, Optional


@lru_cache(maxsize=1)
def get_embeddings_model():
    """Lazy-load the embeddings model. Returns None if unavailable."""
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
    except Exception as e:
        logger.error(f"Embeddings import failed: {e}")
        return None

    try:
        return HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )
    except Exception as e:
        logger.error(f"Failed to initialize embeddings model: {e}")
        return None


@lru_cache(maxsize=32)
def fetch_news_for_symbols(symbols: tuple) -> List[dict]:
    """Fetch relevant financial news articles for portfolio holdings.

    symbols: tuple of symbol strings (used as cache key)
    """
    if not NEWSAPI_KEY:
        logger.warning("NewsAPI key not configured.")
        return []

    try:
        from newsapi import NewsApiClient
        newsapi = NewsApiClient(api_key=NEWSAPI_KEY)
        from_date = (datetime.now() - timedelta(days=NEWS_LOOKBACK_DAYS)).strftime("%Y-%m-%d")

        clean_symbols = [re.sub(r"\.(NS|BO|L)$", "", s) for s in symbols]
        query_terms = clean_symbols[:5]
        query_terms += ["NSE", "BSE", "Indian stock market", "Sensex", "Nifty"]
        query = " OR ".join(query_terms[:8]) if query_terms else "NSE OR BSE OR India"

        articles = newsapi.get_everything(
            q=query,
            language="en",
            from_param=from_date,
            sort_by="relevancy",
            page_size=NEWS_MAX_ARTICLES,
        )
        return articles.get("articles", [])
    except Exception as e:
        logger.error(f"News fetch error: {e}")
        return []


def build_rag_vectorstore(articles: List[dict]):
    """Build a Chroma vector store from news articles. Returns None on failure."""
    if not articles:
        return None

    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_community.vectorstores import Chroma
        from langchain_core.documents import Document
    except Exception as e:
        logger.error(f"RAG libraries not available: {e}")
        return None

    embeddings = get_embeddings_model()
    if embeddings is None:
        return None

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=RAG_CHUNK_SIZE, chunk_overlap=RAG_CHUNK_OVERLAP
    )

    docs = []
    for article in articles:
        content = f"{article.get('title','')}\n{article.get('description','')}\n{article.get('content','')}"
        chunks = splitter.split_text(content)
        for chunk in chunks:
            docs.append(
                Document(
                    page_content=chunk,
                    metadata={
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "url": article.get("url", ""),
                        "published": article.get("publishedAt", ""),
                        "title": article.get("title", ""),
                    },
                )
            )

    try:
        vectorstore = Chroma.from_documents(docs, embeddings)
        logger.info(f"RAG vectorstore built with {len(docs)} chunks")
        return vectorstore
    except Exception as e:
        logger.error(f"Vectorstore build error: {e}")
        return None


def query_rag(vectorstore, query: str) -> str:
    """Query the RAG vectorstore and return relevant context."""
    if not vectorstore:
        return ""

    try:
        results = vectorstore.similarity_search(query, k=RAG_TOP_K)
        parts = []
        for doc in results:
            parts.append(f"[{doc.metadata.get('source','Unknown')} - {doc.metadata.get('published','')[:10]}]\n{doc.page_content}")
        return "\n\n".join(parts)
    except Exception as e:
        logger.error(f"RAG query error: {e}")
        return ""


def get_top_articles() -> List[dict]:
    return fetch_news_for_symbols(tuple([]))


def search_news(query: str) -> List[str]:
    articles = get_top_articles()
    vs = build_rag_vectorstore(articles)
    if vs:
        try:
            res = vs.similarity_search(query, k=RAG_TOP_K)
            return [doc.page_content for doc in res]
        except Exception as e:
            logger.error(f"RAG query error: {e}")
    return []