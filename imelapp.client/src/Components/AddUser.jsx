import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

function AddUser({ title, currentUser, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', repeatPassword: '', isActive: true, role: ''
    });
    // Prati koja su polja bila fokusirana (za prikaz validacije)
    const [touched, setTouched] = useState({});

    // Prikaz lozinke / ponovljene lozinke
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);

    // Ako postoji korisnik (ako je editovanje u pitanju), postavi njegove podatke (osim lozinke)
    useEffect(() => {
        if (currentUser) {
            const role = currentUser.role === "Admin" ? "1" : (currentUser.role === "User" ? "0" : "");

            setFormData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                password: '', // ostaje prazno
                repeatPassword: '', // ostaje prazno
                isActive: currentUser.isActive ?? true,
                role: role,
            });
        }
    }, [currentUser]);

    // Ako se promijeni korisnik, resetuj formu
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Validacija polja u formi
    const validate = {
        username: (formData.username?.length ?? 0) >= 3,
        email: /\S+@\S+\.\S+/.test(formData.email),
        password: !currentUser ? (formData.password?.length ?? 0) >= 6 : true,
        repeatPassword: !currentUser ? formData.password === formData.repeatPassword && (formData.repeatPassword?.length ?? 0) > 0 : true,
        role: (formData.role?.length ?? 0) > 0
    };

    // Prikaz greške ili uspjeha
    const showError = (field) => touched[field] && !validate[field];
    const showSuccess = (field) => touched[field] && validate[field];

    // Prikaz poruke o grešci ili uspjehu
    const getMessage = (field) => {
        if (!touched[field]) return '';
        if (!validate[field]) {
            switch (field) {
                case 'username': return 'Min. 3 karaktera';
                case 'email': return 'Neispravan email';
                case 'password': return 'Min. 6 karaktera';
                case 'repeatPassword': return 'Lozinke se ne poklapaju';
                case 'role': return 'Morate odabrati rolu';
                default: return '';
            }
        }
        return '';
    };

    // Funkcija za slanje forme - submit
    const handleSubmit = async (e) => {
        const token = sessionStorage.getItem('token');

        e.preventDefault();
        setTouched({ username: true, email: true, password: true, repeatPassword: true, role: true });

        // Validacija: ako dodaješ novog korisnika, sve mora biti popunjeno
        if (!Object.values(validate).every(Boolean)) {
            toast.error("Pokušaj dodavanja korisnika nije uspio. Provjerite polja!");
            return;
        }

        try {
            // formiranje axiosa za slanje podataka
            const url = currentUser
                ? `${import.meta.env.VITE_API_URL}/edit/${currentUser.id}`
                : `${import.meta.env.VITE_API_URL}/register`;

            // Ako je korisnik već učitan, koristi PUT metodu, inače POST
            const method = currentUser ? 'put' : 'post';

            // Početni podaci koji se uvijek šalju
            const data = {
                username: formData.username,
                email: formData.email,
                isActive: formData.isActive,
            };

            // Dodaj samo ako je nešto uneseno
            if (formData.password?.trim()) {
                data.password = formData.password;
            }

            if (formData.role?.trim()) {
                data.role = formData.role;
            }

            // axios poziv formiran
            const res = await axios[method](url, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.status === 200 || res.status === 201) {
                toast.success('Korisnik uspješno ' + (currentUser ? 'ažuriran' : 'dodajn') + '. Zatvaranje modala...');
                onSuccess();
                setTimeout(onClose, 1500);
            } else {
                toast.error(res.data?.message || 'Greška pri dodavanju/izmjeni korisnika.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Server greška.');
        }
    };


    return (
        <div className="container" style={{ width: '600px' }}>
            <div className="card shadow p-4 bg-light">
                <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={onClose}></button>
                <h2 className="text-center mb-4">{title}</h2>
                <form onSubmit={handleSubmit} className="text-end" noValidate>

                    { /* prikaz polja - iterira i renderuje svako */}
                    {['username', 'email', 'password', 'repeatPassword'].map((field) => {

                        // Ako je korisnik već učitan, ne prikazuj polje za lozinku
                        // if (currentUser && field === 'password') return null;
                        // if (currentUser && field === 'repeatPassword') return null;

                        const isPassword = field === 'password' || field === 'repeatPassword';
                        const show = field === 'password' ? showPassword : field === 'repeatPassword' ? showRepeatPassword : false;
                        const toggleShow = () => {
                            if (field === 'password') setShowPassword(prev => !prev);
                            if (field === 'repeatPassword') setShowRepeatPassword(prev => !prev);
                        };

                        return (
                            <div className="mb-3" key={field}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label mb-0 text-capitalize">{field === 'repeatPassword' ? 'Ponovi lozinku' : field}</label>
                                    <small
                                        className={`ms-auto text-end ${showError(field) ? 'text-danger' : showSuccess(field) ? 'text-success' : 'text-muted'}`}
                                        style={{ minHeight: '1rem', fontSize: '0.8rem' }}
                                    >
                                        {getMessage(field)}
                                    </small>
                                </div>
                                <div className="input-group">
                                    <input
                                        type={isPassword && !show ? 'password' : 'text'}
                                        name={field}
                                        className={`form-control ${showError(field) ? 'is-invalid' : showSuccess(field) ? 'is-valid' : ''}`}
                                        value={formData[field]}
                                        onChange={handleChange}
                                        onBlur={() => setTouched({ ...touched, [field]: true })}
                                    />
                                    {isPassword && (
                                        <span className="input-group-text" onClick={toggleShow} style={{ cursor: 'pointer' }}>
                                            {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Role input */}
                    <div className="mb-3 text-start">
                        <label className="form-label">Rola</label>
                        <select
                            name="role"
                            className={`form-select ${showError('role') ? 'is-invalid' : showSuccess('role') ? 'is-valid' : ''}`}
                            value={formData.role}
                            onChange={handleChange}
                            onBlur={() => setTouched({ ...touched, role: true })}
                        >
                            <option value="">Izaberite rolu</option>
                            <option value="1">Admin</option>
                            <option value="0">User</option>
                        </select>
                        <small className={`ms-auto text-end ${showError('role') ? 'text-danger' : showSuccess('role') ? 'text-success' : 'text-muted'}`} style={{ minHeight: '1rem', fontSize: '0.8rem' }}>
                            {getMessage('role')}
                        </small>
                    </div>

                    {/* isActive toggle */}
                    <div className="form-check mb-5 text-start form-switch">
                        <input
                            type="checkbox"
                            role="switch"
                            className="form-check-input"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                            {formData.isActive ? 'Korisnik će biti AKTIVAN' : 'Korisnik će biti NEAKTIVAN'}
                        </label>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Zatvori</button>
                            <button type="submit" className="btn btn-success text-end">{currentUser ? 'Spremi promjene' : 'Dodaj korisnika'}</button>
                    </div>
                </form>

                {/* tost notifikacija */}
                <ToastContainer
                    position="top-right"
                    autoClose={2000}
                    hideProgressBar
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        </div>
    );
}

export default AddUser;
