import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid, Column, Paging, Pager } from 'devextreme-react/data-grid';
import 'devextreme/dist/css/dx.light.css';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import AddUser from './AddUser';

function AdminDashboard() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchUsers(token);
        }
    }, [navigate]);

    // Funkcija za dohvat svih korisnika sa servera
    const fetchUsers = async (token) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (err) {
            setError('Pogreška pri učitavanju svih korisnika.');
        }
    };

    // Otvaranje modala sa korisnikom kojeg uređujemo
    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    // Funkcija za brisanje korisnika
    const handleDelete = async (userId) => {
        if (window.confirm("Da li ste sigurni da želite obrisati korisnika?")) {
            const token = sessionStorage.getItem('token');
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/delete/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setUsers(prev => prev.filter(user => user.id !== userId));
            } catch (err) {
                setError('Greška prilikom brisanja korisnika.');
            }
        }
    };

    // Prikaz buttona (Uredi i Obriši) u tabeli
    const renderAkcije = (cellData) => {
        const user = cellData.data;
        return (
            <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(user)}>
                    <i className="bi bi-pencil-square me-1"></i>Uredi
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(user.id)}>
                    <i className="bi bi-trash me-1"></i>Obriši
                </button>
            </div>
        );
    };

    // Otvaranje modala za dodavanje korisnika
    const openModal = () => {
        setCurrentUser(null);
        setIsModalOpen(true);
    };

    // Zatvaranje modala
    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="container">
            <div className="card shadow-sm p-4">
                <h2 className="text-center">Admin Dashboard</h2>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="d-flex justify-content-between pb-4">
                    <h4 className="my-2">Lista svih korisnika</h4>
                    <button className="btn btn-sm btn-primary gradient" onClick={openModal}>
                        <i className="bi bi-person-plus me-1"></i>Dodaj novog korisnika
                    </button>
                </div>

                <div className="table-responsive">
                    {/* DevExtreme DataGrid komponenta za prikaz korisnika */}
                    <DataGrid
                        dataSource={users}
                        keyExpr="id"
                        showBorders={true}
                        showColumnLines={true}
                        showRowLines={true}
                        rowAlternationEnabled={true}
                        allowColumnResizing={true}
                        columnAutoWidth={true}
                        wordWrapEnabled={true}
                        hoverStateEnabled={true}
                        columnHidingEnabled={true}
                    >
                        <Paging defaultPageSize={10} />
                        <Pager
                            visible={true}
                            allowedPageSizes={[5, 10]}
                            showPageSizeSelector={true}
                            showInfo={true}
                        />
                        <Column dataField="id" caption="ID" width={70} alignment="center" />
                        <Column dataField="username" caption="Korisničko ime" />
                        <Column dataField="email" caption="Email" />
                        <Column dataField="isActive" caption="Aktivan" dataType="boolean" width={100} alignment="center" />
                        <Column dataField="role" caption="Uloga" width={100} alignment="center" />
                        <Column dataField="createdAt" caption="Datum kreiranja" dataType="date" format="dd.MM.yyyy" width={150} alignment="center" />
                        <Column caption="Akcije" cellRender={renderAkcije} width={200} alignment="center" />
                    </DataGrid>
                </div>
            </div>

            {/* Modal za dodavanje/uređivanje korisnika */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                ariaHideApp={false}
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                <div className="container">
                    <AddUser
                        title={currentUser ? 'Uredi korisnika' : 'Dodaj novog korisnika'}
                        currentUser={currentUser}
                        onClose={closeModal}
                        onSuccess={() => fetchUsers(sessionStorage.getItem('token'))} // Prop za osvežavanje korisnika
                    />
                </div>
            </Modal>
        </div>
    );
}

export default AdminDashboard;
