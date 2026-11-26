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
Fighters: Junior, Marty, Raphy (belly flop), Esa (green gas), Sydney (rapid fire), Sami (spinning kicks), Edson (wrestling slam, unblockable), Mom (electric shock).
Stats (speed/attack/health, 1-10) live in `src/characters.js` and drive walk speed, damage and HP.

Controllers: plug in or turn on pads at any time (press a button if Chrome doesn't see it). The first pad becomes P1, the second P2; unplug/replug is handled live (match auto-pauses). Keyboard always works for both players, so pad-vs-keyboard works. Back/Select swaps player slots (use it to make a single pad Player 2).
Buttons (Xbox/PlayStation): stick or D-pad move, A/Cross light, X/Square heavy, Y/Triangle special, B/Circle or stick-up jump, stick-down crouch, bumpers/triggers block.

## Attack set
Standing: Light = punch, Heavy = kick. Holding down: low punch and sweeping kick (low hitbox, trips the opponent, can be jumped over). In the air: flying punch and flying kick (one per jump). Variants are generated from each fighter's light/heavy in `src/characters.js` (`addVariants`).

## Detailed sprites
Fighters with `detail: true` and a `pal` palette in `src/characters.js` use `src/detailed.js` (outlines, shading, face). Junior (62px), Marty (68px), Sydney (66px, flared jeans), Mom (58px, flared dress skirt) and Raphy (62px, bare-chested sumo with belly flop pose) use it (jointed skeletons, realistic proportions; per-fighter `body` sizes); Esa, Sami (round glasses, long straight hair, flared jeans) and Edson (cap, glasses, goatee, stocky build, baggy cargo pants) use it too. Any fighters left without `detail: true` use the simpler renderer in `src/sprites.js`.

## v1.2: online play (peer-to-peer)
Main menu > **PLAY ONLINE**. One player picks **HOST GAME** and gets a 4-letter room code (click the lobby screen to copy an invite link of the form `https://<you>.github.io/<repo>/?room=CODE`). The other player opens that link, or picks **JOIN GAME** and types the code. Host is P1, guest is P2; each player picks their own fighter and both press Light to ready up.

How it works: no game server is needed, so it runs on GitHub Pages. Browsers connect directly over WebRTC (PeerJS, loaded from unpkg; its free public broker is used only to introduce the two browsers). Only button states are exchanged and both browsers run the identical simulation (input-delay lockstep, 3 frames). Local controls are the usual keyboard (either layout) or a gamepad. Esc leaves the match.
Limits: needs internet access to unpkg.com and 0.peerjs.com; a few strict corporate/school networks block WebRTC (no TURN relay is configured). Gameplay slows if the connection stalls rather than desyncing.

## v1.3: mobile / touch
On phones and tablets (touch screens) on-screen controls appear automatically: D-pad on the left (up = jump, down = crouch), PUNCH / KICK / SPEC / BLOCK on the right, MENU (= Esc) at the bottom centre. Hold DOWN + BLOCK to crouch-block, DOWN + PUNCH/KICK for low attacks, like on keyboard. Play in landscape. Touch controls drive player 1, so use them for CPU matches and online play (one phone cannot do local two-player). Tap menu items directly or use the D-pad + PUNCH to confirm.

## v1.4: remap controls
Main menu > **REMAP CONTROLS**. Two pages (Tab switches): **Keyboard** (every action for P1 and P2) and **Gamepad** (punch, kick, special, jump, block; stick/d-pad always move). Up/Down pick a row, Left/Right switch player, Enter (or the punch button) then press the new key/button, Del resets one binding, Esc cancels or leaves. Clicking a row works too. If you pick a key that's already used, the two actions swap. Reserved keys: Esc, Enter, Tab, P (pause), M (sound); gamepad Back/Select swaps player slots. Bindings are saved in the browser (localStorage) and shown on the CONTROLS screen. Online play uses your own bindings, and your opponent never needs the same ones.

## v1.5: combos
Chain combos for every fighter (`src/combos.js`). When a move **connects** (not blocked) you can cancel it into the next move; presses are buffered for 10 frames, so you can mash. Default chains: Light -> Light / Heavy / low light / Special, low light -> low light / sweep / Light / Heavy, Heavy -> Special. Finish a chain with the right sequence and the last move becomes a **finisher** (bonus damage, knockback or launch) with its name shown under the health bar, plus a HITS counter. Later moves in a chain do slightly less damage, and chains max out at 6 moves. Button maps are unchanged.
Fighters have 3 combos each. Sami can also chain kick into kick (Light, Heavy, Heavy, Heavy = Tornado Kick). Edit `COMBOS` in `src/combos.js` to change them: `seq` (move keys), `dmg`/`kb` multipliers, `launch`, `final`. The CPU chains and goes for combos too.

## Combos and finisher animations
Chain cancels live in `src/combos.js`: when a move connects you can cancel into the next one, and finishing one of a fighter's listed sequences makes the last move a FINISHER (bonus damage, launch, name banner).
- Light, Light, Heavy is the basic string; each fighter has three combos (crouch strings, special finishers, Sami's kick strings).
- Holding DOWN the whole time works for crouch combos. You also get 6 extra frames after a move ends to keep a combo going, and button presses are buffered for 14 frames (also during hit-stop).
- Every combo has its own finisher animation, set with `anim` (`spin`, `flip`, `rush`, `slam`, `burst`, `shake`), `col`, `fx` (`star`, `gas`, `bolt`, `flame`, `dust`) and optional `turns`, `lift`, `shake`, `stop` in `src/combos.js`. The effects (afterimage trails, aura, hit-stop, screen shake, flash, shockwave, particles, banner) are in `src/comboFx.js`.

## Throw, blocking and balance (v1.5)
- **Throw:** press Light + Heavy together (a 3-frame gap still counts; touch has a THROW button). It beats blocking but has a slow wind-up (14 frames) and a very long recovery (36 frames), so it can't be spammed, and it only grabs grounded opponents who aren't in hit-stun. It has its own reach-in / heave / follow-through animation.
- **Blocking:** works from either side, and every blocked hit shoves the defender back. If the defender is in a corner (or the attacker jumped in), the attacker is pushed away instead, so nobody gets stuck in a corner.
- **Flying punch/kick:** shorter hit window, lower kick damage, and landing lag (6 / 11 frames) so you can't chain jump-ins. Define the numbers in `addVariants` in `src/characters.js` (`a`, `land`, `dmg`).
- **Sami:** kick damage, kick-chain finishers and her multi-kick special were reduced.

## Fighter heights (v1.6)
Heights are set by `h` (hitbox) and `body` (drawn proportions: `leg`, `arm`, `torso`, `w`) in `src/characters.js`. Drawn heights: Junior 64, Esa 64, Raphy 66, Edson 66, Sydney 60, Sami 60, Mom 63, Marty 75.
To resize a fighter keep the shape and scale `leg`, `arm` and `torso` together; drawn height is about `2 x leg + torso + 17`.

## New fighters (v1.7)
- **Kuya D:** quick + strong but weak defense. Speed 9 / attack 9 / health 4, and he takes 20% extra damage (`taken: 1.2` in `src/characters.js`). Special: a basketball chest pass. Combos: CROSSOVER (Light, Light, Heavy), DUNKED ON (crouch Light, Light, Heavy; launches), HARD PASS (Light, Heavy, Special).
- **Uncle Dandy:** all-rounder with Mom's stats (speed 6 / attack 7 / health 8), same height as Junior. White collared shirt, black jeans, black sunglasses. Special: a flurry of quick alternating punches. Combos: BANK SHOT (Light, Light, Heavy), SAY UNCLE (crouch Light, Light, Heavy; launches), UBER ATTACK (Light, Heavy, Special).
- **Auntie Sheila:** the same height as Uncle Dandy; quick and balanced (speed 9 / attack 7 / health 7). Long dark hair, teal glasses, pink blouse, black slacks. Special: throws a graded test paper (red F). Combos: TEACHER'S INTUITION (Light, Light, Heavy), DETENTION (crouch Light, Light, Heavy; launches), PRINCIPAL'S OFFICE (Light, Heavy, Special).
- **Sherell:** same speed / strength / health as Esa (6 / 7 / 7). Music + acting powers: her special is a sonic-scream sound wave. Combos: SONIC SCREAM (Light, Light, Special), OVERREHEARSAL (Light, Light, Heavy), GRAND FINALE (Light, Heavy, Special).
- Finisher styles added: `juke` (crossover shuffle), `slam` with a `lift` height (dunk), and `ball` / `note` particles. Sprite features added to `src/detailed.js`: `fade`, `goatee`, `jersey`, `sleeveless`, `sock`, `shortsTrim`, `rainbow`.
