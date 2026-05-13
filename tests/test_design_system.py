import unittest
from unittest.mock import patch, call

from frontend.design_system import (
    load_global_styles,
    render_topbar,
    render_hero,
    panel_start,
    panel_end,
)


class TestDesignSystem(unittest.TestCase):
    @patch("frontend.design_system.st")
    def test_load_global_styles(self, mock_st):
        load_global_styles()

        mock_st.set_page_config.assert_called_once_with(
            page_title="WealthOS",
            page_icon="◈",
            layout="wide",
            initial_sidebar_state="expanded",
        )
        mock_st.markdown.assert_called_once()
        args, kwargs = mock_st.markdown.call_args
        self.assertIn("<style>", args[0])
        self.assertTrue(kwargs.get("unsafe_allow_html"))

    @patch("frontend.design_system.st")
    def test_render_topbar_default(self, mock_st):
        render_topbar("Dashboard")
        
        mock_st.markdown.assert_called_once()
        args, kwargs = mock_st.markdown.call_args
        self.assertIn("Dashboard", args[0])
        self.assertIn("Live portfolio intelligence", args[0])
        self.assertTrue(kwargs.get("unsafe_allow_html"))

    @patch("frontend.design_system.st")
    def test_render_topbar_custom_note(self, mock_st):
        render_topbar("Dashboard", "Testing Note")
        
        mock_st.markdown.assert_called_once()
        args, kwargs = mock_st.markdown.call_args
        self.assertIn("Testing Note", args[0])

    @patch("frontend.design_system.st")
    def test_render_hero(self, mock_st):
        render_hero("Welcome", "This is a test hero.", "<button>Click Me</button>")
        
        mock_st.markdown.assert_called_once()
        args, kwargs = mock_st.markdown.call_args
        self.assertIn("Welcome", args[0])
        self.assertIn("This is a test hero.", args[0])
        self.assertIn("<button>Click Me</button>", args[0])
        self.assertTrue(kwargs.get("unsafe_allow_html"))

    @patch("frontend.design_system.st")
    def test_panel_start(self, mock_st):
        panel_start("Panel Title", "Panel Subtitle", "Meta Data")
        
        mock_st.markdown.assert_called_once()
        args, kwargs = mock_st.markdown.call_args
        self.assertIn("Panel Title", args[0])
        self.assertIn("Panel Subtitle", args[0])
        self.assertIn("Meta Data", args[0])
        self.assertTrue(kwargs.get("unsafe_allow_html"))

    @patch("frontend.design_system.st")
    def test_panel_start_minimal(self, mock_st):
        panel_start("Just Title")
        
        mock_st.markdown.assert_called_once()
        args, kwargs = mock_st.markdown.call_args
        self.assertIn("Just Title", args[0])
        self.assertNotIn("wo-panel-subtitle", args[0])
        self.assertNotIn("wo-mono", args[0])

    @patch("frontend.design_system.st")
    def test_panel_end(self, mock_st):
        panel_end()
        
        mock_st.markdown.assert_called_once_with(
            "</section>", unsafe_allow_html=True
        )

if __name__ == "__main__":
    unittest.main()
