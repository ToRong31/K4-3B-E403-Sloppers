import { useEffect, useMemo, useRef, useState } from 'react';

export const skillGroups = Object.freeze([
  { id: 'engineering', label: 'ENGINEERING', skills: ['Frontend', 'Backend', 'Mobile', 'DevOps / Cloud'] },
  { id: 'ai-data', label: 'AI / DATA', skills: ['Machine Learning', 'NLP', 'Computer Vision', 'Data Analysis', 'Data Engineering', 'Prompt Engineering'] },
  { id: 'product', label: 'PRODUCT', skills: ['Product Management', 'Business Analysis', 'User/Market Research'] },
  { id: 'design', label: 'DESIGN', skills: ['UI/UX Design', 'Graphic Design'] },
  { id: 'leadership', label: 'LEADERSHIP', skills: ['Project Management', 'Team Leadership', 'Communication'] },
]);

export const industries = Object.freeze([
  'IT',
  'Education',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Agriculture',
  'Entertainment',
  'Social Impact',
  'Productivity',
  'Khác',
]);

const defaultSkills = ['Frontend', 'Prompt Engineering', 'UI/UX Design'];
const defaultLevels = { Frontend: 4, 'Prompt Engineering': 3, 'UI/UX Design': 4 };

export function buildSkillProfile(selectedSkills, levels) {
  return selectedSkills.map((skill) => ({ skill, level: Number(levels[skill] ?? 3) }));
}

