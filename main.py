import sys
import threading
from PyQt6.QtWidgets import QApplication, QWidget, QLabel, QVBoxLayout
from PyQt6.QtCore import Qt, QTimer, QPointF
from PyQt6.QtGui import QScreen
from pynput import keyboard

# -----------------------------------------------------------------------------
# --- Configuration: You can customize the text and appearance here ---
# -----------------------------------------------------------------------------

# The hotkey combination to toggle the display.
HOTKEY_COMBINATION = '<ctrl>+<shift>+x'

# The amount of pixels to move the window with each arrow key press.
MOVEMENT_STEP = 20

# The updated text to be displayed on the overlay.
TEXT_TO_DISPLAY = """
🎙️ EcoFinds: Enhanced & Detailed Video Script

[0:00 - 0:25] Introduction
"Welcome to EcoFinds—a sustainable e-commerce marketplace built entirely from scratch..."

[0:25 - 0:55] System Architecture
"The frontend is a modern React application built with Vite. It communicates with a backend API on Node.js and Express, powered by a PostgreSQL database containerized using Docker..."

[0:55 - 2:15] Key Features: From Core to Advanced
"Core: Secure JWT Authentication, Full CRUD for Products, robust discovery, a functional Shopping Cart, and a personalized User Dashboard."
"Advanced: A complete Forgot Password flow, Two-Factor Authentication with email OTPs, an Amazon-style image gallery, and sophisticated blob storage for user-uploaded images."

[2:15 - 2:45] Technology Stack
"Backend: Node.js, Express, Prisma ORM, PostgreSQL, and Zod for validation."
"Frontend: A responsive React app with Vite, Tailwind CSS, shadcn/ui, and React Router."

[2:45 - 3:30] Backend Deep Dive: Docker & Data Integrity
"Our backend workflow is powered by Docker... A key challenge was solving foreign key constraint violations in our seed script by re-ordering deletion operations..."

[3:30 - 4:15] Development Journey & Troubleshooting
"We fixed 'net::ERR_CONNECTION_REFUSED' errors by debugging silent backend crashes... We also refactored our entire navigation system using react-router-dom and a <ProtectedRoute /> component."

[4:15 - 4:35] Conclusion
"EcoFinds demonstrates an end-to-end development process following modern full-stack best practices..."
"""

# -----------------------------------------------------------------------------
# --- Main Application Logic ---
# -----------------------------------------------------------------------------

class TranslucentDisplay(QWidget):
    """
    A movable, borderless, always-on-top, translucent window.
    """
    def __init__(self):
        super().__init__()
        self.is_visible = False  # Start hidden
        self.drag_pos = None
        self.init_ui()

    def init_ui(self):
        self.setWindowFlags(
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        self.label = QLabel(TEXT_TO_DISPLAY, self)
        self.label.setAlignment(Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignTop)
        self.label.setStyleSheet("""
            background-color: rgba(20, 20, 30, 0.9);
            color: #E0E0E0;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 15px;
            padding: 25px;
            border-radius: 15px;
        """)

        layout = QVBoxLayout(self)
        layout.addWidget(self.label)
        self.setLayout(layout)

        self.resize(850, 700)
        self.center_on_screen()

    def center_on_screen(self):
        center_point = QScreen.availableGeometry(QApplication.primaryScreen()).center()
        geo = self.frameGeometry()
        geo.moveCenter(center_point)
        self.move(geo.topLeft())

    def toggle_visibility(self):
        self.is_visible = not self.is_visible
        if self.is_visible:
            print("Display ON. Press", HOTKEY_COMBINATION, "to hide.")
            self.show()
            self.activateWindow() # Bring window to front to accept key presses
        else:
            print("Display OFF. Press", HOTKEY_COMBINATION, "to show.")
            self.hide()
            
    # --- Methods for MOVING the window ---
    
    def mousePressEvent(self, event):
        """Handles mouse-click-and-drag movement."""
        if event.button() == Qt.MouseButton.LeftButton:
            self.drag_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        """Handles mouse-drag movement."""
        if self.drag_pos is not None:
            self.move(event.globalPosition().toPoint() - self.drag_pos)
            event.accept()

    def mouseReleaseEvent(self, event):
        """Stops mouse-drag movement."""
        self.drag_pos = None
        event.accept()
        
    def keyPressEvent(self, event):
        """Handles arrow key movement."""
        key = event.key()
        if key == Qt.Key.Key_Up:
            self.move(self.x(), self.y() - MOVEMENT_STEP)
        elif key == Qt.Key.Key_Down:
            self.move(self.x(), self.y() + MOVEMENT_STEP)
        elif key == Qt.Key.Key_Left:
            self.move(self.x() - MOVEMENT_STEP, self.y())
        elif key == Qt.Key.Key_Right:
            self.move(self.x() + MOVEMENT_STEP, self.y())
        else:
            super().keyPressEvent(event) # Pass other keys to parent


def setup_hotkey_listener(toggle_callback):
    """Sets up and starts the pynput global hotkey listener."""
    def on_activate():
        print("Hotkey Activated! Toggling display.")
        QTimer.singleShot(0, toggle_callback)

    hotkeys = { HOTKEY_COMBINATION: on_activate }
    listener = keyboard.GlobalHotKeys(hotkeys)
    listener_thread = threading.Thread(target=listener.start, daemon=True)
    listener_thread.start()
    
    print(f"Hotkey listener started. Press {HOTKEY_COMBINATION} to toggle the display.")
    print("When visible: Click and drag to move with the mouse, or use Arrow Keys.")


if __name__ == '__main__':
    app = QApplication(sys.argv)
    display = TranslucentDisplay()
    setup_hotkey_listener(display.toggle_visibility)
    sys.exit(app.exec())