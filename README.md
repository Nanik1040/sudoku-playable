# Sudoku Playable

A small Sudoku game aimed at [YouTube Playables](https://developers.google.com/youtube/gaming/playables). It runs in any browser today. YouTube publishing is invite-only and comes after the game is playable.

## Run it locally

From this folder:

```bash
python3 -m http.server 5173
```

Open http://localhost:5173

- **4×4** is the on-ramp. **Easy / Medium / Hard** are classic 9×9.
- Tap a cell, then a number. **Notes** is pencil marks. **N** toggles notes on a keyboard.
- Progress saves in the browser. On YouTube it will use Playables cloud save.

## Path onto YouTube

1. Keep playing and fixing this game until it feels good on a phone.
2. Fill out the [Playables interest form](https://developers.google.com/youtube/gaming/playables) (linked from the official docs). You can apply with a local/hosted demo URL.
3. If YouTube does not accept a direct account, a Playables publisher can submit it for you.
4. After access: zip this folder, upload in the Developer Portal, test on desktop + Android + iOS YouTube, submit for certification.

Do not add your own ads, in-app purchases, or calls to other websites. Playables hosts the files and only allows YouTube ads through their SDK.
