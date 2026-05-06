from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import sys

src_img_path = "/Users/mithatacargur/Desktop/Mockuplar/1.png"
out_path = "/Users/mithatacargur/Desktop/Mockuplar/islamiyoldas_mockup_1.png"

W, H = 1284, 2778
canvas = Image.new("RGBA", (W, H), (245, 246, 248, 255))

draw = ImageDraw.Draw(canvas)
for y in range(H):
    r = int(235 + (255 - 235) * (y / H))
    g = int(236 + (255 - 236) * (y / H))
    b = int(240 + (255 - 240) * (y / H))
    draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

try:
    screenshot = Image.open(src_img_path).convert("RGBA")
except Exception as e:
    print("Error opening screenshot:", e)
    sys.exit(1)

frame_w = 1060
frame_h = int(frame_w * (screenshot.height / screenshot.width))
bezel = 24
radius = 120

ss_resized = screenshot.resize((frame_w - bezel*2, frame_h - bezel*2), Image.LANCZOS)

phone = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
pdraw = ImageDraw.Draw(phone)
pdraw.rounded_rectangle([0, 0, frame_w, frame_h], radius=radius, fill=(20, 20, 20, 255), outline=(50, 50, 50, 255), width=3)
phone.paste(ss_resized, (bezel, bezel), ss_resized if ss_resized.mode == 'RGBA' else None)

di_w = 320
di_h = 85
di_x = (frame_w - di_w) // 2
di_y = bezel + 15
pdraw.rounded_rectangle([di_x, di_y, di_x + di_w, di_y + di_h], radius=40, fill=(0, 0, 0, 255))

phone_y = 600
phone_x = (W - frame_w) // 2
canvas.paste(phone, (phone_x, phone_y), phone)

# The phone ends at phone_y + frame_h (e.g. 600 + 2293 = 2893, which is off-screen)
# We want the fade to happen in the visible area near the bottom.
fade_start = H - 800
fade_end = H
fade_h = fade_end - fade_start

fade_layer = Image.new("RGBA", (W, fade_h), (0,0,0,0))
fdraw = ImageDraw.Draw(fade_layer)
for y in range(fade_h):
    progress = y / fade_h
    alpha = int(255 * (progress ** 1.8))
    fdraw.line([(0, y), (W, y)], fill=(255, 255, 255, alpha))

canvas.paste(fade_layer, (0, fade_start), fade_layer)

try:
    font_large = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 130)
    font_medium = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 45)
    font_bold = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 55)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_bold = ImageFont.load_default()

text1 = "Maneviyatınızı"
text2 = "Güçlendirin"
try:
    bbox1 = font_large.getbbox(text1)
    tw1 = bbox1[2] - bbox1[0]
    bbox2 = font_large.getbbox(text2)
    tw2 = bbox2[2] - bbox2[0]
except:
    tw1, tw2 = 800, 800

draw.text(((W - tw1) / 2, 200), text1, font=font_large, fill=(20, 20, 20, 255))
draw.text(((W - tw2) / 2, 340), text2, font=font_large, fill=(20, 20, 20, 255))

badge_y = H - 280
# Star badges
draw.text((250, badge_y), "★ ★ ★ ★ ★", font=font_medium, fill=(20, 20, 20, 255))
draw.text((250, badge_y + 60), "4.9 Puan", font=font_bold, fill=(20, 20, 20, 255))
draw.text((250, badge_y + 130), "App Store", font=font_medium, fill=(100, 100, 100, 255))

# Download badges
draw.text((750, badge_y), "🥇", font=font_medium, fill=(20, 20, 20, 255))
draw.text((750, badge_y + 60), "100.000+", font=font_bold, fill=(20, 20, 20, 255))
draw.text((750, badge_y + 130), "Aktif Kullanıcı", font=font_medium, fill=(100, 100, 100, 255))

canvas.convert("RGB").save(out_path, "PNG", quality=100)
print("Saved to", out_path)
