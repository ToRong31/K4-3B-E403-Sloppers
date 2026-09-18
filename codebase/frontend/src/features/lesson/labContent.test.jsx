import { describe, expect, it } from 'vitest';

import { labLessons } from './labContent';

describe('Mini Hackathon lesson fixture', () => {
  it('contains the six checkpoints, CP6 reading and submission page', () => {
    expect(labLessons).toHaveLength(8);
    expect(labLessons.map((lesson) => lesson.id)).toEqual([
      'prepare', 'cp1', 'cp2', 'cp3', 'cp4', 'cp5', 'cp6', 'submission',
    ]);
  });

  it('keeps AI implementation out of the static lesson fixture', () => {
    expect(labLessons.at(-1).component).toBeNull();
    expect(labLessons.find((lesson) => lesson.id === 'cp3').label).toContain('AI thật');
  });
});
