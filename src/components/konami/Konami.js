/**
 * =========================================
 * KONAMI CODE SEQUENCE DETECTOR
 * =========================================
 * Detects the sequence "oflyn" and triggers
 * a console message when matched
 */

class Konami {
  constructor() {
    // The sequence to match
    this.sequence = ["o", "f", "l", "y", "n"];
    // Current position in the sequence
    this.position = 0;
    // Bind the handler to maintain context
    this.handleKeyPress = this.handleKeyPress.bind(this);
    // Initialize the listener
    this.init();
  }

  /**
   * Initializes the key press event listener
   */
  init() {
    document.addEventListener("keydown", this.handleKeyPress);
  }

  /**
   * Handles each keypress and checks against the sequence
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyPress(event) {
    // Get the pressed key in lowercase
    const key = event.key.toLowerCase();

    // Check if the pressed key matches the current position in sequence
    if (key === this.sequence[this.position]) {
      // Move to next position
      this.position++;

      // Check if the full sequence is completed
      if (this.position === this.sequence.length) {
        console.log('🎉 Sequence "oflyn" detected! Secret message unlocked!');
        // Reset position for next attempt
        this.position = 0;
      }
    } else {
      // Reset position if wrong key is pressed
      this.position = 0;
      // If the wrong key is the first key of sequence, start over
      if (key === this.sequence[0]) {
        this.position = 1;
      }
    }
  }

  /**
   * Cleans up event listeners when component is destroyed
   */
  destroy() {
    document.removeEventListener("keydown", this.handleKeyPress);
  }
}

export default Konami;
