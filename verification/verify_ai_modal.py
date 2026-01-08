from playwright.sync_api import sync_playwright
import time

def verify_ai_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos",
            viewport={"width": 1280, "height": 720}
        )
        page = context.new_page()

        # Bypass VisualLanding
        page.goto("http://localhost:3000")
        page.evaluate("localStorage.setItem('dogtale-landing-seen', 'true')")
        page.reload()

        # Wait for the app to load
        page.wait_for_timeout(2000)

        # Open AI Chat
        page.get_by_label("Open AI chat").click()

        # Wait for modal
        page.wait_for_selector("div[role='dialog']")

        # Type and send message
        page.get_by_label("Message input").fill("Hello")
        page.get_by_label("Send message").click()

        # Wait for typing indicator to appear
        # We are looking for the role="status" which we added
        status_locator = page.locator("div[role='status']")
        status_locator.wait_for(state="visible", timeout=5000)

        # Take screenshot of typing state
        page.screenshot(path="verification/ai_typing.png")

        print("Screenshot taken: verification/ai_typing.png")

        # Verify accessibility attributes
        is_polite = status_locator.get_attribute("aria-live") == "polite"
        print(f"Typing indicator has aria-live='polite': {is_polite}")

        messages_log = page.locator("div[role='log']")
        is_log = messages_log.is_visible()
        print(f"Messages container has role='log': {is_log}")

        browser.close()

if __name__ == "__main__":
    verify_ai_modal()
