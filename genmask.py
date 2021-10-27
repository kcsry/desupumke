import json

from PIL import Image

RES = 2

img = Image.open("./assets/desumask.png").convert("L")
img.thumbnail((400, 400))
w, h = img.size
aspect = (w / h)

lit = set()
px = img.load()

for y in range(h):
    for x in range(w):
        if px[x, y] > 192:
            lit.add((round(x / w, RES), round(y / h / aspect, RES)))

with open("./src/desumask.ts", "w") as outf:
    outf.write("export default %s;" % json.dumps(sorted(lit)))