export function MemberInviteFlow({ currentUser, group, invitationStatus, labTitle, onInvitationChange, onProfileSaved, profileReady }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [step, setStep] = useState('edit');
  const [selectedSkills, setSelectedSkills] = useState(defaultSkills);
  const [levels, setLevels] = useState(defaultLevels);
  const [industry, setIndustry] = useState('IT');
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customSkills, setCustomSkills] = useState([]);
  const [customSkillError, setCustomSkillError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (onboardingOpen && !dialog.open) dialog.showModal();
    if (!onboardingOpen && dialog.open) dialog.close();
  }, [onboardingOpen]);

  const profile = useMemo(() => buildSkillProfile(selectedSkills, levels), [levels, selectedSkills]);

  const closeOnboarding = () => {
    setOnboardingOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const acceptInvitation = () => {
    onInvitationChange('accepted');
    setPanelOpen(false);
    setStep('edit');
    setOnboardingOpen(true);
  };

  const declineInvitation = () => {
    onInvitationChange('declined');
    setPanelOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((current) => current.includes(skill)
      ? current.filter((item) => item !== skill)
      : [...current, skill]);
    setLevels((current) => current[skill] ? current : { ...current, [skill]: 3 });
  };

  const addCustomSkill = () => {
    const skill = customSkillInput.trim();
    if (!skill) return;
    if (selectedSkills.some((item) => item.toLocaleLowerCase() === skill.toLocaleLowerCase())) {
      setCustomSkillError('Kỹ năng này đã có trong hồ sơ.');
      return;
    }
    setSelectedSkills((current) => [...current, skill]);
    setCustomSkills((current) => [...current, skill]);
    setLevels((current) => ({ ...current, [skill]: 3 }));
    setCustomSkillInput('');
    setCustomSkillError('');
  };

  const removeCustomSkill = (skill) => {
    setCustomSkills((current) => current.filter((item) => item !== skill));
    setSelectedSkills((current) => current.filter((item) => item !== skill));
  };

  const saveProfile = () => {
    onProfileSaved({ industry, skills: profile, customSkills });
    setStep('success');
  };

  const unread = invitationStatus === 'pending';
  const canOpenProfile = invitationStatus === 'accepted' && !profileReady;

  return (
    <div className="member-invite-flow">
      <button
        ref={triggerRef}
        className="notification-trigger"
        type="button"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((current) => !current)}
      >
        <span aria-hidden="true">♢</span> Thông báo
        {unread && <i aria-label="1 thông báo chưa đọc">1</i>}
      </button>

      {panelOpen && (
        <>
          <button className="notification-scrim" type="button" aria-label="Đóng thông báo" onClick={() => setPanelOpen(false)} />
          <aside className="member-notification-panel" aria-label={`Thông báo của ${currentUser.shortName}`}>
            <header>
              <div><span>VIEW HỌC VIÊN · {currentUser.displayName.toUpperCase()}</span><h2>Thông báo</h2></div>
              <button type="button" aria-label="Đóng thông báo" onClick={() => setPanelOpen(false)}>×</button>
            </header>

            {invitationStatus === 'pending' && (
              <article className="invite-notification-card">
                <span className="member-avatar">T</span>
                <div>
                  <b>Lời mời vào nhóm {group.name}</b>
                  <p>Trọng mời bạn tham gia Mini Hackathon AI.</p>
                  <small>Vừa xong · Mã nhóm {group.code}</small>
                  <div className="notification-actions">
                    <button className="secondary-button" type="button" onClick={declineInvitation}>Từ chối</button>
                    <button className="primary-button" type="button" onClick={acceptInvitation}>Xác nhận tham gia</button>
                  </div>
                </div>
              </article>
            )}

            {invitationStatus === 'declined' && (
              <div className="notification-empty"><b>Bạn đã từ chối lời mời</b><p>Nhóm trưởng sẽ thấy trạng thái từ chối trong LabSpace.</p></div>
            )}

            {canOpenProfile && (
              <div className="notification-empty profile-pending"><b>Đã tham gia · Còn 1 bước</b><p>Hoàn tất hồ sơ kỹ năng để nhóm trưởng có đủ dữ liệu tạo bản nháp.</p><button className="primary-button" type="button" onClick={() => { setPanelOpen(false); setOnboardingOpen(true); }}>Tiếp tục khai kỹ năng →</button></div>
            )}

            {profileReady && (
              <div className="notification-empty profile-complete"><b>✓ Hồ sơ phiên Lab đã sẵn sàng</b><p>Nhóm trưởng có thể xem trạng thái hoàn tất của bạn.</p></div>
            )}

            <p className="notification-note">Xác nhận lời mời sẽ mở onboarding kỹ năng cho riêng phiên LAB này.</p>
          </aside>
        </>
      )}

      <dialog ref={dialogRef} className="member-profile-dialog" onClose={() => setOnboardingOpen(false)} onCancel={closeOnboarding} aria-labelledby="member-profile-title">
        <header className="group-dialog-header">
          <div><span>VIEW HỌC VIÊN · {currentUser.displayName.toUpperCase()} · SAU KHI XÁC NHẬN THÔNG BÁO</span><h2 id="member-profile-title">Hồ sơ năng lực phiên Lab</h2></div>
          <button type="button" onClick={closeOnboarding} aria-label="Đóng hồ sơ kỹ năng">×</button>
        </header>

        {step === 'edit' && (
          <section className="member-profile-body">
            <p className="member-profile-intro"><b>Onboarding của {currentUser.shortName}</b> · Chọn kỹ năng và tự đánh giá để AI tham khảo khi nhóm trưởng tạo bản nháp phân công.</p>
            <div className="profile-boundary-note">Bạn chỉ khai báo năng lực; AI không tự giao task. Nhóm trưởng và cả nhóm vẫn xem, điều chỉnh trước khi phê duyệt.</div>
            <div className="profile-lab-label"><span>Bài Lab</span><b>{labTitle}</b></div>
            <label className="industry-field">Ngành đang công tác
              <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                {industries.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
            <h3 className="profile-section-title">Kỹ năng <small>chọn rồi tự đánh giá mức 1–5</small></h3>
            <div className="skill-group-list">
              {skillGroups.map((groupItem) => (
                <section key={groupItem.id}>
                  <b>{groupItem.label}</b>
                  <div>
                    {groupItem.skills.map((skill) => {
                      const selected = selectedSkills.includes(skill);
                      return <button className={selected ? 'selected' : ''} type="button" aria-pressed={selected} key={skill} onClick={() => toggleSkill(skill)}>{selected ? '✓ ' : ''}{skill}</button>;
                    })}
                  </div>
                </section>
              ))}
            </div>

            <section className="custom-skill-section">
              <b>KỸ NĂNG TỰ NHẬP</b>
              <p>Thêm kỹ năng chưa có trong danh sách; bạn sẽ tự đánh giá mức độ ở phần bên dưới.</p>
              <div>
                <input
                  value={customSkillInput}
                  maxLength={40}
                  placeholder="Ví dụ: Automation Testing"
                  onChange={(event) => { setCustomSkillInput(event.target.value); setCustomSkillError(''); }}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomSkill(); } }}
                />
                <button className="secondary-button" type="button" onClick={addCustomSkill}>＋ Thêm</button>
              </div>
              {customSkillError && <small>{customSkillError}</small>}
              {customSkills.length > 0 && <div className="custom-skill-chips">{customSkills.map((skill) => <button type="button" key={skill} onClick={() => removeCustomSkill(skill)}>{skill} <span aria-hidden="true">×</span></button>)}</div>}
            </section>

            <section className="proficiency-card">
              <header><b>MỨC ĐỘ THÀNH THẠO</b><small>1 = cơ bản · 5 = chuyên gia</small></header>
              {selectedSkills.length ? selectedSkills.map((skill) => (
                <label key={skill}>{skill}<output>{levels[skill] ?? 3}</output><input type="range" min="1" max="5" value={levels[skill] ?? 3} onChange={(event) => setLevels((current) => ({ ...current, [skill]: Number(event.target.value) }))} /></label>
              )) : <p>Hãy chọn ít nhất một kỹ năng để tiếp tục.</p>}
            </section>
            <footer className="group-dialog-actions"><button className="secondary-button" type="button" onClick={closeOnboarding}>Để sau</button><button className="primary-button" type="button" disabled={!selectedSkills.length} onClick={() => setStep('review')}>Xem lại hồ sơ →</button></footer>
          </section>
        )}

        {step === 'review' && (
          <section className="member-profile-body profile-review">
            <span className="review-eyebrow">BƯỚC 2/2 · XÁC NHẬN THÔNG TIN</span>
            <h3>Hồ sơ của {currentUser.displayName}</h3>
            <p>Kiểm tra lại trước khi gửi trạng thái hoàn tất cho nhóm trưởng.</p>
            <div className="profile-review-meta"><span>Ngành đang công tác</span><b>{industry}</b></div>
            <div className="profile-review-list">
              {profile.map((item) => <div key={item.skill}><b>{item.skill}</b><span>{'★'.repeat(item.level)}{'☆'.repeat(5 - item.level)} · {item.level}/5</span></div>)}
            </div>
            <div className="profile-boundary-note">Thông tin này là tự đánh giá cho phiên Lab, không phải quyết định phân công chính thức.</div>
            <footer className="group-dialog-actions"><button className="secondary-button" type="button" onClick={() => setStep('edit')}>← Chỉnh sửa</button><button className="primary-button" type="button" onClick={saveProfile}>Xác nhận & lưu hồ sơ</button></footer>
          </section>
        )}

        {step === 'success' && (
          <section className="group-created-state">
            <span className="group-created-check">✓</span>
            <h3>Hồ sơ đã sẵn sàng</h3>
            <p>Trạng thái của bạn đã được cập nhật trong giao diện mô phỏng.</p>
            <div className="leader-setup-notice">Backend và realtime sẽ là nguồn xác nhận cuối cùng khi được tích hợp.</div>
            <footer className="group-dialog-actions"><button className="primary-button" type="button" onClick={closeOnboarding}>Vào LabSpace →</button></footer>
          </section>
        )}
      </dialog>
    </div>
  );
}
