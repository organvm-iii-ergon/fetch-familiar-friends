
from playwright.sync_api import sync_playwright

def verify_calendar(page):
    # Bypass VisualLanding
    page.goto('http://localhost:3000')
    page.evaluate("localStorage.setItem('dogtale-landing-seen', 'true')")
    page.reload()

    # Wait for calendar to load
    page.wait_for_selector('text=Today')

    # Switch to month view if not already (although MonthCalendar is likely default or visible)
    # The prompt says "The MonthCalendar component is conditionally rendered and requires toggling 'Month View' (via the button with aria-label='Show month view') to be visible for verification."
    # Let's check if we see "June 2023" or similar month/year header.
    # Actually, the app likely defaults to current month.

    # Try to find the toggle button
    try:
        page.click('button[aria-label="Show month view"]')
        page.wait_for_timeout(500) # Wait for animation
    except:
        print("Could not find 'Show month view' button, assuming month view is visible or different layout")

    # Take screenshot
    page.screenshot(path='verification/calendar.png')

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_calendar(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path='verification/error.png')
        finally:
            browser.close()
