/*
  Hier beheer je alle markers.

  x en y zijn pixelcoördinaten op de afbeelding map.png.
  De afbeelding is 2048 x 2048 pixels.

  Tip om een nieuwe locatie te bepalen:
  - Open de map in de browser.
  - Klik op een plek op de kaart.
  - In de console verschijnt de x/y positie die je kunt overnemen.
*/

const MAP_MARKERS = [
  {
    id: "airport",
    title: "Los Santos International Airport",
    type: "Transport",
    x: 690,
    y: 1810,
    description: "Vliegveld onderaan de kaart."
  },
  {
    id: "port",
    title: "Port of South Los Santos",
    type: "Haven",
    x: 1115,
    y: 1810,
    description: "Havengebied aan de zuidkant van Los Santos."
  },
  {
    id: "downtown",
    title: "Downtown Los Santos",
    type: "Stad",
    x: 900,
    y: 1530,
    description: "Centrum van de stad."
  },
  {
    id: "sandy-shores",
    title: "Sandy Shores",
    type: "Dorp",
    x: 1250,
    y: 735,
    description: "Plaats aan de zuidkant van de Alamo Sea."
  },
  {
    id: "paleto-bay",
    title: "Paleto Bay",
    type: "Dorp",
    x: 960,
    y: 255,
    description: "Plaats in het noorden van de map."
  },
  {
    id: "military-base",
    title: "Fort Zancudo",
    type: "Basis",
    x: 540,
    y: 835,
    description: "Militaire basis aan de westkant van de map."
  }
];
