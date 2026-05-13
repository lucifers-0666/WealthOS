import streamlit as st

def load_global_styles():
    """Inject WealthOS global CSS into the Streamlit app."""
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
        background-color: #0B1728;
        color: #F3F4F6;
    }

    .stApp {
        background: linear-gradient(135deg, #0B1728 0%, #0f1f38 100%);
    }

    /* Sidebar */
    section[data-testid="stSidebar"] {
        background: #0d1b2e;
        border-right: 1px solid rgba(148,163,184,0.1);
    }

    /* Cards */
    .stMetric {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 12px;
        padding: 1rem;
    }

    /* Buttons */
    .stButton > button {
        background: linear-gradient(180deg, rgba(125,211,252,0.15), rgba(125,211,252,0.05));
        border: 1px solid rgba(125,211,252,0.25);
        color: #F3F4F6;
        border-radius: 10px;
        font-weight: 600;
    }

    .stButton > button:hover {
        background: linear-gradient(180deg, rgba(125,211,252,0.25), rgba(125,211,252,0.10));
        border-color: rgba(125,211,252,0.45);
    }

    /* Hide default Streamlit header/footer */
    header[data-testid="stHeader"] { display: none; }
    footer { display: none; }
    </style>
    """, unsafe_allow_html=True)