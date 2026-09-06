#!/usr/bin/env bash
# Configura realm, roles, cliente y usuarios según la guía DDS.
# Requiere: docker compose up -d y contenedor keycloak-proyecto-tareas en ejecución.

set -euo pipefail

CONTAINER="${KEYCLOAK_CONTAINER:-keycloak-proyecto-tareas}"
REALM="${KEYCLOAK_REALM:-proyecto-tareas}"
CLIENT_ID="${KEYCLOAK_CLIENT_ID:-proyecto-tareas-node-backend}"
REDIRECT_URI="${KEYCLOAK_REDIRECT_URI:-http://localhost:5173/auth/callback}"
WEB_ORIGIN="${KEYCLOAK_WEB_ORIGIN:-http://localhost:5173}"

KCADM="/opt/keycloak/bin/kcadm.sh"
KEYCLOAK_URL="${KEYCLOAK_BASE_URL:-http://localhost:8081}"

docker_kcadm() {
  MSYS_NO_PATHCONV=1 docker exec "${CONTAINER}" "${KCADM}" "$@"
}

user_exists() {
  local username="$1"

  docker_kcadm get users \
    -r "${REALM}" \
    -q username="${username}" \
    --fields id,username 2>/dev/null | grep -q '"id"'
}

client_exists() {
  docker_kcadm get clients \
    -r "${REALM}" \
    -q clientId="${CLIENT_ID}" \
    --fields id,clientId 2>/dev/null | grep -q '"id"'
}

get_client_id() {
  docker_kcadm get clients \
    -r "${REALM}" \
    -q clientId="${CLIENT_ID}" \
    --fields id 2>/dev/null | grep -o '"id" *: *"[^"]*"' | head -n 1 | sed 's/.*"id" *: *"\([^"]*\)".*/\1/'
}

echo "→ Esperando Keycloak (${KEYCLOAK_URL})..."

if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER}"; then
  echo "Error: el contenedor ${CONTAINER} no está corriendo. Ejecutá: npm run keycloak:up" >&2
  exit 1
fi

for i in $(seq 1 90); do
  if curl -sf "${KEYCLOAK_URL}/realms/master" >/dev/null 2>&1; then
    echo "  Keycloak listo (${i} intento(s))."
    break
  fi

  if [ "$i" -eq 90 ]; then
    echo "Error: Keycloak no respondió a tiempo en ${KEYCLOAK_URL}" >&2
    echo "  Revisá: docker logs ${CONTAINER}" >&2
    exit 1
  fi

  if [ $((i % 5)) -eq 0 ]; then
    echo "  … aún iniciando (${i}/90)"
  fi

  sleep 2
done

echo "→ Autenticando kcadm..."

# Usar la credencial configurada en el contenedor sin copiarla al repositorio.
docker exec "${CONTAINER}" sh -c '
  /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8080 --realm master \
    --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD"
'

echo "→ Creando realm ${REALM} (si no existe)..."

if ! docker_kcadm get "realms/${REALM}" >/dev/null 2>&1; then
  docker_kcadm create realms \
    -s realm="${REALM}" \
    -s enabled=true

  echo "  Realm creado."
else
  echo "  Realm ya existe."
fi

echo "→ Creando roles usuario y admin..."

for R in usuario admin; do
  if ! docker_kcadm get "roles/${R}" -r "${REALM}" >/dev/null 2>&1; then
    docker_kcadm create roles \
      -r "${REALM}" \
      -s name="${R}"

    echo "  Rol ${R} creado."
  else
    echo "  Rol ${R} ya existe."
  fi
done

echo "→ Creando cliente OAuth ${CLIENT_ID}..."

