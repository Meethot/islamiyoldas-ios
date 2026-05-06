from PIL import Image, ImageDraw, ImageFont

img_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_quran_event_1777887430883.png"
out_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_quran_event_with_text.png"

try:
    img = Image.open(img_path)
except Exception as e:
    print(f"Error opening image: {e}")
    exit(1)

draw = ImageDraw.Draw(img)
w, h = img.size

font_path = "/System/Library/Fonts/Avenir.ttc"
try:
    font_title1 = ImageFont.truetype(font_path, 60, index=4) # Avenir Next Medium
    font_title2 = ImageFont.truetype(font_path, 50, index=0) # Regular
    font_bottom1 = ImageFont.truetype(font_path, 25, index=4) # Medium
    font_bottom2 = ImageFont.truetype(font_path, 45, index=8) # Bold
    font_bottom3 = ImageFont.truetype(font_path, 25, index=0) # Regular
except:
    font_title1 = font_title2 = font_bottom1 = font_bottom2 = font_bottom3 = ImageFont.load_default()

gold_color = (195, 155, 80)
white_color = (250, 250, 250)
gray_color = (110, 110, 110)
dark_color = (30, 30, 30)

# Top Centered Text
title1 = "İSLÂMİ YOLDAŞ"
title2 = "GÜNCELLEMESİ"

def get_text_width(text, font):
    return draw.textbbox((0, 0), text, font=font)[2]

draw.text(((w - get_text_width(title1, font_title1)) / 2, 40), title1, font=font_title1, fill=gold_color)
draw.text(((w - get_text_width(title2, font_title2)) / 2, 110), title2, font=font_title2, fill=white_color)

# Bottom Left-Aligned Text
margin_x = 60
base_y = h - 220

text_b1 = "ÖNEMLİ GÜNCELLEME"
text_b2 = "Eş Zamanlı Takip Et!"
text_b3 = "Kur'an dinlerken ayetleri eş zamanlı olarak\nekrandan takip et. Arapça, meâl ve okunuş\nsekmeleri arasında kesintisiz geçiş yap."

draw.text((margin_x, base_y), text_b1, font=font_bottom1, fill=gray_color)
draw.text((margin_x, base_y + 35), text_b2, font=font_bottom2, fill=dark_color)

# Draw multiline text
draw.multiline_text((margin_x, base_y + 95), text_b3, font=font_bottom3, fill=gray_color, spacing=10)

img.save(out_path)
print(f"Saved to {out_path}")
