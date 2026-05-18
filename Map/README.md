# Interactieve kaart met GitHub Pages

Deze map bevat een statische interactieve kaart die geschikt is voor GitHub Pages.

## Bestanden

- `index.html` — de pagina
- `app.js` — laadt de kaart, afbeelding en markers
- `styles.css` — opmaak
- `map.png` — jouw kaartafbeelding
- `markers.json` — markerdata

## Markerbestand aanpassen

`markers.json` gebruikt x/y-coördinaten in pixels vanaf linksboven op de afbeelding.

Voorbeeld:

```json
[
  {
    "name": "Mijn marker",
    "x": 958,
    "y": 259,
    "description": "Optionele tekst"
  }
]
```

Klik in de webpagina op de kaart om de x/y-coördinaten van dat punt te zien. Je kunt het getoonde JSON-object kopiëren naar `markers.json`.

## Lokaal testen

Open de map in een terminal en start een kleine webserver:

```bash
python -m http.server 8000
```

Open daarna:

```text
http://localhost:8000
```

Open `index.html` liever niet direct via `file://`, want browsers blokkeren dan vaak het uitlezen van `markers.json`.

## Publiceren op GitHub Pages

1. Maak een repository op GitHub.
2. Upload alle bestanden uit deze map naar de repository.
3. Ga in GitHub naar **Settings → Pages**.
4. Kies **Deploy from a branch**.
5. Kies branch **main** en folder **/root**.
6. Sla op en open de URL die GitHub Pages toont.
