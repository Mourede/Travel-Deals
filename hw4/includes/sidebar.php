<?php
/**
 * The display controls from section 5: font size of the main content and
 * background colour of the page. script.js applies both and remembers
 * them in localStorage so they survive navigation.
 */
?>
    <div class="side">
      <h3>Display</h3>
      <p class="side-note">Adjust the page display.</p>

      <div class="controls">
        <label>Text Size
          <input type="number"
                 id="fontSize"
                 value="16"
                 min="10"
                 max="30"
                 onchange="changeFont()">
        </label>

        <label>Background
          <input type="color"
                 id="bgColor"
                 value="#eef3f8"
                 onchange="changeBg()">
        </label>
      </div>
    </div>
