from PIL import Image, ImageDraw, ImageFont

# Load image
img_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_event_vertical_1777887695257.png"
out_path = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/glassmorphism_event_with_text.png"
img = Image.open(img_path)
draw = ImageDraw.Draw(img)

# Width and height
w, h = img.size

# Fonts
font_path = "/System/Library/Fonts/Avenir.ttc"
try:
    font_title_large = ImageFont.truetype(font_path, 80, index=4) # Avenir Next Medium
    font_title_small = ImageFont.truetype(font_path, 60, index=0)
    font_bottom_title = ImageFont.truetype(font_path, 50, index=8) # Bold
    font_bottom_sub = ImageFont.truetype(font_path, 35, index=0)
except Exception as e:
    print(f"Font loading error: {e}")
    font_title_large = ImageFont.load_default()
    font_title_small = ImageFont.load_default()
    font_bottom_title = ImageFont.load_default()
    font_bottom_sub = ImageFont.load_default()

gold_color = (200, 160, 90)
white_color = (245, 245, 245)
dark_color = (60, 60, 60)
gray_color = (100, 100, 100)

# Top texts
title1 = "İSLÂMİ YOLDAŞ"
title2 = "GÜNCELLEMESİ"

def draw_text_center(y, text, font, fill_color):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    x = (w - text_w) / 2
    draw.text((x, y), text, font=font, fill=fill_color)

# Add top text
draw_text_center(50, title1, font_title_large, gold_color)
draw_text_center(140, title2, font_title_small, gray_color)

# Bottom texts
b_title1 = "ÖNEMLİ GÜNCELLEME"
b_title2 = "Eş Zamanlı Takip Et!"

# Text wrapping function
def draw_multiline_center(y, text, font, fill_color, max_width):
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        current_line.append(word)
        bbox = draw.textbbox((0, 0), " ".join(current_line), font=font)
        if (bbox[2] - bbox[0]) > max_width:
            current_line.pop()
            lines.append(" ".join(current_line))
            current_line = [word]
    lines.append(" ".join(current_line))
    
    current_y = y
    for line in lines:
        draw_text_center(current_y, line, font, fill_color)
        bbox = draw.textbbox((0, 0), line, font=font)
        current_y += (bbox[3] - bbox[1]) + 10

b_desc = "Kur'an dinlerken hangi ayette olduğunu anlık gör. Eş zamanlı takip sistemiyle meâl ve okunuş ekranlarında gezinerek maneviyatını artır."

# Bottom section layout (assuming 1024x1024 image)
draw_text_center(h - 250, b_title1, font_bottom_sub, gray_color)
draw_text_center(h - 200, b_title2, font_bottom_title, dark_color)
draw_multiline_center(h - 130, b_desc, font_bottom_sub, gray_color, w - 100)

img.save(out_path)
print(f"Saved to {out_path}")
