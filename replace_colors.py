import os
import re

mapping = {
    "#0a201f": "var(--color-bg)",
    "#102321": "var(--color-surface)",
    "#172923": "var(--color-card)",
    "#1e3530": "var(--color-overlay)",
    "#2d3c37": "var(--color-border)",
    "#ece0cc": "var(--color-text)",
    "#aca492": "var(--color-text-muted)",
    "#7b7c70": "var(--color-text-faint)",
    "#c8b38e": "var(--color-gold)",
    "#869fc4": "var(--color-blue)",
    "#6fae8d": "var(--color-gain)",
    "#b66a6a": "var(--color-loss)",
    "#d2a76d": "var(--color-warn)",
    # Other potential variants seen in grep output
    "#86efac": "var(--color-gain)",  # Mapping tailwind green to standard gain
    "#fda4af": "var(--color-loss)",  # Mapping tailwind red to standard loss
}

def replace_colors(directory):
    count = 0
    pattern = re.compile("|".join(re.escape(k) for k in mapping.keys()), re.IGNORECASE)
    
    def replacer(match):
        return mapping[match.group(0).lower()]
        
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith((".css", ".jsx", ".js")):
                path = os.path.join(root, file)
                
                # skip index.css root variables definition block? 
                # Wait, if we replace in index.css, --color-bg: var(--color-bg) will happen!
                # We need to skip index.css or just fix it afterwards.
                
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = pattern.sub(replacer, content)
                
                if new_content != content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    count += 1
    print(f"Updated {count} files.")

if __name__ == "__main__":
    replace_colors("D:/wealthOS/WealthOS/frontend/src")
