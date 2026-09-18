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

export const defaultLabManifest = Object.freeze({
  lab_id: 'K4-L3B-DAY05-06-MINI-HACKATHON',
  version: 1,
  title: 'Mini Hackathon AI',
  checkpoints: [
    {
      checkpoint_id: 'cp1',
      checkpoint_order: 1,
      title: 'Canvas và repo',
      items: [
        {
          item_id: 'cp1-item-1',
          item_order: 1,
          source_type: 'deliverable',
          title: 'Canvas 7 dòng',
          content: 'Hoàn thành Canvas 7 dòng và nộp link repo công khai.',
          ref_id: 'lab://K4-L3B-DAY05-06/v1/cp1/item-1',
          is_required: true,
        },
      ],
    },
    {
      checkpoint_id: 'cp3',
      checkpoint_order: 3,
      title: 'Video thao tác và số đo',
      items: [
        {
          item_id: 'cp3-item-1',
          item_order: 1,
          source_type: 'requirement',
          title: 'Golden set',
          content: 'Chuẩn bị ít nhất 20 câu thử và ghi lại số case đạt chuẩn.',
          ref_id: 'lab://K4-L3B-DAY05-06/v1/cp3/item-1',
          is_required: true,
        },
        {
          item_id: 'cp3-item-2',
          item_order: 2,
          source_type: 'deliverable',
          title: 'Video thao tác',
          content: 'Quay video thao tác sản phẩm khoảng 30 giây.',
          ref_id: 'lab://K4-L3B-DAY05-06/v1/cp3/item-2',
          is_required: true,
        },
      ],
    },
  ],
});

export const workspaceFixture = Object.freeze({
  source: 'mock',
  group: { id: 'group-sloppers', name: 'Sloppers', code: 'SLOP-3B' },
  checklistSource: 'Chưa phân tích checklist từ bài Lab',
  planStatus: 'draft',
  members: [
    { id: 'm1', studentCode: '2A202602765', fullName: 'Phạm Hoàng Trọng', name: 'Trọng', role: 'Nhóm trưởng', className: 'K4-E403', avatar: 'T', color: '#0284c7', status: 'accepted', profileReady: true },
    { id: 'm2', studentCode: '2A202602678', fullName: 'Lê Thị Thùy Trang', name: 'Trang', role: 'Frontend · UI/UX', className: 'K4-E403', avatar: 'T', color: '#0d9488', status: 'pending', profileReady: false },
    { id: 'm3', studentCode: '2A202602676', fullName: 'Lâm Hải Dương', name: 'Dương', role: 'AI · Prompt', className: 'K4-E403', avatar: 'D', color: '#7c3aed', status: 'pending', profileReady: false },
    { id: 'm4', studentCode: '2A202602523', fullName: 'Hoàng Quốc Dũng', name: 'Dũng', role: 'Backend · Data', className: 'K4-E403', avatar: 'D', color: '#ea580c', status: 'pending', profileReady: false },
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
