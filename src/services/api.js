// Se VITE_API_URL não for definida, usa o mesmo host de onde a página foi
// aberta (funciona tanto em localhost quanto acessando pelo IP da rede local
// a partir do celular, sem precisar editar o .env pra cada dispositivo).
const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error || `Erro ${res.status} ao chamar ${path}`);
  }

  return body;
}

export function criarPaciente(dados) {
  return request("/api/fila", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function listarFila() {
  return request("/api/fila");
}

export function consultarStatus(id) {
  return request(`/api/fila/${encodeURIComponent(id)}/status`);
}

export function alterarStatus(id, status) {
  return request(`/api/fila/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export { API_URL };
