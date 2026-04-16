import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navigation() {
    const { role: activeRole, base: activeBase, login, logout } = useAuth();
    const [formRole, setFormRole] = useState('Admin');
    const [formBase, setFormBase] = useState('Alpha');

    const handleLogin = (e) => {
        e.preventDefault();
        login(formRole, formBase);
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">Military AMS</div>

            <div className="nav-links">
                {activeRole !== 'Logistics' && <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Dashboard</NavLink>}
                {activeRole !== 'Commander' && <NavLink to="/purchases" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Purchases</NavLink>}
                {activeRole !== 'Commander' && <NavLink to="/transfers" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Transfers</NavLink>}
                {activeRole !== 'Logistics' && <NavLink to="/assignments" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Assignments</NavLink>}
            </div>

            <div className="auth-section">
                {!activeRole ? (
                    <form className="login-inline" onSubmit={handleLogin}>
                        <select value={formRole} onChange={e => setFormRole(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.35rem' }}>
                            <option value="Admin">Admin</option>
                            <option value="Commander">Base Commander</option>
                            <option value="Logistics">Logistics Officer</option>
                        </select>
                        {formRole === 'Commander' && (
                            <input type="text" value={formBase} onChange={e => setFormBase(e.target.value)} placeholder="Base Name" required style={{ width: '100px' }} />
                        )}
                        <button type="submit" className="btn btn-primary btn-sm">Login System</button>
                    </form>
                ) : (
                    <div className="login-inline">
                        <span className="badge badge-approved" style={{ marginRight: '0.5rem' }}>
                            {activeRole} {activeRole === 'Commander' ? `(${activeBase})` : ''}
                        </span>
                        <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navigation;
