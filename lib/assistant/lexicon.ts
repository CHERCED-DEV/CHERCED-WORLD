export const ABBREVIATIONS: Record<string, string> = {
  q: 'que',
  k: 'que',
  ke: 'que',
  xq: 'porque',
  pq: 'porque',
  porq: 'porque',
  tb: 'tambien',
  tmb: 'tambien',
  d: 'de',
  x: 'por',
  pa: 'para',
  u: 'you',
  ur: 'your',
  r: 'are',
  pls: 'please',
  plz: 'please',
  thx: 'thanks',
  ty: 'thanks',
  wat: 'what',
  wut: 'what',
  whats: 'what',
  techs: 'technologies',
  tecnos: 'tecnologias',
  tecno: 'tecnologia',
  info: 'informacion',
  db: 'database',
  bd: 'database',
}

export const PHRASES: Array<[RegExp, string]> = [
  [/\bbases? de datos\b/g, 'database'],
  [/\be ?-?mail\b/g, 'email'],
  [/\bcorreo electronico\b/g, 'correo'],
  [/\bsitio web\b/g, 'website'],
  [/\bweb ?site\b/g, 'website'],
  [/\bfront ?-?end\b/g, 'frontend'],
  [/\bback ?-?end\b/g, 'backend'],
  [/\bfull ?-?stack\b/g, 'fullstack'],
  [/\b(buenas )?practicas de ingenieria\b/g, 'practicas'],
  [/\bengineering practices\b/g, 'practices'],
  [/\bia aplicada\b/g, 'ia'],
  [/\bapplied ai\b/g, 'ai'],
  [/\binteligencia artificial\b/g, 'ia'],
  [/\bhojas? de vida\b/g, 'cv'],
  [/\bcurriculum vitae\b/g, 'cv'],
]

export const STOPWORDS = new Set([
  'a', 'al', 'algo', 'algun', 'alguna', 'algunos', 'ante', 'como', 'con', 'contra', 'cual', 'cuales', 'cuando',
  'de', 'del', 'desde', 'donde', 'durante', 'e', 'el', 'ella', 'en', 'entre', 'era', 'eres', 'es', 'esa', 'ese',
  'eso', 'esta', 'estas', 'este', 'esto', 'estos', 'fue', 'ha', 'han', 'has', 'hay', 'la', 'las', 'le', 'les',
  'lo', 'los', 'me', 'mi', 'mis', 'muy', 'mas', 'ni', 'no', 'nos', 'o', 'os', 'para', 'pero', 'por', 'porque',
  'que', 'quien', 'se', 'sea', 'ser', 'si', 'sin', 'sobre', 'son', 'su', 'sus', 'tambien', 'te', 'ti', 'tiene',
  'tienes', 'tu', 'tus', 'un', 'una', 'uno', 'unos', 'unas', 'y', 'ya', 'yo', 'hola', 'puedes', 'podrias',
  'dime', 'cuentame', 'hablame', 'quiero', 'saber', 'gustaria', 'usted', 'about', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'for', 'from',
  'have', 'had', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'my', 'of', 'on', 'or', 'please', 'so',
  'some', 'tell', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to',
  'up', 'us', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would',
  'you', 'your', 'yours', 'hi', 'hello', 'know', 'want', 'show', 'give', 'hecho', 'hiciste', 'made', 'make',
])

export const SPANISH_MARKERS = new Set([
  'que', 'como', 'cual', 'cuales', 'donde', 'cuando', 'quien', 'por', 'para', 'con', 'sabes', 'tienes', 'tu',
  'tus', 'eres', 'has', 'hiciste', 'puedes', 'hablame', 'dime', 'cuentame', 'cuantos', 'cuantas', 'de', 'del',
  'el', 'la', 'los', 'las', 'un', 'una', 'y', 'en', 'mi', 'es', 'hola', 'gracias', 'proyectos', 'proyecto',
  'tecnologias', 'tecnologia', 'servicios', 'experiencia', 'ofreces', 'estudiaste', 'idiomas', 'hablas',
  'correo', 'cursos', 'trabajas', 'usas', 'haces', 'hecho', 'contigo', 'te', 'ti', 'muestrame', 'dame',
  'trabajaste', 'conoces', 'manejas', 'sobre', 'tiene', 'usa', 'hace', 'anos', 'contacto', 'contactarte',
  'escribes', 'formacion', 'universidad', 'estudios', 'puedo', 'quiero', 'tambien', 'algun', 'alguna',
])

