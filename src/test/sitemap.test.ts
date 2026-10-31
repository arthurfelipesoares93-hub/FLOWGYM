import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { routeTree } from '@/routeTree.gen';
import { sitemapStaticPaths, sitemapXML } from '@/lib/sitemap';

describe('Public sitemap', () => {
  it('includes only public content and excludes student, trainer and access flows', () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(sitemapStaticPaths(router)).toEqual(['/', '/como-funciona', '/contato', '/william']);
  });

  it('uses the public domain without inventing modification dates', () => {
    const xml = sitemapXML('https://teamoliveira.live', [{ path: '/' }]);
    expect(xml).toContain('<loc>https://teamoliveira.live/</loc>');
    expect(xml).not.toContain('<lastmod>');
  });
});