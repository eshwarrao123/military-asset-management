import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function Dashboard() {
    const { role: activeRole, base: activeBase } = useAuth();

    const [metrics, setMetrics] = useState({
        openingBalance: 0,
        closingBalance: 0,
        netMovement: 0,
        assigned: 0,
        expended: 0,
        breakdown: { purchasesInRange: 0, transfersInInRange: 0, transfersOutInRange: 0 }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [filters, setFilters] = useState({
        base: '',
        equipmentType: '',
        startDate: '',
        endDate: ''
    });

    const fetchDashboardData = async (currentFilters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(currentFilters).forEach(([k, v]) => {
                if (v) params.append(k, v);
            });

            console.log(`[Dashboard] Request URL: /api/dashboard?${params.toString()}`);
            const res = await api.get(`/dashboard?${params.toString()}`);
            console.log('[Dashboard] API Response:', res.data);

            const data = res.data?.metrics || {};

            setMetrics({
                openingBalance: data.openingBalance || 0,
                closingBalance: data.closingBalance || 0,
                netMovement: data.netMovement || 0,
                assigned: data.assigned || 0,
                expended: data.expended || 0,
                breakdown: {
                    purchasesInRange: data.breakdown?.purchasesInRange || 0,
                    transfersInInRange: data.breakdown?.transfersInInRange || 0,
                    transfersOutInRange: data.breakdown?.transfersOutInRange || 0
                }
            });
            setError('');
        } catch (err) {
            console.error('[Dashboard] Error fetching data:', err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeRole) {
            const initialFilters = { ...filters, base: activeRole === 'Commander' ? activeBase : '' };
            setFilters(initialFilters);
            fetchDashboardData(initialFilters);
        }
        // eslint-disable-next-line
    }, [activeRole, activeBase]);

    const handleApply = (e) => {
        e.preventDefault();
        fetchDashboardData(filters);
    };

    if (!activeRole) return <p className="empty">Please select a role to view the dashboard.</p>;

    const formatNet = (val) => val > 0 ? `+${val}` : val;

    return (
        <div>
            <h1 className="page-title">Dashboard</h1>

            {error && <div className="msg msg-error">{error}</div>}

            <div className="card">
                <p className="section-header">Filters</p>
                <form className="filter-bar" onSubmit={handleApply}>
                    {activeRole !== 'Commander' && (
                        <div className="form-group">
                            <label>Base</label>
                            <input className="form-control" type="text" placeholder="e.g. Alpha" value={filters.base} onChange={e => setFilters({ ...filters, base: e.target.value })} />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Equipment Type</label>
                        <input className="form-control" type="text" placeholder="e.g. Rifle" value={filters.equipmentType} onChange={e => setFilters({ ...filters, equipmentType: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Start Date</label>
                        <input className="form-control" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input className="form-control" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Applying...' : 'Apply Filters'}
                    </button>
                </form>
            </div>

            {loading && <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Loading Dashboard Data...</p>}

            {!loading && (
                <div className="dashboard-grid">
                    <div className="stat-card">
                        <div className="stat-label">Opening Balance</div>
                        <div className="stat-value">{metrics.openingBalance}</div>
                    </div>
                    <div className="stat-card" style={{ cursor: 'pointer', border: '1px solid var(--accent)' }} onClick={() => setShowModal(true)}>
                        <div className="stat-label">Net Movement 🔍 (Click to detail)</div>
                        <div className="stat-value">{formatNet(metrics.netMovement)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Closing Balance</div>
                        <div className="stat-value">{metrics.closingBalance}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Assigned</div>
                        <div className="stat-value">{metrics.assigned}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Expended</div>
                        <div className="stat-value">{metrics.expended}</div>
                    </div>
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div className="card" style={{ width: '360px', backgroundColor: 'var(--surface)', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                        <p className="page-title" style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Net Movement Breakdown</p>
                        <ul className="item-list">
                            <li>
                                <span>Purchases (Incoming)</span>
                                <span className="badge badge-approved">{formatNet(metrics.breakdown.purchasesInRange)}</span>
                            </li>
                            <li>
                                <span>Transfers In</span>
                                <span className="badge badge-assigned">{formatNet(metrics.breakdown.transfersInInRange)}</span>
                            </li>
                            <li>
                                <span>Transfers Out</span>
                                <span className="badge badge-rejected">{formatNet(-metrics.breakdown.transfersOutInRange)}</span>
                            </li>
                        </ul>
                        <button className="btn btn-ghost" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setShowModal(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