export const ENGLISH_MARKERS = new Set([
  'what', 'which', 'how', 'where', 'when', 'who', 'do', 'does', 'did', 'you', 'your', 'are', 'is', 'the', 'a',
  'an', 'and', 'with', 'can', 'have', 'has', 'tell', 'me', 'about', 'projects', 'project', 'technologies',
  'technology', 'services', 'experience', 'offer', 'study', 'studied', 'speak', 'email', 'hi', 'hello',
  'thanks', 'made', 'built', 'show', 'know', 'work', 'worked', 'many', 'years', 'of', 'in', 'on', 'for',
  'write', 'contact', 'reach', 'languages', 'courses', 'skills', 'use', 'used', 'any', 'some', 'please',
  'would', 'could', 'should', 'there', 'this', 'that', 'yourself', 'available', 'hire', 'build', 'were',
])

export const SECOND_PERSON = new Set([
  'tu', 'tus', 'te', 'ti', 'contigo', 'usted', 'you', 'your', 'yours', 'yourself', 'camilo', 'cherced',
  'hernandez', 'autor', 'author', 'eres', 'sabes', 'tienes', 'usas', 'haces', 'trabajas', 'ofreces', 'hablas',
  'vives', 'puedes', 'conoces', 'manejas', 'dominas', 'programas', 'estudias', 'prefieres', 'piensas', 'crees',
  'quieres', 'gusta', 'naciste', 'his', 'he', 'him',
])

export const DIRECTED = new Set(['tell', 'hablame', 'cuentame', 'dime', 'muestrame', 'show', 'explain', 'explicame'])

export type Concept =
  | 'technologies'
  | 'projects'
  | 'experience'
  | 'cv'
  | 'services'
  | 'hire'
  | 'education'
  | 'courses'
  | 'languages'
  | 'contact'
  | 'about'
  | 'blog'
  | 'greeting'
  | 'thanks'

type ConceptWords = { words: string[]; weak?: string[] }

export const CONCEPTS: Record<Concept, ConceptWords> = {
  technologies: {
    words: [
      'tecnologia', 'tecnologias', 'technology', 'technologies', 'tech', 'stack', 'herramienta', 'herramientas',
      'tool', 'tools', 'framework', 'frameworks', 'libreria', 'librerias', 'library', 'libraries', 'lenguaje',
      'lenguajes', 'skill', 'skills', 'habilidad', 'habilidades', 'conocimientos', 'knowledge', 'programming',
      'programacion',
    ],
    weak: ['usas', 'use', 'uses', 'using', 'manejas', 'dominas', 'sabes'],
  },
  projects: {
    words: [
      'proyecto', 'proyectos', 'project', 'projects', 'portafolio', 'portfolio', 'apps', 'aplicaciones',
      'applications', 'trabajos',
    ],
    weak: ['hiciste', 'hecho', 'built', 'made', 'build', 'construiste', 'desarrollaste', 'developed', 'did', 'creaste'],
  },
  experience: {
    words: [
      'experiencia', 'experience', 'trayectoria', 'career', 'trabajado', 'worked', 'trabajaste', 'empleo',
      'empleos', 'job', 'jobs', 'empresa', 'empresas', 'company', 'companies', 'anos', 'years', 'cargo', 'puesto',
      'laboral', 'profesional', 'professional', 'background', 'senior', 'junior',
    ],
  },
  cv: {
    words: ['cv', 'resume', 'curriculum', 'curriculo', 'hv'],
  },
  services: {
    words: [
      'servicio', 'servicios', 'service', 'services', 'ofreces', 'offer', 'offers', 'ofrecer', 'ayudar',
      'ayudarme', 'ayudas', 'help', 'disenar', 'diseno', 'disenas', 'design', 'mantenimiento', 'maintenance',
      'mantener', 'maintain', 'arreglar', 'fix', 'taller', 'talleres', 'workshop', 'workshops', 'consultoria',
      'consulting', 'asesoria',
    ],
  },
  hire: {
    words: [
      'contratar', 'contratarte', 'contrato', 'hire', 'hiring', 'freelance', 'disponible', 'available',
      'availability', 'presupuesto', 'quote', 'cotizacion', 'precio', 'precios', 'price', 'prices', 'rates',
      'tarifa', 'tarifas', 'cobras', 'charge',
    ],
  },
  education: {
    words: [
      'educacion', 'education', 'estudios', 'estudiaste', 'estudias', 'studied', 'study', 'studies',
      'universidad', 'university', 'titulo', 'degree', 'ingenieria', 'engineering', 'college', 'formacion',
      'graduado', 'graduate', 'graduaste',
    ],
  },
  courses: {
    words: [
      'curso', 'cursos', 'course', 'courses', 'platzi', 'certificado', 'certificados', 'certificate',
      'certificates', 'certification', 'certifications', 'bootcamp', 'aprendiste', 'learned', 'learn',
    ],
  },
  languages: {
    words: [
      'idioma', 'idiomas', 'ingles', 'english', 'espanol', 'spanish', 'hablas', 'speak', 'spoken', 'bilingue',
      'bilingual', 'languages', 'language',
    ],
  },
  contact: {
    words: [
      'contacto', 'contactar', 'contactarte', 'contact', 'correo', 'email', 'mail', 'escribirte', 'reach',
      'comunicarme', 'linkedin', 'github', 'instagram', 'redes', 'social', 'socials', 'telefono', 'phone',
      'whatsapp', 'mensaje',
    ],
  },
  about: {
    words: ['presentate', 'introduce', 'yourself', 'biografia', 'bio', 'perfil', 'profile'],
  },
  blog: {
    words: [
      'blog', 'post', 'posts', 'articulo', 'articulos', 'article', 'articles', 'escribes', 'publicaciones',
      'publicas', 'publish',
    ],
  },
  greeting: { words: ['hola', 'hi', 'hello', 'hey', 'buenas', 'saludos', 'holi', 'buenos'] },
  thanks: { words: ['gracias', 'thanks', 'thank', 'genial', 'great'] },
}

