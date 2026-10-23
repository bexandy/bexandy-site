import agenciasur from '../assets/logos/agenciasur.png';
import mambomadness from '../assets/logos/mambomadness.png';
import lacasadelmambo from '../assets/logos/lacasadelmambo.png';
import rumbadecalle from '../assets/logos/rumbadecalle.png';
import type { ImageMetadata } from 'astro';

export interface Org {
  id: string;
  name: string;
  role: string;
  description: string;
  url?: string;
  instagram?: string;
  city: string;
  logo: ImageMetadata;
  /** fondo claro bajo el logo (logos oscuros sobre transparente) */
  lightChip?: boolean;
  /** logo circular (foto de perfil) */
  round?: boolean;
  /** logo apaisado: recuadro ancho */
  wide?: boolean;
}

/** Empresa donde trabajo. */
export const employer: Org = {
  id: 'agenciasur',
  name: 'Agencia Sur SpA',
  role: 'Senior Backend Developer desde 2019',
  description: 'Desarrollo de sistemas web y móviles y digitalización de procesos para empresas. Providencia, Santiago.',
  url: 'https://agenciasur.cl/',
  city: 'Providencia',
  logo: agenciasur,
  lightChip: true,
  wide: true,
};

/** Academias donde soy alumno. */
export const academies: Org[] = [
  {
    id: 'mambomadness',
    name: 'Mambo Madness',
    role: 'Alumno · salsa On2',
    description: 'Escuela de salsa y bachata de Gabo y Mayra, con clases de lunes a sábado y práctica social mensual.',
    url: 'https://www.mambomadnesscl.com/',
    instagram: 'mambo.madness',
    city: 'Providencia',
    logo: mambomadness,
    lightChip: true,
  },
  {
    id: 'lacasadelmambo',
    name: 'La Casa del Mambo',
    role: 'Alumno · salsa On1 y On2',
    description: 'Academia de bailes latinos fundada en 2011: salsa, mambo y bachata, con baile social y orquesta en vivo.',
    url: 'https://www.lacasadelmambo.cl/',
    instagram: 'lacasadelmambo',
    city: 'Santiago Centro',
    logo: lacasadelmambo,
  },
  {
    id: 'rumbadecalle',
    name: 'Rumba de Calle · Ñuñoa',
    role: 'Alumno · salsa y bachata',
    description: 'Clases de ritmos latinos al aire libre en Plaza Ñuñoa, martes, jueves y domingo, y baile social en la calle.',
    instagram: 'rumbadecalle',
    city: 'Plaza Ñuñoa',
    logo: rumbadecalle,
    round: true,
  },
];
