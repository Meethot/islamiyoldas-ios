from PIL import Image, ImageDraw, ImageFont, ImageFilter

img_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_quran_event_1777887430883.png"
out_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_quran_event_with_text3.png"

img = Image.open(img_path).convert("RGBA")
draw = ImageDraw.Draw(img)
w, h = img.size

font_path_serif = "/System/Library/Fonts/Palatino.ttc"
font_path_sans = "/System/Library/Fonts/Avenir.ttc"

try:
    font_title1 = ImageFont.truetype(font_path_serif, 85, index=0) 
    font_title2 = ImageFont.truetype(font_path_serif, 65, index=0)
    
    font_bottom1 = ImageFont.truetype(font_path_sans, 24, index=4) # Medium
    font_bottom2 = ImageFont.truetype(font_path_sans, 42, index=8) # Bold
    font_bottom3 = ImageFont.truetype(font_path_sans, 26, index=0) # Regular
except:
    font_title1 = font_title2 = font_bottom1 = font_bottom2 = font_bottom3 = ImageFont.load_default()

gold_color = (212, 175, 55, 255) # Rich gold
white_color = (255, 255, 255, 255)
shadow_color = (0, 0, 0, 100)
gray_color = (90, 90, 90, 255)
dark_color = (40, 40, 40, 255)

title1 = "İSLÂMİ YOLDAŞ"
title2 = "GÜNCELLEMESİ"

def get_text_width(text, font):
    return draw.textbbox((0, 0), text, font=font)[2]

def draw_text_with_shadow(draw_obj, x, y, text, font, fill_color):
    shadow_offset = 2
    draw_obj.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_color)
    draw_obj.text((x, y), text, font=font, fill=fill_color)

# Draw Title 1
x1 = (w - get_text_width(title1, font_title1)) / 2
draw_text_with_shadow(draw, x1, 40, title1, font_title1, gold_color)

# Draw Title 2
x2 = (w - get_text_width(title2, font_title2)) / 2
draw_text_with_shadow(draw, x2, 135, title2, font_title2, white_color)


# Bottom Left-Aligned Text
margin_x = 60
base_y = h - 220

text_b1 = "ÖNEMLİ GÜNCELLEME"
text_b2 = "Eş Zamanlı Takip Et!"
text_b3 = "Kur'an dinlerken ayetleri eş zamanlı olarak ekrandan\ntakip et. Arapça, meâl ve okunuş sekmeleri\narasında kesintisiz geçiş yap."

draw.text((margin_x, base_y), text_b1, font=font_bottom1, fill=gray_color)
draw.text((margin_x, base_y + 35), text_b2, font=font_bottom2, fill=dark_color)
draw.multiline_text((margin_x, base_y + 95), text_b3, font=font_bottom3, fill=gray_color, spacing=8)

img = img.convert("RGB")
img.save(out_path)
print(f"Saved to {out_path}")
