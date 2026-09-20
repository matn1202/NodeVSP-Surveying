// Every participant-visible string. Spanish is the default, English via ?lang=en.
// HTML carries keys (data-i18n, data-i18n-attr), never text. `{name}` is filled by t().
export const copy = {
  es: {
    'brand': 'NodeVSP · Encuesta',
    'nav.credits': 'Créditos',
    'nav.theme': 'Cambiar tema claro/oscuro',
    'nav.lang': 'English',
    'nav.home': 'Inicio',
    'foot.disclaimer': 'Todos los modelos de aeronaves de esta encuesta fueron creados por usuarios y provienen del OpenVSP Airshow (airshow.openvsp.org). Pertenecen a sus autores; esta encuesta solo los muestra como vistas 3D.',
    'foot.credits': 'Ver a los autores',

    'about.eyebrow': 'Qué es NodeVSP',
    'about.h': 'Describe una aeronave. NodeVSP la construye.',
    'about.art': 'Diagrama de una aeronave con sus puntos de control y sus cotas.',
    'about.lead': 'NodeVSP conecta el lenguaje natural con el diseño de aeronaves. Corre sobre OpenVSP y VSPAERO, las herramientas paramétricas de la NASA, para que un agente de IA construya un modelo 3D real a partir de una descripción escrita, sin planos ni parámetros técnicos.',
    'about.1': 'Basado en OpenVSP/VSPAERO, el mismo motor que usa la NASA para geometría y aerodinámica paramétrica.',
    'about.2': 'Un agente de IA traduce texto a un modelo 3D real; esta encuesta le enseña a describir aviones como lo haría una persona.',
    'about.3': 'Trabajo final de Ingeniería Aeroespacial, Universidad Nacional de La Plata (Argentina).',

    'title.home': 'Encuesta NodeVSP',
    'home.h': 'Ayúdanos a enseñarle a una máquina a describir aviones',
    'home.lead': 'NodeVSP convierte una descripción en lenguaje natural en un modelo paramétrico de una aeronave. Para hacerlo bien necesita saber cómo describe la gente un avión de verdad. Esta encuesta recoge esas palabras. Toma unos minutos y no hay respuestas correctas ni incorrectas.',
    'consent.h': 'Antes de empezar',
    'consent.1': 'Es anónima: no hay cuenta, correo ni datos de contacto.',
    'consent.2': 'Se genera en tu navegador un código aleatorio solo para agrupar tus respuestas. No identifica a nadie.',
    'consent.3': 'Se guarda lo que escribes, tal cual, junto con ese código y la hora. Se usa para investigación del proyecto NodeVSP y no se publica desde este repositorio.',
    'consent.4': 'Puedes cerrar la página en cualquier momento.',
    'consent.check': 'Entiendo lo anterior y quiero participar.',
    'consent.code': 'Tu código anónimo:',
    'home.pick': 'Elige una tarea',
    'arm.model.name': 'Describe el modelo',
    'arm.model.desc': 'Ves un modelo 3D que puedes girar. Describe la aeronave para que otra persona pueda construirla.',
    'arm.photo.name': 'Describe la aeronave',
    'arm.photo.desc': 'Ves una fotografía de una aeronave real. Escribe lo que le pedirías a alguien que la construya.',
    'arm.game.name': 'Distingue las aeronaves',
    'arm.game.desc': 'Cuatro aeronaves, una descripción. Elige la que coincide. Diez rondas.',
    'arm.go': 'Empezar',

    'title.brief': 'Escribe una descripción',
    'brief.model.h': 'Describe este modelo',
    'brief.model.prompt': 'Gira el modelo 3D para verlo por todos lados. Descríbelo con tus palabras, con el detalle suficiente para que otra persona pudiera construirlo.',
    'brief.photo.h': 'Describe esta aeronave',
    'brief.photo.prompt': 'Imagina que quieres que alguien construya una aeronave como la de la foto. Escribe la petición que le harías.',
    'brief.model.badge': 'Modelo',
    'brief.photo.badge': 'Fotografía',
    'still.front': 'Vista desde delante',
    'still.rear': 'Vista desde atrás',
    'view3d.loading': 'Cargando el modelo…',
    'view3d.hint': 'Arrastra para girar, rueda para acercar.',
    'view3d.error': 'No se pudo cargar el modelo 3D. Te mostramos dos imágenes del modelo.',
    'photos.none': 'Todavía no hay fotografías para esta tarea. Prueba con «Describe el modelo» o con el juego.',
    'brief.label': 'Tu descripción',
    'brief.placeholder': 'Escribe con tus palabras…',
    'brief.count': '{chars} caracteres · {words} palabras',
    'hint.lead': 'Un aviso, no un requisito: se envía igual.',
    'hint.short': 'Es corta ({n} de {min} caracteres). Más detalle ayuda.',
    'hint.long': 'Es muy larga ({n} palabras; suele bastar con menos de {cap}).',
    'hint.punct': 'Parece código o datos (contiene {list}). Descríbelo con palabras.',
    'hint.ident': 'Parece un nombre de variable ({list}). Descríbelo con palabras.',
    'brief.submit': 'Enviar',
    'brief.sending': 'Enviando…',
    'brief.error': 'No se pudo enviar. Tu texto sigue aquí; inténtalo de nuevo.',
    'brief.skip': 'Mostrar otra aeronave',
    'brief.thanks': 'Gracias, se guardó tu descripción.',
    'brief.another': 'Describir otra',
    'brief.back': 'Volver al inicio',

    'title.game': 'Distingue las aeronaves',
    'game.h': 'Distingue las aeronaves',
    'game.round': 'Ronda {n} de {total}',
    'game.prompt': '¿A qué aeronave corresponde esta descripción?',
    'game.lang': 'Las descripciones están en inglés.',
    'game.option': 'Aeronave {letter}',
    'game.right': 'Correcto.',
    'game.wrong': 'No era esa. La correcta está resaltada.',
    'game.unsaved': 'No se pudo guardar esta respuesta; el juego continúa.',
    'game.next': 'Siguiente',
    'game.finish': 'Ver resultado',
    'game.score': 'Acertaste {n} de {total}.',
    'game.again': 'Jugar otra vez',
    'game.error': 'No se pudo cargar el juego.',

    'title.credits': 'Créditos',
    'credits.h': 'Créditos',
    'credits.lead': 'Los modelos de esta encuesta fueron creados por usuarios y provienen del OpenVSP Airshow (airshow.openvsp.org). Estos son sus autores, en orden alfabético y sin indicar qué autor hizo qué aeronave.',
    'credits.error': 'No se pudo cargar la lista.',
  },
  en: {
    'brand': 'NodeVSP · Survey',
    'nav.credits': 'Credits',
    'nav.theme': 'Toggle light/dark theme',
    'nav.lang': 'Español',
    'nav.home': 'Home',
    'foot.disclaimer': 'Every aircraft model in this survey is user-made and comes from the OpenVSP Airshow (airshow.openvsp.org). They belong to their authors; this survey only shows them as 3D views.',
    'foot.credits': 'See the authors',

    'about.eyebrow': 'What NodeVSP is',
    'about.h': 'Describe an aircraft. NodeVSP builds it.',
    'about.art': 'Diagram of an aircraft with its control points and its dimensions.',
    'about.lead': 'NodeVSP connects natural language to aircraft design. It runs on OpenVSP and VSPAERO, NASA’s parametric geometry and aerodynamics tools, so an AI agent can build a real 3D model from a written description — no blueprints, no technical parameters.',
    'about.1': 'Built on OpenVSP/VSPAERO, the same engine NASA uses for parametric geometry and aerodynamics.',
    'about.2': 'An AI agent turns text into a real 3D model; this survey teaches it to describe aircraft the way people actually do.',
    'about.3': 'A final-year Aerospace Engineering project at Universidad Nacional de La Plata (Argentina).',

    'title.home': 'NodeVSP survey',
    'home.h': 'Help us teach a machine to describe aircraft',
    'home.lead': 'NodeVSP turns a plain-language description into a parametric model of an aircraft. To do that well it has to learn how people really describe one. This survey collects those words. It takes a few minutes and there are no right or wrong answers.',
    'consent.h': 'Before you start',
    'consent.1': 'It is anonymous: no account, no email, no contact details.',
    'consent.2': 'A random code is generated in your browser only to group your answers. It does not identify anyone.',
    'consent.3': 'What you write is stored as-is, with that code and the time. It is used for research on the NodeVSP project and is not published from this repository.',
    'consent.4': 'You can close the page at any time.',
    'consent.check': 'I understand the above and want to take part.',
    'consent.code': 'Your anonymous code:',
    'home.pick': 'Choose a task',
    'arm.model.name': 'Describe the model',
    'arm.model.desc': 'You see a 3D model you can rotate. Describe the aircraft so someone else could build it.',
    'arm.photo.name': 'Describe the aircraft',
    'arm.photo.desc': 'You see a photograph of a real aircraft. Write what you would ask someone to build.',
    'arm.game.name': 'Tell them apart',
    'arm.game.desc': 'Four aircraft, one description. Pick the match. Ten rounds.',
    'arm.go': 'Start',

    'title.brief': 'Write a description',
    'brief.model.h': 'Describe this model',
    'brief.model.prompt': 'Rotate the 3D model to see it from every side. Describe it in your own words, in enough detail that someone else could build it.',
    'brief.photo.h': 'Describe this aircraft',
    'brief.photo.prompt': 'Imagine you want someone to build an aircraft like the one in the photo. Write the request you would make.',
    'brief.model.badge': 'Model',
    'brief.photo.badge': 'Photograph',
    'still.front': 'View from the front',
    'still.rear': 'View from the back',
    'view3d.loading': 'Loading the model…',
    'view3d.hint': 'Drag to rotate, scroll to zoom.',
    'view3d.error': 'The 3D model could not be loaded. Here are two images of it instead.',
    'photos.none': 'There are no photographs for this task yet. Try “Describe the model” or the game.',
    'brief.label': 'Your description',
    'brief.placeholder': 'Write in your own words…',
    'brief.count': '{chars} characters · {words} words',
    'hint.lead': 'A hint, not a requirement: it submits either way.',
    'hint.short': 'It is short ({n} of {min} characters). More detail helps.',
    'hint.long': 'It is very long ({n} words; under {cap} is usually plenty).',
    'hint.punct': 'It looks like code or data (contains {list}). Say it in words.',
    'hint.ident': 'It looks like a variable name ({list}). Say it in words.',
    'brief.submit': 'Submit',
    'brief.sending': 'Sending…',
    'brief.error': 'It could not be sent. Your text is still here; try again.',
    'brief.skip': 'Show a different aircraft',
    'brief.thanks': 'Thank you, your description was saved.',
    'brief.another': 'Describe another',
    'brief.back': 'Back to start',

    'title.game': 'Tell them apart',
    'game.h': 'Tell them apart',
    'game.round': 'Round {n} of {total}',
    'game.prompt': 'Which aircraft does this description match?',
    'game.lang': 'The descriptions are in English.',
    'game.option': 'Aircraft {letter}',
    'game.right': 'Correct.',
    'game.wrong': 'Not that one. The right one is highlighted.',
    'game.unsaved': 'This answer could not be saved; the game continues.',
    'game.next': 'Next',
    'game.finish': 'See result',
    'game.score': 'You got {n} of {total}.',
    'game.again': 'Play again',
    'game.error': 'The game could not be loaded.',

    'title.credits': 'Credits',
    'credits.h': 'Credits',
    'credits.lead': 'The models in this survey are user-made and come from the OpenVSP Airshow (airshow.openvsp.org). These are their authors, in alphabetical order and without saying which author made which aircraft.',
    'credits.error': 'The list could not be loaded.',
  },
};

export const lang = new URLSearchParams(globalThis.location?.search).get('lang') === 'en' ? 'en' : 'es';

export function t(key, vars = {}) {
  const s = copy[lang][key];
  if (s === undefined) throw new Error(`copy: no "${key}" in ${lang}`);
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/** Fill every [data-i18n] (text) and [data-i18n-attr="attr:key"] (attribute). */
export function applyCopy(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    el.setAttribute(attr, t(key));
  });
}

/** An internal URL that keeps the chosen language. */
export function link(href) {
  if (lang !== 'en') return href;
  const u = new URL(href, location.href);
  u.searchParams.set('lang', 'en');
  return u.pathname + u.search + u.hash;
}
