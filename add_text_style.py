from PIL import Image, ImageDraw, ImageFont, ImageFilter

img_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_quran_event_1777887430883.png"
out_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_quran_event_with_text2.png"

try:
    img = Image.open(img_path).convert("RGBA")
except Exception as e:
    print(f"Error opening image: {e}")
    exit(1)

draw = ImageDraw.Draw(img)
w, h = img.size

# Trying Palatino or Optima for the elegant serif look
font_path = "/System/Library/Fonts/Palatino.ttc"
try:
    # index 0 is regular, index 1 is italic, index 2 is bold
    font_title1 = ImageFont.truetype(font_path, 80, index=0) 
    font_title2 = ImageFont.truetype(font_path, 65, index=0)
except:
    font_title1 = font_title2 = ImageFont.load_default()

gold_color = (212, 175, 55, 255) # Rich gold
white_color = (255, 255, 255, 255)
shadow_color = (0, 0, 0, 150)

title1 = "İSLÂMİ YOLDAŞ"
title2 = "GÜNCELLEMESİ"

def get_text_width(text, font):
    return draw.textbbox((0, 0), text, font=font)[2]

def draw_text_with_shadow(draw_obj, x, y, text, font, fill_color):
    # Draw shadow
    shadow_offset = 3
    draw_obj.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_color)
    # Draw main text
    draw_obj.text((x, y), text, font=font, fill=fill_color)

# Draw Title 1
x1 = (w - get_text_width(title1, font_title1)) / 2
draw_text_with_shadow(draw, x1, 40, title1, font_title1, gold_color)

# Draw Title 2
x2 = (w - get_text_width(title2, font_title2)) / 2
draw_text_with_shadow(draw, x2, 130, title2, font_title2, white_color)

img = img.convert("RGB")
img.save(out_path)
print(f"Saved to {out_path}")
