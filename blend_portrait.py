from PIL import Image, ImageFilter, ImageDraw

src = "/Users/mithatacargur/.gemini/antigravity/brain/77ae7d5f-6a30-4ac8-9bbc-da8b0eb30162/event_portrait_full_1777897939527.png"
out_path = "/Users/mithatacargur/Desktop/AppStore_Event_Images/event_detail_1080x1920.png"

img = Image.open(src).convert("RGB")

# 1. Create the blurred background
# Scale image to 1920x1920 so it covers the whole height
bg_size = 1920
bg_scaled = img.resize((bg_size, bg_size), Image.LANCZOS)
# Crop center 1080x1920
left = (bg_size - 1080) // 2
bg_cropped = bg_scaled.crop((left, 0, left + 1080, 1920))
# Apply heavy blur
bg_blurred = bg_cropped.filter(ImageFilter.GaussianBlur(radius=40))

# 2. Create the sharp foreground
fg_w = 1080
# We don't want to scale the square to 1080x1080 because that leaves a lot of vertical blur.
# Let's scale it to fit nicely.
fg_scaled = img.resize((fg_w, fg_w), Image.LANCZOS)

# 3. Create an alpha mask for blending the top and bottom edges smoothly
mask = Image.new("L", (fg_w, fg_w), 255)
draw = ImageDraw.Draw(mask)

# Gradient size for fading
fade_h = 150
for y in range(fade_h):
    alpha = int(255 * (y / fade_h))
    # Top fade
    draw.line([(0, y), (fg_w, y)], fill=alpha)
    # Bottom fade
    draw.line([(0, fg_w - 1 - y), (fg_w, fg_w - 1 - y)], fill=alpha)

# Apply mask to fg
fg_scaled.putalpha(mask)

# 4. Composite
final = bg_blurred.copy()
y_offset = (1920 - fg_w) // 2
final.paste(fg_scaled, (0, y_offset), fg_scaled)

final.save(out_path, "PNG", quality=100)
print(f"Saved seamlessly blended portrait to: {out_path}")
