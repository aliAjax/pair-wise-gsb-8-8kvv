// 界面层：通用弹窗外壳。
import React from 'react';

export function Modal({ title, crumb, onClose, children, wide }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={wide ? 'modal modal-wide' : 'modal'}>
        <button className="close" onClick={onClose}>
          ×
        </button>
        {crumb && <span className="crumb">{crumb}</span>}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
