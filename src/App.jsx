import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

const MODULES = [
  { path: '/login', id: 'login', label: 'Inicio de sesión', public: true },
  { path: '/panel-principal', id: 'panel-principal', label: 'Panel principal y reportes' },
  { path: '/clientes-solicitudes', id: 'clientes-solicitudes', label: 'Clientes y solicitudes' },
  { path: '/cotizaciones-documentos', id: 'cotizaciones-documentos', label: 'Cotizaciones y documentos' },
  { path: '/catalogo-costos', id: 'catalogo-costos', label: 'Catálogo de costos' },
  { path: '/proyectos-presupuestos', id: 'proyectos-presupuestos', label: 'Proyectos y presupuestos' },
  { path: '/control-gastos', id: 'control-gastos', label: 'Control de gastos' },
  { path: '/coordinacion-comunicaciones', id: 'coordinacion-comunicaciones', label: 'Coordinación y tareas' },
  { path: '/configuracion-auditoria', id: 'configuracion-auditoria', label: 'Configuración y auditoría' },
];

const DEMO = {
  user: {
    username: 'administrador@eden.local',
    nombre: 'Administrador',
    rol: 'Administrador',
  },
  clientes: [
    {
      id: 1,
      nombre: 'Empresa ABC',
      email: 'contacto@empresaabc.example',
      telefono: '+34 600 000 001',
      empresa: 'Empresa ABC',
    },
    {
      id: 2,
      nombre: 'Cliente XYZ',
      email: 'operaciones@clientexyz.example',
      telefono: '+34 600 000 002',
      empresa: 'Cliente XYZ',
    },
    {
      id: 3,
      nombre: 'Comunidad Norte',
      email: 'administracion@comunidadnorte.example',
      telefono: '+34 600 000 003',
      empresa: 'Comunidad Norte',
    },
  ],
  solicitudes: [
    {
      id: 1,
      cliente: 'Empresa ABC',
      titulo: 'Revisión de instalación eléctrica',
      descripcion: 'Inspección y propuesta de adecuación.',
      estado: 'Pendiente',
      prioridad: 'Alta',
      origen: 'Panel',
      fecha: '2025-05-06',
    },
    {
      id: 2,
      cliente: 'Cliente XYZ',
      titulo: 'Mantenimiento preventivo',
      descripcion: 'Mantenimiento de equipos de climatización.',
      estado: 'En revisión',
      prioridad: 'Media',
      origen: 'Panel',
      fecha: '2025-05-04',
    },
  ],
  cotizaciones: [
    {
      id: 1,
      cliente: 'Empresa ABC',
      estado: 'Pendiente',
      fecha: '2025-05-01',
      total: 1500,
      moneda: 'EUR',
    },
    {
      id: 2,
      cliente: 'Cliente XYZ',
      estado: 'Aprobada',
      fecha: '2025-04-20',
      total: 3200,
      moneda: 'EUR',
    },
    {
      id: 3,
      cliente: 'Comunidad Norte',
      estado: 'En revisión',
      fecha: '2025-04-18',
      total: 2180,
      moneda: 'EUR',
    },
  ],
  documentos: [
    {
      id: 1,
      nombre: 'Cotización COT-001.pdf',
      tipo: 'Cotización',
      cotizacion_id: 1,
      fecha: '2025-05-01',
      url: null,
    },
    {
      id: 2,
      nombre: 'Cotización COT-002.pdf',
      tipo: 'Cotización',
      cotizacion_id: 2,
      fecha: '2025-04-20',
      url: null,
    },
  ],
  costos: [
    {
      id: 1,
      nombre: 'Cableado eléctrico',
      categoria: 'Materiales',
      unidad: 'metro',
      costo_unitario: 8.5,
      moneda: 'EUR',
      proveedor: 'Proveedor A',
    },
    {
      id: 2,
      nombre: 'Técnico electricista',
      categoria: 'Mano de obra',
      unidad: 'hora',
      costo_unitario: 32,
      moneda: 'EUR',
      proveedor: 'Interno',
    },
    {
      id: 3,
      nombre: 'Revisión de equipo AC',
      categoria: 'Servicios',
      unidad: 'unidad',
      costo_unitario: 75,
      moneda: 'EUR',
      proveedor: 'Interno',
    },
    {
      id: 4,
      nombre: 'Desplazamiento técnico',
      categoria: 'Logística',
      unidad: 'servicio',
      costo_unitario: 25,
      moneda: 'EUR',
      proveedor: 'Interno',
    },
  ],
  proyectos: [
    {
      id: 1,
      nombre: 'Instalación eléctrica oficina',
      cliente: 'Empresa ABC',
      estado: 'En progreso',
      fecha_inicio: '2025-04-15',
      fecha_fin: '2025-05-15',
      presupuesto: 4200,
      moneda: 'EUR',
    },
    {
      id: 2,
      nombre: 'Mantenimiento aire acondicionado',
      cliente: 'Cliente XYZ',
      estado: 'Finalizado',
      fecha_inicio: '2025-03-01',
      fecha_fin: '2025-03-10',
      presupuesto: 1800,
      moneda: 'EUR',
    },
  ],
  gastos: [
    {
      id: 1,
      proyecto_id: 1,
      proyecto: 'Instalación eléctrica oficina',
      concepto: 'Materiales',
      categoria: 'Materiales',
      monto: 500,
      moneda: 'EUR',
      fecha: '2025-04-20',
    },
    {
      id: 2,
      proyecto_id: 2,
      proyecto: 'Mantenimiento aire acondicionado',
      concepto: 'Mano de obra',
      categoria: 'Mano de obra',
      monto: 300,
      moneda: 'EUR',
      fecha: '2025-03-05',
    },
    {
      id: 3,
      proyecto_id: 1,
      proyecto: 'Instalación eléctrica oficina',
      concepto: 'Desplazamientos',
      categoria: 'Logística',
      monto: 90,
      moneda: 'EUR',
      fecha: '2025-04-22',
    },
  ],
  tareas: [
    {
      id: 1,
      titulo: 'Validar alcance con el cliente',
      descripcion: 'Confirmar necesidades y condiciones de la solicitud.',
      responsable: 'Gerente',
      proyecto: 'Instalación eléctrica oficina',
      prioridad: 'Alta',
      estado: 'Pendiente',
      fecha_limite: '2025-05-08',
    },
    {
      id: 2,
      titulo: 'Actualizar costos de materiales',
      descripcion: 'Contrastar precios con los proveedores.',
      responsable: 'Administrador',
      prioridad: 'Media',
      estado: 'En progreso',
      fecha_limite: '2025-05-09',
    },
    {
      id: 3,
      titulo: 'Enviar cotización COT-002',
      descripcion: 'Documento revisado y aprobado internamente.',
      responsable: 'Gerente',
      prioridad: 'Media',
      estado: 'Completada',
      fecha_limite: '2025-04-20',
    },
  ],
  auditoria: [
    {
      id: 1,
      usuario: 'Administrador',
      accion: 'Inicio de sesión',
      entidad: 'Sesión',
      fecha: '2025-05-06T09:00:00',
    },
    {
      id: 2,
      usuario: 'Gerente',
      accion: 'Actualización de cotización',
      entidad: 'COT-002',
      fecha: '2025-05-05T16:30:00',
    },
  ],
  configuracion: {
    nombre_empresa: 'EDÉN',
    moneda: 'EUR',
    idioma: 'es',
    zona_horaria: 'Europe/Madrid',
    notificaciones: true,
  },
};

