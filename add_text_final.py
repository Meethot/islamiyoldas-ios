from PIL import Image, ImageDraw, ImageFont

img_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_quran_event_1777887430883.png"
out_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/event_final.png"

img = Image.open(img_path).convert("RGBA")
draw = ImageDraw.Draw(img)
w, h = img.size

# Use Palatino for serif elegance
font_path = "/System/Library/Fonts/Palatino.ttc"
font_title1 = ImageFont.truetype(font_path, 90, index=2)  # Bold
font_title2 = ImageFont.truetype(font_path, 70, index=0)  # Regular

gold_color = (185, 150, 55)
gray_color = (120, 120, 120)

title1 = "İSLÂMİ YOLDAŞ"
title2 = "GÜNCELLEMESİ"

def center_x(text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return (w - (bbox[2] - bbox[0])) / 2

# Only top text, nothing else
draw.text((center_x(title1, font_title1), 35), title1, font=font_title1, fill=gold_color)
draw.text((center_x(title2, font_title2), 135), title2, font=font_title2, fill=gray_color)

img.convert("RGB").save(out_path)
print(f"Saved to {out_path}")
