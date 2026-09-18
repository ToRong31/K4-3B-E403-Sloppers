export const demoAccounts = Object.freeze([
  {
    id: 'user-leader-trong',
    accountId: '2A202602765',
    email: 'leader.demo@vlearn.local',
    displayName: 'Phạm Hoàng Trọng',
    shortName: 'Trọng',
    role: 'leader',
    roleLabel: 'Nhóm trưởng',
    avatar: 'T',
  },
  {
    id: 'user-member-trang',
    accountId: '2A202602678',
    email: 'member.demo@vlearn.local',
    displayName: 'Lê Thị Thùy Trang',
    shortName: 'Trang',
    role: 'member',
    roleLabel: 'Thành viên',
    avatar: 'T',
  },
  {
    id: 'user-coach-e403',
    accountId: 'COACH-E403',
    email: 'coach.demo@vlearn.local',
    displayName: 'Lab Coach E403',
    shortName: 'Coach E403',
    role: 'coach',
    roleLabel: 'Lab Coach',
    avatar: 'GV',
  },
]);

export const labFixture = Object.freeze({
  id: 'k4-l3b-day05-06',
  course: 'K4 · L3B · DAY05–06',
  title: 'Bài 16 · MINI HACKATHON',
  description: 'AI Product Hackathon: SPEC → Prototype → Demo · đầy đủ nội dung CP1–CP6.',
  status: 'in_progress',
  progress: 0,
  lessonCount: 21,
  updatedAt: 'Bài Lab mẫu đã được tải lên',
});

export const canonicalTasksFixture = Object.freeze([
  { id: 't1', category: 'EVIDENCE', title: 'Khảo sát và tổng hợp pain', deliverable: 'Evidence log + quote', owner: 'Chưa phân công', status: 'todo' },
  { id: 't2', category: 'PRODUCT', title: 'Chốt Canvas 7 dòng', deliverable: 'canvas.md', owner: 'Chưa phân công', status: 'todo' },
  { id: 't3', category: 'UI / FLOW', title: 'Dựng flow tương tác', deliverable: 'Mockup bấm được', owner: 'Chưa phân công', status: 'todo' },
  { id: 't4', category: 'AI / EVAL', title: 'AI assignment + golden set', deliverable: 'Model call + ≥20 case', owner: 'Chưa phân công', status: 'todo' },
  { id: 't5', category: 'SUBMISSION', title: 'Hoàn thiện spec và gói nộp', deliverable: 'Spec + slide + video', owner: 'Chưa phân công', status: 'todo' },
]);

import fullLabManifest from './labManifest.json';

export const defaultLabManifest = Object.freeze(fullLabManifest);

export const workspaceFixture = Object.freeze({
  source: 'mock',
  group: { id: 'group-sloppers', name: 'Sloppers', code: 'SLOP-3B' },
  checklistSource: 'Chưa phân tích checklist từ bài Lab',
  planStatus: 'draft',
  members: [
    {
      id: 'm1',
      studentCode: '2A202602765',
      fullName: 'Phạm Hoàng Trọng',
      name: 'Trọng',
      role: 'Nhóm trưởng · Product',
      className: 'K4-E403',
      avatar: 'T',
      color: '#0284c7',
      status: 'accepted',
      profileReady: true,
      industry: 'IT',
      skills: ['Product Management', 'User/Market Research', 'Project Management', 'Team Leadership'],
      skillLevels: { 'Product Management': 5, 'User/Market Research': 4, 'Project Management': 4, 'Team Leadership': 5 },
      skillsWithLevel: [
        { skill: 'Product Management', level: 5 },
        { skill: 'User/Market Research', level: 4 },
        { skill: 'Project Management', level: 4 },
        { skill: 'Team Leadership', level: 5 },
      ],
    },
    {
      id: 'm2',
      studentCode: '2A202602678',
      fullName: 'Lê Thị Thùy Trang',
      name: 'Trang',
      role: 'Frontend · UI/UX',
      className: 'K4-E403',
      avatar: 'T',
      color: '#0d9488',
      status: 'accepted',
      profileReady: true,
      industry: 'IT',
      skills: ['Frontend', 'UI/UX Design', 'Prompt Engineering'],
      skillLevels: { Frontend: 4, 'UI/UX Design': 4, 'Prompt Engineering': 3 },
      skillsWithLevel: [
        { skill: 'Frontend', level: 4 },
        { skill: 'UI/UX Design', level: 4 },
        { skill: 'Prompt Engineering', level: 3 },
      ],
    },
    {
      id: 'm3',
      studentCode: '2A202602676',
      fullName: 'Lâm Hải Dương',
      name: 'Dương',
      role: 'AI · Prompt',
      className: 'K4-E403',
      avatar: 'D',
      color: '#7c3aed',
      status: 'accepted',
      profileReady: true,
      industry: 'IT',
      skills: ['Prompt Engineering', 'NLP', 'Machine Learning', 'Data Analysis'],
      skillLevels: { 'Prompt Engineering': 5, NLP: 4, 'Machine Learning': 4, 'Data Analysis': 3 },
      skillsWithLevel: [
        { skill: 'Prompt Engineering', level: 5 },
        { skill: 'NLP', level: 4 },
        { skill: 'Machine Learning', level: 4 },
        { skill: 'Data Analysis', level: 3 },
      ],
    },
    {
      id: 'm4',
      studentCode: '2A202602523',
      fullName: 'Hoàng Quốc Dũng',
      name: 'Dũng',
      role: 'Backend · Data',
      className: 'K4-E403',
      avatar: 'D',
      color: '#ea580c',
      status: 'accepted',
      profileReady: true,
      industry: 'IT',
      skills: ['Backend', 'Data Engineering', 'DevOps / Cloud'],
      skillLevels: { Backend: 5, 'Data Engineering': 4, 'DevOps / Cloud': 4 },
      skillsWithLevel: [
        { skill: 'Backend', level: 5 },
        { skill: 'Data Engineering', level: 4 },
        { skill: 'DevOps / Cloud', level: 4 },
      ],
    },
  ],
  tasks: [],
});

export const coachFixture = Object.freeze({
  source: 'mock',
  summary: { activeGroups: 12, aboveEighty: 5, blocked: 3, helpNeeded: 2 },
  groups: [
    { id: 'g1', name: 'Sloppers', code: 'SLOP-3B', progress: 40, blocked: 1, lastCheckIn: '2 phút trước', help: 'pending' },
    { id: 'g2', name: 'Team Phoenix', code: 'PHNX-08', progress: 80, blocked: 0, lastCheckIn: '5 phút trước', help: null },
    { id: 'g3', name: 'Null Pointers', code: 'NULL-12', progress: 20, blocked: 2, lastCheckIn: '11 phút trước', help: 'pending' },
    { id: 'g4', name: 'AI Sprinters', code: 'AISP-04', progress: 100, blocked: 0, lastCheckIn: '1 phút trước', help: null },
  ],
});
