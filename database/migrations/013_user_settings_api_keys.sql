-- WealthOS Migration 013: Add user settings API key columns
-- Description: Adds columns to public.profiles to store user-specific API keys for AlphaVantage and Gemini

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS alphavantage_api_key TEXT,
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
