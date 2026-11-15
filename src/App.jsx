import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Función para obtener el token JWT almacenado en localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Función para eliminar el token y cerrar sesión
function logout(navigate) {
  localStorage.removeItem('token');
  navigate('/login');
}

// Componente Guardia de Ruta para proteger rutas privadas
function PrivateRoute({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Componente Login
function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Error en autenticación');
        return;
      }
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      navigate('/');
    } catch {
      setError('Error de conexión con el servidor');
    }
  }

  return (
    <section className="pantalla" id="p-login" style={{ display: 'block' }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="formulario">
        <label>
          Usuario:
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Contraseña:
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Entrar</button>
      </form>
      <p>
        ¿No tienes cuenta?{' '}
        <button onClick={() => navigate('/register')} className="link-button">
          Regístrate
        </button>
      </p>
    </section>
  );
}

// Componente Registro
function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Error en el registro');
        return;
      }
      setSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
      setUsername('');
      setPassword('');
      setPassword2('');
    } catch {
      setError('Error de conexión con el servidor');
    }
  }

  return (
    <section className="pantalla" id="p-register" style={{ display: 'none' }}>
      <h2>Registro de usuario</h2>
      <form onSubmit={handleSubmit} className="formulario">
        <label>
          Usuario:
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Contraseña:
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          Repetir contraseña:
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit">Registrar</button>
      </form>
      <p>
        ¿Ya tienes cuenta?{' '}
        <button onClick={() => navigate('/login')} className="link-button">
          Inicia sesión
        </button>
      </p>
    </section>
  );
}

// Componente Panel Principal
function Panel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Obtener datos del usuario autenticado
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError('');
      try {
        const token = getToken();
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) {
          logout(navigate);
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch {
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <section className="pantalla" id="p-panel" style={{ display: 'none' }}>
        <h2>Cargando...</h2>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pantalla" id="p-panel" style={{ display: 'none' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => logout(navigate)}>Cerrar sesión</button>
      </section>
    );
  }

  return (
    <section className="pantalla" id="p-panel" style={{ display: 'none' }}>
      <header className="barra-superior">
        <h1>Panel principal</h1>
        <nav>
          <button onClick={() => irA('p-cotizaciones')}>Cotizaciones</button>
          <button onClick={() => irA('p-proyectos')}>Proyectos</button>
          <button onClick={() => irA('p-gastos')}>Gastos</button>
          <button onClick={() => irA('p-documentos')}>Documentos</button>
          <button onClick={() => irA('p-reportes')}>Reportes</button>
          <button onClick={() => irA('p-configuracion')}>Configuración</button>
          <button onClick={() => logout(navigate)}>Cerrar sesión</button>
        </nav>
        <p className="usuario-info">Usuario: {user?.username}</p>
      </header>

      <main>
        <Cotizaciones />
        <Proyectos />
        <Gastos />
        <Documentos />
        <Reportes />
        <Configuracion />
      </main>
    </section>
  );
}

// Componente Cotizaciones (demo con datos realistas)
function Cotizaciones() {
  return (
    <section className="pantalla" id="p-cotizaciones" style={{ display: 'none' }}>
      <h2>Cotizaciones</h2>
      <p>Listado de cotizaciones demo con datos realistas.</p>
      <table className="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1001</td>
            <td>Empresa Alfa</td>
            <td>En revisión</td>
            <td>2025-05-10</td>
            <td>$1,200.00</td>
          </tr>
          <tr>
            <td>1002</td>
            <td>Comercial Beta</td>
            <td>Aprobada</td>
            <td>2025-05-12</td>
            <td>$3,450.00</td>
          </tr>
          <tr>
            <td>1003</td>
            <td>Servicios Gamma</td>
            <td>Rechazada</td>
            <td>2025-05-14</td>
            <td>$980.00</td>
          </tr>
        </tbody>
      </table>
      <button onClick={() => irA('p-panel')}>Volver al panel</button>
    </section>
  );
}

