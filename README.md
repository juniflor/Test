# Pixel Fighter v1.0
Local Versus fighting game (HTML5 Canvas + Vite). Fighters: Junior, Marty.

## Run locally
    npm install
    npm run dev      # open the printed URL in Chrome
    npm run build    # outputs dist/

## Deploy to GitHub Pages
1. Push this folder to a GitHub repo (branch `main`).
2. Repo Settings > Pages > Source: **GitHub Actions**.
3. Every push to `main` builds and deploys (`.github/workflows/deploy.yml`). `base` is relative, so any repo name works.

## Controls
| | P1 | P2 |
|-|-|-|
|Move/Jump/Crouch|A D / W / S|Arrows|
|Light/Heavy/Special|F / G / R|Numpad 1 / 2 / 3|
|Block|Left Shift|Numpad 0|

Gamepads (auto-assigned: first pad = P1, second = P2): D-pad/stick move, A light, X heavy, Y special, B or stick-up jump, bumpers/triggers block.
Menus: W/S or arrows + F/Enter to confirm, Esc back. In match: P pause, Esc quit. M toggles sound.

## Adding a fighter
Add an entry to `src/characters.js` (stats, colors, three moves). Sprites are drawn procedurally in `src/sprites.js` from those fields; the roster, select screen and AI pick it up automatically.

## v1.1: eight fighters + controllers
Fighters: Junior, Marty, Raphy (belly flop), Esa (green gas), Sydney (rapid fire), Sam Li (spinning kicks), Edson (wrestling slam, unblockable), Mom (electric shock).
Stats (speed/attack/health, 1-10) live in `src/characters.js` and drive walk speed, damage and HP.

Controllers: plug in or turn on pads at any time (press a button if Chrome doesn't see it). The first pad becomes P1, the second P2; unplug/replug is handled live (match auto-pauses). Keyboard always works for both players, so pad-vs-keyboard works. Back/Select swaps player slots (use it to make a single pad Player 2).
Buttons (Xbox/PlayStation): stick or D-pad move, A/Cross light, X/Square heavy, Y/Triangle special, B/Circle or stick-up jump, stick-down crouch, bumpers/triggers block.

## Attack set
Standing: Light = punch, Heavy = kick. Holding down: low punch and sweeping kick (low hitbox, trips the opponent, can be jumped over). In the air: flying punch and flying kick (one per jump). Variants are generated from each fighter's light/heavy in `src/characters.js` (`addVariants`).

## Detailed sprites
Fighters with `detail: true` and a `pal` palette in `src/characters.js` use `src/detailed.js` (outlines, shading, face). Junior (62px), Marty (68px), Sydney (66px, flared jeans), Mom (58px, flared dress skirt) and Raphy (62px, bare-chested sumo with belly flop pose) use it (jointed skeletons, realistic proportions; per-fighter `body` sizes); other fighters still use the simpler renderer in `src/sprites.js`.

## v1.2: online play (peer-to-peer)
Main menu > **PLAY ONLINE**. One player picks **HOST GAME** and gets a 4-letter room code (click the lobby screen to copy an invite link of the form `https://<you>.github.io/<repo>/?room=CODE`). The other player opens that link, or picks **JOIN GAME** and types the code. Host is P1, guest is P2; each player picks their own fighter and both press Light to ready up.

How it works: no game server is needed, so it runs on GitHub Pages. Browsers connect directly over WebRTC (PeerJS, loaded from unpkg; its free public broker is used only to introduce the two browsers). Only button states are exchanged and both browsers run the identical simulation (input-delay lockstep, 3 frames). Local controls are the usual keyboard (either layout) or a gamepad. Esc leaves the match.
Limits: needs internet access to unpkg.com and 0.peerjs.com; a few strict corporate/school networks block WebRTC (no TURN relay is configured). Gameplay slows if the connection stalls rather than desyncing.

## v1.3: mobile / touch
On phones and tablets (touch screens) on-screen controls appear automatically: D-pad on the left (up = jump, down = crouch), PUNCH / KICK / SPEC / BLOCK on the right, MENU (= Esc) at the bottom centre. Hold DOWN + BLOCK to crouch-block, DOWN + PUNCH/KICK for low attacks, like on keyboard. Play in landscape. Touch controls drive player 1, so use them for CPU matches and online play (one phone cannot do local two-player). Tap menu items directly or use the D-pad + PUNCH to confirm.

## v1.4: remap controls
Main menu > **REMAP CONTROLS**. Two pages (Tab switches): **Keyboard** (every action for P1 and P2) and **Gamepad** (punch, kick, special, jump, block; stick/d-pad always move). Up/Down pick a row, Left/Right switch player, Enter (or the punch button) then press the new key/button, Del resets one binding, Esc cancels or leaves. Clicking a row works too. If you pick a key that's already used, the two actions swap. Reserved keys: Esc, Enter, Tab, P (pause), M (sound); gamepad Back/Select swaps player slots. Bindings are saved in the browser (localStorage) and shown on the CONTROLS screen. Online play uses your own bindings, and your opponent never needs the same ones.
