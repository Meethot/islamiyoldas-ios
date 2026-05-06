from PIL import Image

src = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/event_portrait_full_1777897939527.png"
out_dir = "/Users/mithatacargur/Desktop/AppStore_Event_Images"

img = Image.open(src).convert("RGB")

# 1. Landscape (Event Card) - 1920x1080 -> 16:9
# Crop top and bottom
target_ratio_l = 1920 / 1080 # 1.777
new_h = int(img.width / target_ratio_l)
top = (img.height - new_h) // 2
crop_l = img.crop((0, top, img.width, top + new_h))
final_l = crop_l.resize((1920, 1080), Image.LANCZOS)
final_l.save(f"{out_dir}/event_card_1920x1080.png", "PNG", quality=100)
print(f"Landscape saved: {out_dir}/event_card_1920x1080.png")

# 2. Portrait (Event Detail) - 1080x1920 -> 9:16
# Crop left and right sides
target_ratio_p = 1080 / 1920 # 0.5625
new_w = int(img.height * target_ratio_p)
left = (img.width - new_w) // 2
crop_p = img.crop((left, 0, left + new_w, img.height))
final_p = crop_p.resize((1080, 1920), Image.LANCZOS)
final_p.save(f"{out_dir}/event_detail_1080x1920.png", "PNG", quality=100)
print(f"Portrait saved: {out_dir}/event_detail_1080x1920.png")

# Remove any old 1920x2160 file
import os
try: os.remove(f"{out_dir}/event_detail_1920x2160.png")
except: pass
