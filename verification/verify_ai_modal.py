from playwright.sync_api import sync_playwright
import time

def verify_ai_modal_validation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:3000")

            print("Waiting for app to load...")
            page.wait_for_selector('h1', timeout=10000)

            print("Looking for AI Chat button...")
            # Try to find the button by its aria-label as seen in CalendarCard.jsx
            ai_btn = page.locator('button[aria-label="Open AI chat"]')

            if not ai_btn.count():
                 # Try by visible text
                 ai_btn = page.get_by_text("AI Chat")

            if not ai_btn.count():
                page.screenshot(path="verification/debug_main_page.png")
                print("Could not find AI Chat button. Screenshot saved.")
                return

            print("Clicking AI Chat button...")
            ai_btn.click()

            print("Waiting for modal...")
            page.wait_for_selector('div[role="dialog"]', timeout=5000)

            print("Filling input with profanity...")
            input_field = page.get_by_placeholder("Ask me anything about dogs...")
            input_field.fill("This is shit")

            print("Clicking Send...")
            send_btn = page.get_by_label("Send message")
            send_btn.click()

            print("Waiting for error message...")
            error_msg = page.get_by_role("alert")
            error_msg.wait_for(state="visible", timeout=5000)

            text = error_msg.inner_text()
            print(f"Error message found: {text}")

            if "family-friendly" in text:
                print("Validation successful!")
            else:
                print("Unexpected error message.")

            page.screenshot(path="verification/final_validation.png")
            print("Screenshot saved to verification/final_validation.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_final.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ai_modal_validation()
