import { describe, expect, it } from 'vitest';

import { buildSkillProfile, skillGroups } from './MemberInviteFlow';

describe('member skill profile', () => {
  it('keeps the three skill categories defined by the approved mockup', () => {
    expect(skillGroups.map((group) => group.label)).toEqual([
      'ENGINEERING',
      'AI / DATA',
      'PRODUCT & DESIGN',
    ]);
  });

  it('normalizes selected skills into the profile payload shape', () => {
    expect(buildSkillProfile(['Frontend', 'UI/UX Design'], { Frontend: 4, 'UI/UX Design': '5' })).toEqual([
      { skill: 'Frontend', level: 4 },
      { skill: 'UI/UX Design', level: 5 },
    ]);
  });

  it('uses level 3 when a selected skill has not been rated yet', () => {
    expect(buildSkillProfile(['Backend'], {})).toEqual([{ skill: 'Backend', level: 3 }]);
  });
});
