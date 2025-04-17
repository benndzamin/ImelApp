import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { getCurrentUser } from '../utils/Auth';

function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [role, setRole] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('token');

        if (token) {
            const user = getCurrentUser();
            setRole(user.role);
            setIsLoggedIn(true);
            fetchUserData(token);
        }
    }, [navigate]);

    // Funkcija za dohvatanje korisničkog imena
    const fetchUserData = async (token) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/username`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setUsername(response.data.username);
        } catch (err) {
            setIsLoggedIn(false); // ako poziv ne uspije, tretiraj korisnika kao da nije logovan
            if (err.response) {
                setError(`Greška: ${err.response.status} - ${err.response.data.message || 'Pogreška prilikom učitavanja korisnika.'}`);
            } else {
                setError('Pogreška prilikom povezivanja sa serverom.');
            }
        }
    };

    // Funkcija za odjavu korisnika
    const handleLogout = () => {
        sessionStorage.removeItem('token');
        setIsLoggedIn(false);
        setUsername('');
        navigate('/');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary bg-gradient fixed-top">
            <div className="container">
                <a className="navbar-brand" href="/">ImelApp</a>
                <div className="ms-auto">
                    {isLoggedIn ? (
                        <>
                            <span className="mx-5 text-light fw-bold">
                                {role && <span className="badge bg-secondary">{role}</span>}

                                <User size={30} /> {username}
                            </span>
                            <button
                                className="btn btn-light px-4 py-2 mx-2"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-outline-light me-2" onClick={() => navigate('/login')}>
                                Login
                            </button>
                            <button className="btn btn-light" onClick={() => navigate('/register')}>
                                Register
                            </button>
                        </>
                    )}
                </div>
            </div>
            {error && (
                <div className="alert alert-danger position-absolute end-0 mt-5 me-3">
                    {error}
                </div>
            )}
        </nav>
    );
}

export default Navbar;
