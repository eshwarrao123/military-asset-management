import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function Assignments() {
    const { role, base } = useAuth();
    const [form, setForm] = useState({ assetType: '', quantity: '', assignedTo: '', base: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [assignments, setAssignments] = useState([]);
    const [inventoryStats, setInventoryStats] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [expendingId, setExpendingId] = useState(null);

    const fetchData = async () => {
        try {
            const [assignRes, invRes] = await Promise.all([
                api.get('/assignments'),
                api.get('/inventory')
            ]);

            let data = assignRes.data;
            if (Array.isArray(data) && role === 'Commander') {
                data = data.filter(a => a.base === base);
            }
            setAssignments(Array.isArray(data) ? data : []);
            setInventoryStats(Array.isArray(invRes.data) ? invRes.data : []);
        } catch (err) {
            console.log(err.response || err);
            setMsg({ type: 'error', text: err.response?.data?.message || err.message });
            setAssignments([]);
        }
    };

    useEffect(() => {
        if (role) fetchData();
        // eslint-disable-next-line
    }, [role, base]);

    const currentStock = inventoryStats.find(i => i.assetType === form.assetType && i.baseName === form.base)?.quantity || 0;
    const isStockInvalid = form.assetType && form.base && form.quantity > currentStock;

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
            await api.post('/assignments', {
                ...form,
                quantity: Number(form.quantity),
                assetType: form.assetType.trim().toLowerCase(),
                base: form.base.trim().toLowerCase()
            });
            setMsg({ type: 'success', text: 'Asset assigned successfully.' });
            setForm({ assetType: '', quantity: '', assignedTo: '', base: '' });
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

    const handleExpend = async (id) => {
        setExpendingId(id);
        setMsg({ type: '', text: '' });
        try {
            await api.put(`/assignments/${id}/expend`);
            setMsg({ type: 'success', text: 'Marked as expended.' });
            fetchData();
        } catch (err) {
            console.log(err.response || err);
            setMsg({ type: 'error', text: err.response?.data?.message || err.message });
        } finally {
            setExpendingId(null);
        }
    };

    if (!role) return <p className="empty">Please select a role to view assignments.</p>;

    return (
        <div>
            <h1 className="page-title">Assignments</h1>

            <div className="card">
                <p className="section-header">Assign Asset</p>
                {msg.text && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}

                {form.assetType && form.base && (
                    <div className="msg msg-success" style={{ marginBottom: '1rem', background: 'rgba(56,139,253,0.1)', color: 'var(--accent)', borderColor: 'rgba(56,139,253,0.3)' }}>
                        Available at {form.base}: <strong>{currentStock}</strong> {form.assetType}
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
                            <label>Assigned To</label>
                            <input className="form-control" type="text" placeholder="Personnel name or ID" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} required disabled={submitting} />
                        </div>
                        <div className="form-group">
                            <label>Base</label>
                            <input className="form-control" type="text" value={form.base} onChange={e => setForm({ ...form, base: e.target.value })} required disabled={submitting} />
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={submitting || isStockInvalid}>
                        {submitting ? 'Assigning...' : 'Assign'}
                    </button>
                </form>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.25rem', paddingBottom: '0.5rem' }}>
                    <p className="section-header" style={{ margin: 0 }}>Active Assignments</p>
                </div>

                {assignments.length === 0 ? <p className="empty">No assignments found.</p> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Asset Type</th>
                                    <th>Quantity</th>
                                    <th>Assigned To</th>
                                    <th>Base</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(a => (
                                    <tr key={a._id}>
                                        <td>{a.assetType}</td>
                                        <td>{a.quantity}</td>
                                        <td>{a.assignedTo}</td>
                                        <td>{a.base}</td>
                                        <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderBottom: 'none' }}>
                                            <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                                            {a.status !== 'Expended' && (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleExpend(a._id)}
                                                    disabled={expendingId === a._id}
                                                >
                                                    {expendingId === a._id ? '...' : 'Expend'}
                                                </button>
                                            )}
                                        </td>
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

export default Assignments;
