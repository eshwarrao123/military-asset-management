import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function Transfers() {
    const { role, base } = useAuth();
    const [form, setForm] = useState({ assetType: '', quantity: '', fromBase: '', toBase: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [transfers, setTransfers] = useState([]);
    const [inventoryStats, setInventoryStats] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [trRes, invRes] = await Promise.all([
                api.get('/transfers'),
                api.get('/inventory')
            ]);

            let data = trRes.data;
            if (Array.isArray(data) && role === 'Commander') {
                data = data.filter(t => t.fromBase === base || t.toBase === base);
            }
            setTransfers(Array.isArray(data) ? data : []);
            setInventoryStats(Array.isArray(invRes.data) ? invRes.data : []);
        } catch (err) {
            console.log(err.response || err);
            setMsg({ type: 'error', text: err.response?.data?.message || err.message });
            setTransfers([]);
        }
    };

    useEffect(() => {
        if (role) fetchData();
        // eslint-disable-next-line
    }, [role, base]);

    const currentStock = inventoryStats.find(i => i.assetType === form.assetType && i.baseName === form.fromBase)?.quantity || 0;
    const isStockInvalid = form.assetType && form.fromBase && form.quantity > currentStock;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg({ type: '', text: '' });

        if (isStockInvalid) {
            setMsg({ type: 'error', text: 'Not enough stock at this base. Please transfer or purchase first.' });
            setSubmitting(false);
            return;
        }

        try {
            await api.post('/transfers', {
                ...form,
                quantity: Number(form.quantity),
                assetType: form.assetType.trim().toLowerCase(),
                fromBase: form.fromBase.trim().toLowerCase(),
                toBase: form.toBase.trim().toLowerCase()
            });
            setMsg({ type: 'success', text: 'Transfer recorded successfully.' });
            setForm({ assetType: '', quantity: '', fromBase: '', toBase: '' });
            fetchData();
        } catch (err) {
            console.log(err.response || err);
            const serverMsg = err.response?.data?.message || err.message;
            setMsg({
                type: 'error',
                text: serverMsg.includes('Insufficient quantity') ? 'Not enough stock at this base. Please transfer or purchase first.' : serverMsg
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!role) return <p className="empty">Please select a role to view transfers.</p>;

    return (
        <div>
            <h1 className="page-title">Transfers</h1>

            <div className="card">
                <p className="section-header">New Transfer</p>
                {msg.text && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}

                {form.assetType && form.fromBase && (
                    <div className="msg msg-success" style={{ marginBottom: '1rem', background: 'rgba(56,139,253,0.1)', color: 'var(--accent)', borderColor: 'rgba(56,139,253,0.3)' }}>
                        Available at {form.fromBase}: <strong>{currentStock}</strong> {form.assetType}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Asset Type</label>
                            <input className="form-control" type="text" value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value })} required disabled={submitting} />
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input className="form-control" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required disabled={submitting} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>From Base</label>
                            <select className="form-control" value={form.fromBase} onChange={e => setForm({ ...form, fromBase: e.target.value })} required disabled={submitting}>
                                <option value="">-- Select Base --</option>
                                <option value="Alpha">Alpha</option>
                                <option value="Bravo">Bravo</option>
                                <option value="Charlie">Charlie</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>To Base</label>
                            <select className="form-control" value={form.toBase} onChange={e => setForm({ ...form, toBase: e.target.value })} required disabled={submitting}>
                                <option value="">-- Select Base --</option>
                                <option value="Alpha">Alpha</option>
                                <option value="Bravo">Bravo</option>
                                <option value="Charlie">Charlie</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={submitting || isStockInvalid}>
                        {submitting ? 'Initiating...' : 'Initiate Transfer'}
                    </button>
                </form>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.25rem', paddingBottom: '0.5rem' }}>
                    <p className="section-header" style={{ margin: 0 }}>Transfer History</p>
                </div>

                {transfers.length === 0 ? <p className="empty">No transfers recorded.</p> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Asset Type</th>
                                    <th>Quantity</th>
                                    <th>From Base</th>
                                    <th>To Base</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map(t => (
                                    <tr key={t._id}>
                                        <td>{t.assetType}</td>
                                        <td>{t.quantity}</td>
                                        <td>{t.fromBase}</td>
                                        <td>{t.toBase}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(t.date).toLocaleDateString()}</td>
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

export default Transfers;
