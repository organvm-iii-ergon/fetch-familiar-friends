
from playwright.sync_api import sync_playwright

def verify_aimodal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Bypass VisualLanding
        page.add_init_script("localStorage.setItem('dogtale-landing-seen', 'true')")

        try:
            print("Navigating...")
            page.goto("http://localhost:3000", timeout=60000)
            page.wait_for_load_state("networkidle")

            print("Dumping page content for debugging...")
            # If standard get_by_label fails, maybe it's hidden or not rendered yet.
            # CalendarCard is likely part of the main view.

            # Let's take a screenshot of the main page to see what's loaded
            page.screenshot(path="verification/main_page.png")

            # Try to find the button more robustly
            # It's an AI Chat button

            print("Looking for 'AI Chat' button...")
            # Try finding by text "AI Chat" which is visible
            ai_btn = page.get_by_text("AI Chat")
            if ai_btn.count() > 0:
                print("Found by text 'AI Chat'")
                ai_btn.first.click()
            else:
                print("Could not find by text, trying label...")
                page.get_by_label("Open AI chat").click()

            print("Waiting for modal...")
            page.wait_for_selector("text=AI Assistant")

            print("Sending message...")
            page.get_by_placeholder("Ask me anything about dogs...").fill("Hello")
            page.get_by_role("button", name="Send message").click()

            page.wait_for_timeout(500)

            page.screenshot(path="verification/aimodal_verification.png")
            print("Screenshot taken successfully")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_aimodal()
