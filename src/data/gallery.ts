import type { ImageMetadata } from 'astro';

export const themes = {
  trabajo: 'Trabajo',
  estudio: 'Estudio',
  santiago: 'Santiago',
  calle: 'Calle',
  viajes: 'Viajes',
  venezuela: 'Venezuela',
  baile: 'Baile',
  noche: 'Noche',
  fantasia: 'Fantasía',
} as const;
export type Theme = keyof typeof themes;

export interface GalleryItem { slug: string; theme: Theme; caption: string; prompt: string; image: ImageMetadata }

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/gallery/*.jpg', { eager: true });
const raw: Omit<GalleryItem, 'image'>[] = [
 {
  "slug": "ventana-bn",
  "theme": "estudio",
  "caption": "Traje junto a la ventana, blanco y negro",
  "prompt": ""
 },
 {
  "slug": "retrato-de-estudio-sobre-fondo-negro",
  "theme": "estudio",
  "caption": "Retrato de estudio sobre fondo negro",
  "prompt": ""
 },
 {
  "slug": "oficina-monitor-con-codigo-a-la-espalda",
  "theme": "trabajo",
  "caption": "Oficina, monitor con código a la espalda",
  "prompt": ""
 },
 {
  "slug": "oficina-abierta-camisa-blanca",
  "theme": "trabajo",
  "caption": "Oficina abierta, camisa blanca",
  "prompt": ""
 },
 {
  "slug": "moto-montana",
  "theme": "viajes",
  "caption": "Moto en la cordillera",
  "prompt": ""
 },
 {
  "slug": "sonrisa-en-la-oficina",
  "theme": "trabajo",
  "caption": "Sonrisa en la oficina",
  "prompt": ""
 },
 {
  "slug": "monitores-brazos-cruzados",
  "theme": "trabajo",
  "caption": "Entre monitores, brazos cruzados",
  "prompt": ""
 },
 {
  "slug": "retro-80s",
  "theme": "fantasia",
  "caption": "Retrato retro años 80",
  "prompt": ""
 },
 {
  "slug": "retrato-de-estudio-chaqueta-negra",
  "theme": "estudio",
  "caption": "Retrato de estudio, chaqueta negra",
  "prompt": ""
 },
 {
  "slug": "traje-claro-concreto",
  "theme": "estudio",
  "caption": "Traje claro contra muro de concreto",
  "prompt": "2874b08464494cb5b371c13d577f5325"
 },
 {
  "slug": "camisa-blanca-en-la-oficina",
  "theme": "trabajo",
  "caption": "Camisa blanca en la oficina",
  "prompt": ""
 },
 {
  "slug": "retrato-de-estudio-media-sonrisa",
  "theme": "estudio",
  "caption": "Retrato de estudio, media sonrisa",
  "prompt": ""
 },
 {
  "slug": "cafe-en-la-calle-con-laptop",
  "theme": "calle",
  "caption": "Café en la calle con laptop",
  "prompt": ""
 },
 {
  "slug": "oficina-luminosa",
  "theme": "trabajo",
  "caption": "Oficina luminosa",
  "prompt": ""
 },
 {
  "slug": "traje-y-moto-en-la-montana",
  "theme": "viajes",
  "caption": "Traje y moto en la montaña",
  "prompt": ""
 },
 {
  "slug": "oficina-manos-en-la-cintura",
  "theme": "trabajo",
  "caption": "Oficina, manos en la cintura",
  "prompt": ""
 },
 {
  "slug": "codigo-en-pantalla-gafas-y-traje",
  "theme": "trabajo",
  "caption": "Código en pantalla, gafas y traje",
  "prompt": "676c0ca20f0c47d39ae86fd98b503a43"
 },
 {
  "slug": "roraima-4x4",
  "theme": "venezuela",
  "caption": "Tepuy y camioneta",
  "prompt": ""
 },
 {
  "slug": "cafe-otono",
  "theme": "calle",
  "caption": "Café de otoño con taza en mano",
  "prompt": ""
 },
 {
  "slug": "chaqueta-de-cuero-contra-concreto",
  "theme": "estudio",
  "caption": "Chaqueta de cuero contra concreto",
  "prompt": ""
 },
 {
  "slug": "ajustando-el-blazer",
  "theme": "estudio",
  "caption": "Ajustando el blazer",
  "prompt": ""
 },
 {
  "slug": "sueter-azul-en-la-oficina",
  "theme": "trabajo",
  "caption": "Suéter azul en la oficina",
  "prompt": ""
 },
 {
  "slug": "traje-y-corbata-oficina-al-fondo",
  "theme": "trabajo",
  "caption": "Traje y corbata, oficina al fondo",
  "prompt": ""
 },
 {
  "slug": "retrato-de-estudio-fondo-oscuro",
  "theme": "estudio",
  "caption": "Retrato de estudio, fondo oscuro",
  "prompt": "8a76de51e9dc4c8884a85fc634446e88"
 },
 {
  "slug": "retrato-de-estudio-luz-lateral",
  "theme": "estudio",
  "caption": "Retrato de estudio, luz lateral",
  "prompt": ""
 },
 {
  "slug": "blazer-gris-retrato",
  "theme": "estudio",
  "caption": "Blazer gris, mano en la barbilla",
  "prompt": ""
 },
 {
  "slug": "retrato-estudio-negro",
  "theme": "estudio",
  "caption": "Retrato de estudio sobre fondo negro",
  "prompt": ""
 },
 {
  "slug": "ejecutivo-con-la-ciudad-de-noche",
  "theme": "noche",
  "caption": "Ejecutivo con la ciudad de noche",
  "prompt": "A crisp professional photograph of the same corporate man in a dark"
 },
 {
  "slug": "moto-desierto",
  "theme": "viajes",
  "caption": "Moto en el desierto rojo",
  "prompt": "A grand"
 },
 {
  "slug": "vidrio-cordillera-y-camisa-de-jeans",
  "theme": "santiago",
  "caption": "Vidrio, cordillera y camisa de jeans",
  "prompt": "A medium-shot portrait capturing  Bexandy  posing casually at a"
 },
 {
  "slug": "arquitecto-cafe",
  "theme": "trabajo",
  "caption": "Arquitecto de software en un café",
  "prompt": "Candid lifestyle portrait of Bexandy  senior software architect"
 },
 {
  "slug": "cafe-risa",
  "theme": "calle",
  "caption": "Risa en un café de barrio",
  "prompt": "Candid street-style photograph of Bexandy captured mid-laugh at an"
 },
 {
  "slug": "santiago-crepusculo",
  "theme": "santiago",
  "caption": "Costanera Center al crepúsculo",
  "prompt": "Change the background of la foto original to a cinematic twilight view of the"
 },
 {
  "slug": "santiago-tobalaba",
  "theme": "santiago",
  "caption": "Metro Tobalaba y la torre Costanera",
  "prompt": "Change the background of la foto original to a modern street in Santiago de"
 },
 {
  "slug": "escritorio-codigo",
  "theme": "trabajo",
  "caption": "Escritorio de vidrio, dos monitores y luz de atardecer",
  "prompt": "Cinematic medium shot of Bexandy seated at a sleek glass desk in a"
 },
 {
  "slug": "billar",
  "theme": "noche",
  "caption": "Mesa de billar en un lounge",
  "prompt": "Cinematic mid-shot of Bexandy leaning casually against the edge of a"
 },
 {
  "slug": "moto-deportiva-frente-al-mar",
  "theme": "viajes",
  "caption": "Moto deportiva frente al mar",
  "prompt": "Cinematic wide shot of Bexandy leaning confidently against a modern"
 },
 {
  "slug": "moto-neon",
  "theme": "viajes",
  "caption": "Moto bajo neones",
  "prompt": "Cinematic wide shot of Bexandy perched on a matte-black"
 },
 {
  "slug": "salsa-luces",
  "theme": "baile",
  "caption": "Salsa bajo las luces",
  "prompt": "Dynamic medium shot of Bexandy captured in the midst of a fluid"
 },
 {
  "slug": "caminando-por-el-desierto",
  "theme": "viajes",
  "caption": "Caminando por el desierto",
  "prompt": ""
 },
 {
  "slug": "camisa-blanca-entre-edificios",
  "theme": "calle",
  "caption": "Camisa blanca entre edificios",
  "prompt": ""
 },
 {
  "slug": "teclado-retroiluminado-sudadera-gris",
  "theme": "trabajo",
  "caption": "Teclado retroiluminado, sudadera gris",
  "prompt": ""
 },
 {
  "slug": "traje-gris-de-pie",
  "theme": "estudio",
  "caption": "Traje gris, de pie",
  "prompt": ""
 },
 {
  "slug": "traje-claro-en-un-porche-al-atardecer",
  "theme": "estudio",
  "caption": "Traje claro en un porche al atardecer",
  "prompt": ""
 },
 {
  "slug": "taburete-traje-negro",
  "theme": "estudio",
  "caption": "Traje negro en taburete",
  "prompt": ""
 },
 {
  "slug": "santiago-calle-bus",
  "theme": "santiago",
  "caption": "Calle de Santiago, camisa celeste",
  "prompt": ""
 },
 {
  "slug": "ajustando-las-mangas-del-traje",
  "theme": "estudio",
  "caption": "Ajustando las mangas del traje",
  "prompt": ""
 },
 {
  "slug": "porche-de-madera-traje-claro",
  "theme": "estudio",
  "caption": "Porche de madera, traje claro",
  "prompt": ""
 },
 {
  "slug": "traje-gris-ajustando-la-chaqueta",
  "theme": "estudio",
  "caption": "Traje gris, ajustando la chaqueta",
  "prompt": ""
 },
 {
  "slug": "monitores-con-codigo-apaisado",
  "theme": "trabajo",
  "caption": "Monitores con código, apaisado",
  "prompt": ""
 },
 {
  "slug": "chaqueta-de-ante",
  "theme": "estudio",
  "caption": "Chaqueta de ante",
  "prompt": "Medium shot of Bexandy standing in a relaxed posture with both hands"
 },
 {
  "slug": "setup-gamer",
  "theme": "trabajo",
  "caption": "Puesto de trabajo con teclado retroiluminado",
  "prompt": "Medium shot of a Venezuelan man Bexandy"
 },
 {
  "slug": "santiago-cordillera",
  "theme": "santiago",
  "caption": "Mirando a la cordillera",
  "prompt": "Outdoor professional portrait of Bexandy"
 },
 {
  "slug": "adoquines",
  "theme": "calle",
  "caption": "Calle empedrada",
  "prompt": "Place the man from la foto original standing on a cobblestone street in a"
 },
 {
  "slug": "retrato-corporativo-en-la-oficina",
  "theme": "trabajo",
  "caption": "Retrato corporativo en la oficina",
  "prompt": "Professional corporate headshot of Bexandy  senior software engineer"
 },
 {
  "slug": "clasica-en-la-ruta-66",
  "theme": "viajes",
  "caption": "Clásica en la Ruta 66",
  "prompt": "Reimagine the main subject firmly seated on the motorcycle seat and we"
 },
 {
  "slug": "sillon-cuero-bn",
  "theme": "estudio",
  "caption": "Sillón de cuero, blanco y negro",
  "prompt": "Three-quarter portrait of Bexandy centered in a minimalist studio"
 },
 {
  "slug": "santiago-neon",
  "theme": "noche",
  "caption": "Neón de Santiago de Chile",
  "prompt": "Transform the background of la foto original into an upscale luxury bar in"
 },
 {
  "slug": "retrato-de-estudio-sueter-con-cierre",
  "theme": "estudio",
  "caption": "Retrato de estudio, suéter con cierre",
  "prompt": ""
 },
 {
  "slug": "retrato-de-estudio-mirada-al-frente",
  "theme": "estudio",
  "caption": "Retrato de estudio, mirada al frente",
  "prompt": ""
 },
 {
  "slug": "retrato-de-estudio-fondo-gris",
  "theme": "estudio",
  "caption": "Retrato de estudio, fondo gris",
  "prompt": ""
 },
 {
  "slug": "moto-entre-palmeras",
  "theme": "viajes",
  "caption": "Moto entre palmeras",
  "prompt": "Wide angle cinematic shot of Bexandy perched casually on a vintage"
 },
 {
  "slug": "desierto-aventura",
  "theme": "viajes",
  "caption": "Dunas y moto de aventura",
  "prompt": "Wide-angle cinematic shot of Bexandy standing triumphantly beside a"
 },
 {
  "slug": "oficina-ventana-ciudad",
  "theme": "trabajo",
  "caption": "Oficina con la ciudad al fondo",
  "prompt": ""
 },
 {
  "slug": "chaqueta-con-el-escudo-de-la-vinotinto",
  "theme": "venezuela",
  "caption": "Chaqueta con el escudo de la Vinotinto",
  "prompt": ""
 },
 {
  "slug": "muro-con-grafiti",
  "theme": "calle",
  "caption": "Muro con grafiti",
  "prompt": ""
 },
 {
  "slug": "moto-y-chaqueta-de-cuero-en-la-montana",
  "theme": "viajes",
  "caption": "Moto y chaqueta de cuero en la montaña",
  "prompt": ""
 },
 {
  "slug": "oficina-camisa-blanca",
  "theme": "trabajo",
  "caption": "Oficina abierta, camisa blanca",
  "prompt": ""
 },
 {
  "slug": "retrato-de-perfil-fondo-negro",
  "theme": "estudio",
  "caption": "Retrato de perfil, fondo negro",
  "prompt": ""
 },
 {
  "slug": "blazer-gris-apaisado",
  "theme": "estudio",
  "caption": "Blazer gris, apaisado",
  "prompt": ""
 },
 {
  "slug": "retrato-de-estudio-chaqueta-con-cierre",
  "theme": "estudio",
  "caption": "Retrato de estudio, chaqueta con cierre",
  "prompt": ""
 },
 {
  "slug": "traje-entre-monitores",
  "theme": "trabajo",
  "caption": "Traje entre monitores",
  "prompt": ""
 },
 {
  "slug": "traje-gris-sentado-en-estudio",
  "theme": "estudio",
  "caption": "Traje gris, sentado en estudio",
  "prompt": ""
 },
 {
  "slug": "sudadera-gris-y-teclado",
  "theme": "trabajo",
  "caption": "Sudadera gris y teclado",
  "prompt": ""
 },
 {
  "slug": "entre-rascacielos",
  "theme": "calle",
  "caption": "Entre rascacielos",
  "prompt": ""
 },
 {
  "slug": "santiago-nieve",
  "theme": "santiago",
  "caption": "Santiago con la cordillera nevada",
  "prompt": ""
 },
 {
  "slug": "traje-claro-en-un-porche-al-atardecer-2",
  "theme": "estudio",
  "caption": "Traje claro en un porche al atardecer",
  "prompt": ""
 },
 {
  "slug": "sillon-de-cuero-en-la-biblioteca",
  "theme": "estudio",
  "caption": "Sillón de cuero en la biblioteca",
  "prompt": ""
 },
 {
  "slug": "roraima-traje",
  "theme": "venezuela",
  "caption": "Carretera hacia el tepuy",
  "prompt": ""
 },
 {
  "slug": "laptop-de-noche",
  "theme": "trabajo",
  "caption": "Laptop de noche",
  "prompt": ""
 },
 {
  "slug": "retro-neon",
  "theme": "fantasia",
  "caption": "Chaqueta ochentera y neón",
  "prompt": ""
 },
 {
  "slug": "moto-en-carretera-nevada",
  "theme": "viajes",
  "caption": "Moto en carretera nevada",
  "prompt": ""
 },
 {
  "slug": "blazer-en-la-oficina",
  "theme": "trabajo",
  "caption": "Blazer en la oficina",
  "prompt": ""
 },
 {
  "slug": "camisa-clara-en-la-oficina",
  "theme": "trabajo",
  "caption": "Camisa clara en la oficina",
  "prompt": ""
 },
 {
  "slug": "chaqueta-de-jeans-noche-urbana",
  "theme": "calle",
  "caption": "Chaqueta de jeans, noche urbana",
  "prompt": ""
 },
 {
  "slug": "sala-de-control-con-la-chaqueta-de-la-vi",
  "theme": "venezuela",
  "caption": "Sala de control con la chaqueta de la Vinotinto",
  "prompt": ""
 },
 {
  "slug": "cafe-de-otono-sueter-claro",
  "theme": "calle",
  "caption": "Café de otoño, suéter claro",
  "prompt": ""
 },
 {
  "slug": "con-el-equipo-en-la-oficina",
  "theme": "trabajo",
  "caption": "Con el equipo en la oficina",
  "prompt": ""
 },
 {
  "slug": "retrato-de-perfil",
  "theme": "estudio",
  "caption": "Retrato de perfil",
  "prompt": ""
 }
];

/** Generado desde scripts/images/gallery.txt; las imágenes se preparan con scripts/images/prepare-gallery.sh */
export const gallery: GalleryItem[] = raw.map((r) => ({ ...r, image: files[`/src/assets/gallery/${r.slug}.jpg`]!.default }));
