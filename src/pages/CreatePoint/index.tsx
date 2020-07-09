import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map,TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import './styles.css';

import logo from '../../assets/logo.svg';

interface Item {
    id: number,
    title: string,
    image_url: string
}

interface uf {
    sigla: string
}

interface city {
    nome: string
}


const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>();
    const [ufs, setUfs] = useState<string[]>();
    const [cities, setCities] = useState<string[]>();

    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [selectedItem, setselectedItem] = useState<number[]>([]);

    const history = useHistory();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        })
    }, []);

    useEffect(() => {
        axios.get<uf[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
        .then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);
            setUfs(ufInitials);
        })
    }, []);

    useEffect(() => {
        axios.get<city[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados/'+selectedUf+"/municipios")
        .then(response => {
            const cityNames = response.data.map(city=>city.nome);        
            setCities(cityNames);
        })
    }, [selectedUf]);

    useEffect(() => {
       navigator.geolocation.getCurrentPosition( position => {
           const {latitude, longitude } = position.coords;

           setInitialPosition([latitude, longitude]);
       })
    }, []);

    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;
        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])};
        
    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const { name, value } = event.target;

        setFormData({ ...formData, [name]: value})
    } 
    
    function handleSelectedItem(id: number){
        const alreadySelected = selectedItem.findIndex(item => item === id);

        if(alreadySelected >= 0){
            const filteredItems = selectedItem.filter(item => item !== id);

            setselectedItem(filteredItems);

        }else{
            setselectedItem([ ...selectedItem, id]);
        }
    } 
    
    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItem;

        const data = {
            name, 
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }

        await api.post('points', data);

        alert("Ponto de coleta criado com sucesso");
        history.push('/');
        
        console.log(data);
    }
    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />

                <Link to="/">
                    <span>
                        <FiArrowLeft />
                    </span>
                 Voltar para home
                </Link>

            </header>

            <form onSubmit={handleSubmit}>
                <h1> Cadastro do <br/> ponto de coleta.</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>
                </fieldset>

                <div className="field-group">
                    
                    <div className="field">
                        <label htmlFor="email">E-mail</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="whatsapp">Whatsapp</label>
                        <input
                            type="text"
                            name="whatsapp"
                            id="whatsapp"
                            onChange={handleInputChange}
                        />
                    </div> 
                </div>    
                
                
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={13} onclick = {handleMapClick}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                        <Marker position={selectedPosition}/>
                    </Map>

                    <div className="field-group">
                    
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectedUf}>
                                <option value="0">Selecione uma UF</option>
                                {ufs?.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" value={selectedCity} onChange={handleSelectedCity} id="city">
                                <option value="0">Selecione uma cidade</option>
                                {cities?.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                </fieldset>

                <ul className="items-grid">
                   {items?.map(Item => (
                    <li 
                    key={Item.id} 
                    onClick={() => handleSelectedItem(Item.id)}
                    className={selectedItem.includes(Item.id) ? 'selected' : ''}
                    >
                        <img src={Item.image_url} alt={Item.title}></img>
                        <span>{Item.title}</span>
                    </li>
                   ))}
                    
                </ul>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
}

export default CreatePoint;