# Ademas del callback (${REDIRECT_URI}), registramos el origen del frontend
# (${WEB_ORIGIN}) como redirect URI valida: es la URL exacta que usa
# cerrarSesion() en oauth.js como post_logout_redirect_uri.
# El atributo post.logout.redirect.uris="+" le dice a Keycloak que acepte
# para logout las mismas URIs ya habilitadas para login.
if ! client_exists; then
  docker_kcadm create clients \
    -r "${REALM}" \
    -s clientId="${CLIENT_ID}" \
    -s name="Proyecto Tareas Node Backend" \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s directAccessGrantsEnabled=false \
    -s "redirectUris=[\"${REDIRECT_URI}\", \"${WEB_ORIGIN}\"]" \
    -s "webOrigins=[\"${WEB_ORIGIN}\"]" \
    -s 'attributes={"pkce.code.challenge.method":"S256","post.logout.redirect.uris":"+"}'

  echo "  Cliente creado."
else
  echo "  Cliente ya existe."
  CLIENT_UUID="$(get_client_id)"
  docker_kcadm update "clients/${CLIENT_UUID}" \
    -r "${REALM}" \
    -s "redirectUris=[\"${REDIRECT_URI}\", \"${WEB_ORIGIN}\"]" \
    -s "webOrigins=[\"${WEB_ORIGIN}\"]" \
    -s 'attributes={"pkce.code.challenge.method":"S256","post.logout.redirect.uris":"+"}'
  echo "  Cliente actualizado para PKCE S256."
fi

# Reaplicar también a clientes existentes. Audiencia exclusiva del recurso API.
CLIENT_UUID="$(get_client_id)"
docker_kcadm update "clients/${CLIENT_UUID}" -r "${REALM}" \
  -s publicClient=true -s standardFlowEnabled=true -s implicitFlowEnabled=false \
  -s directAccessGrantsEnabled=false -s serviceAccountsEnabled=false

# PUT de la colección actualiza el mapper identificado por nombre sin duplicarlo.
# El JSON se procesa localmente; no contiene secretos.
MAPPER_ID="$(docker_kcadm get "clients/${CLIENT_UUID}/protocol-mappers/models" -r "${REALM}" | python3 -c 'import json,sys; print(next((m["id"] for m in json.load(sys.stdin) if m["name"] == "tareas-api-audience"), ""))')"
MAPPER_ARGS=(-r "${REALM}" -s name=tareas-api-audience -s protocol=openid-connect -s protocolMapper=oidc-audience-mapper -s 'config={"included.custom.audience":"tareas-api","access.token.claim":"true","id.token.claim":"false"}')
if [ -n "${MAPPER_ID}" ]; then
  docker_kcadm update "clients/${CLIENT_UUID}/protocol-mappers/models/${MAPPER_ID}" "${MAPPER_ARGS[@]}"
else
  docker_kcadm create "clients/${CLIENT_UUID}/protocol-mappers/models" "${MAPPER_ARGS[@]}"
fi

create_user() {
  local username="$1"
  local email="$2"
  local first="$3"
  local last="$4"
  local role="$5"

  if user_exists "${username}"; then
    echo "  Usuario ${username} ya existe."
  else
    : "${KEYCLOAK_DEMO_PASSWORD:?Defina KEYCLOAK_DEMO_PASSWORD para crear usuarios demo nuevos}"
    docker_kcadm create users \
      -r "${REALM}" \
      -s username="${username}" \
      -s enabled=true \
      -s email="${email}" \
      -s firstName="${first}" \
      -s lastName="${last}"

    echo "  Usuario ${username} creado."
    docker_kcadm set-password \
      -r "${REALM}" \
      --username "${username}" \
      --new-password "${KEYCLOAK_DEMO_PASSWORD}" \
      --temporary=false
  fi

  echo "  Asignando rol ${role} a ${username}..."

  docker_kcadm add-roles \
    -r "${REALM}" \
    --uusername "${username}" \
    --rolename "${role}"

  echo "  Usuario ${username} configurado con rol ${role}."
}

echo "→ Creando usuarios de prueba..."

create_user usuario01 carla@proyectotareas.com Carla Usuario usuario
create_user usuario02 juan@proyectotareas.com Juan Usuario usuario
create_user admin01 marcos@proyectotareas.com Marcos Admin admin

echo ""
echo "Listo. Keycloak: http://localhost:8081"
echo "  Administración: credenciales de su configuración local"
echo "  Realm: ${REALM}"
echo "  Usuarios existentes conservan sus contraseñas."