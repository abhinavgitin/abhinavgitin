import os
import base64
from PIL import ImageFont

def generate_svg():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(base_dir, "fonts", "InstrumentSerif-Regular.ttf")
    output_dir = os.path.join(base_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    with open(font_path, "rb") as f:
        font_data = f.read()
    b64_font = base64.b64encode(font_data).decode("utf-8")

    font = ImageFont.truetype(font_path, 58)

    texts = [
        "Abhinav Puri.",
        "Computer Science Engineering Student.",
        "Building with Java.",
        "Leveling up with DSA.",
        "Learning · Advanced Java · Spring Boot."
    ]

    type_speed = 0.055
    pause_time = 0.700
    delete_speed = 0.035
    next_time = 0.200

    durations = []
    for text in texts:
        length = len(text)
        duration = (length * type_speed) + pause_time + (length * delete_speed) + next_time
        durations.append(duration)

    total_time = sum(durations)

    def safe_pct(t):
        return max(0.0, min(100.0, (t / total_time) * 100))

    css_rules = []
    svg_clips = []
    svg_elements = []

    css_rules.append("@keyframes blink {\n  0%, 50% { opacity: 1; }\n  50.1%, 100% { opacity: 0; }\n}")

    current_time = 0.0

    for i, text in enumerate(texts):
        total_width = font.getlength(text)
        left_x = 500 - (total_width / 2)
        length = len(text)
        start_time = current_time

        clip_kfs = []
        pos_kfs = []
        fade_kfs = []

        fade_kfs.append("0% { opacity: 0; }")
        if start_time > 0:
            fade_kfs.append(f"{safe_pct(start_time - 0.001):.3f}% {{ opacity: 0; }}")
        fade_kfs.append(f"{safe_pct(start_time):.3f}% {{ opacity: 1; }}")

        time_end_visible = start_time + (length * type_speed) + pause_time + (length * delete_speed)
        fade_kfs.append(f"{safe_pct(time_end_visible):.3f}% {{ opacity: 1; }}")
        if time_end_visible < total_time:
            fade_kfs.append(f"{safe_pct(time_end_visible + 0.001):.3f}% {{ opacity: 0; }}")
        fade_kfs.append("100% { opacity: 0; }")

        if start_time > 0:
            clip_kfs.append("0% { width: 0px; }")
            pos_kfs.append(f"0% {{ transform: translateX({left_x:.2f}px); }}")
            clip_kfs.append(f"{safe_pct(start_time - 0.001):.3f}% {{ width: 0px; }}")
            pos_kfs.append(f"{safe_pct(start_time - 0.001):.3f}% {{ transform: translateX({left_x:.2f}px); }}")

        for c in range(length + 1):
            time_c = start_time + c * type_speed
            w = font.getlength(text[:c])
            if c == 0:
                clip_kfs.append(f"{safe_pct(time_c):.3f}% {{ width: 0px; }}")
                pos_kfs.append(f"{safe_pct(time_c):.3f}% {{ transform: translateX({left_x:.2f}px); }}")
            else:
                prev_w = font.getlength(text[:c-1])
                clip_kfs.append(f"{safe_pct(time_c - 0.001):.3f}% {{ width: {prev_w:.2f}px; }}")
                pos_kfs.append(f"{safe_pct(time_c - 0.001):.3f}% {{ transform: translateX({left_x + prev_w:.2f}px); }}")
                clip_kfs.append(f"{safe_pct(time_c):.3f}% {{ width: {w:.2f}px; }}")
                pos_kfs.append(f"{safe_pct(time_c):.3f}% {{ transform: translateX({left_x + w:.2f}px); }}")

        time_pause_end = start_time + (length * type_speed) + pause_time
        clip_kfs.append(f"{safe_pct(time_pause_end):.3f}% {{ width: {total_width:.2f}px; }}")
        pos_kfs.append(f"{safe_pct(time_pause_end):.3f}% {{ transform: translateX({left_x + total_width:.2f}px); }}")

        for c in range(length - 1, -1, -1):
            time_d = time_pause_end + (length - c) * delete_speed
            w = font.getlength(text[:c])
            prev_w = font.getlength(text[:c+1])
            clip_kfs.append(f"{safe_pct(time_d - 0.001):.3f}% {{ width: {prev_w:.2f}px; }}")
            pos_kfs.append(f"{safe_pct(time_d - 0.001):.3f}% {{ transform: translateX({left_x + prev_w:.2f}px); }}")
            clip_kfs.append(f"{safe_pct(time_d):.3f}% {{ width: {w:.2f}px; }}")
            pos_kfs.append(f"{safe_pct(time_d):.3f}% {{ transform: translateX({left_x + w:.2f}px); }}")

        if time_end_visible < total_time:
            clip_kfs.append(f"{safe_pct(time_end_visible + 0.001):.3f}% {{ width: 0px; }}")
            pos_kfs.append(f"{safe_pct(time_end_visible + 0.001):.3f}% {{ transform: translateX({left_x:.2f}px); }}")
        clip_kfs.append("100% { width: 0px; }")
        pos_kfs.append(f"100% {{ transform: translateX({left_x:.2f}px); }}")

        css_rules.append(f"@keyframes fade_{i} {{\n  " + "\n  ".join(fade_kfs) + "\n}")
        css_rules.append(f"@keyframes clip_{i} {{\n  " + "\n  ".join(clip_kfs) + "\n}")
        css_rules.append(f"@keyframes pos_{i} {{\n  " + "\n  ".join(pos_kfs) + "\n}")

        svg_clips.append(f'<clipPath id="clip_{i}">\n  <rect height="90" x="{left_x:.2f}" y="0" style="animation: clip_{i} {total_time:.3f}s linear infinite;" />\n</clipPath>')
        
        group = f"""<g style="animation: fade_{i} {total_time:.3f}s linear infinite;">
  <text x="{left_x:.2f}" y="65" font-family="'Instrument Serif', serif" font-size="58" fill="#fff" clip-path="url(#clip_{i})">{text}</text>
  <g style="animation: pos_{i} {total_time:.3f}s linear infinite;">
    <rect width="4" height="54" y="18" fill="#fff" style="animation: blink 0.8s infinite;" />
  </g>
</g>"""
        svg_elements.append(group)

        current_time += durations[i]

    font_face = f"""@font-face {{
  font-family: 'Instrument Serif';
  src: url(data:font/ttf;charset=utf-8;base64,{b64_font}) format('truetype');
  font-weight: normal;
  font-style: normal;
}}"""

    styles = f"<style>\n{font_face}\n" + "\n".join(css_rules) + "\n</style>"

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="90" viewBox="0 0 1000 90">
<defs>
{styles}
{"".join(svg_clips)}
</defs>
<rect width="100%" height="100%" fill="transparent" />
{"".join(svg_elements)}
</svg>"""

    output_file = os.path.join(output_dir, "header.svg")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(svg_content)

if __name__ == "__main__":
    generate_svg()