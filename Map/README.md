# Interactieve kaart met kleuren en zichtbaarheid

Deze map bevat een statische interactieve kaart die geschikt is voor GitHub Pages.

## Bestanden

- `index.html` — de pagina
- `app.js` — laadt de kaart, afbeelding en markers
- `styles.css` — opmaak, inclusief gekleurde markers en de toon/verberg-knoppen
- `map.png` — jouw kaartafbeelding
- `markers.json` — markerdata

## Markerbestand aanpassen

`markers.json` gebruikt x/y-coördinaten in pixels vanaf linksboven op de afbeelding.

Per marker kun je een kleur instellen met `color`:

```json
[
  {
    "name": "Mijn marker",
    "x": 958,
    "y": 259,
    "description": "Optionele tekst",
    "color": "#e74c3c",
    "visible": true
  }
]
```

Je kunt hexkleuren gebruiken, zoals:

```json
"color": "#e74c3c"
```

Gewone CSS-kleurnamen werken ook:

```json
"color": "red"
```

Of rgb:

```json
"color": "rgb(52, 152, 219)"
```

Laat je `color` weg, dan gebruikt de kaart standaard rood.

## Markers standaard verbergen

Een marker is standaard zichtbaar. Wil je dat een marker bij het openen van de kaart standaard verborgen is, zet dan `visible` op `false`:

```json
{
  "name": "Geheime locatie",
  "x": 1000,
  "y": 1200,
  "color": "#9b59b6",
  "visible": false
}
```

Dit kan ook met:

```json
"hidden": true
```

In de zijbalk kan de gebruiker elke marker apart aan- of uitvinken. Met **Alles tonen** en **Alles verbergen** kun je alle markers tegelijk aan- of uitzetten.

De zichtbaarheid wordt per browser onthouden met `localStorage`. Daardoor blijven jouw keuzes bewaard na het verversen van de pagina.

## Stabiele marker-id gebruiken

Als je veel markers toevoegt of namen wijzigt, is het handig om een vaste `id` te gebruiken. Daarmee blijft de opgeslagen zichtbaarheid aan dezelfde marker gekoppeld:

```json
{
  "id": "politie-sandy-shores",
  "name": "Politie Sandy Shores",
  "x": 1257,
  "y": 774,
  "color": "#3498db"
}
```

## Coördinaten bepalen

Klik in de webpagina op de kaart om de x/y-coördinaten van dat punt te zien. Je kunt het getoonde JSON-object kopiëren naar `markers.json`.

## Optioneel: eigen icon-afbeelding

De code ondersteunt nog steeds eigen icon-afbeeldingen. Als je `icon` invult, krijgt die afbeelding voorrang op de gekleurde marker:

```json
{
  "name": "Vliegveld",
  "x": 820,
  "y": 1788,
  "color": "#9b59b6",
  "icon": "icons/airport.svg",
  "iconSize": [36, 36]
}
```

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
