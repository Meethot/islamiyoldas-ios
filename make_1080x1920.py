from PIL import Image

src = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/event_banner_small_text_1777889470903.png"
out_dir = "/Users/mithatacargur/Desktop/AppStore_Event_Images"

img = Image.open(src).convert("RGB")
portrait = Image.new("RGB", (1080, 1920), (230, 230, 235))

# Scale image to fit width
scale = 1080 / img.width
new_h = int(img.height * scale)
scaled = img.resize((1080, new_h), Image.LANCZOS)

top_strip = img.crop((0, 0, img.width, 20)).resize((1, 1), Image.LANCZOS)
top_color = top_strip.getpixel((0, 0))
bot_strip = img.crop((0, img.height - 20, img.width, img.height)).resize((1, 1), Image.LANCZOS)
bot_color = bot_strip.getpixel((0, 0))

for y in range(1920):
    r = int(top_color[0] + (bot_color[0] - top_color[0]) * y / 1920)
    g = int(top_color[1] + (bot_color[1] - top_color[1]) * y / 1920)
    b = int(top_color[2] + (bot_color[2] - top_color[2]) * y / 1920)
    for x in range(1080):
        portrait.putpixel((x, y), (r, g, b))

y_offset = (1920 - new_h) // 2
portrait.paste(scaled, (0, y_offset))
portrait.save(f"{out_dir}/event_detail_1080x1920.png", "PNG", quality=100)
import os
try: os.remove(f"{out_dir}/event_detail_1920x2160.png")
except: pass
