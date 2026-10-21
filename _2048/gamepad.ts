import type { Direction } from "./logic";

/** Same deadzone as Space Rocks. */
export const GAMEPAD_DEADZONE = 0.18;

function pressed(gp: Gamepad, index: number) {
  const button = gp.buttons[index];
  return Boolean(button && (button.pressed || button.value > 0.5));
}

/** D-pad (standard 12–15) else left stick, dominant axis. */
export function directionFromGamepad(gp: Gamepad): Direction | null {
  const up = pressed(gp, 12);
  const down = pressed(gp, 13);
  const left = pressed(gp, 14);
  const right = pressed(gp, 15);
  if (up !== down) return up ? "up" : "down";
  if (left !== right) return left ? "left" : "right";

  const x = gp.axes[0] ?? 0;
  const y = gp.axes[1] ?? 0;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax < GAMEPAD_DEADZONE && ay < GAMEPAD_DEADZONE) return null;
  if (ax > ay) return x > 0 ? "right" : "left";
  return y > 0 ? "down" : "up";
}

export function southButtonPressed(gp: Gamepad) {
  return pressed(gp, 0);
}

export function firstConnectedGamepad(): Gamepad | null {
  const pads = navigator.getGamepads?.();
  if (!pads) return null;
  for (const pad of pads) {
    if (pad?.connected) return pad;
  }
  return null;
}