export const ABOUT_PHRASES = [
  /\b(quien eres|quien es camilo|quien es el autor|who are you|who is camilo|who s camilo|whos camilo)\b/,
  /\b(hablame de ti|cuentame de ti|cuentame sobre ti|hablame sobre ti|sobre ti|about you|about yourself|tell me about you)\b/,
  /\b(a que te dedicas|what do you do|que haces|what are you)\b/,
]

export const SITE_PHRASES = [
  /\b(este sitio|esta web|esta pagina|este portafolio|esta app|this site|this website|this page|this portfolio|this app)\b/,
  /\bcherced ?-?world\b/,
]

export const PROGRAMMING_HINTS = new Set(['programming', 'programacion', 'code', 'coding', 'codigo', 'lenguajes', 'lenguaje'])

export const SPOKEN_HINTS = new Set(['speak', 'spoken', 'hablas', 'habla', 'ingles', 'english', 'espanol', 'spanish'])

export const STUDY_HINTS = new Set(['estudiaste', 'estudias', 'estudio', 'universidad', 'titulo', 'universitaria'])

export const QUESTION_TECH: Record<string, string> = {
  database: 'mongodb',
  databases: 'mongodb',
}

export const EXTERNAL_DISPLAY: Record<string, string> = {
  java: 'Java',
  php: 'PHP',
  ruby: 'Ruby',
  kotlin: 'Kotlin',
  swift: 'Swift',
  vue: 'Vue',
  svelte: 'Svelte',
  django: 'Django',
  laravel: 'Laravel',
  flutter: 'Flutter',
  kubernetes: 'Kubernetes',
  rust: 'Rust',
  wordpress: 'WordPress',
  jquery: 'jQuery',
  bootstrap: 'Bootstrap',
  tailwind: 'Tailwind',
  graphql: 'GraphQL',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  firebase: 'Firebase',
  mern: 'MERN',
  axios: 'Axios',
}

export const EXTERNAL_TECH: Record<string, string[]> = {
  java: ['java'],
  php: ['php'],
  ruby: ['ruby', 'rails'],
  kotlin: ['kotlin'],
  swift: ['swift'],
  vue: ['vue', 'vuejs'],
  svelte: ['svelte'],
  django: ['django'],
  laravel: ['laravel'],
  flutter: ['flutter'],
  kubernetes: ['kubernetes', 'k8s'],
  rust: ['rust'],
  wordpress: ['wordpress'],
  jquery: ['jquery'],
  bootstrap: ['bootstrap'],
  tailwind: ['tailwind', 'tailwindcss'],
  graphql: ['graphql'],
  postgresql: ['postgres', 'postgresql'],
  mysql: ['mysql'],
  firebase: ['firebase'],
  mern: ['mern'],
  axios: ['axios'],
}

