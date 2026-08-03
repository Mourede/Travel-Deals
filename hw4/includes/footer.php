<?php
/**
 * Closes the layout opened in header.php and loads script.js.
 *
 * A page can set $pageScript to the name of one more script to load
 * after it, which is how flights.php, stays.php and the rest pull in
 * their own JavaScript.
 */
?>
    </div>
  </div>

  <div class="footer">
    <p>Travel Deals</p>
  </div>

  <script src="script.js"></script>
  <?php if (!empty($pageScript)): ?>
    <script src="js/<?= htmlspecialchars($pageScript) ?>"></script>
  <?php endif; ?>
</body>
</html>