function getToken() {
  return localStorage.getItem('token');
}

function logout(navigate) {
  localStorage.removeItem('token');
  navigate('/login', { replace: true });
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function errorDetail(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map((item) => item.msg || item.message || JSON.stringify(item))
      .join(' · ');
  }
  return (
    payload.detail ||
    payload.message ||
    payload.error ||
    fallback
  );
}

async function apiFetch(
  path,
  {
    method = 'GET',
    body,
    form,
    auth = true,
    signal,
    headers = {},
  } = {},
) {
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };
  const token = getToken();

  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let requestBody = body;

  if (form) {
    const params = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    requestBody = params.toString();
    requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (
    body !== undefined &&
    body !== null &&
    !(typeof FormData !== 'undefined' && body instanceof FormData)
  ) {
    requestBody = JSON.stringify(body);
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response;
  let text;

  try {
    response = await fetch(path, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal,
    });
    text = await response.text();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    const networkError = new Error(
      'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
    );
    networkError.isNetwork = true;
    throw networkError;
  }

  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('eden:unauthorized'));
    }

    throw new ApiError(
      errorDetail(payload, `La solicitud falló con el estado ${response.status}.`),
      response.status,
    );
  }

  return payload;
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidates = [
    payload.items,
    payload.results,
    payload.data,
    payload.records,
    payload.clientes,
    payload.solicitudes,
    payload.cotizaciones,
    payload.documentos,
    payload.costos,
    payload.proyectos,
    payload.gastos,
    payload.tareas,
    payload.auditoria,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) || [];
}

