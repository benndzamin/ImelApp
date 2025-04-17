import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function UserDashboard() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchUserData(token);
        }
    }, [navigate]);

    const fetchUserData = async (token) => {
        if (!token) {
            setError('Token nije pronađen.');
            return;
        }
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setUserData(response.data);
        } catch (err) {
            if (err.response) {
                setError(`Greška: ${err.response.status} - ${err.response.data.message || 'Pogreška prilikom učitavanja podataka.'}`);
            } else {
                setError('Pogreška prilikom povezivanja sa serverom.');
            }
        }
    };

    return (
        <div className="container">
            <div className="card shadow p-4 bg-light">
                <h2 className="mb-4">User Dashboard</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {userData ? (
                    <div>
                        <p><strong>Korisnik:</strong> {userData.username}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Uloga:</strong> {userData.role}</p>
                        <p><strong>Datum kreiranja:</strong> {userData.created}</p>
                        <p><strong>Stanje:</strong> {userData.active ? 'NEAKTIVAN' : 'AKTIVAN'}</p>

                    </div>
                ) : (
                    <p>Učitavanje korisničkih podataka...</p>
                )}
            </div>
        </div>
    );
}

export default UserDashboard;
