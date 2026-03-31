# Argentum Online Web — Análisis General

Fecha: 2026-03-29

Se trata de un **MMORPG web** (Argentum Online) dividido en dos proyectos separados que se comunican por WebSocket y REST.

---

## Arquitectura General

```
[Browser]
    │
    ├── HTTP/SSR → argentumonlineweb-cliente (Next.js, puerto 3000)
    │                    ├── API REST → /api/* (Express embebido)
    │                    └── MongoDB (cuentas + personajes)
    │
    └── WebSocket Binary → argentumonlineweb-servidor (Node.js, puerto 7666)
                                └── GET /api/character → cliente (autenticación)
```

El **cliente** sirve las páginas web Y expone la API REST (son el mismo proceso Express). El **servidor** es el motor del juego en tiempo real, que a su vez llama a la API del cliente para validar sesiones.

---

## argentumonlineweb-cliente

**Stack:** Next.js 9 · React 16 · Redux · Express · Mongoose · Passport.js · SCSS

### Estructura
| Carpeta/Archivo | Qué hace |
|---|---|
| `pages/` | Rutas SSR: home, register, createCharacter, ranking, play |
| `components/` | Header, Login, MainContainer |
| `server/` | Controladores, servicios, modelos Mongoose, rutas Express |
| `engine/` | Motor del juego en canvas, cliente WebSocket binario |
| `config/` | URLs, constantes del juego (clases, razas, géneros) |
| `public/static/` | Sprites, mapas, gráficos del juego |
| `store.js` | Redux store (account + initsLoaded) |
| `server.js` | Entry point Express |

**Flujo de autenticación:** Passport Local → Express Session → cookies → localStorage (para el engine).

### Stack detallado

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 9.1.2 |
| UI | React 16.11.0 |
| Estado | Redux 4 + Redux-Thunk |
| Estilos | SCSS + CSS Modules |
| HTTP client | Isomorphic-Fetch + Axios |
| Auth | Passport.js Local Strategy + bcryptjs |
| Sesiones | Express-Session + Cookie-Session |
| DB | MongoDB + Mongoose 5 |
| Iconos | FontAwesome |

---

## argentumonlineweb-servidor

**Stack:** Node.js · WebSocket (ws) · Mongoose · MySQL2 · ByteBuffer · Pathfinding

### Estructura
| Archivo | Qué hace |
|---|---|
| `server.js` | Inicia WebSocket en puerto 7666 |
| `game.js` | Motor del juego: movimiento, combate, items, hechizos (3759 líneas) |
| `protocol.js` | Dispatcher de paquetes binarios recibidos (1411 líneas) |
| `login.js` | Valida personaje llamando a la API REST del cliente |
| `npcs.js` | Comportamiento y combate de NPCs |
| `vars.js` | Estado global en memoria (personajes, NPCs, mapas, clientes) |
| `mapas/` | 290 mapas en JSON (100x100 tiles cada uno) |
| `jsons/` | Definiciones de NPCs, hechizos, objetos |

**Game ticks:** combate (500ms) · NPCs (650ms) · limpieza (60s) · auto-save (5min)

### Paquetes WebSocket que recibe el servidor
| ID | Acción |
|---|---|
| 1 | changeHeading — cambio de dirección |
| 2 | click — click en el mapa |
| 3 | useItem — usar item del inventario |
| 4 | equiparItem — equipar item |
| 5 | connectCharacter — login/selección de personaje |
| 6 | position — solicitud de movimiento |
| 7 | dialog — diálogo con NPC |
| 8 | ping — keep-alive |
| 9 | attackMele — ataque cuerpo a cuerpo |
| 10 | attackRange — ataque a distancia |
| 11 | attackSpell — lanzar hechizo |
| 12 | tirarItem — tirar item |
| 13 | agarrarItem — agarrar item del suelo |
| 14 | buyItem — comprar a mercader |
| 15 | sellItem — vender a mercader |
| 17 | changeSeguro — activar/desactivar seguro de item |

---

## Problemas Críticos (Seguridad)

Ambas aplicaciones comparten el mismo token de autenticación hardcodeado:
```javascript
const tokenAuth = "Bearer token"; // ← igual en cliente y servidor
```
Esto significa que cualquiera puede hacer llamadas a la API como si fuera el servidor del juego.

Otros problemas de seguridad:
- **CORS permisivo**: acepta cualquier origen (`callback(null, origin)`)
- **Cookie session con key vacía**: `keys: [""]`
- **localStorage** guarda `idAccount`, `email`, `idCharacter` — expuesto a XSS
- **Sin rate limiting** en login/registro — brute force posible
- **Protocolo WebSocket sin cifrar** — MITM posible
- **MySQL credentials hardcodeadas** en el código del servidor

---

## Deuda Técnica General

- Next.js 9 (2019) — la versión actual es 15
- React 16 con class components — hooks existen desde 2018
- `NODE_OPTIONS=--openssl-legacy-provider` en los scripts — señal de dependencias muy antiguas
- `game.js` con 3759 líneas, `engine.js` con 1983, `renderCharacters.js` con 12106
- Estado global mutable en `vars.js` — sin inmutabilidad
- Mezcla de español e inglés en nombres de variables/funciones
- Sin tests
- Sin TypeScript
- Credenciales de producción vacías hardcodeadas en el código
- `alert()` para manejo de errores en frontend — bloquea el render

---

## Propuestas de Mejora

### Seguridad (Prioritario)
1. **Reemplazar el token hardcodeado** por JWT dinámico con expiración
2. **CORS restrictivo**: solo los dominios de producción permitidos
3. **Rate limiting** en `/api/login` y `/api/register` (ej: `express-rate-limit`)
4. **Eliminar datos sensibles de localStorage** — usar solo cookies HttpOnly
5. **Cifrar el protocolo WebSocket** con WSS (TLS)
6. **Cookie session con secreto real** desde variable de entorno

### Modernización del Stack
7. **Migrar a Next.js 14+** con App Router — SSR mejorado, Server Components, mejor performance
8. **Migrar class components a hooks** — código más simple y testeable
9. **Agregar TypeScript** — evita errores en el protocolo binario, en modelos y en el estado del juego
10. **Reemplazar Redux por Zustand o React Query** — mucho menos boilerplate para lo que se usa

### Arquitectura del Servidor
11. **Dividir `game.js`** en módulos por dominio: `combat.js`, `movement.js`, `inventory.js`, `spells.js`
12. **Eliminar estado global de `vars.js`** — encapsularlo en clases o un store centralizado
13. **Agregar middleware de validación** por tipo de paquete (en vez de validar dentro de cada handler)
14. **Logger estructurado** — reemplazar `console.log` por Winston o Pino con niveles y contexto

### DevOps / Operaciones
15. **Variables de entorno con dotenv** validadas al arranque (ej: con `zod` o `envalid`)
16. **Tests de integración** para los flujos críticos: login, movimiento, combate
17. **Docker Compose** para levantar ambos servicios + MongoDB juntos
18. **CI/CD básico** con GitHub Actions: lint + tests en cada PR

---

## Conclusión

La aplicación **funciona y tiene una arquitectura coherente** para lo que es (un juego en tiempo real), pero carga 7 años de deuda técnica. La prioridad debería ser primero los problemas de seguridad, luego la división del monolito `game.js`, y gradualmente la modernización del stack.
