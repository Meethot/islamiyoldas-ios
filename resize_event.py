from PIL import Image

src = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/event_banner_small_text_1777889470903.png"
out_dir = "/Users/mithatacargur/Desktop/AppStore_Event_Images"

img = Image.open(src).convert("RGB")
w, h = img.size

# Apple In-App Event sizes:
# Event Card (landscape): 1920 x 1080
# Event Detail (portrait): 1080 x 1920

def crop_and_resize(img, target_w, target_h, name):
    target_ratio = target_w / target_h
    src_ratio = img.width / img.height
    
    if src_ratio > target_ratio:
        # Source is wider - crop sides
        new_w = int(img.height * target_ratio)
        left = (img.width - new_w) // 2
        cropped = img.crop((left, 0, left + new_w, img.height))
    else:
        # Source is taller - crop top/bottom
        new_h = int(img.width / target_ratio)
        top = (img.height - new_h) // 2
        cropped = img.crop((0, top, img.width, top + new_h))
    
    resized = cropped.resize((target_w, target_h), Image.LANCZOS)
    path = f"{out_dir}/{name}.png"
    resized.save(path, "PNG", quality=100)
    print(f"Saved: {path} ({target_w}x{target_h})")

# Landscape (event card)
crop_and_resize(img, 1920, 1080, "event_card_1920x1080")

# Portrait (event detail) - for this we need to regenerate or pad
# Since source is square, we'll add matching background for portrait
from PIL import ImageFilter

# Create portrait canvas with matching marble-like background
portrait = Image.new("RGB", (1080, 1920), (230, 230, 235))

# Scale image to fit width
scale = 1080 / img.width
new_h = int(img.height * scale)
scaled = img.resize((1080, new_h), Image.LANCZOS)

# Sample top and bottom colors for seamless blend
top_strip = img.crop((0, 0, img.width, 20)).resize((1, 1), Image.LANCZOS)
top_color = top_strip.getpixel((0, 0))
bot_strip = img.crop((0, img.height - 20, img.width, img.height)).resize((1, 1), Image.LANCZOS)
bot_color = bot_strip.getpixel((0, 0))

# Fill canvas with gradient from top_color to bot_color
for y in range(1920):
    r = int(top_color[0] + (bot_color[0] - top_color[0]) * y / 1920)
    g = int(top_color[1] + (bot_color[1] - top_color[1]) * y / 1920)
    b = int(top_color[2] + (bot_color[2] - top_color[2]) * y / 1920)
    for x in range(1080):
        portrait.putpixel((x, y), (r, g, b))

# Paste centered vertically
y_offset = (1920 - new_h) // 2
portrait.paste(scaled, (0, y_offset))

# Smooth blend edges
portrait.save(f"{out_dir}/event_detail_1080x1920.png", "PNG", quality=100)
print(f"Saved: {out_dir}/event_detail_1080x1920.png (1080x1920)")

print("\nDone! Files are on your Desktop in 'AppStore_Event_Images' folder.")