export const CASE_FILLER = new Set([
  'maneja', 'manejan', 'manejo', 'handle', 'handles', 'handled', 'handling', 'funciona', 'funcionan', 'work',
  'works', 'hace', 'hacen', 'does', 'done', 'explica', 'explain', 'describe', 'cuenta', 'caso', 'case', 'deal',
  'deals', 'esto', 'cosa', 'thing', 'things', 'algo', 'tipo', 'kind', 'manera', 'forma', 'way',
])

export const SOCIAL_DISPLAY: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  github: 'GitHub',
  email: 'Email',
  facebook: 'Facebook',
}

const PRIVATE_PEOPLE =
  '(visitantes?|usuarios?|users?|personas|people|gente|comentaristas?|commenters?|lectores|readers|clientes|clients|customers|otros|others|who (commented|contacted|wrote|messaged)|que (comentaron|escribieron|te escribieron|te contactaron|te han escrito))'
const PRIVATE_DATA =
  '(correos?|emails?|mails?|telefonos?|phones?|phone numbers?|numeros?|celulares?|direcciones? ip|ip addresses?|ips?|datos personales|personal data|datos de contacto|contact (data|details|info)|mensajes?|messages?|comentarios? (privados|pendientes))'

export const MANIPULATION_PATTERNS: RegExp[] = [
  /\b(ignora\w*|ignore\w*|olvida\w*|forget|disregard|omite|omit|salta\w*|skip|bypass|override)\b.{0,60}\b(instruc\w*|regla\w*|rules?|prompt\w*|restric\w*|indicaciones|directiv\w*|guidelines?|previous|anteriores|politica\w*|policy|policies)\b/,
  /\b(eres ahora|ahora eres|you are now|now you are|act as|actua como|actua de|pretend|finge|fingir|haz de cuenta|roleplay|role play|jailbreak|dan mode|developer mode|modo desarrollador|modo dios|god mode|sin restricciones|without restrictions|no restrictions|unrestricted|sin filtros|unfiltered)\b/,
  /\byou are dan\b|\bdo anything now\b/,
  /^\s*(system|sistema|admin|root)\s*:/,
  /\b(system prompt|prompt del sistema|tu prompt|your prompt|el prompt|the prompt|instrucciones (internas|ocultas|del sistema|secretas|originales)|tus instrucciones|your instructions|hidden (rules|instructions)|internal (rules|instructions)|reglas (ocultas|internas|secretas)|tus reglas|your rules|initial instructions|configuracion interna|internal configuration)\b/,
  /\b(contrasenas?|passwords?|passwd|credencial\w*|credentials?|tokens?|api ?keys?|secrets?|secretos?|clave (secreta|del admin\w*|de acceso|api|de la base|privada)|private key|llave privada|hash\w*)\b/,
  /\.env\b|\benv file\b|\b(variables? de entorno|environment variables?|connection string|cadena de conexion|mongodb_\w+|mongodb integral db|uri de (mongo\w*|la base)|(mongo\w*|database) (uri|url|string))\b/,
  /\b(inbox|bandeja de entrada|mensajes (privados|recibidos|del inbox|de contacto|sin leer|que te (han )?(enviado|mandado|escrito))|private messages|unread messages|received messages|contact messages|messages (you received|you got|people sent|from visitors|in your inbox)|panel de admin\w*|admin panel|sesion de admin\w*|admin session|cookie de admin\w*|admin cookie)\b/,
  new RegExp(`\\b${PRIVATE_DATA}\\b.{0,50}\\b${PRIVATE_PEOPLE}\\b`),
  new RegExp(`\\b${PRIVATE_PEOPLE}\\b.{0,50}\\b${PRIVATE_DATA}\\b`),
  /\b(repite|repeat|imprime|print|muestra\w*|show|reveal|revela\w*|dump|vuelca|exporta|export|copia|copy|traduce|translate)\b.{0,40}\b(texto (de arriba|anterior)|text above|above text|everything above|todo lo anterior|lo de arriba|your instructions|tus instrucciones|system message|mensaje del sistema|configuracion|configuration|source code|codigo fuente)\b/,
  /\b(database|base de datos|db)\b.{0,40}\b(contenido|contents?|dump|volcado|que hay|tablas?|tables?|colecciones|collections?|registros|records|query|consulta|acceso|access)\b/,
  /\b(que hay|what s in|whats in|what is in|contenido de|contents of|dump|accede a|access)\b.{0,30}\b(database|base de datos|db|inbox|servidor|server)\b/,
  /\b(hack\w*|exploit\w*|inyecci\w*|injection|sql ?injection|xss|escala\w* privilegios|privilege escalation)\b/,
]

