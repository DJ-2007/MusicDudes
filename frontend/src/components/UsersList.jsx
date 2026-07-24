import React from 'react';

export default function UsersList({ users }) {
  return (
    <section className="users-panel card fade-in desktop-right-sidebar">
      <div className="section-header">
        <div>
          <p className="eyebrow">Friends Listening</p>
          <h3>Active Users</h3>
        </div>
      </div>
      <div className="users-list">
        {users.length > 0 ? users.map((user) => (
          <div key={user.id} className="user-row">
            <div className="user-avatar">{user.avatar || user.name.slice(0, 1).toUpperCase()}</div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-status">Listening now</div>
            </div>
          </div>
        )) : (
          <div className="empty-users">No one else is in the room yet.</div>
        )}
      </div>
    </section>
  );
}