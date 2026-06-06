# Socheata Thai Portfolio

This project is a static personal portfolio website for `socheatathai.github.io`.

## Project Structure

```text
socheatathai.github.io/
|-- index.html         # Main page
|-- css/
|   `-- style.css      # Site styles
|-- js/
|   `-- main.js        # UI behavior and content rendering
|-- data/
|   `-- content.json   # Portfolio content in English and Khmer
|-- images/            # Profile, school, and other site images
|-- .vscode/           # Editor settings
|-- .nuxt/             # Generated folder from earlier Nuxt work
|-- .output/           # Generated build output from earlier Nuxt work
`-- README.md
```

## Main Files

- `index.html`: Defines the page structure and loads the CSS and JavaScript.
- `css/style.css`: Controls layout, colors, animations, and responsive styling.
- `js/main.js`: Loads `data/content.json`, renders sections, and handles language switching and navigation behavior.
- `data/content.json`: Stores portfolio text, project items, experience, education, and contact data.

## How To Run Locally

Because the site loads `data/content.json` with `fetch()`, you should run it through a local web server. Opening `index.html` directly from the file system may prevent the content from loading correctly.

### Option 1: VS Code Live Server

1. Open the project in VS Code.
2. Install the `Live Server` extension if needed.
3. Right-click `index.html`.
4. Choose `Open with Live Server`.

### Option 2: Python

If Python is installed, run this from the project root:

```powershell
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

### Option 3: Node.js

If Node.js is installed, run:

```powershell
npx serve .
```

Then open the local URL shown in the terminal.

## How To Update Content

- Edit `data/content.json` to update text, projects, experience, education, and contact links.
- Replace files inside `images/` if you want to update profile or school images.
- Edit `css/style.css` for design changes.
- Edit `js/main.js` for behavior changes.
