"""Сборка презентации: slides.html → zashchita.pdf, zashchita.pptx (слайды + заметки докладчика).

Запуск из корня репозитория:
    pip install playwright python-pptx && python -m playwright install chromium
    python presentation/src/build.py
"""
import asyncio
import pathlib
import tempfile

from playwright.async_api import async_playwright
from pptx import Presentation
from pptx.util import Emu

SRC = pathlib.Path(__file__).resolve().parent
OUT = SRC.parent


async def render():
    html = SRC / "slides.html"
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=2)
        await page.goto(html.as_uri(), wait_until="networkidle")
        await page.evaluate("document.fonts.ready")
        notes = await page.eval_on_selector_all("section.slide", "els => els.map(e => e.dataset.notes || '')")
        tmp = pathlib.Path(tempfile.mkdtemp())
        pngs = []
        for i, el in enumerate(await page.query_selector_all("section.slide"), 1):
            png = tmp / f"slide-{i:02d}.png"
            await el.screenshot(path=str(png))
            pngs.append(png)
        await page.emulate_media(media="print")
        await page.pdf(path=str(OUT / "zashchita.pdf"), width="1280px", height="720px",
                       print_background=True, margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        await browser.close()
    return pngs, notes


def build_pptx(pngs, notes):
    prs = Presentation()
    prs.slide_width, prs.slide_height = Emu(12192000), Emu(6858000)  # 16:9
    blank = prs.slide_layouts[6]
    for png, note in zip(pngs, notes):
        slide = prs.slides.add_slide(blank)
        slide.shapes.add_picture(str(png), 0, 0, prs.slide_width, prs.slide_height)
        slide.notes_slide.notes_text_frame.text = note
    prs.save(OUT / "zashchita.pptx")


if __name__ == "__main__":
    pngs, notes = asyncio.run(render())
    build_pptx(pngs, notes)
    print(f"{len(pngs)} слайдов → {OUT / 'zashchita.pdf'}, {OUT / 'zashchita.pptx'}")
