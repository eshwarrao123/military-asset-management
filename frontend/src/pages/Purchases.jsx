import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function Purchases() {
    const { role, base } = useAuth();
    const [form, setForm] = useState({ assetType: '', quantity: '', base: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [purchases, setPurchases] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [filterBase, setFilterBase] = useState('');

    const fetchPurchases = async () => {
        try {
            const res = await api.get('/purchases');
            let data = res.data;
            if (Array.isArray(data) && role === 'Commander') {
                data = data.filter(p => p.base === base);
            }
            setPurchases(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log(err.response || err);
            setMsg({ type: 'error', text: err.response?.data?.message || err.message });
            setPurchases([]);
        }
    };

    useEffect(() => {
        if (role) fetchPurchases();
        // eslint-disable-next-line
    }, [role, base]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg({ type: '', text: '' });

        if (!form.base) {
            setMsg({ type: 'error', text: 'Please select a destination base strictly.' });
            setSubmitting(false);
            return;
        }

        try {
            await api.post('/purchases', {
                assetType: form.assetType.trim().toLowerCase(),
                quantity: Number(form.quantity),
                base: form.base.trim().toLowerCase()
            });
            setMsg({ type: 'success', text: `Purchase securely deployed and automatically stacked into ${form.base} Inventory.` });
            setForm({ assetType: '', quantity: '', base: '' });
            fetchPurchases();
        } catch (err) {
            console.log(err.response || err);
            setMsg({ type: 'error', text: err.response?.data?.message || err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const badgeClass = (status) => {
        if (status === 'Approved') return 'badge badge-approved';
        if (status === 'Rejected') return 'badge badge-rejected';
        return 'badge badge-pending';
    };

    if (!role) return <p className="empty">Please select a role to view purchases.</p>;

    let displayPurchases = purchases;
    if (filterBase) {
        displayPurchases = displayPurchases.filter(p => p.base?.toLowerCase().includes(filterBase.toLowerCase()));
    }

    return (
        <div>
            <h1 className="page-title">Purchases</h1>

            <div className="card">
                <p className="section-header">New Request</p>
                {msg.text && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Asset Type</label>
                            <input className="form-control" type="text" placeholder="e.g. Tactical Radio" value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value })} required disabled={submitting} />
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input className="form-control" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required disabled={submitting} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Destination Base</label>
                            <select className="form-control" value={form.base} onChange={e => setForm({ ...form, base: e.target.value })} required disabled={submitting}>
                                <option value="">-- Select Base --</option>
                                <option value="Alpha">Alpha</option>
                                <option value="Bravo">Bravo</option>
                                <option value="Charlie">Charlie</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={submitting}>
                        {submitting ? 'Submitting Request...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.25rem', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="section-header" style={{ margin: 0 }}>Recent Requests</p>
                    {role !== 'Commander' && (
                        <input
                            className="form-control"
                            style={{ width: '200px', padding: '0.35rem 0.5rem' }}
                            type="text"
                            placeholder="Filter by Base..."
                            value={filterBase}
                            onChange={e => setFilterBase(e.target.value)}
                        />
                    )}
                </div>

                {displayPurchases.length === 0 ? <p className="empty">No purchase requests matching criteria yet.</p> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Asset Type</th>
                                    <th>Quantity</th>
                                    <th>Base</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayPurchases.map(p => (
                                    <tr key={p._id}>
                                        <td>{p.assetType}</td>
                                        <td>{p.quantity}</td>
                                        <td>{p.base}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td><span className={badgeClass(p.status)}>{p.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Purchases;
