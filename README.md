# EPB4_reserva_servicios

## Estructura del repositorio

```text
backend/       API Spring Boot, persistencia, seguridad, pruebas y documentación
frontend/      Aplicación web cliente y proveedor
backend/postman/ Colecciones y recursos para probar la API
```

## Ejecutar el backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

La API queda disponible en `http://localhost:8080`. Si el puerto está ocupado, usa:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo" "-Dspring-boot.run.arguments=--server.port=8081"
```

La documentación de endpoints está en [backend/docs/serviciosBackend.md](backend/docs/serviciosBackend.md).

## Validar el backend

```powershell
cd backend
.\mvnw.cmd test
```

## Ejecutar el frontend

```powershell
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`. La documentación de la aplicación cliente está en [frontend/docs/serviciosFrontend.md](frontend/docs/serviciosFrontend.md).

## Validar el frontend

```powershell
cd frontend
npm run build
```
