const formulario = document.getElementById("busqueda");
const ciudadInput = document.getElementById("ciudad");
const botonBuscar = document.getElementById("buscar");
const estado = document.getElementById("estado");
const resultado = document.getElementById("resultado");
const ubicacion = document.getElementById("ubicacion");
const descripcion = document.getElementById("descripcion");
const temperatura = document.getElementById("temperatura");
const sensacion = document.getElementById("sensacion");
const humedad = document.getElementById("humedad");
const viento = document.getElementById("viento");
const actualizado = document.getElementById("actualizado");

const descripcionesTiempo = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada intensa",
  71: "Nevada ligera",
  73: "Nevada moderada",
  75: "Nevada intensa",
  77: "Granos de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve intensos",
  95: "Tormenta",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo intenso",
};

function validarNumero(valor, nombre) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new Error(`La API no devolvió un valor válido para ${nombre}.`);
  }
  return valor;
}

async function buscarTiempo(nombreCiudad) {
  estado.textContent = "Buscando el tiempo…";
  resultado.hidden = true;
  botonBuscar.disabled = true;
  ciudadInput.disabled = true;

  try {
    const parametrosCiudad = new URLSearchParams({
      name: nombreCiudad,
      count: "1",
      language: "es",
      format: "json",
    });
    const respuestaCiudad = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${parametrosCiudad}`,
    );
    if (!respuestaCiudad.ok) {
      throw new Error("No se pudo consultar el servicio de búsqueda de ciudades.");
    }

    const datosCiudad = await respuestaCiudad.json();
    const ciudad = datosCiudad.results?.[0];
    if (!ciudad) {
      throw new Error(`No se encontró la ciudad «${nombreCiudad}». Comprueba el nombre e inténtalo de nuevo.`);
    }

    const parametrosTiempo = new URLSearchParams({
      latitude: ciudad.latitude,
      longitude: ciudad.longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      timezone: "auto",
    });
    const respuestaTiempo = await fetch(
      `https://api.open-meteo.com/v1/forecast?${parametrosTiempo}`,
    );
    if (!respuestaTiempo.ok) {
      throw new Error("No se pudo consultar el servicio del tiempo.");
    }

    const datosTiempo = await respuestaTiempo.json();
    const actual = datosTiempo.current;
    if (!actual) {
      throw new Error("El servicio no devolvió datos actuales para esta ciudad.");
    }
    if (typeof actual.time !== "string") {
      throw new Error("El servicio no devolvió la hora de actualización.");
    }

    ubicacion.textContent = [ciudad.name, ciudad.admin1, ciudad.country]
      .filter(Boolean)
      .join(", ");
    descripcion.textContent =
      descripcionesTiempo[actual.weather_code] ?? "Estado del tiempo no disponible";
    temperatura.textContent = `${validarNumero(actual.temperature_2m, "temperatura").toFixed(1)} °C`;
    sensacion.textContent = `${validarNumero(actual.apparent_temperature, "sensación térmica").toFixed(1)} °C`;
    humedad.textContent = `${validarNumero(actual.relative_humidity_2m, "humedad")} %`;
    viento.textContent = `${validarNumero(actual.wind_speed_10m, "viento")} km/h`;
    actualizado.textContent = `Datos actuales: ${actual.time.replace("T", " ")} (hora local)`;
    resultado.hidden = false;
    estado.textContent = "";
  } catch (error) {
    console.error("Error al obtener el tiempo:", error);
    if (error instanceof TypeError) {
      estado.textContent =
        "No se pudo conectar con el servicio del tiempo. Comprueba tu conexión e inténtalo de nuevo.";
    } else if (error instanceof SyntaxError) {
      estado.textContent =
        "El servicio del tiempo devolvió una respuesta no válida. Inténtalo de nuevo más tarde.";
    } else {
      estado.textContent = error.message || "Ha ocurrido un error al consultar el tiempo.";
    }
  } finally {
    botonBuscar.disabled = false;
    ciudadInput.disabled = false;
    ciudadInput.focus();
  }
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nombreCiudad = ciudadInput.value.trim();
  if (!nombreCiudad) {
    estado.textContent = "Escribe el nombre de una ciudad para buscarla.";
    ciudadInput.focus();
    return;
  }

  buscarTiempo(nombreCiudad);
});

buscarTiempo(ciudadInput.value.trim());
