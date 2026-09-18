(function () {
  "use strict";


  /* ==========================================================
     1. EVENTOS DE PRUEBA
     ========================================================== */

  const EVENTS = {

    "zayre-abraham": {
      names: "Zayre & Abraham",
      date: "2027-02-28",

      photos: {

        "IF-027": {
          code: "IF-027",

          /*
            IMPORTANTE:
            La fotografía IF-027-01.jpg fue eliminada.
            Esta ruta es solamente un marcador para la
            siguiente fase.
          */

          file: ""
        }

      }
    },


    "evento-prueba": {
      names: "Evento de Prueba",
      date: "2026-10-10",

      photos: {

        "TEST-001": {
          code: "TEST-001",
          file: ""
        }

      }
    }

  };


  /* ==========================================================
     2. OBTENER EVENTO DESDE LA URL
     ========================================================== */

  const params = new URLSearchParams(
    window.location.search
  );

  const eventId =
    params.get("event") || "zayre-abraham";


  const eventData =
    EVENTS[eventId];


  /* ==========================================================
     3. REFERENCIAS DEL DOM
     ========================================================== */

  const eventName =
    document.getElementById("event-name");

  const eventDate =
    document.getElementById("event-date");

  const form =
    document.getElementById("lookup-form");

  const input =
    document.getElementById("code-input");

  const errorEl =
    document.getElementById("code-error");

  const screenSearch =
    document.getElementById("screen-search");

  const screenPortrait =
    document.getElementById("screen-portrait");

  const stage =
    document.querySelector(".stage");

  const portraitCode =
    document.getElementById("portrait-code");

  const portraitImage =
    document.getElementById("portrait-image");

  const downloadBtn =
    document.getElementById("download-btn");

  const backBtn =
    document.getElementById("back-btn");


  /* ==========================================================
     4. VALIDAR EVENTO
     ========================================================== */

  if (!eventData) {

    eventName.textContent =
      "Event not found";

    eventDate.textContent =
      "";

    form.style.display =
      "none";

    return;
  }


  /* ==========================================================
     5. MOSTRAR INFORMACIÓN DEL EVENTO
     ========================================================== */

  eventName.textContent =
    eventData.names;


  const formattedDate =
    new Date(eventData.date + "T00:00:00")
      .toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });


  eventDate.textContent =
    formattedDate
      .replaceAll("/", " · ");


  /* ==========================================================
     6. NORMALIZAR CÓDIGO
     ========================================================== */

  function normalizeCode(value) {

    if (!value) {
      return "";
    }


    return value
      .toUpperCase()
      .replace(/[\s·.\-_]+/g, "");
  }


  /* ==========================================================
     7. BUSCAR FOTOGRAFÍA
     ========================================================== */

  function findPhoto(code) {

    const normalized =
      normalizeCode(code);


    const photos =
      eventData.photos;


    for (const key in photos) {

      if (
        normalizeCode(key) === normalized
      ) {

        return photos[key];

      }

    }


    return null;
  }


  /* ==========================================================
     8. MOSTRAR FOTOGRAFÍA
     ========================================================== */

  function showPhoto(photo) {

    portraitCode.textContent =
      photo.code.replace("-", " · ");


    if (!photo.file) {

      errorEl.textContent =
        "La fotografía todavía no está disponible en este prototipo.";

      return;
    }


    portraitImage.src =
      photo.file;


    portraitImage.alt =
      `Fotografía LUMORA — ${photo.code}`;


    downloadBtn.dataset.photoPath =
      photo.file;


    downloadBtn.dataset.fileName =
      photo.file.split("/").pop();


    screenSearch.setAttribute(
      "aria-hidden",
      "true"
    );


    screenPortrait.setAttribute(
      "aria-hidden",
      "false"
    );


    stage.dataset.current =
      "portrait";


    screenPortrait.style.animation =
      "none";

    void screenPortrait.offsetWidth;

    screenPortrait.style.animation =
      "";

  }


  /* ==========================================================
     9. FORMULARIO
     ========================================================== */

  form.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      errorEl.textContent =
        "";


      const photo =
        findPhoto(input.value);


      if (!photo) {

        errorEl.textContent =
          "We couldn't find a portrait with that code.";

        return;
      }


      showPhoto(photo);

    }
  );


  /* ==========================================================
     10. REGRESAR
     ========================================================== */

  backBtn.addEventListener(
    "click",
    function () {

      screenPortrait.setAttribute(
        "aria-hidden",
        "true"
      );


      screenSearch.setAttribute(
        "aria-hidden",
        "false"
      );


      stage.dataset.current =
        "search";


      errorEl.textContent =
        "";


      input.value =
        "";


      input.focus();

    }
  );


  /* ==========================================================
     11. DESCARGA
     ========================================================== */

  downloadBtn.addEventListener(
    "click",
    function () {

      const path =
        downloadBtn.dataset.photoPath;


      const fileName =
        downloadBtn.dataset.fileName;


      if (!path) {
        return;
      }


      const link =
        document.createElement("a");


      link.href =
        path;


      link.download =
        fileName || "lumora-photo.jpg";


      document.body.appendChild(link);


      link.click();


      document.body.removeChild(link);

    }
  );

})();
