/* ==========================================================
   LUMORA — PHOTO STUDIO
   Prototipo funcional — Pantalla de evento individual
   ==========================================================

   Este archivo simula, con datos locales, lo que en producción
   será una consulta a un backend. Toda la lógica de "negocio"
   está separada de la manipulación del DOM para poder sustituir
   fácilmente la fuente de datos más adelante.
*/

(function () {
  "use strict";

  /* ----------------------------------------------------------
     1. DATOS SIMULADOS DEL EVENTO
     ------------------------------------------------------------
     >>> PUNTO DE CONEXIÓN FUTURO: BASE DE DATOS / API <<<

     Hoy: un objeto local con los invitados válidos del evento.

     Después, esto puede sustituirse por, por ejemplo:
       const res = await fetch(`/api/events/${eventSlug}/guests/${code}`);
       const guest = await res.json();

     o por una consulta a Google Sheets vía un webhook de n8n:
       const res = await fetch(
         `https://n8n.tu-dominio.com/webhook/lumora/lookup?event=${eventSlug}&code=${code}`
       );

     El "slug" del evento (ej. "zayre-abraham") hoy es implícito
     porque esta página sirve un solo evento. Cuando existan
     múltiples eventos (/event/zayre-abraham/, /event/evento-002/),
     ese slug puede leerse desde la URL o inyectarse en el HTML
     al generar la página, y usarse aquí para filtrar la consulta.
  ---------------------------------------------------------- */
  const EVENT_DATA = {
    slug: "zayre-abraham",
    names: "Zayre & Abraham",
    date: "2027-02-28",

    // Invitados válidos para este prototipo. La clave es el
    // código ya normalizado (formato canónico "IF-027").
    guests: {
      "IF-027": {
        code: "IF-027",
        photoFile: "IF-027-01.jpg",
      },
    },
  };

  /* ----------------------------------------------------------
     2. ALMACENAMIENTO DE FOTOGRAFÍAS
     ------------------------------------------------------------
     >>> PUNTO DE CONEXIÓN FUTURO: ALMACENAMIENTO EXTERNO <<<

     Hoy: las fotografías viven localmente en /assets/photos/.

     Después, PHOTO_BASE_PATH puede apuntar a un bucket externo
     (S3, Google Cloud Storage, Cloudinary, Google Drive, etc.),
     por ejemplo:
       const PHOTO_BASE_PATH = "https://cdn.lumora.mx/events/zayre-abraham/";

     getPhotoPath() es el único lugar que necesita cambiar para
     migrar de archivos locales a almacenamiento remoto.
  ---------------------------------------------------------- */
  const PHOTO_BASE_PATH = "assets/photos/";

  function getPhotoPath(fileName) {
    return PHOTO_BASE_PATH + fileName;
  }

  /* ----------------------------------------------------------
     3. NORMALIZACIÓN DE CÓDIGOS
     ------------------------------------------------------------
     Acepta variantes como IF027, IF-027, IF 027, IF · 027 (o
     minúsculas, o con espacios extra) y las convierte todas al
     formato canónico "IF-027".
  ---------------------------------------------------------- */
  function normalizeCode(rawInput) {
    if (!rawInput) return "";

    const cleaned = rawInput
      .toUpperCase()
      // Unifica separadores comunes (espacio, punto medio, guion) a nada,
      // dejando solo letras y números para analizar el patrón.
      .replace(/[\s·.\-_]+/g, "");

    // Espera un patrón de letras seguidas de números, ej. "IF027".
    const match = cleaned.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const [, prefix, digits] = match;
    return `${prefix}-${digits}`;
  }

  /* ----------------------------------------------------------
     4. CONSULTA DEL INVITADO
     ------------------------------------------------------------
     Hoy: búsqueda síncrona en el objeto EVENT_DATA.guests.

     Después, esta función puede volverse async y hacer el fetch
     real descrito en la sección 1, manteniendo la misma firma
     (recibe un código, devuelve los datos del invitado o null),
     de forma que el resto del código no necesite cambiar.
  ---------------------------------------------------------- */
  function findGuest(canonicalCode) {
    return EVENT_DATA.guests[canonicalCode] || null;
  }

  /* ----------------------------------------------------------
     5. REFERENCIAS AL DOM
  ---------------------------------------------------------- */
  const stage = document.querySelector(".stage");
  const screenSearch = document.getElementById("screen-search");
  const screenPortrait = document.getElementById("screen-portrait");

  const form = document.getElementById("lookup-form");
  const input = document.getElementById("code-input");
  const errorEl = document.getElementById("code-error");

  const portraitCodeEl = document.getElementById("portrait-code");
  const portraitImageEl = document.getElementById("portrait-image");
  const downloadBtn = document.getElementById("download-btn");
  const backBtn = document.getElementById("back-btn");

  /* ----------------------------------------------------------
     6. CAMBIO DE PANTALLA
  ---------------------------------------------------------- */
  function showPortraitScreen(guest) {
    // Código mostrado con el mismo formato visual que el resto
    // de la marca: "IF · 027".
    portraitCodeEl.textContent = guest.code.replace("-", " · ");

    const photoPath = getPhotoPath(guest.photoFile);
    portraitImageEl.src = photoPath;
    portraitImageEl.alt = `Retrato de estudio LUMORA — código ${guest.code}`;

    downloadBtn.dataset.photoPath = photoPath;
    downloadBtn.dataset.fileName = guest.photoFile;

    screenSearch.setAttribute("aria-hidden", "true");
    screenPortrait.setAttribute("aria-hidden", "false");
    stage.dataset.current = "portrait";

    // Reinicia la animación de aparición para la nueva pantalla.
    screenPortrait.style.animation = "none";
    // Forzar reflow para poder reiniciar la animación.
    void screenPortrait.offsetWidth;
    screenPortrait.style.animation = "";
  }

  function showSearchScreen() {
    screenPortrait.setAttribute("aria-hidden", "true");
    screenSearch.setAttribute("aria-hidden", "false");
    stage.dataset.current = "search";

    errorEl.textContent = "";
    input.value = "";
    input.focus();

    screenSearch.style.animation = "none";
    void screenSearch.offsetWidth;
    screenSearch.style.animation = "";
  }

  /* ----------------------------------------------------------
     7. MANEJO DEL FORMULARIO
  ---------------------------------------------------------- */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorEl.textContent = "";

    const canonicalCode = normalizeCode(input.value);

    if (!canonicalCode) {
      errorEl.textContent = "Please enter a valid code, like IF-027.";
      return;
    }

    // >>> Si más adelante findGuest() se vuelve async (fetch real),
    // este bloque debe convertirse en un await dentro de una función
    // async, mostrando aquí un estado de carga si se desea.
    const guest = findGuest(canonicalCode);

    if (!guest) {
      errorEl.textContent = `We couldn't find a portrait for ${canonicalCode}.`;
      return;
    }

    showPortraitScreen(guest);
  });

  backBtn.addEventListener("click", showSearchScreen);

  /* ----------------------------------------------------------
     8. DESCARGA DE LA FOTOGRAFÍA
     ------------------------------------------------------------
     Hoy: descarga directa del archivo local mediante un enlace
     temporal con el atributo "download".

     Después, esto puede apuntar a una URL firmada de almacenamiento
     externo, o pasar primero por un endpoint que registre la
     descarga (por ejemplo, disparando un flujo de n8n que
     actualice un contador en Google Sheets).
  ---------------------------------------------------------- */
  downloadBtn.addEventListener("click", function () {
    const photoPath = downloadBtn.dataset.photoPath;
    const fileName = downloadBtn.dataset.fileName || "lumora-portrait.jpg";

    if (!photoPath) return;

    const link = document.createElement("a");
    link.href = photoPath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
})();
