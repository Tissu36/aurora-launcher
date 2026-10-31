# Aurora Launcher · Chapter 5 Season 1 (28.00)
Made by Whykrushy · Aur Krushy

## Code + test on Chromebook (Linux)
1. Settings → Advanced → Developers → Linux development environment → Turn on.
2. Open the Terminal app and run:
   sudo apt update && sudo apt install -y unzip libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   (close + reopen Terminal)
   nvm install 20
3. Drag aurora-launcher.zip from Files into "Linux files", then:
   unzip aurora-launcher.zip -d aurora-launcher && cd aurora-launcher
   npm install
   npm start
The launcher opens. Play can't start Fortnite on a Chromebook; that part runs on Windows.

## Build the Windows .exe (no Windows needed)
1. Push this folder to a GitHub repo.
2. Repo → Actions → "Build Windows launcher" → Run workflow.
3. When it's green, open the run → Artifacts → Aurora-Launcher-Windows → that's the installer.
Tip: push a tag like v1.0.0 and it also drops the .exe into Releases automatically.

## First launch on Windows
- Library → Choose build folder → the 28.00 folder (has FortniteGame + Engine inside).
- Settings → Display name, Backend URL (default http://127.0.0.1:3551).
- Play.
