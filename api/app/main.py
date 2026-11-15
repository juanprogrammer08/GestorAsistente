from fastapi import FastAPI, Depends, HTTPException, status, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, select
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
import os
import asyncio
import datetime

# Configuración y constantes
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db")
AUTH_SECRET = os.getenv("AUTH_SECRET", "secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Contexto para hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Base declarativa para modelos
Base = declarative_base()

# Motor y sesión asíncrona
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Modelos de datos básicos

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    rol = Column(String(20), nullable=False, default="usuario")
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

# Funciones utilitarias

def verificar_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hashear_password(password: str) -> str:
    return pwd_context.hash(password)

def crear_token_acceso(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, AUTH_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def obtener_usuario_por_username(db: AsyncSession, username: str) -> Optional[Usuario]:
    stmt = select(Usuario).where(Usuario.username == username)
    result = await db.execute(stmt)
    usuario = result.scalars().first()
    return usuario

async def autenticar_usuario(db: AsyncSession, username: str, password: str) -> Optional[Usuario]:
    usuario = await obtener_usuario_por_username(db, username)
    if not usuario:
        return None
    if not verificar_password(password, usuario.hashed_password):
        return None
    if not usuario.activo:
        return None
    return usuario

# Dependencia para obtener sesión DB
async def get_db():
    async with async_session() as session:
        try:
            yield session
        except SQLAlchemyError:
            await session.rollback()
            raise
        finally:
            await session.close()

# Dependencia para obtener usuario actual a partir del token JWT
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, AUTH_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    usuario = await obtener_usuario_por_username(db, username)
    if usuario is None:
        raise credentials_exception
    return usuario

# FastAPI app con root_path para que /docs y /openapi.json funcionen bajo /api
app = FastAPI(root_path="/api", title="API EDÉN")

# CORS (permitir frontend local y producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas públicas

@app.get("/health", tags=["salud"])
async def health_check():
    return {"status": "ok"}

@app.post("/auth/register", tags=["auth"])
async def register(
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    # Validar usuario existente
    usuario_existente = await obtener_usuario_por_username(db, username)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    hashed_pw = hashear_password(password)
    nuevo_usuario = Usuario(username=username, hashed_password=hashed_pw, rol="administrador", activo=True)
    db.add(nuevo_usuario)
    await db.commit()
    await db.refresh(nuevo_usuario)
    return {"msg": "Usuario registrado correctamente", "username": nuevo_usuario.username}

@app.post("/auth/login", tags=["auth"])
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    usuario = await autenticar_usuario(db, form_data.username, form_data.password)
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    access_token = crear_token_acceso(data={"sub": usuario.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", tags=["auth"])
async def leer_usuario_actual(usuario: Usuario = Depends(obtener_usuario_actual)):
    return {
        "id": usuario.id,
        "username": usuario.username,
        "rol": usuario.rol,
        "activo": usuario.activo,
        "creado_en": usuario.creado_en.isoformat(),
    }

# Rutas protegidas de ejemplo (CRUD básico para usuarios)

from pydantic import BaseModel

class UsuarioOut(BaseModel):
    id: int
    username: str
    rol: str
    activo: bool
    creado_en: datetime.datetime

    class Config:
        orm_mode = True

class UsuarioUpdate(BaseModel):
    rol: Optional[str]
    activo: Optional[bool]

@app.get("/usuarios", response_model=list[UsuarioOut], tags=["usuarios"])
async def listar_usuarios(db: AsyncSession = Depends(get_db), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    # Solo admin puede listar usuarios
    if usuario_actual.rol != "administrador":
        raise HTTPException(status_code=403, detail="No autorizado")
    stmt = select(Usuario)
    result = await db.execute(stmt)
    usuarios = result.scalars().all()
    return usuarios

@app.get("/usuarios/{usuario_id}", response_model=UsuarioOut, tags=["usuarios"])
async def obtener_usuario(usuario_id: int, db: AsyncSession = Depends(get_db), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    if usuario_actual.rol != "administrador" and usuario_actual.id != usuario_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    stmt = select(Usuario).where(Usuario.id == usuario_id)
    result = await db.execute(stmt)
    usuario = result.scalars().first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@app.put("/usuarios/{usuario_id}", response_model=UsuarioOut, tags=["usuarios"])
async def actualizar_usuario(usuario_id: int, datos: UsuarioUpdate, db: AsyncSession = Depends(get_db), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    if usuario_actual.rol != "administrador":
        raise HTTPException(status_code=403, detail="No autorizado")
    stmt = select(Usuario).where(Usuario.id == usuario_id)
    result = await db.execute(stmt)
    usuario = result.scalars().first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if datos.rol is not None:
        usuario.rol = datos.rol
    if datos.activo is not None:
        usuario.activo = datos.activo
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario

# Inicialización de base de datos (crear tablas)

@app.on_event("startup")
async def startup_event():
    try:
        async with engine.begin() as conn:
            # Crear tablas si no existen
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        # Fallback a SQLite si falla conexión a Postgres
        if DATABASE_URL.startswith("postgresql"):
            # Cambiar a SQLite local
            sqlite_url = "sqlite+aiosqlite:///./app.db"
            global engine, async_session
            engine = create_async_engine(sqlite_url, echo=False, future=True)
            async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

# Middleware para capturar excepciones y devolver JSON consistente

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    except Exception:
        return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})
from fastapi import FastAPI, Depends, HTTPException, status, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, select
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
import os
import asyncio
import datetime

# Configuración y constantes
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db")
AUTH_SECRET = os.getenv("AUTH_SECRET", "secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Contexto para hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Base declarativa para modelos
Base = declarative_base()

# Motor y sesión asíncrona
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Modelos de datos básicos

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    rol = Column(String(20), nullable=False, default="usuario")
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

# Funciones utilitarias

def verificar_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hashear_password(password: str) -> str:
    return pwd_context.hash(password)

def crear_token_acceso(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, AUTH_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def obtener_usuario_por_username(db: AsyncSession, username: str) -> Optional[Usuario]:
    stmt = select(Usuario).where(Usuario.username == username)
    result = await db.execute(stmt)
    usuario = result.scalars().first()
    return usuario

async def autenticar_usuario(db: AsyncSession, username: str, password: str) -> Optional[Usuario]:
    usuario = await obtener_usuario_por_username(db, username)
    if not usuario:
        return None
    if not verificar_password(password, usuario.hashed_password):
        return None
    if not usuario.activo:
        return None
    return usuario

# Dependencia para obtener sesión DB
async def get_db():
    async with async_session() as session:
        try:
            yield session
        except SQLAlchemyError:
            await session.rollback()
            raise
        finally:
            await session.close()

# Dependencia para obtener usuario actual a partir del token JWT
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, AUTH_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    usuario = await obtener_usuario_por_username(db, username)
    if usuario is None:
        raise credentials_exception
    return usuario

# FastAPI app con root_path para que /docs y /openapi.json funcionen bajo /api
app = FastAPI(root_path="/api", title="API EDÉN")

# CORS (permitir frontend local y producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas públicas

@app.get("/health", tags=["salud"])
async def health_check():
    return {"status": "ok"}

@app.post("/auth/register", tags=["auth"])
async def register(
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    # Validar usuario existente
    usuario_existente = await obtener_usuario_por_username(db, username)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    hashed_pw = hashear_password(password)
    nuevo_usuario = Usuario(username=username, hashed_password=hashed_pw, rol="administrador", activo=True)
    db.add(nuevo_usuario)
    await db.commit()
    await db.refresh(nuevo_usuario)
    return {"msg": "Usuario registrado correctamente", "username": nuevo_usuario.username}

@app.post("/auth/login", tags=["auth"])
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    usuario = await autenticar_usuario(db, form_data.username, form_data.password)
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    access_token = crear_token_acceso(data={"sub": usuario.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", tags=["auth"])
async def leer_usuario_actual(usuario: Usuario = Depends(obtener_usuario_actual)):
    return {
        "id": usuario.id,
        "username": usuario.username,
        "rol": usuario.rol,
        "activo": usuario.activo,
        "creado_en": usuario.creado_en.isoformat(),
    }

# Rutas protegidas de ejemplo (CRUD básico para usuarios)

from pydantic import BaseModel

class UsuarioOut(BaseModel):
    id: int
    username: str
    rol: str
    activo: bool
    creado_en: datetime.datetime

    class Config:
        orm_mode = True

class UsuarioUpdate(BaseModel):
    rol: Optional[str]
    activo: Optional[bool]

@app.get("/usuarios", response_model=list[UsuarioOut], tags=["usuarios"])
async def listar_usuarios(db: AsyncSession = Depends(get_db), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    # Solo admin puede listar usuarios
    if usuario_actual.rol != "administrador":
        raise HTTPException(status_code=403, detail="No autorizado")
    stmt = select(Usuario)
    result = await db.execute(stmt)
    usuarios = result.scalars().all()
    return usuarios

@app.get("/usuarios/{usuario_id}", response_model=UsuarioOut, tags=["usuarios"])
async def obtener_usuario(usuario_id: int, db: AsyncSession = Depends(get_db), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    if usuario_actual.rol != "administrador" and usuario_actual.id != usuario_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    stmt = select(Usuario).where(Usuario.id == usuario_id)
    result = await db.execute(stmt)
    usuario = result.scalars().first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@app.put("/usuarios/{usuario_id}", response_model=UsuarioOut, tags=["usuarios"])
async def actualizar_usuario(usuario_id: int, datos: UsuarioUpdate, db: AsyncSession = Depends(get_db), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    if usuario_actual.rol != "administrador":
        raise HTTPException(status_code=403, detail="No autorizado")
    stmt = select(Usuario).where(Usuario.id == usuario_id)
    result = await db.execute(stmt)
    usuario = result.scalars().first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if datos.rol is not None:
        usuario.rol = datos.rol
    if datos.activo is not None:
        usuario.activo = datos.activo
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario

# Inicialización de base de datos (crear tablas)

@app.on_event("startup")
async def startup_event():
    try:
        async with engine.begin() as conn:
            # Crear tablas si no existen
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        # Fallback a SQLite si falla conexión a Postgres
        if DATABASE_URL.startswith("postgresql"):
            # Cambiar a SQLite local
            sqlite_url = "sqlite+aiosqlite:///./app.db"
            global engine, async_session
            engine = create_async_engine(sqlite_url, echo=False, future=True)
            async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

# Middleware para capturar excepciones y devolver JSON consistente

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    except Exception:
        return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})