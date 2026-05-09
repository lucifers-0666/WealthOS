import streamlit as st
from newsapi import NewsApiClient
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.docstore.document import Document
from loguru import logger
from datetime import datetime, timedelta
from config import NEWSAPI_KEY, NEWS_LOOKBACK_DAYS, NEWS_MAX_ARTICLES, RAG_CHUNK_SIZE, RAG_CHUNK_OVERLAP, RAG_TOP_K, NEWS_CACHE_TTL
import re


@st.cache_resource
def get_embeddings_model():
    """Load HuggingFace embeddings model (free, runs locally)."""
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )


@st.cache_data(ttl=NEWS_CACHE_TTL)
def fetch_news_for_symbols(symbols: list) -> list:
    """
    Fetch relevant financial news articles for portfolio holdings.
    Returns list of article dicts.
    """
    if not NEWSAPI_KEY:
        logger.warning("NewsAPI key not configured.")
        return []

    try:
        newsapi = NewsApiClient(api_key=NEWSAPI_KEY)
        from_date = (datetime.now() - timedelta(days=NEWS_LOOKBACK_DAYS)).strftime('%Y-%m-%d')

        # Clean symbols for search (remove exchange suffix)
        clean_symbols = [re.sub(r'\.(NS|BO|L)$', '', s) for s in symbols]
        # Add Indian market keywords
        query_terms = clean_symbols[:5]  # top 5 holdings
        query_terms += ['NSE', 'BSE', 'Indian stock market', 'Sensex', 'Nifty']
        query = ' OR '.join(query_terms[:8])

        articles = newsapi.get_everything(
            q=query,
            language='en',
            from_param=from_date,
            sort_by='relevancy',
            page_size=NEWS_MAX_ARTICLES
        )
        return articles.get('articles', [])
    except Exception as e:
        logger.error(f"News fetch error: {e}")
        return []


def build_rag_vectorstore(articles: list):
    """Build a Chroma vector store from news articles."""
    if not articles:
        return None

    embeddings = get_embeddings_model()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=RAG_CHUNK_SIZE,
        chunk_overlap=RAG_CHUNK_OVERLAP
    )

    docs = []
    for article in articles:
        content = f"{article.get('title', '')}\n{article.get('description', '')}\n{article.get('content', '')}"
        chunks = splitter.split_text(content)
        for chunk in chunks:
            docs.append(Document(
                page_content=chunk,
                metadata={
                    'source': article.get('source', {}).get('name', 'Unknown'),
                    'url': article.get('url', ''),
                    'published': article.get('publishedAt', ''),
                    'title': article.get('title', '')
                }
            ))

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
        context_parts = []
        for doc in results:
            context_parts.append(
                f"[{doc.metadata.get('source', 'Unknown')} - {doc.metadata.get('published', '')[:10]}]\n"
                f"{doc.page_content}"
            )
        return "\n\n".join(context_parts)
    except Exception as e:
        logger.error(f"RAG query error: {e}")
        return ""
