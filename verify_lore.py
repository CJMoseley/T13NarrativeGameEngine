from playwright.sync_api import sync_playwright

def test_lore_generation(page):
    page.goto("http://localhost:5173")
    page.wait_for_selector("#loaderUI", state="hidden", timeout=60000)
    page.get_by_role("button", name="Test Menu").click()

    for _ in range(10):
        page.get_by_role("button", name="Test Lore Generation").click()
        page.wait_for_timeout(200)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Capture console logs
            logs = []
            page.on("console", lambda msg: logs.append(msg.text))
            test_lore_generation(page)
        finally:
            with open("verification_logs.txt", "w") as f:
                f.write("\n".join(logs))
            browser.close()
