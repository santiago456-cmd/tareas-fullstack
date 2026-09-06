// Componentes reales con repositorios simulados. No realiza solicitudes a la API.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../src/index.css';
import TareaForm from '../src/pages/TareaForm';
import ListaForm from '../src/pages/ListaForm';
import Listas from '../src/pages/Listas';
import Tareas from '../src/pages/Tareas';
import listas from '../src/repositories/listas.repository';
import tareas from '../src/repositories/tareas.repository';
const params=new URLSearchParams(location.search);
const fail=params.has('error');
const data=[{id:1,nombre:'Lista de auditoría',descripcion:'Descripción de ejemplo',color:'#3525cd',cantidadTareas:1}];
const task={id:1,listaId:1,titulo:'Tarea de auditoría',descripcion:'Descripción de ejemplo',completada:false,prioridad:'media',fechaVencimiento:'2026-09-06',etiquetas:params.has('badTags')?'texto':['auditoría']};
const delayed=async(value)=>{await new Promise(r=>setTimeout(r,100));if(fail)throw Error('Fallo simulado');return value;};
listas.obtenerListas=()=>delayed(data);listas.obtenerListaPorId=()=>delayed(data[0]);
listas.crearLista=()=>Promise.reject(Error('Fallo simulado al crear'));
listas.actualizarLista=()=>delayed(data[0]);listas.eliminarLista=()=>delayed({});
tareas.obtenerTareas=()=>delayed([task]);tareas.obtenerTareaPorId=()=>delayed(task);
tareas.crearTarea=()=>delayed(task);tareas.actualizarTarea=()=>delayed(task);
tareas.completarTarea=()=>delayed(task);tareas.eliminarTarea=()=>delayed({});
const route=params.get('route')||'/listas/1/tareas/nueva';
createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[route]}>
 <div style={{padding:16}}>Auditoría local — datos simulados, sin API</div>
 <Routes><Route path="/listas" element={<Listas/>}/><Route path="/tareas" element={<Tareas/>}/><Route path="/listas/:id/editar" element={<ListaForm/>}/><Route path="/listas/:listaId/tareas/nueva" element={<TareaForm/>}/><Route path="/tareas/:id/editar" element={<TareaForm/>}/></Routes>
 <ToastContainer/>
</MemoryRouter>);