// Componente Proyectos (demo)
function Proyectos() {
  return (
    <section className="pantalla" id="p-proyectos" style={{ display: 'none' }}>
      <h2>Proyectos</h2>
      <p>Listado de proyectos demo con datos realistas.</p>
      <ul>
        <li>
          <strong>Proyecto A:</strong> Instalación eléctrica - Estado: En progreso - Fecha inicio: 2025-04-20
        </li>
        <li>
          <strong>Proyecto B:</strong> Mantenimiento HVAC - Estado: Pendiente - Fecha inicio: 2025-05-01
        </li>
        <li>
          <strong>Proyecto C:</strong> Renovación de oficinas - Estado: Finalizado - Fecha inicio: 2025-03-15
        </li>
      </ul>
      <button onClick={() => irA('p-panel')}>Volver al panel</button>
    </section>
  );
}

// Componente Gastos (demo)
function Gastos() {
  return (
    <section className="pantalla" id="p-gastos" style={{ display: 'none' }}>
      <h2>Control de Gastos</h2>
      <p>Listado de gastos demo con datos realistas.</p>
      <table className="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Proyecto</th>
            <th>Concepto</th>
            <th>Monto</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>5001</td>
            <td>Proyecto A</td>
            <td>Materiales</td>
            <td>$300.00</td>
            <td>2025-05-05</td>
          </tr>
          <tr>
            <td>5002</td>
            <td>Proyecto B</td>
            <td>Mano de obra</td>
            <td>$450.00</td>
            <td>2025-05-10</td>
          </tr>
          <tr>
            <td>5003</td>
            <td>Proyecto C</td>
            <td>Transporte</td>
            <td>$120.00</td>
            <td>2025-04-25</td>
          </tr>
        </tbody>
      </table>
      <button onClick={() => irA('p-panel')}>Volver al panel</button>
    </section>
  );
}

// Componente Documentos (demo)
function Documentos() {
  return (
    <section className="pantalla" id="p-documentos" style={{ display: 'none' }}>
      <h2>Documentos Profesionales</h2>
      <p>Listado de documentos demo con enlaces de descarga.</p>
      <ul>
        <li>
          <a href="/docs/presupuesto_1001.pdf" target="_blank" rel="noopener noreferrer">
            Presupuesto 1001 - Empresa Alfa
          </a>
        </li>
        <li>
          <a href="/docs/contrato_1002.pdf" target="_blank" rel="noopener noreferrer">
            Contrato 1002 - Comercial Beta
          </a>
        </li>
        <li>
          <a href="/docs/informe_1003.pdf" target="_blank" rel="noopener noreferrer">
            Informe 1003 - Servicios Gamma
          </a>
        </li>
      </ul>
      <button onClick={() => irA('p-panel')}>Volver al panel</button>
    </section>
  );
}

// Componente Reportes (demo)
function Reportes() {
  return (
    <section className="pantalla" id="p-reportes" style={{ display: 'none' }}>
      <h2>Reportes</h2>
      <p>Reportes demo con métricas clave y gráficos (simulados).</p>
      <ul>
        <li>Conversiones de cotizaciones: 75%</li>
        <li>Proyectos activos: 3</li>
        <li>Gastos totales mes actual: $870.00</li>
      </ul>
      <button onClick={() => irA('p-panel')}>Volver al panel</button>
    </section>
  );
}

// Componente Configuración (demo)
function Configuracion() {
  return (
    <section className="pantalla" id="p-configuracion" style={{ display: 'none' }}>
      <h2>Configuración</h2>
      <p>Opciones de configuración demo para el usuario y la aplicación.</p>
      <ul>
        <li>Idioma: Español (único disponible)</li>
        <li>Notificaciones: Activadas</li>
        <li>Seguridad: MFA recomendado (pendiente)</li>
      </ul>
      <button onClick={() => irA('p-panel')}>Volver al panel</button>
    </section>
  );
}

// Función global para cambiar de pantalla según id
function irA(id) {
  document.querySelectorAll('.pantalla').forEach(function (p) {
    p.style.display = p.id === id ? 'block' : 'none';
  });
}

export default function App() {
  // Al montar, mostrar la pantalla adecuada según si hay token
  useEffect(() => {
    if (getToken()) {
      irA('p-panel');
    } else {
      irA('p-login');
    }
  }, []);

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Panel />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to={getToken() ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
}