export const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
  /\b(clima|weather|temperatura|temperature|lluvia|rain|pronostico|forecast|que tiempo hace|hace frio|hace calor)\b/,
  /\b(futbol|football|soccer|mundial|world cup|partido|match score|nba|nfl|beisbol|baseball|tenis|tennis)\b/,
  /\b(politica|politics|presidente|president|elecciones|elections?|gobierno actual|congreso|congress)\b/,
  /\b(receta|recetas|recipe|recipes|cocinar|cook|cooking|comida tipica)\b/,
  /\b(bitcoin|crypto\w*|criptomoneda\w*|dolar hoy|exchange rate|stock price|acciones de|invertir|invest\w*|loteria|lottery)\b/,
  /\b(capital de|capital of|quien invento|who invented|historia de|history of|cuantos habitantes|population of|distancia entre|how far is)\b/,
  /\b(chiste|chistes|joke|jokes|adivinanza|riddle|poema|poem|cancion|song|horoscopo|horoscope)\b/,
  /\b(tarea|homework|ensayo|essay|traduce|translate|traduccion|translation)\b/,
  /\b(escribe|escribeme|write|hazme|haz|genera|generate|crea|create)\b.{0,30}\b(codigo|code|funcion|function|script|programa|program|query|algoritmo|algorithm|clase|class)\b/,
  /\b(que hora es|what time is it|que dia es hoy|what day is it|fecha de hoy|today s date)\b/,
  /\b(medico|doctor|medicina|medicine|enfermedad|disease|abogado|lawyer|legal advice)\b/,
  /\b\d+\s*[-+*/x]\s*\d+\b|\b(cuanto es|how much is|calcula|calculate|raiz cuadrada|square root)\b/,
]

export const CODE_REQUEST =
  /\b(escribe|escribeme|hazme|haz|genera|generame|crea|creame|programa|write|generate|create|make|code)\b( me)? (un|una|el|la|a|an|the|some)\b.{0,30}\b(codigo|code|funcion|function|script|programa|program|query|consulta sql|algoritmo|algorithm|clase|class|regex|componente|component|snippet)\b/

export const SERVICE_FOCUS: Record<string, string[]> = {
  workshops: [
    'taller', 'talleres', 'workshop', 'workshops', 'entrenamiento', 'entrenar', 'entrenas', 'training', 'train',
    'capacitacion', 'capacitar', 'ensenar', 'ensenas', 'teach', 'equipo', 'equipos', 'team', 'teams',
  ],
  'ai-harness': [
    'asistente', 'asistentes', 'assistant', 'assistants', 'harness', 'plugin', 'plugins', 'profesion', 'profession',
    'oficio', 'craft',
  ],
  'software-factory': ['fabrica', 'fabricas', 'factory', 'factories', 'agentes', 'agents', 'paralelo', 'parallel'],
  'process-optimization': [
    'optimizar', 'optimizacion', 'optimize', 'optimization', 'automatizar', 'automatizacion', 'automate', 'automation',
    'proceso', 'procesos', 'process', 'processes', 'repetitivo', 'repetitive',
  ],
  architecture: [
    'arquitectura', 'architecture', 'disenar', 'diseno', 'disenas', 'design', 'designs', 'modernizar', 'modernizacion',
    'modernize', 'modernization', 'legado', 'legacy', 'migrar', 'migracion', 'migrate', 'migration', 'microservicios',
    'microservices',
  ],
  product: [
    'producto', 'product', 'desarrollar', 'desarrollo', 'development', 'develop', 'programar', 'program', 'build',
    'construir', 'responsive', 'app', 'aplicacion', 'website', 'mantenimiento', 'maintenance', 'mantener', 'maintain',
    'arreglar', 'fix', 'soporte', 'support', 'figma', 'ui', 'ux',
  ],
}

export const LOBE_WORDS: Record<string, string[]> = {
  frontend: ['frontend'],
  architecture: ['arquitectura', 'architecture', 'arquitecto', 'architect'],
  'backend-cloud': ['backend', 'nube', 'cloud'],
  'applied-ai': ['ia', 'ai', 'inteligencia', 'llm', 'llms', 'agentes', 'agents'],
  practices: ['practicas', 'practices', 'calidad', 'quality'],
  business: ['negocio', 'negocios', 'business', 'stakeholders'],
}
