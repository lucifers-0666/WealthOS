import pandas as pd

DEFAULT_TARGET = {
    "Equity": 60.0,
    "ETF": 20.0,
    "Gold ETF": 10.0,
    "Debt": 5.0,
    "Cash": 5.0,
}


def compare_allocation(enriched: pd.DataFrame, target: dict = None) -> pd.DataFrame:
    """
    Compare actual allocation vs target allocation.
    Returns DataFrame with columns: asset_class, actual_pct, target_pct, deviation, status
    """
    if target is None:
        target = DEFAULT_TARGET

    if enriched is None or enriched.empty:
        rows = []
        for ac, tgt in target.items():
            rows.append({"asset_class": ac, "actual_pct": 0.0, "target_pct": tgt,
                         "deviation": -tgt, "status": "Underweight"})
        return pd.DataFrame(rows)

    total_val = enriched["current_value"].sum()
    actual = (
        enriched.groupby("asset_class")["current_value"]
        .sum()
        .reset_index()
    )
    actual["actual_pct"] = (actual["current_value"] / total_val * 100).round(1)

    rows = []
    all_classes = set(target.keys()) | set(actual["asset_class"].tolist())
    for ac in all_classes:
        act_row = actual[actual["asset_class"] == ac]
        act_pct = float(act_row["actual_pct"].iloc[0]) if not act_row.empty else 0.0
        tgt_pct = target.get(ac, 0.0)
        dev = round(act_pct - tgt_pct, 1)
        if dev > 3:
            status = "Overweight"
        elif dev < -3:
            status = "Underweight"
        else:
            status = "On Target"
        rows.append({
            "asset_class": ac,
            "actual_pct": act_pct,
            "target_pct": tgt_pct,
            "deviation": dev,
            "status": status,
        })

    return pd.DataFrame(rows).sort_values("target_pct", ascending=False)
