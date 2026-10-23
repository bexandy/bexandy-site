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
  "slug": "escritorio-codigo",
  "theme": "trabajo",
  "caption": "Escritorio de vidrio, dos monitores y luz de atardecer",
  "prompt": "Cinematic medium shot of Bexandy seated at a sleek glass desk in a"
 },
 {
  "slug": "oficina-camisa-blanca",
  "theme": "trabajo",
  "caption": "Oficina abierta, camisa blanca",
  "prompt": ""
 },
 {
  "slug": "monitores-brazos-cruzados",
  "theme": "trabajo",
  "caption": "Entre monitores, brazos cruzados",
  "prompt": ""
 },
 {
  "slug": "monitores-gafas-traje",
  "theme": "trabajo",
  "caption": "Código en pantalla, gafas y traje",
  "prompt": ""
 },
 {
  "slug": "laptop-camiseta",
  "theme": "trabajo",
  "caption": "Trabajo remoto con laptop",
  "prompt": ""
 },
 {
  "slug": "oficina-ventana-ciudad",
  "theme": "trabajo",
  "caption": "Oficina con la ciudad al fondo",
  "prompt": ""
 },
 {
  "slug": "arquitecto-cafe",
  "theme": "trabajo",
  "caption": "Arquitecto de software en un café",
  "prompt": "Candid lifestyle portrait of Bexandy  senior software architect"
 },
 {
  "slug": "setup-gamer",
  "theme": "trabajo",
  "caption": "Puesto de trabajo con teclado retroiluminado",
  "prompt": "Medium shot of a Venezuelan man Bexandy"
 },
 {
  "slug": "retrato-estudio-negro",
  "theme": "estudio",
  "caption": "Retrato de estudio sobre fondo negro",
  "prompt": ""
 },
 {
  "slug": "sillon-cuero-bn",
  "theme": "estudio",
  "caption": "Sillón de cuero, blanco y negro",
  "prompt": "Three-quarter portrait of Bexandy centered in a minimalist studio"
 },
 {
  "slug": "ventana-bn",
  "theme": "estudio",
  "caption": "Traje junto a la ventana, blanco y negro",
  "prompt": ""
 },
 {
  "slug": "traje-claro-concreto",
  "theme": "estudio",
  "caption": "Traje claro contra muro de concreto",
  "prompt": "2874b08464494cb5b371c13d577f5325"
 },
 {
  "slug": "blazer-gris-retrato",
  "theme": "estudio",
  "caption": "Blazer gris, mano en la barbilla",
  "prompt": ""
 },
 {
  "slug": "traje-gris-sentado",
  "theme": "estudio",
  "caption": "Traje gris, sentado en estudio",
  "prompt": "ca818b82e2fc437badd23a762df16f38"
 },
 {
  "slug": "porche-atardecer",
  "theme": "estudio",
  "caption": "Traje claro en un porche al atardecer",
  "prompt": "d7106987bcf344e48bc4f007e41cfaa1"
 },
 {
  "slug": "taburete-traje-negro",
  "theme": "estudio",
  "caption": "Traje negro en taburete",
  "prompt": ""
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
  "slug": "santiago-nieve",
  "theme": "santiago",
  "caption": "Santiago con la cordillera nevada",
  "prompt": ""
 },
 {
  "slug": "santiago-calle-bus",
  "theme": "santiago",
  "caption": "Calle de Santiago, camisa celeste",
  "prompt": ""
 },
 {
  "slug": "santiago-cordillera",
  "theme": "santiago",
  "caption": "Mirando a la cordillera",
  "prompt": "Outdoor professional portrait of Bexandy"
 },
 {
  "slug": "cafe-risa",
  "theme": "calle",
  "caption": "Risa en un café de barrio",
  "prompt": "Candid street-style photograph of Bexandy captured mid-laugh at an"
 },
 {
  "slug": "paris-cruce",
  "theme": "calle",
  "caption": "Cruce de calle, estilo editorial",
  "prompt": "Full-body shot of Bexandy captured mid-stride"
 },
 {
  "slug": "adoquines",
  "theme": "calle",
  "caption": "Calle empedrada",
  "prompt": "Place the man from la foto original standing on a cobblestone street in a"
 },
 {
  "slug": "cafe-otono",
  "theme": "calle",
  "caption": "Café de otoño con taza en mano",
  "prompt": ""
 },
 {
  "slug": "chaqueta-jeans-noche",
  "theme": "calle",
  "caption": "Chaqueta de jeans, noche urbana",
  "prompt": "fa743930b15a49258a803745471d7fb8"
 },
 {
  "slug": "moto-montana",
  "theme": "viajes",
  "caption": "Moto en la cordillera",
  "prompt": ""
 },
 {
  "slug": "moto-desierto",
  "theme": "viajes",
  "caption": "Moto en el desierto rojo",
  "prompt": "A grand"
 },
 {
  "slug": "volante",
  "theme": "viajes",
  "caption": "Al volante, luces de ciudad",
  "prompt": "Cinematic interior shot of Bexandy in the driver's seat of a sleek"
 },
 {
  "slug": "moto-neon",
  "theme": "viajes",
  "caption": "Moto bajo neones",
  "prompt": "Cinematic wide shot of Bexandy perched on a matte-black"
 },
 {
  "slug": "ruta-66",
  "theme": "viajes",
  "caption": "Clásica en la Ruta 66",
  "prompt": "Low-angle wide shot of Bexandy perched atop a classic 1965"
 },
 {
  "slug": "desierto-aventura",
  "theme": "viajes",
  "caption": "Dunas y moto de aventura",
  "prompt": "Wide-angle cinematic shot of Bexandy standing triumphantly beside a"
 },
 {
  "slug": "beisbol-venezuela",
  "theme": "venezuela",
  "caption": "Uniforme de Venezuela en el estadio",
  "prompt": ""
 },
 {
  "slug": "roraima-4x4",
  "theme": "venezuela",
  "caption": "Tepuy y camioneta",
  "prompt": ""
 },
 {
  "slug": "roraima-traje",
  "theme": "venezuela",
  "caption": "Carretera hacia el tepuy",
  "prompt": ""
 },
 {
  "slug": "caballo-flamencos",
  "theme": "venezuela",
  "caption": "Caballo blanco y corocoras",
  "prompt": ""
 },
 {
  "slug": "vinotinto-nasa",
  "theme": "venezuela",
  "caption": "Chaqueta con el escudo de la Vinotinto",
  "prompt": "a2b61ed70b4e4ba9889d62d1d01408ac"
 },
 {
  "slug": "tango",
  "theme": "baile",
  "caption": "Baile de salón con vestido rojo",
  "prompt": ""
 },
 {
  "slug": "salsa-luces",
  "theme": "baile",
  "caption": "Salsa bajo las luces",
  "prompt": "Dynamic medium shot of Bexandy captured in the midst of a fluid"
 },
 {
  "slug": "billar",
  "theme": "noche",
  "caption": "Mesa de billar en un lounge",
  "prompt": "Cinematic mid-shot of Bexandy leaning casually against the edge of a"
 },
 {
  "slug": "bar-lujo",
  "theme": "noche",
  "caption": "Bar de lujo, chaqueta de cuero",
  "prompt": "Place the man from la foto original in a moody"
 },
 {
  "slug": "santiago-neon",
  "theme": "noche",
  "caption": "Neón de Santiago de Chile",
  "prompt": "Transform the background of la foto original into an upscale luxury bar in"
 },
 {
  "slug": "link-convencion",
  "theme": "fantasia",
  "caption": "Cosplay de Link en una convención",
  "prompt": "At the Convention - Bexandy"
 },
 {
  "slug": "retro-80s",
  "theme": "fantasia",
  "caption": "Retrato retro años 80",
  "prompt": ""
 },
 {
  "slug": "retro-neon",
  "theme": "fantasia",
  "caption": "Chaqueta ochentera y neón",
  "prompt": ""
 },
 {
  "slug": "silla-scifi",
  "theme": "fantasia",
  "caption": "Silla de mando futurista",
  "prompt": ""
 },
 {
  "slug": "minotauro",
  "theme": "fantasia",
  "caption": "Minotauro de fantasía",
  "prompt": "23ed427da0534ec690e3a6bf3e964b2a"
 }
];

/** Generado desde scripts/images/gallery.txt; las imágenes se preparan con scripts/images/prepare-gallery.sh */
export const gallery: GalleryItem[] = raw.map((r) => ({ ...r, image: files[`/src/assets/gallery/${r.slug}.jpg`]!.default }));
