from PIL import Image

src = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/event_banner_small_text_1777889470903.png"
out_dir = "/Users/mithatacargur/Desktop/AppStore_Event_Images"

img = Image.open(src).convert("RGB")

# Apple constraints: min 1920x1080, max 3840x2160
# Most portrait-like allowed: 1920 x 2160

target_w, target_h = 1920, 2160

# Create canvas with matching background color
top_color = img.crop((0, 0, img.width, 10)).resize((1, 1), Image.LANCZOS).getpixel((0, 0))
bot_color = img.crop((0, img.height - 10, img.width, img.height)).resize((1, 1), Image.LANCZOS).getpixel((0, 0))

canvas = Image.new("RGB", (target_w, target_h))

# Fill with gradient
for y in range(target_h):
    r = int(top_color[0] + (bot_color[0] - top_color[0]) * y / target_h)
    g = int(top_color[1] + (bot_color[1] - top_color[1]) * y / target_h)
    b = int(top_color[2] + (bot_color[2] - top_color[2]) * y / target_h)
    for x in range(target_w):
        canvas.putpixel((x, y), (r, g, b))

# Scale image to fit width
scale = target_w / img.width
new_h = int(img.height * scale)
scaled = img.resize((target_w, new_h), Image.LANCZOS)

# Center vertically
y_offset = (target_h - new_h) // 2
canvas.paste(scaled, (0, y_offset))

path = f"{out_dir}/event_detail_1920x2160.png"
canvas.save(path, "PNG")
print(f"Saved: {path} (1920x2160)")

# Delete old invalid file
import os
old = f"{out_dir}/event_detail_1080x1920.png"
if os.path.exists(old):
    os.remove(old)
    print(f"Deleted old: {old}")

print("Done!")
