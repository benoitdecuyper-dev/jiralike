import { describe, it, expect } from 'vitest';
import { cap, shortId, sanitizeSearchTerm, parseMarkdownTickets, isValidEmail, authErrorMessage } from './utils.js';

describe('cap', () => {
  it('capitalise la première lettre', () => expect(cap('haute')).toBe('Haute'));
  it('gère le vide', () => expect(cap('')).toBe(''));
});

describe('shortId', () => {
  it('tronque à 8 caractères', () => expect(shortId('abcdef123456')).toBe('abcdef12'));
  it('gère null', () => expect(shortId(null)).toBe(''));
});

describe('sanitizeSearchTerm', () => {
  it('retire les caractères qui cassent .or()', () => {
    expect(sanitizeSearchTerm('a,b(c)*')).toBe('a b c');
  });
  it('trim et gère undefined', () => {
    expect(sanitizeSearchTerm('  x  ')).toBe('x');
    expect(sanitizeSearchTerm(undefined)).toBe('');
  });
});

describe('parseMarkdownTickets', () => {
  it('lit les puces, retire emphase et clé de ticket', () => {
    const md = `## ÉPIC FDF-E1\n- **FDF-1** Rédiger la note *(fait)*\n- FDF-2 Cadrer le concept`;
    const r = parseMarkdownTickets(md);
    expect(r.map(x => x.titre)).toEqual(['Rédiger la note (fait)', 'Cadrer le concept']);
    expect(r[0]).toMatchObject({ type: 'tache', priorite: 'moyenne' });
  });

  it('retombe sur les lignes simples quand il n\'y a pas de puce', () => {
    const r = parseMarkdownTickets('Tâche A\n# Titre ignoré\n> citation\nTâche B');
    expect(r.map(x => x.titre)).toEqual(['Tâche A', 'Tâche B']);
  });

  it('renvoie une liste vide pour du vide', () => {
    expect(parseMarkdownTickets('')).toEqual([]);
    expect(parseMarkdownTickets(null)).toEqual([]);
  });
});

describe('isValidEmail', () => {
  it('accepte une adresse valide', () => {
    expect(isValidEmail('jean@boite.fr')).toBe(true);
  });
  it('refuse les adresses invalides et le vide', () => {
    expect(isValidEmail('jean@boite')).toBe(false);
    expect(isValidEmail('jeanboite.fr')).toBe(false);
    expect(isValidEmail('a b@c.fr')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('authErrorMessage', () => {
  it('gère le vide', () => expect(authErrorMessage(null)).toBe(''));
  it('mappe les identifiants invalides sans révéler le détail', () => {
    expect(authErrorMessage({ message: 'Invalid login credentials' }))
      .toBe('Email ou mot de passe incorrect.');
  });
  it('mappe la limite de débit', () => {
    expect(authErrorMessage({ message: 'Email rate limit exceeded' }))
      .toBe('Trop de tentatives. Réessaie dans quelques minutes.');
  });
  it('retombe sur le message brut si inconnu', () => {
    expect(authErrorMessage({ message: 'Boom' })).toBe('Boom');
  });
});
