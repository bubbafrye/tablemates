**Gameplay**

*2048* is played on a plain 4×4 grid, with numbered tiles that slide when a player moves them using the four arrow keys, a directional swipe, or a gamepad. The game begins with two tiles already in the grid, having a value of either 2 or 4, and another such tile appears in a random empty space after each turn. Tiles slide as far as possible in the chosen direction until they are stopped by either another tile or the edge of the grid. If two tiles of the same number collide while moving, they will merge into a tile with the total value of the two tiles that collided.The resulting tile cannot merge with another tile again in the same move. Higher-scoring tiles emit a soft glow; the largest possible tile is 16,384.

At the game start, tiles with a value of 2 appear 90% of the time, and tiles with a value of 4 appear 10% of the time. 

If a move causes three consecutive tiles of the same value to slide together, only the two tiles farthest along the direction of motion will combine. If all four spaces in a row or column are filled with tiles of the same value, a move parallel to that row/column will combine the first two and last two. A scoreboard on the upper-right keeps track of the user's score. The user's score starts at zero, and is increased whenever two tiles combine, by the value of the new tile.

The game is won when a tile with a value of 2048 appears on the board. Players can continue beyond that to reach higher scores.When the player has no legal moves (there are no empty spaces and no adjacent tiles with the same value), the game ends.

**Controller**

A gamepad is a first-class way to play, equal to keyboard and swipe — not a hidden extra. The catalog marks 2048 as controller-supported, and on-screen copy says so (“arrows or a controller” on desktop, “swipe or use a controller” on touch). Keyboard and swipe stay available at all times; a pad never replaces them.

Only four directions matter. The D-pad is the preferred source when any of its buttons are held. If the D-pad is idle, the left stick is read instead, using the same 0.18 analog deadzone as Space Rocks so rest noise does not count as a move. Diagonals collapse to a single cardinal: whichever axis is stronger. Opposite D-pad buttons cancel. The right stick, shoulders, and face buttons are not used for sliding.

A move is issued while a direction is asserted, but the board already refuses input during a slide. Holding a direction therefore repeats at the slide cadence (~140ms) once the tiles have landed, similar to holding an arrow key, without queuing extra slides. An illegal direction (tiles cannot move that way) is a no-op.

Face buttons are reserved for end-of-round, never for play. The south button (A / cross) confirms the prompt that is already on screen: Keep going after a 2048 win, New game after a loss. It is edge-triggered so a held press cannot restart repeatedly. South does nothing while the round is in play, so an accidental tap cannot wipe a board. Exit and New game during play stay on-screen clicks — they are too destructive to bind to a pad.

Browsers typically expose a pad only after the player presses a button on it. Until then the game plays as keyboard/swipe only; no “connect a controller” chrome is required.

**Strategy**

Strategies in *2048* include keeping the largest tile in a specific corner with other large tiles filling the row (either vertically or horizontally). If the row remains filled, the player can then move in three different directions while still keeping the largest tile in the preferred corner. As a general rule, no small tiles should be separated from other small tiles by a large tile.