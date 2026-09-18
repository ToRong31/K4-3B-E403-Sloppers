import { useEffect, useRef, useState } from 'react';

export function GroupSettingsDialog({
  open,
  group,
  members = [],
  onClose,
  onSave,
  onDelete,
  onRemoveMember,
}) {
  const dialogRef = useRef(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteArmed, setDeleteArmed] = useState(false);

  useEffect(() => {
    if (open && group) {
      setName(group.name);
      setCode(group.code);
      setError('');
      setDeleteArmed(false);
      if (!dialogRef.current.open) dialogRef.current.showModal();
    } else if (!open && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [group, open]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave({ name, code });
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const removeGroup = async () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onDelete();
    } catch (deleteError) {
      setError(deleteError.message);
      setSaving(false);
    }
  };

  const removeMember = async (member) => {
    setError('');
    try {
      await onRemoveMember(member.id);
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  return (
    <dialog ref={dialogRef} open={open} className="group-settings-dialog" onClose={onClose} onCancel={onClose}>
      <header className="group-dialog-header">
        <div>
          <span>LABSPACE · QUẢN LÝ NHÓM</span>
          <h2>Chỉnh sửa nhóm</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng cài đặt nhóm">×</button>
      </header>
      <section className="group-dialog-body">
        <label>Tên nhóm
          <input value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>Mã nhóm
          <input value={code} maxLength={20} onChange={(event) => setCode(event.target.value.toUpperCase())} />
        </label>

        <section aria-labelledby="group-member-management-title">
          <h3 id="group-member-management-title">Thành viên và lời mời</h3>
          {members.map((member) => (
            <div key={member.id} className="group-member-management-row">
              <span><b>{member.name}</b> · {member.status === 'pending' ? 'đang chờ' : 'đã vào'}</span>
              {member.role !== 'Nhóm trưởng' && (
                <button type="button" className="text-button" onClick={() => removeMember(member)}>
                  {member.status === 'pending' ? 'Hủy lời mời' : 'Xóa khỏi nhóm'}
                </button>
              )}
            </div>
          ))}
        </section>

        {error && <p className="form-error" role="alert">{error}</p>}
        {deleteArmed && <p className="form-error" role="status">Bấm “Xóa nhóm” lần nữa để xác nhận. Toàn bộ invitation, plan và progress sẽ bị xóa.</p>}
        <footer className="group-dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
          <button type="button" className="primary-button" disabled={saving || !name.trim() || code.trim().length < 4} onClick={save}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
          <button type="button" className="danger-outline" disabled={saving} onClick={removeGroup}>
            {deleteArmed ? 'Xóa nhóm lần nữa' : 'Xóa nhóm'}
          </button>
        </footer>
      </section>
    </dialog>
  );
}