function normalizeObject(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }
  if (
    payload.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }
  return payload;
}

function useResource(path, demoData, normalize = normalizeList) {
  const [data, setData] = useState(() => normalize(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');
      setOffline(false);

      try {
        const payload = await apiFetch(path, { signal });
        setData(normalize(payload));
      } catch (requestError) {
        if (requestError.name === 'AbortError') return;

        if (requestError.isNetwork) {
          setData(demoData);
          setOffline(true);
        } else {
          setData(normalize(null));
          setError(requestError.message || 'No se pudieron cargar los datos.');
        }
      } finally {
        if (!signal || !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [path, demoData, normalize],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  return {
    data,
    setData,
    loading,
    error,
    offline,
    reload,
  };
}

function useMutation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const execute = useCallback(async (operation, successMessage) => {
    setPending(true);
    setError('');
    setSuccess('');

    try {
      await operation();
      setSuccess(successMessage);
      return true;
    } catch (requestError) {
      setError(
        requestError.isNetwork
          ? 'Sin conexión. El cambio no se guardó; vuelve a intentarlo cuando se recupere la conexión.'
          : requestError.message || 'No se pudo completar la operación.',
      );
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const clear = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return { pending, error, success, execute, clear };
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function entityName(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') {
    return (
      value.nombre ||
      value.name ||
      value.empresa ||
      value.username ||
      value.email ||
      fallback
    );
  }
  return String(value);
}

function formatMoney(value, currency = 'EUR') {
  if (value === null || value === undefined || value === '') return '—';

  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(toNumber(value));
  } catch {
    return `${toNumber(value).toFixed(2)} ${currency || 'EUR'}`;
  }
}

function formatDate(value, includeTime = false) {
  if (!value) return '—';

  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00`)
    : new Date(raw);

  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit' }
      : {}),
  }).format(date);
}

function recordId(prefix, id) {
  if (id === null || id === undefined || id === '') return '—';
  if (typeof id === 'string' && /[A-Za-z]/.test(id)) return id;
  return `${prefix}-${String(id).padStart(3, '0')}`;
}

function normalizedText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function statusTone(status) {
  const value = normalizedText(status);

  if (
    ['aprobada', 'aprobado', 'finalizado', 'finalizada', 'completada', 'completado', 'activo', 'pagado'].includes(value)
  ) {
    return 'success';
  }
  if (
    ['pendiente', 'en revision', 'en progreso', 'borrador', 'nueva', 'media'].includes(value)
  ) {
    return 'warning';
  }
  if (['rechazada', 'cancelada', 'cancelado', 'vencida', 'alta', 'error'].includes(value)) {
    return 'danger';
  }
  return 'info';
}

function StatusBadge({ children }) {
  return (
    <span className={`badge ${statusTone(children)}`}>
      {children || 'Sin estado'}
    </span>
  );
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  );

  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function PrivateRoute({ children }) {
  const location = useLocation();

  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message: 'Inicia sesión para acceder a este módulo.',
        }}
      />
    );
  }

  return children;
}

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="topbar" aria-label="Navegación principal de EDÉN">
      <div className="topbar-inner">
        <div className="brand-row">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">YF</div>
            <div>
              <span className="brand-name">YERUZZA FORGE</span>
              <span className="brand-product">EDÉN · Oficina virtual de gestión</span>
            </div>
          </div>
          <span className="environment">Prototipo navegable</span>
        </div>

        <div className="nav-modules">
          {MODULES.map((module) => {
            const active =
              location.pathname === module.path ||
              (module.id === 'login' && location.pathname === '/register');

            return (
              <button
                key={module.id}
                className={`nav-btn${active ? ' active' : ''}`}
                type="button"
                onClick={() => navigate(module.path)}
                aria-current={active ? 'page' : undefined}
              >
                {module.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function ScreenHeader({ id, eyebrow, title, description, tags, actions }) {
  return (
    <header className="screen-header">
      <div className="screen-header-copy">
        <div className="eyebrow">{eyebrow}</div>
        <h1 id={`${id}-title`}>{title}</h1>
        <p className="screen-description">{description}</p>
      </div>
      {(tags || actions) && (
        <div className="header-side">
          {tags && <div className="header-tags">{tags}</div>}
          {actions && <div className="header-actions">{actions}</div>}
        </div>
      )}
    </header>
  );
}

function ScreenFooter({ offline = false }) {
  return (
    <footer className="screen-footer">
      <span>EDÉN · Solicitudes, cotizaciones, proyectos y gastos en una sola oficina virtual.</span>
      <span className={`footer-status${offline ? ' offline' : ''}`}>
        {offline ? 'Respaldo local por interrupción de red' : 'Comunicación protegida con la API'}
      </span>
    </footer>
  );
}

function Page({ id, children, offline = false }) {
  return (
    <section id={id} className="pantalla" aria-labelledby={`${id}-title`}>
      {children}
      <ScreenFooter offline={offline} />
    </section>
  );
}

function ResourceNotice({ resource, label = 'los datos' }) {
  return (
    <>
      {resource.loading && (
        <div className="notice info" role="status">
          <span className="loading-dot" aria-hidden="true" />
          Cargando {label} desde la API…
        </div>
      )}
      {resource.offline && (
        <div className="notice warning" role="status">
          <strong>Sin conexión.</strong>
          <span>
            Se muestran datos de ejemplo únicamente como respaldo temporal. Los cambios no se simularán.
          </span>
          <button type="button" className="text-button" onClick={resource.reload}>
            Reintentar
          </button>
        </div>
      )}
      {resource.error && (
        <div className="notice danger" role="alert">
          <strong>No se pudieron cargar {label}.</strong>
          <span>{resource.error}</span>
          <button type="button" className="text-button" onClick={resource.reload}>
            Reintentar
          </button>
        </div>
      )}
    </>
  );
}

function MutationFeedback({ mutation }) {
  return (
    <>
      {mutation.error && (
        <div className="notice danger compact" role="alert">
          {mutation.error}
        </div>
      )}
      {mutation.success && (
        <div className="notice success-notice compact" role="status">
          {mutation.success}
        </div>
      )}
    </>
  );
}

function DataTable({ caption, columns, rows, empty = 'No hay registros para mostrar.' }) {
  return (
    <div className="table-responsive">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? row.uuid ?? index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FormPanel({ title, description, onClose, children }) {
  return (
    <article className="card card-padded form-panel">
      <div className="card-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {onClose && (
          <button type="button" className="text-button" onClick={onClose}>
            Cerrar
          </button>
        )}
      </div>
      {children}
    </article>
  );
}

function AuthAside() {
  const workflow = [
    {
      id: 'solicitudes',
      etapa: '01 · Solicitudes',
      resultado: 'Centraliza necesidades y clientes',
      trazabilidad: 'Origen y estado',
    },
    {
      id: 'costos',
      etapa: '02 · Costos',
      resultado: 'Calcula con un catálogo controlado',
      trazabilidad: 'Precios y márgenes',
    },
    {
      id: 'cotizaciones',
      etapa: '03 · Cotizaciones',
      resultado: 'Prepara propuestas y documentos',
      trazabilidad: 'Versiones y aprobación',
    },
    {
      id: 'proyectos',
      etapa: '04 · Proyectos',
      resultado: 'Compara presupuesto y gasto real',
      trazabilidad: 'Desviaciones',
    },
  ];

  return (
    <article className="card operations-card">
      <div className="operations-header">
        <div>
          <h2>Una lectura completa de tu operación</h2>
          <p>Del primer contacto al cierre del proyecto, con información conectada.</p>
        </div>
        <span className="demo-label">Vista del producto</span>